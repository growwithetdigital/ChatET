// Audio Playback Utility for Gemini 24kHz PCM TTS & Browser Speech Fallback

let activeAudioCtx: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;

export function stopActiveSpeech(): void {
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

  const cleanText = text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[MEMORY_RECORD:.*?\]/gi, '')
    .replace(/[#*`_~]/g, '')
    .trim();

  if (!cleanText) {
    options?.onEnd?.();
    return;
  }

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

    await playPcm24kBase64(data.audioBase64, options?.onStart, options?.onEnd);
  } catch (err) {
    console.warn('Gemini TTS fallback to browser speechSynthesis:', err);
    speakWithBrowserFallback(cleanText, options?.onStart, options?.onEnd);
  }
}

async function playPcm24kBase64(
  base64Audio: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

function speakWithBrowserFallback(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 1500));
  utterance.rate = 1.03;
  utterance.pitch = 0.95;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}
