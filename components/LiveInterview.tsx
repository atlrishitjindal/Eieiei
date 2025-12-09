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
             // Logic handles transcripts & audio playback (omitted for brevity, same as original logic but cleaner code style if fully rewritten)
             // Keeping original logic for audio handling to ensure safety, just updating UI wrapper.
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
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6">
      {/* Left Panel: Active Session */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex-none">
          <h2 className="text-2xl font-bold text-white tracking-tight">Interview Simulator</h2>
          <p className="text-zinc-400">Practice behavioral questions with real-time feedback.</p>
        </div>

        <Card className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-zinc-900 border-zinc-800">
          {/* Visualizer Background */}
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <motion.div 
                animate={{ scale: [1, 1 + currentInputVolume * 0.05, 1], opacity: [0.1, 0.2, 0.1] }}
                className="w-96 h-96 rounded-full bg-blue-500 blur-3xl"
               />
            </div>
          )}

          <div className="relative z-10 text-center space-y-8">
            <div className="h-32 flex items-center justify-center">
              {isConnecting ? (
                <div className="flex flex-col items-center gap-3 text-blue-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="font-medium">Establishing secure connection...</span>
                </div>
              ) : isActive ? (
                <div className="relative">
                   <div className="w-24 h-24 rounded-full bg-zinc-950 border-4 border-zinc-800 flex items-center justify-center shadow-2xl relative z-10">
                     <Mic className="w-10 h-10 text-emerald-500" />
                   </div>
                   <motion.div 
                     animate={{ scale: 1.5, opacity: 0 }} 
                     transition={{ repeat: Infinity, duration: 2 }}
                     className="absolute inset-0 bg-emerald-500/20 rounded-full"
                   />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <MicOff className="w-10 h-10" />
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
               {!isActive ? (
                 <Button onClick={startSession} disabled={isConnecting} variant="primary" size="lg" className="rounded-full px-8">
                   <Play className="w-5 h-5 mr-2" /> Start Interview
                 </Button>
               ) : (
                 <Button onClick={stopSession} variant="danger" size="lg" className="rounded-full px-8">
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
            
            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
          </div>
        </Card>

        {/* Report Panel */}
        {report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-none">
            <Card className="border-zinc-800 bg-zinc-900/50 p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-white">Performance Report</h3>
                 <Badge variant="info" className="text-lg px-3 py-1">{report.overallScore}/100</Badge>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Strengths</span>
                   <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                     {report.strengths.slice(0,3).map((s,i) => <li key={i} className="flex gap-2"><CheckCircle className="w-3 h-3 mt-1 text-emerald-500 flex-none"/> {s}</li>)}
                   </ul>
                 </div>
                 <div>
                   <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Improvements</span>
                   <ul className="mt-2 space-y-1 text-sm text-zinc-400">
                     {report.improvements.slice(0,3).map((s,i) => <li key={i} className="flex gap-2"><BarChart className="w-3 h-3 mt-1 text-amber-500 flex-none"/> {s}</li>)}
                   </ul>
                 </div>
               </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Right Panel: Transcript */}
      <Card className="w-full lg:w-96 flex flex-col h-full bg-zinc-900/50 border-zinc-800/50 p-0 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <h3 className="font-medium text-zinc-200 text-sm">Live Transcript</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {transcripts.map((msg, idx) => (
            <div key={idx} className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
              <div className={cn(
                "px-3 py-2 rounded-2xl text-sm",
                msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-sm" : "bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700"
              )}>
                {msg.text}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 capitalize">{msg.role}</span>
            </div>
          ))}
          {interimTranscript && (
             <div className={cn("flex flex-col max-w-[85%] animate-pulse", interimTranscript.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
               <div className={cn("px-3 py-2 rounded-2xl text-sm opacity-70", interimTranscript.role === 'user' ? "bg-blue-600" : "bg-zinc-800")}>
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