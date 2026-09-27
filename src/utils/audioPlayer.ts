// Audio Playback Utility for Web Speech API & Gemini 24kHz PCM TTS

let activeAudioCtx: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeEndCallback: (() => void) | null = null;
let currentSpeechSessionId = 0;

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove markdown images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Keep link text, remove URL
    .replace(/\[MEMORY_RECORD:.*?\]/gi, '') // Remove memory tags
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/```\w*\n?/g, '').replace(/```/g, '')
    ) // Strip code block fences but keep content
    .replace(/[#*`_~>|]/g, '') // Remove markdown symbols
    .replace(/\n{2,}/g, '. ') // Convert paragraph breaks to pauses
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function isWebSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

export function stopActiveSpeech(): void {
  currentSpeechSessionId++;

  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {
      // ignore if already stopped
    }
    activeSourceNode = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  if (activeEndCallback) {
    const cb = activeEndCallback;
    activeEndCallback = null;
    cb();
  }
}

function selectPreferredBrowserVoice(): SpeechSynthesisVoice | null {
  if (!isWebSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  const preferredKeywords = [
    'Google US English',
    'Google UK English Male',
    'Natural',
    'Online',
    'Daniel',
    'Aaron',
    'Samantha',
    'Alex',
  ];

  for (const keyword of preferredKeywords) {
    const match = pool.find((v) => v.name.includes(keyword));
    if (match) return match;
  }

  return pool.find((v) => v.default) || pool[0] || null;
}

/**
 * Splits long text into sentence-aligned chunks so Web Speech API does not
 * time out on long ChatET responses in Chromium browsers.
 */
function chunkTextForUtterances(text: string, maxChunkLength = 260): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((current + ' ' + trimmed).trim().length <= maxChunkLength) {
      current = (current + ' ' + trimmed).trim();
    } else {
      if (current) chunks.push(current);
      if (trimmed.length <= maxChunkLength) {
        current = trimmed;
      } else {
        // Hard-split very long unpunctuated segments by words
        const words = trimmed.split(/\s+/);
        let segment = '';
        for (const word of words) {
          if ((segment + ' ' + word).trim().length <= maxChunkLength) {
            segment = (segment + ' ' + word).trim();
          } else {
            if (segment) chunks.push(segment);
            segment = word;
          }
        }
        current = segment;
      }
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

/**
 * Speaks a model message aloud using the browser's native Web Speech API
 * (`window.speechSynthesis` and `SpeechSynthesisUtterance`).
 */
export function speakWithWebSpeech(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err?: unknown) => void;
  }
): void {
  stopActiveSpeech();

  if (!isWebSpeechSupported()) {
    options?.onError?.('Web Speech API is not supported in this browser.');
    options?.onEnd?.();
    return;
  }

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) {
    options?.onEnd?.();
    return;
  }

  const sessionId = ++currentSpeechSessionId;
  activeEndCallback = options?.onEnd || null;

  const chunks = chunkTextForUtterances(cleanText);
  const voice = selectPreferredBrowserVoice();
  let chunkIndex = 0;
  let started = false;

  const finishSession = () => {
    if (sessionId !== currentSpeechSessionId) return;
    if (activeEndCallback) {
      const cb = activeEndCallback;
      activeEndCallback = null;
      cb();
    }
  };

  const speakNextChunk = () => {
    if (sessionId !== currentSpeechSessionId) return;
    if (chunkIndex >= chunks.length) {
      finishSession();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-US';
    }
    utterance.rate = options?.rate ?? 1.02;
    utterance.pitch = options?.pitch ?? 1.0;

    utterance.onstart = () => {
      if (sessionId !== currentSpeechSessionId) return;
      if (!started) {
        started = true;
        options?.onStart?.();
      }
    };

    utterance.onend = () => {
      if (sessionId !== currentSpeechSessionId) return;
      chunkIndex++;
      speakNextChunk();
    };

    utterance.onerror = (event) => {
      if (sessionId !== currentSpeechSessionId) return;
      // Ignore 'interrupted' or 'canceled' errors triggered by stopActiveSpeech
      if (event.error === 'interrupted' || event.error === 'canceled') {
        return;
      }
      options?.onError?.(event.error);
      finishSession();
    };

    window.speechSynthesis.speak(utterance);
  };

  speakNextChunk();
}

export async function speakTextWithGemini(
  text: string,
  options?: {
    voiceName?: 'Charon' | 'Fenrir' | 'Kore' | 'Zephyr' | 'Puck';
    onStart?: () => void;
    onEnd?: () => void;
  }
): Promise<void> {
  stopActiveSpeech();

  const cleanText = cleanTextForSpeech(text);

  if (!cleanText) {
    options?.onEnd?.();
    return;
  }

  activeEndCallback = options?.onEnd || null;

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        voiceName: options?.voiceName || 'Charon',
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.audioBase64) {
      throw new Error('Empty audioBase64');
    }

    await playPcm24kBase64(data.audioBase64, options?.onStart, () => {
      if (activeEndCallback) {
        const cb = activeEndCallback;
        activeEndCallback = null;
        cb();
      }
    });
  } catch (err) {
    console.warn('Gemini TTS fallback to browser Web Speech API:', err);
    speakWithWebSpeech(cleanText, {
      onStart: options?.onStart,
      onEnd: options?.onEnd,
    });
  }
}

async function playPcm24kBase64(
  base64Audio: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
    activeAudioCtx = new AudioCtx({ sampleRate: 24000 });
  }
  if (activeAudioCtx.state === 'suspended') {
    await activeAudioCtx.resume();
  }

  const binaryString = window.atob(base64Audio);
  const byteLength = binaryString.length;
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Convert 16-bit signed little-endian PCM to Float32Array
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const float32Data = new Float32Array(sampleCount);
  const dataView = new DataView(bytes.buffer);
  for (let i = 0; i < sampleCount; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    float32Data[i] = int16 / 32768.0;
  }

  const audioBuffer = activeAudioCtx.createBuffer(1, sampleCount, 24000);
  audioBuffer.getChannelData(0).set(float32Data);

  const source = activeAudioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(activeAudioCtx.destination);
  activeSourceNode = source;

  onStart?.();

  return new Promise<void>((resolve) => {
    source.onended = () => {
      if (activeSourceNode === source) {
        activeSourceNode = null;
      }
      onEnd?.();
      resolve();
    };
    source.start(0);
  });
}
