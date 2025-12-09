import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, Loader2, Play, Square, FileText, CheckCircle, BarChart, XCircle } from 'lucide-react';
import { base64ToBytes, createPcmBlob, decodeAudioData, downsampleBuffer } from '../services/audioUtils';
import { generateInterviewReport } from '../services/gemini';
import { InterviewReport, ResumeAnalysis } from '../types';
import { motion } from 'framer-motion';
import { Button, Card, Badge } from './ui/DesignSystem';
import { cn } from '../lib/utils';

interface LiveInterviewProps {
  resumeAnalysis: ResumeAnalysis | null;
}

interface Transcription {
  role: 'user' | 'model';
  text: string;
}

const LiveInterview: React.FC<LiveInterviewProps> = ({ resumeAnalysis }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Transcription[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<{ role: 'user' | 'model'; text: string } | null>(null);
  const [currentInputVolume, setCurrentInputVolume] = useState(0);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  
  const currentInputTransRef = useRef<string>('');
  const currentOutputTransRef = useRef<string>('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, interimTranscript]);

  const stopSession = useCallback(async () => {
    setIsActive(false);
    setIsConnecting(false);
    setCurrentInputVolume(0);
    setInterimTranscript(null);

    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.close();
      } catch (e) {}
      sessionPromiseRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      try { await audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }
    if (inputContextRef.current) {
      try { await inputContextRef.current.close(); } catch(e) {}
      inputContextRef.current = null;
    }
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
  }, []);

  const startSession = async () => {
    setError(null);
    setReport(null);
    setTranscripts([]);
    setInterimTranscript(null);
    setIsConnecting(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      const contextPrompt = resumeAnalysis 
        ? `The candidate's summary: "${resumeAnalysis.summary}". Skills: ${resumeAnalysis.skills?.join(', ')}. Tailor questions.` 
        : "Ask general behavioral questions suitable for any professional role.";
      const systemInstruction = `You are an expert hiring manager. CONTEXT: ${contextPrompt} RULES: Speak English. Ask ONE question at a time. Provide brief feedback.`;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass(); 
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i+=10) sum += inputData[i] * inputData[i]; 
              const rms = Math.sqrt(sum / (inputData.length/10));
              setCurrentInputVolume(Math.min(100, rms * 1000));
              const downsampledData = downsampleBuffer(inputData, inputCtx.sampleRate, 16000);
              sessionPromise.then(session => session.sendRealtimeInput({ media: createPcmBlob(downsampledData) })).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             let userSpeaking = false;
             let modelSpeaking = false;
             if (message.serverContent?.outputTranscription) {
               currentOutputTransRef.current += message.serverContent.outputTranscription.text;
               modelSpeaking = true;
             } else if (message.serverContent?.inputTranscription) {
               currentInputTransRef.current += message.serverContent.inputTranscription.text;
               userSpeaking = true;
             }
             if (userSpeaking) setInterimTranscript({ role: 'user', text: currentInputTransRef.current });
             else if (modelSpeaking) setInterimTranscript({ role: 'model', text: currentOutputTransRef.current });

             if (message.serverContent?.turnComplete) {
               const userText = currentInputTransRef.current.trim();
               const modelText = currentOutputTransRef.current.trim();
               if (userText || modelText) {
                 setTranscripts(prev => [
                   ...prev,
                   ...(userText ? [{ role: 'user', text: userText } as Transcription] : []),
                   ...(modelText ? [{ role: 'model', text: modelText } as Transcription] : [])
                 ]);
               }
               currentInputTransRef.current = '';
               currentOutputTransRef.current = '';
               setInterimTranscript(null);
             }

             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const audioBuffer = await decodeAudioData(base64ToBytes(base64Audio), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
             }
          },
          onclose: () => stopSession(),
          onerror: (e) => { setError("Connection failed."); stopSession(); }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) {
      setError(err.message || "Failed to start");
      setIsConnecting(false);
      stopSession();
    }
  };

  const handleGenerateReport = async () => {
    if (transcripts.length === 0) return;
    setIsGeneratingReport(true);
    try {
      const fullText = transcripts.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n');
      const data = await generateInterviewReport(fullText);
      setReport(data);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  useEffect(() => {
    return () => { stopSession(); };
  }, [stopSession]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Left Panel: Active Session */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex-none">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Interview Simulator</h2>
          <p className="text-slate-500">Practice with our AI hiring manager. We'll analyze your responses.</p>
        </div>

        <Card className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-white shadow-lg border-slate-200">
          {/* Visualizer Background */}
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <motion.div 
                animate={{ scale: [1, 1 + currentInputVolume * 0.05, 1], opacity: [0.1, 0.2, 0.1] }}
                className="w-96 h-96 rounded-full bg-brand-100 blur-3xl"
               />
            </div>
          )}

          <div className="relative z-10 text-center space-y-8">
            <div className="h-32 flex items-center justify-center">
              {isConnecting ? (
                <div className="flex flex-col items-center gap-3 text-brand-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="font-medium">Connecting to AI Interviewer...</span>
                </div>
              ) : isActive ? (
                <div className="relative">
                   <div className="w-24 h-24 rounded-full bg-white border-4 border-brand-100 flex items-center justify-center shadow-2xl relative z-10">
                     <Mic className="w-10 h-10 text-brand-600" />
                   </div>
                   <motion.div 
                     animate={{ scale: 1.5, opacity: 0 }} 
                     transition={{ repeat: Infinity, duration: 2 }}
                     className="absolute inset-0 bg-brand-200 rounded-full"
                   />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                  <MicOff className="w-10 h-10" />
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
               {!isActive ? (
                 <Button onClick={startSession} disabled={isConnecting} variant="primary" size="lg" className="rounded-full px-8 shadow-xl shadow-brand-500/20">
                   <Play className="w-5 h-5 mr-2" /> Start Interview
                 </Button>
               ) : (
                 <Button onClick={stopSession} variant="danger" size="lg" className="rounded-full px-8 shadow-sm">
                   <Square className="w-5 h-5 mr-2 fill-current" /> End Session
                 </Button>
               )}
               
               {transcripts.length > 0 && !isActive && !report && (
                 <Button onClick={handleGenerateReport} disabled={isGeneratingReport} variant="secondary" className="rounded-full">
                   {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                   Generate Report
                 </Button>
               )}
            </div>
            
            {error && <p className="text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded-full inline-block">{error}</p>}
          </div>
        </Card>

        {/* Report Panel */}
        {report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-none">
            <Card className="border-slate-200 bg-white p-6 shadow-md">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-slate-900">Performance Report</h3>
                 <Badge variant="info" className="text-lg px-3 py-1">Score: {report.overallScore}/100</Badge>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">Strengths</span>
                   <ul className="space-y-2 text-sm text-slate-600">
                     {report.strengths.slice(0,3).map((s,i) => <li key={i} className="flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-none mt-0.5"/> {s}</li>)}
                   </ul>
                 </div>
                 <div>
                   <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-2">Improvements</span>
                   <ul className="space-y-2 text-sm text-slate-600">
                     {report.improvements.slice(0,3).map((s,i) => <li key={i} className="flex gap-2"><BarChart className="w-4 h-4 text-amber-500 flex-none mt-0.5"/> {s}</li>)}
                   </ul>
                 </div>
               </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Right Panel: Transcript */}
      <Card className="w-full lg:w-96 flex flex-col h-full bg-white border-slate-200 p-0 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-700 text-sm">Live Transcript</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {transcripts.map((msg, idx) => (
            <div key={idx} className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' ? "bg-brand-600 text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm"
              )}>
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 capitalize font-medium">{msg.role}</span>
            </div>
          ))}
          {interimTranscript && (
             <div className={cn("flex flex-col max-w-[85%] animate-pulse", interimTranscript.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
               <div className={cn("px-4 py-2.5 rounded-2xl text-sm opacity-70", interimTranscript.role === 'user' ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700")}>
                 {interimTranscript.text} ...
               </div>
             </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      </Card>
    </div>
  );
};

export default LiveInterview;