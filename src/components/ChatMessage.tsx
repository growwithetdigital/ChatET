import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Copy,
  Check,
  ShieldCheck,
  User,
  CornerDownRight,
  Maximize2,
  Download,
  ExternalLink,
  FileText,
  File,
  X,
  Volume2,
  Square,
  Globe,
} from 'lucide-react';
import { Message } from '../types';
import { speakTextWithGemini, stopActiveSpeech } from '../utils/audioPlayer';

interface ChatMessageProps {
  message: Message;
  onClarify?: (text: string) => void;
  onOpenImageStudioWithPrompt?: (prompt: string) => void;
  onMemoryDetected?: (category: string, content: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onClarify,
  onMemoryDetected,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeLightboxImg, setActiveLightboxImg] = useState<{ src: string; alt?: string } | null>(null);
  const isModel = message.role === 'model';

  // Parse out any [MEMORY_RECORD: category="..." | content="..."] tags
  let cleanedContent = message.content;
  const memoryMatches: Array<{ category: string; content: string }> = [];
  const memoryRegex = /\[MEMORY_RECORD:\s*category="([^"]+)"\s*\|\s*content="([^"]+)"\]/gi;

  let match;
  while ((match = memoryRegex.exec(message.content)) !== null) {
    memoryMatches.push({
      category: match[1],
      content: match[2],
    });
  }

  if (memoryMatches.length > 0) {
    cleanedContent = cleanedContent.replace(memoryRegex, '').trim();
  }

  // Trigger auto-save if newly detected
  React.useEffect(() => {
    if (isModel && !message.isStreaming && memoryMatches.length > 0 && onMemoryDetected) {
      for (const mem of memoryMatches) {
        onMemoryDetected(mem.category, mem.content);
      }
    }
  }, [isModel, message.isStreaming, message.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeak = async () => {
    if (isSpeaking) {
      stopActiveSpeech();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    await speakTextWithGemini(cleanedContent, {
      voiceName: 'Charon',
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(message.timestamp));

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Custom Image Renderer for Markdown with zoom, download, and lightbox capabilities
  const renderMarkdownImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { src, alt } = props;
    if (!src) return null;

    const handleDownload = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatet-render-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch {
        // Fallback link click
        const a = document.createElement('a');
        a.href = src;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }
    };

    return (
      <div className="my-4 group/img relative rounded-xl overflow-hidden border border-slate-700 bg-black shadow-xl">
        <div
          className="relative cursor-pointer max-h-[480px] overflow-hidden flex items-center justify-center bg-slate-950"
          onClick={() => setActiveLightboxImg({ src, alt })}
        >
          <img
            src={src}
            alt={alt || 'Visual render'}
            className="w-full h-auto object-cover max-h-[480px] transition-transform duration-300 group-hover/img:scale-[1.01]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-between p-3">
            <div className="text-xs text-slate-200 font-medium truncate max-w-[70%]">
              {alt || 'Generated visual concept'}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-1 border border-slate-700"
                title="Download high-res image"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightboxImg({ src, alt });
                }}
                className="p-1.5 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 text-xs flex items-center gap-1 border border-cyan-700/60"
                title="View full size"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        {alt && (
          <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="truncate italic">{alt}</span>
            <span className="text-[10px] text-cyan-400 font-mono shrink-0 ml-2">Visual Concept</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={`group relative flex flex-col w-full my-3 transition-all ${
          isModel ? 'items-start' : 'items-end'
        }`}
      >
        {/* Sender Header */}
        <div className={`flex items-center gap-2 mb-1.5 px-1 text-xs ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
          {isModel ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-950 border border-cyan-400/60 text-cyan-300 font-bold text-[10px] shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                ET
              </div>
              <span className="font-semibold text-slate-200 tracking-wide">ChatET</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Eric Thomas</span>
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                <User className="w-3 h-3" />
              </div>
            </div>
          )}
          <span className="text-[10px] text-slate-400 font-mono">{formattedTime}</span>
        </div>

        {/* Message Bubble Container */}
        <div
          className={`relative max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
            isModel
              ? 'bg-slate-900/90 text-slate-100 border border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
              : 'bg-gradient-to-r from-cyan-950/60 to-slate-900 text-slate-100 border border-cyan-500/30'
          }`}
        >
          {/* User Attachments Display */}
          {!isModel && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-xs"
                >
                  {att.type.startsWith('image/') && att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="w-7 h-7 rounded object-cover border border-slate-700"
                    />
                  ) : att.type === 'application/pdf' ? (
                    <div className="p-1 rounded bg-rose-950/60 text-rose-400">
                      <FileText className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-1 rounded bg-blue-950/60 text-blue-400">
                      <File className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="font-medium text-slate-200 truncate max-w-[150px]">{att.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{formatFileSize(att.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Markdown rendered output */}
          {isModel ? (
            <div className="prose prose-invert prose-sm max-w-none space-y-2.5 text-slate-200 text-sm leading-relaxed prose-headings:font-heading prose-headings:text-slate-100 prose-headings:font-bold prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-cyan-200 prose-code:text-cyan-300 prose-code:bg-slate-950 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-slate-800">
              <Markdown
                components={{
                  img: renderMarkdownImage,
                }}
              >
                {cleanedContent}
              </Markdown>
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
              )}

              {/* Google Search Grounding Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/70 not-prose">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-2">
                    <Globe className="w-3 h-3" />
                    <span>Verified Web Sources ({message.sources.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {message.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 hover:bg-slate-800 text-xs text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all max-w-[260px]"
                        title={src.uri}
                      >
                        <span className="truncate">{src.title || src.uri}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory Recorded Notice Badge */}
              {memoryMatches.length > 0 && (
                <div className="mt-3 pt-2 space-y-1.5 not-prose">
                  {memoryMatches.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/70 text-[11px] text-cyan-200 flex items-center gap-2"
                    >
                      <span className="text-xs">🧠</span>
                      <span>
                        <strong className="text-cyan-300 font-mono uppercase">Saved to Memory:</strong> &ldquo;{m.content}&rdquo;
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-slate-100 font-medium">
              {message.content}
            </div>
          )}

          {/* Advisor Controls & 7 Rules Stamp */}
          {isModel && !message.isStreaming && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400/90 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  7 Rules Verified
                </span>
                {message.sources && message.sources.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Search Grounded
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleSpeak}
                  className={`p-1 px-2 rounded transition-colors flex items-center gap-1 text-[11px] ${
                    isSpeaking
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50'
                      : 'hover:bg-slate-800 hover:text-cyan-300'
                  }`}
                  title={isSpeaking ? 'Stop spoken audio' : 'Read counsel aloud (Gemini TTS)'}
                >
                  {isSpeaking ? (
                    <>
                      <Square className="w-3 h-3 fill-current text-cyan-400" />
                      <span className="text-[10px] font-medium">Stop Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Listen</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
                  title="Copy counsel text"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>

                {onClarify && (
                  <button
                    onClick={() => onClarify("Could you drill deeper into the specific tradeoffs and missing variables here?")}
                    className="p-1 rounded hover:bg-slate-800 hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px]"
                    title="Prompt follow-up depth"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    <span className="text-[10px] hidden sm:inline">Drill Deeper</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Full Size Viewing */}
      {activeLightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActiveLightboxImg(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute -top-10 right-0 p-2 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeLightboxImg.src}
              alt={activeLightboxImg.alt || 'Full size'}
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {activeLightboxImg.alt && (
              <div className="mt-3 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs text-slate-300 max-w-xl truncate text-center">
                {activeLightboxImg.alt}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
