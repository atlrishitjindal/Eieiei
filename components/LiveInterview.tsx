import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Loader2, Volume2, AlertCircle, Video, VideoOff } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/generative-ai';
import { ResumeAnalysis } from '../types';
import { Button, Card, Badge } from './ui/DesignSystem';
import { cn } from '../lib/utils';
import { createPcmBlob, decodeAudioData, base64ToBytes } from '../services/audioUtils';

interface LiveInterviewProps {
  resumeAnalysis: ResumeAnalysis | null;
}

const LiveInterview: React.FC<LiveInterviewProps> = ({ resumeAnalysis }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volume, setVolume] = useState(0);

  // Refs for audio context and processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Canvas ref for video frame capture
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const stopAudio = () => {
     if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
     }
     if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
     }
     if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
     }
     if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
     }
     // Stop all playing sources
     audioSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
     });
     audioSourcesRef.current.clear();
  };
  
  const stopVideo = () => {
    if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
    }
    setIsVideoOn(false);
  };

  const disconnect = async () => {
     if (sessionPromiseRef.current) {
         try {
             const session = await sessionPromiseRef.current;
             session.close();
         } catch (e) {
             console.error("Error closing session", e);
         }
         sessionPromiseRef.current = null;
     }
     stopAudio();
     stopVideo();
     setIsConnected(false);
     setIsConnecting(false);
  };

  const connect = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        setError("API Key is missing. Please add API_KEY to your environment variables (e.g. Vercel dashboard).");
        return;
    }

    if (!resumeAnalysis) {
        setError("Please upload a resume first to start the interview simulation.");
        return;
    }
    
    setIsConnecting(true);
    setError(null);

    try {
      // Initialize client inside the action to be safe
      const ai = new GoogleGenAI({ apiKey });

      // 1. Setup Audio Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;
      
      // 2. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true
      } });
      streamRef.current = stream;

      // 3. Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: `You are an experienced hiring manager conducting a job interview. 
            The candidate's summary is: "${resumeAnalysis.summary}". 
            Their key strengths are: ${resumeAnalysis.strengths.join(', ')}.
            
            Your goal is to assess their fit for a Senior role similar to their experience.
            Start by welcoming them and asking a relevant opening question based on their resume.
            Keep your responses concise and conversational. Do not be too verbose.
            If the candidate struggles, offer a small hint or move to a different topic.
            Be professional but encouraging.`,
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
        },
        callbacks: {
            onopen: async () => {
                console.log("Gemini Live Session Opened");
                setIsConnected(true);
                setIsConnecting(false);
                
                // Start Audio Processing Pipeline
                if (!audioContextRef.current || !streamRef.current) return;
                
                // Use a separate input context for 16kHz capture if needed
                const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const source = inputContext.createMediaStreamSource(streamRef.current);
                inputSourceRef.current = source;
                
                const processor = inputContext.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                
                processor.onaudioprocess = (e) => {
                    if (isMuted) return; // Don't send data if muted
                    
                    const inputData = e.inputBuffer.getChannelData(0);
                    
                    // Simple volume meter
                    let sum = 0;
                    for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                    setVolume(Math.sqrt(sum / inputData.length));

                    const pcmBlob = createPcmBlob(inputData);
                    
                    // We must use the promise stored in ref because session isn't available in closure yet when defined
                    if (sessionPromiseRef.current) {
                        sessionPromiseRef.current.then(session => {
                            try {
                                session.sendRealtimeInput({ media: pcmBlob });
                            } catch (err) {
                                console.error("Error sending audio input", err);
                            }
                        });
                    }
                };
                
                source.connect(processor);
                processor.connect(inputContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                
                if (base64Audio && audioContextRef.current) {
                    try {
                        const audioBytes = base64ToBytes(base64Audio);
                        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
                        
                        const source = audioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(audioContextRef.current.destination);
                        
                        // Schedule playback
                        const currentTime = audioContextRef.current.currentTime;
                        if (nextStartTimeRef.current < currentTime) {
                            nextStartTimeRef.current = currentTime;
                        }
                        
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        
                        audioSourcesRef.current.add(source);
                        source.onended = () => {
                            audioSourcesRef.current.delete(source);
                        };
                    } catch (e) {
                        console.error("Error processing audio message", e);
                    }
                }
                
                const interrupted = message.serverContent?.interrupted;
                if (interrupted) {
                    audioSourcesRef.current.forEach(s => s.stop());
                    audioSourcesRef.current.clear();
                    if (audioContextRef.current) {
                        nextStartTimeRef.current = audioContextRef.current.currentTime;
                    }
                }
            },
            onclose: () => {
                console.log("Gemini Live Session Closed");
                disconnect();
            },
            onerror: (err) => {
                console.error("Gemini Live Session Error", err);
                setError("Connection lost. Please try again.");
                disconnect();
            }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
        console.error("Failed to connect", err);
        setError(err.message || "Failed to start interview session.");
        setIsConnecting(false);
        disconnect();
    }
  };

  const toggleMute = () => {
      setIsMuted(!isMuted);
  };
  
  const toggleVideo = async () => {
      if (isVideoOn) {
          stopVideo();
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
              videoStreamRef.current = stream;
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
              }
              setIsVideoOn(true);
              
              // Start frame capture
              startVideoStreaming();
          } catch (e) {
              console.error("Failed to access camera", e);
          }
      }
  };
  
  const startVideoStreaming = () => {
      if (!canvasRef.current || !videoRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;
      
      frameIntervalRef.current = window.setInterval(async () => {
          if (!ctx || !video.videoWidth) return;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
          
          if (sessionPromiseRef.current) {
              sessionPromiseRef.current.then(session => {
                 try {
                     session.sendRealtimeInput({
                         media: {
                             mimeType: 'image/jpeg',
                             data: base64Data
                         }
                     });
                 } catch(e) {
                     // ignore send errors
                 }
              });
          }
      }, 1000);
  };

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          disconnect();
      };
  }, []);

  if (!resumeAnalysis) {
      return (
        <Card className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 bg-white shadow-none border border-slate-200 rounded-2xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
             <Mic className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Resume Required</h3>
          <p className="text-slate-500 max-w-md">Please upload your resume first so the AI interviewer can ask relevant questions.</p>
        </Card>
      );
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
         <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Live Interview Sim</h1>
            <p className="text-slate-500 mt-2">Real-time voice practice with an AI hiring manager.</p>
         </div>
         {isConnected && (
             <Badge variant="error" className="animate-pulse bg-red-50 text-red-600 border-red-200">
                <div className="w-2 h-2 rounded-full bg-red-600 mr-2" /> Live
             </Badge>
         )}
      </div>

      <Card className="flex-1 bg-slate-900 border-slate-800 relative overflow-hidden flex flex-col">
          {/* Main Visual Area */}
          <div className="flex-1 relative flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center">
             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
             
             {/* AI Avatar / Visualization */}
             <div className="relative z-10 flex flex-col items-center gap-6">
                <div className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative",
                    isConnected ? "bg-purple-600 shadow-[0_0_40px_-10px_rgba(147,51,234,0.5)] scale-110" : "bg-slate-700"
                )}>
                    {isConnected ? (
                        <>
                           {/* Simple visualizer ring */}
                           <div className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-50 animate-ping" style={{ animationDuration: '2s' }} />
                           <Volume2 className="w-12 h-12 text-white" />
                        </>
                    ) : (
                        <Mic className="w-12 h-12 text-slate-400" />
                    )}
                </div>
                
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-white">AI Interviewer</h3>
                    <p className="text-slate-400 max-w-md">
                        {isConnected 
                          ? "Listening..." 
                          : "Ready to start. Ensure your microphone is enabled."}
                    </p>
                </div>
             </div>
             
             {/* Self View (Video) */}
             <div className="absolute bottom-6 right-6 w-48 h-36 bg-black rounded-lg border border-slate-700 overflow-hidden shadow-xl">
                 {isVideoOn ? (
                     <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-600">
                         <VideoOff className="w-8 h-8" />
                     </div>
                 )}
                 <div className="absolute bottom-2 left-2 flex gap-2">
                      <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
                 </div>
             </div>
          </div>

          {/* Controls Bar */}
          <div className="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-6 relative z-20">
              {!isConnected ? (
                  <Button 
                    size="xl" 
                    onClick={connect} 
                    disabled={isConnecting}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 rounded-full px-8"
                  >
                    {isConnecting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                    Start Interview
                  </Button>
              ) : (
                  <>
                      <button 
                         onClick={toggleMute}
                         className={cn(
                             "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                             isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-slate-800 text-white hover:bg-slate-700"
                         )}
                      >
                          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                      </button>
                      
                      <button 
                         onClick={toggleVideo}
                         className={cn(
                             "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                             !isVideoOn ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-slate-800 text-white hover:bg-slate-700"
                         )}
                      >
                          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                      </button>

                      <button 
                         onClick={disconnect}
                         className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
                      >
                          <PhoneOff className="w-6 h-6" />
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
      
      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default LiveInterview;
