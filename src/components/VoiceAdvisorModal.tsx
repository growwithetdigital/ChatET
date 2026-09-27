import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Square,
  Loader2,
  Radio,
  Globe,
  Zap,
} from 'lucide-react';
import { CustomET, FocusAreaId } from '../types';
import { speakTextWithGemini, stopActiveSpeech } from '../utils/audioPlayer';

interface VoiceAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCustomEt?: CustomET;
  activeLens: FocusAreaId;
  useWebSearch: boolean;
  onVoiceTurnSubmit: (
    spokenPrompt: string,
    onResponseReady: (responseText: string) => void
  ) => Promise<void>;
}

type VoicePersona = 'Charon' | 'Fenrir' | 'Kore' | 'Zephyr';

const VOICE_OPTIONS: Array<{ id: VoicePersona; label: string; desc: string }> = [
  { id: 'Charon', label: 'Charon', desc: 'Deep Executive' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Blunt Strategist' },
  { id: 'Kore', label: 'Kore', desc: 'Crisp Analyst' },
  { id: 'Zephyr', label: 'Zephyr', desc: 'Calm Sounding Board' },
];

export const VoiceAdvisorModal: React.FC<VoiceAdvisorModalProps> = ({
  isOpen,
  onClose,
  activeCustomEt,
  useWebSearch,
  onVoiceTurnSubmit,
}) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [advisorReply, setAdvisorReply] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>('Charon');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [errorNote, setErrorNote] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef('');

  useEffect(() => {
    if (!isOpen) {
      stopListeningCleanup();
      stopActiveSpeech();
      setStatus('idle');
      setTranscript('');
      setAdvisorReply('');
      setErrorNote(null);
    }
  }, [isOpen]);

  const stopListeningCleanup = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  const startListening = async () => {
    stopActiveSpeech();
    setErrorNote(null);
    setTranscript('');
    transcriptRef.current = '';
    setAdvisorReply('');

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let combined = '';
          for (let i = 0; i < event.results.length; i++) {
            combined += event.results[i][0].transcript + ' ';
          }
          const clean = combined.trim();
          transcriptRef.current = clean;
          setTranscript(clean);
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition warning:', e?.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setStatus('listening');
        return;
      } catch (err) {
        console.warn('Falling back to MediaRecorder:', err);
      }
    }

    // Fallback: MediaRecorder + Gemini /api/transcribe
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus('listening');
    } catch (err: any) {
      setErrorNote('Microphone access denied or unavailable. Please check browser permissions.');
      setStatus('idle');
    }
  };

  const finishListeningAndSend = async () => {
    if (status !== 'listening') return;

    // Case 1: Web Speech Recognition captured transcript
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;

      const finalSpoken = transcriptRef.current.trim();
      if (!finalSpoken) {
        setStatus('idle');
        setErrorNote('No speech detected. Tap the microphone and speak your question.');
        return;
      }
      await submitSpokenInquiry(finalSpoken);
      return;
    }

    // Case 2: MediaRecorder fallback -> send to /api/transcribe
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setStatus('transcribing');
      const recorder = mediaRecorderRef.current;

      await new Promise<void>((resolve) => {
        recorder.onstop = () => {
          recorder.stream.getTracks().forEach((t) => t.stop());
          resolve();
        };
        recorder.stop();
      });

      const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      if (audioBlob.size < 200) {
        setStatus('idle');
        setErrorNote('Recording was too short. Please try again.');
        return;
      }

      try {
        const base64Audio = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });

        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: audioBlob.type || 'audio/webm',
          }),
        });

        if (!res.ok) throw new Error('Transcription failed');
        const data = await res.json();
        const text = (data.text || '').trim();
        if (!text) {
          setStatus('idle');
          setErrorNote('Could not discern speech clearly. Please try again.');
          return;
        }
        setTranscript(text);
        await submitSpokenInquiry(text);
      } catch (err: any) {
        setStatus('idle');
        setErrorNote(err?.message || 'Unable to transcribe audio.');
      }
    }
  };

  const submitSpokenInquiry = async (spokenText: string) => {
    setStatus('thinking');
    setAdvisorReply('');

    await onVoiceTurnSubmit(spokenText, async (finalResponseText) => {
      setAdvisorReply(finalResponseText);
      if (autoSpeak && finalResponseText) {
        setStatus('speaking');
        await speakTextWithGemini(finalResponseText, {
          voiceName: selectedVoice,
          onStart: () => setStatus('speaking'),
          onEnd: () => setStatus('idle'),
        });
      } else {
        setStatus('idle');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#090e17] border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-heading text-white tracking-wide">
                  ChatET • Live Voice Mode
                </h2>
                {useWebSearch && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5" />
                    Web Grounded
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {activeCustomEt
                  ? `Active Persona: ${activeCustomEt.name}`
                  : 'Direct Executive Sounding Board (Spoken Mode)'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopListeningCleanup();
              stopActiveSpeech();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Persona Selector Bar */}
        <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Voice:</span>
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedVoice === v.id
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title={v.desc}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (autoSpeak) stopActiveSpeech();
              setAutoSpeak(!autoSpeak);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              autoSpeak
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{autoSpeak ? 'Voice Output On' : 'Muted'}</span>
          </button>
        </div>

        {/* Center Acoustic Orb & Live Transcript */}
        <div className="px-6 py-8 flex flex-col items-center justify-center text-center min-h-[300px]">
          {/* Animated Orb */}
          <div className="relative mb-6 flex items-center justify-center">
            {status === 'listening' && (
              <>
                <div className="absolute w-32 h-32 rounded-full bg-cyan-500/20 animate-ping" />
                <div className="absolute w-24 h-24 rounded-full bg-cyan-400/30 animate-pulse" />
              </>
            )}
            {status === 'speaking' && (
              <>
                <div className="absolute w-32 h-32 rounded-full bg-teal-500/20 animate-pulse" />
                <div className="absolute w-28 h-28 rounded-full border border-cyan-400/40 animate-spin" />
              </>
            )}

            <button
              onClick={() => {
                if (status === 'listening') {
                  finishListeningAndSend();
                } else if (status === 'speaking') {
                  stopActiveSpeech();
                  setStatus('idle');
                } else if (status === 'idle') {
                  startListening();
                }
              }}
              disabled={status === 'thinking' || status === 'transcribing'}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                status === 'listening'
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_35px_rgba(239,68,68,0.6)] scale-105'
                  : status === 'speaking'
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_35px_rgba(6,182,212,0.6)]'
                  : status === 'thinking' || status === 'transcribing'
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 cursor-wait'
                  : 'bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105'
              }`}
            >
              {status === 'listening' ? (
                <Square className="w-7 h-7 fill-current" />
              ) : status === 'thinking' || status === 'transcribing' ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : status === 'speaking' ? (
                <Volume2 className="w-8 h-8 animate-bounce" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Status Label */}
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">
            {status === 'idle' && 'Tap Microphone to Speak with ChatET'}
            {status === 'listening' && 'Listening... Tap Stop Square When Done'}
            {status === 'transcribing' && 'Transcribing Audio via Gemini...'}
            {status === 'thinking' && 'Synthesizing Strategic Counsel...'}
            {status === 'speaking' && `Speaking (${selectedVoice} Voice)... Tap Orb to Interrupt`}
          </div>

          {errorNote && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-amber-950/60 border border-amber-700/60 text-xs text-amber-200 max-w-md">
              {errorNote}
            </div>
          )}

          {/* Spoken Transcript Preview */}
          {transcript && (
            <div className="w-full max-w-lg p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-left mb-3">
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">
                Eric Thomas (Spoken):
              </div>
              <p className="text-xs text-slate-100 leading-relaxed">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}

          {/* Advisor Reply Preview */}
          {advisorReply && (
            <div className="w-full max-w-lg p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-left max-h-44 overflow-y-auto">
              <div className="text-[10px] font-mono uppercase text-cyan-400 mb-1 flex items-center justify-between">
                <span>ChatET Response:</span>
                <Sparkles className="w-3 h-3" />
              </div>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {advisorReply.replace(/\[MEMORY_RECORD:.*?\]/gi, '').trim()}
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Every voice turn is saved to your active consultation transcript.</span>
          <span className="font-mono text-cyan-400">Gemini TTS 24kHz</span>
        </div>
      </div>
    </div>
  );
};
