import React, { useState } from 'react';
import { Sparkles, Download, Copy, Check, X, Maximize2, ExternalLink, RefreshCw, Wand2, Image as ImageIcon } from 'lucide-react';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (imageUrl: string, prompt: string) => void;
  initialPrompt?: string;
}

const STYLE_PRESETS = [
  {
    id: 'editorial',
    label: 'Luxury & Editorial',
    desc: 'Hasselblad, architectural, minimalist lighting, 8k',
    modifier: 'luxury architectural editorial photography, 8k resolution, Leica 50mm, Hasselblad, sharp focus, natural elegant lighting',
  },
  {
    id: 'documentary',
    label: 'Cinematic Documentary',
    desc: '35mm film still, evocative, authentic grain',
    modifier: 'award-winning cinematic documentary still, 35mm Kodak film grain, authentic atmosphere, evocative lighting, 8k',
  },
  {
    id: 'etdigital',
    label: 'ET Digital Cyber-Slate',
    desc: 'Deep slate, turquoise & cyan neon circuits, sleek tech',
    modifier: 'cinematic dark tech aesthetic, turquoise and cyan circuit glow, deep slate backdrop, futuristic studio lighting, Octane render 8k',
  },
  {
    id: 'pod_merch',
    label: 'Etsy & POD Mockup',
    desc: 'Clean apparel/print product mockup on neutral backdrop',
    modifier: 'commercial apparel print-on-demand product mockup, premium studio lighting, clean minimal background, photorealistic 8k',
  },
  {
    id: 'minimalist',
    label: 'Minimalist Graphic',
    desc: 'Negative space, Swiss typography, stark contrast',
    modifier: 'high-end minimalist Scandinavian design, clean geometric lines, generous negative space, museum exhibition quality',
  },
];

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 Landscape', width: 1200, height: 675 },
  { id: '1:1', label: '1:1 Square (Etsy/Social)', width: 1024, height: 1024 },
  { id: '4:3', label: '4:3 Classic Editorial', width: 1200, height: 900 },
  { id: '9:16', label: '9:16 Vertical / Mobile', width: 675, height: 1200 },
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  initialPrompt = '',
}) => {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [selectedStyle, setSelectedStyle] = useState('editorial');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const ratio = ASPECT_RATIOS.find((r) => r.id === selectedRatio) || ASPECT_RATIOS[0];
      const style = STYLE_PRESETS.find((s) => s.id === selectedStyle) || STYLE_PRESETS[0];

      const fullPrompt = `${prompt.trim()}, ${style.modifier}`;
      const seed = Math.floor(Math.random() * 1000000);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        fullPrompt
      )}?width=${ratio.width}&height=${ratio.height}&nologo=true&seed=${seed}`;

      // Preload image to ensure it is generated
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setGeneratedImage(url);
        setEnhancedPrompt(fullPrompt);
        setIsGenerating(false);
      };
      img.onerror = () => {
        // Fallback display anyway
        setGeneratedImage(url);
        setEnhancedPrompt(fullPrompt);
        setIsGenerating(false);
      };
    } catch (err) {
      console.error('Image generation error:', err);
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedImage) return;
    navigator.clipboard.writeText(generatedImage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chatet-visual-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(generatedImage, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                ChatET Visual Studio
              </h2>
              <p className="text-xs text-slate-400">
                High-resolution conceptual rendering for GOS decks, POD mockups, luxury marketing & documentary treatments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Visual Prompt / Scene Description</span>
              <span className="text-slate-400 normal-case font-normal text-[11px]">Be descriptive (lighting, subjects, camera)</span>
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g. A sleek luxury penthouse living room overlooking Manhattan at dusk, minimalist modern furniture, warm architectural recessed lighting, rain on glass, 8k..."
                rows={3}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none"
              />
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Style Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Aesthetic Lens</label>
              <div className="grid grid-cols-1 gap-1.5">
                {STYLE_PRESETS.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${
                      selectedStyle === style.id
                        ? 'bg-cyan-950/40 border-cyan-400/80 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full border ${
                          selectedStyle === style.id ? 'bg-cyan-400 border-cyan-300' : 'border-slate-600'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{style.label}</div>
                      <div className="text-[10px] text-slate-400">{style.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio & Quick Action */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setSelectedRatio(ratio.id)}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-center transition-all ${
                        selectedRatio === ratio.id
                          ? 'bg-cyan-950/40 border-cyan-400/80 text-cyan-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Rendering Visual Artifact...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-slate-950" />
                    <span>Generate Image Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Result View */}
          {generatedImage && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-cyan-400" />
                  Render Output
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                  {onInsertToChat && (
                    <button
                      onClick={() => {
                        onInsertToChat(generatedImage, prompt);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 text-xs flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Send to Chat</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black max-h-[380px] flex items-center justify-center">
                <img
                  src={generatedImage}
                  alt={prompt}
                  className="w-full h-full object-contain max-h-[380px]"
                />
              </div>

              {enhancedPrompt && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
                  <span className="text-cyan-400 font-semibold">Render Prompt: </span>
                  {enhancedPrompt}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
