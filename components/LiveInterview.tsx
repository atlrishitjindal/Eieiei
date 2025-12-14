import React, { useEffect, useRef, useState } from 'react';
import { Mic, PhoneOff, Loader2, Volume2, AlertCircle, Play, FileText, User, Bot, Captions } from 'lucide-react';
import { generateInterviewResponse } from '../services/gemini';
import { ResumeAnalysis } from '../types';
import { Button, Card, Badge } from './ui/DesignSystem';
import { cn } from '../lib/utils';

interface LiveInterviewProps {
  resumeAnalysis: ResumeAnalysis | null;
}

const LiveInterview: React.FC<LiveInterviewProps> = ({ resumeAnalysis }) => {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [realtimeText, setRealtimeText] = useState("");
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const mimeTypeRef = useRef<string>("audio/webm");

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/aac'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'audio/webm';
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;
    }

    mimeTypeRef.current = getSupportedMimeType();

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startSession = () => {
     if (!resumeAnalysis) {
         setError("Resume required to start.");
         return;
     }
     setIsActive(true);
     setTranscript([]);
     setRealtimeText("");
     speak("Hello! I've reviewed your resume. Are you ready to begin the interview?");
  };

  const endSession = () => {
     setIsActive(false);
     if (window.speechSynthesis) window.speechSynthesis.cancel();
     setTranscript([]);
     setRealtimeText("");
     if (recognitionRef.current) recognitionRef.current.stop();
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    
    setTranscript(prev => [...prev, { role: 'ai', text }]);
  };

  const toggleRecording = async () => {
     if (isRecording) {
         stopRecording();
     } else {
         startRecording();
     }
  };

  const startRecording = async () => {
     try {
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         const mimeType = mimeTypeRef.current;
         const recorder = new MediaRecorder(stream, { mimeType });
         
         mediaRecorderRef.current = recorder;
         audioChunksRef.current = [];
         
         recorder.ondataavailable = (event) => {
             if (event.data.size > 0) {
                 audioChunksRef.current.push(event.data);
             }
         };
         
         recorder.onstop = processAudio;
         
         recorder.start();
         setIsRecording(true);
         setRealtimeText("");
         
         if (recognitionRef.current) {
             recognitionRef.current.onresult = (event: any) => {
                 const text = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');
                 setRealtimeText(text);
             };
             recognitionRef.current.start();
         }
         
         if (window.speechSynthesis) window.speechSynthesis.cancel();
         setIsSpeaking(false);
         
     } catch (e) {
         console.error("Mic error", e);
         setError("Could not access microphone.");
     }
  };

  const stopRecording = () => {
     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
         mediaRecorderRef.current.stop();
         setIsRecording(false);
         
         mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());

         if (recognitionRef.current) {
             recognitionRef.current.stop();
         }
     }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processAudio = async () => {
      setIsProcessing(true);
      try {
          if (audioChunksRef.current.length === 0) {
              throw new Error("No audio recorded. Please speak clearly.");
          }

          const mimeType = mimeTypeRef.current;
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const base64Audio = await blobToBase64(audioBlob);
          
          const userText = realtimeText || "(Audio Response)";
          setTranscript(prev => [...prev, { role: 'user', text: userText }]);
          setRealtimeText(""); 

          const context = `${resumeAnalysis?.summary}. Strengths: ${resumeAnalysis?.strengths.join(', ')}`;
          
          const responseText = await generateInterviewResponse(base64Audio, mimeType, context, []);
          
          speak(responseText);
          
      } catch (e: any) {
          console.error("Processing error", e);
          setError(e.message || "Failed to process audio.");
      } finally {
          setIsProcessing(false);
      }
  };

  if (!resumeAnalysis) {
      return (
        <Card className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 bg-white shadow-none border border-slate-200 rounded-2xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
             <Mic className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Resume Required</h3>
          <p className="text-slate-500 max-w-md">Please upload your resume first to start the interview simulation.</p>
        </Card>
      );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-none flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Interview Sim</h1>
            <p className="text-slate-500 mt-2">Practice answering questions with an AI hiring manager.</p>
         </div>
         {isActive && (
             <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                <div className="w-2 h-2 rounded-full bg-emerald-600 mr-2 animate-pulse" /> Active
             </Badge>
         )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 pb-6">
          {/* Main Stage */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-800 relative overflow-hidden flex flex-col order-1 shadow-2xl">
              {/* Main Visual Area - Audio Only */}
              <div className="flex-1 relative flex items-center justify-center min-h-[350px]">
                 <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
                 
                 {/* AI Visualization */}
                 <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className={cn(
                        "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative",
                        isSpeaking ? "bg-purple-600 shadow-[0_0_40px_-10px_rgba(147,51,234,0.5)] scale-110" : "bg-slate-700"
                    )}>
                        {isSpeaking ? (
                            <>
                               <div className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-50 animate-ping" style={{ animationDuration: '2s' }} />
                               <Volume2 className="w-12 h-12 text-white" />
                            </>
                        ) : (
                            <Mic className="w-12 h-12 text-slate-400" />
                        )}
                    </div>
                    
                    <div className="text-center space-y-2 px-4">
                        <h3 className="text-2xl font-bold text-white">AI Interviewer</h3>
                        <p className="text-slate-400 text-sm">
                            {isProcessing ? "Thinking..." : isSpeaking ? "Speaking..." : isRecording ? "Listening..." : "Ready"}
                        </p>
                    </div>

                    {/* LIVE CAPTIONS */}
                    <div className="mt-8 max-w-lg w-full px-6">
                        <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center min-h-[80px] flex items-center justify-center">
                            {realtimeText ? (
                                <p className="text-white font-medium animate-pulse">{realtimeText}</p>
                            ) : isSpeaking && transcript.length > 0 && transcript[transcript.length-1].role === 'ai' ? (
                                <p className="text-purple-200">{transcript[transcript.length-1].text}</p>
                            ) : (
                                <p className="text-slate-500 italic text-sm flex items-center gap-2">
                                    <Captions className="w-4 h-4" /> Live captions will appear here
                                </p>
                            )}
                        </div>
                    </div>
                 </div>
              </div>

              {/* Controls Bar */}
              <div className="p-6 bg-transparent border-t border-white/10 flex items-center justify-center gap-6 relative z-20">
                  {!isActive ? (
                      <Button 
                        size="xl" 
                        onClick={startSession} 
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 rounded-full px-8"
                      >
                        <Play className="w-5 h-5 mr-2" /> Start Interview
                      </Button>
                  ) : (
                      <>
                          {/* Record Button */}
                          <button 
                             onClick={toggleRecording}
                             disabled={isProcessing || isSpeaking}
                             className={cn(
                                 "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl border-4",
                                 isRecording 
                                    ? "bg-red-600 border-red-800 animate-pulse scale-110" 
                                    : isProcessing 
                                       ? "bg-slate-700 border-slate-600 cursor-wait"
                                       : "bg-white text-slate-900 border-slate-200 hover:bg-slate-100"
                             )}
                          >
                              {isProcessing ? (
                                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                              ) : isRecording ? (
                                  <div className="w-8 h-8 bg-white rounded-md" /> 
                              ) : (
                                  <Mic className="w-8 h-8" />
                              )}
                          </button>

                          <button 
                             onClick={endSession}
                             className="absolute right-6 w-12 h-12 rounded-full bg-red-900/50 text-red-500 flex items-center justify-center hover:bg-red-900/80 transition-all"
                             title="End Interview"
                          >
                              <PhoneOff className="w-5 h-5" />
                          </button>
                      </>
                  )}
              </div>
              
              {error && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-sm z-30">
                      <AlertCircle className="w-4 h-4" /> {error}
                  </div>
              )}
          </Card>

          {/* Transcript Panel */}
          <Card className="lg:col-span-1 flex flex-col bg-white border-slate-200 shadow-sm overflow-hidden order-2 h-[600px] lg:h-auto">
             <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-900 flex items-center gap-2">
                 <FileText className="w-4 h-4 text-purple-600" /> Full Transcript
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                 {transcript.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm text-center">
                         <FileText className="w-8 h-8 mb-2 opacity-20" />
                         <p>Conversation history will appear here.</p>
                     </div>
                 ) : (
                     transcript.map((item, idx) => (
                         <div key={idx} className={cn("flex gap-3", item.role === 'user' ? "flex-row-reverse" : "")}>
                             <div className={cn(
                                 "w-8 h-8 rounded-full flex items-center justify-center flex-none shadow-sm",
                                 item.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-purple-100 text-purple-600"
                             )}>
                                 {item.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                             </div>
                             <div className={cn(
                                 "p-3 rounded-2xl text-sm shadow-sm max-w-[85%]",
                                 item.role === 'user' 
                                    ? "bg-white text-slate-700 rounded-tr-none border border-slate-200" 
                                    : "bg-purple-600 text-white rounded-tl-none"
                             )}>
                                 {item.text}
                             </div>
                         </div>
                     ))
                 )}
                 <div ref={transcriptEndRef} />
             </div>
          </Card>
      </div>
    </div>
  );
};

export default LiveInterview;