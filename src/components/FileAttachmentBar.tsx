import React, { useRef } from 'react';
import { Paperclip, FileText, Image as ImageIcon, X, File, AlertCircle } from 'lucide-react';
import { FileAttachment } from '../types';

interface FileAttachmentBarProps {
  attachments: FileAttachment[];
  onAddAttachments: (newAttachments: FileAttachment[]) => void;
  onRemoveAttachment: (id: string) => void;
  disabled?: boolean;
  onTriggerRef?: (trigger: () => void) => void;
}

export const FileAttachmentBar: React.FC<FileAttachmentBarProps> = ({
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  disabled = false,
  onTriggerRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (onTriggerRef && fileInputRef.current) {
      onTriggerRef(() => fileInputRef.current?.click());
    }
  }, [onTriggerRef]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const processedAttachments: FileAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Limit 15MB per file to maintain smooth browser/server performance
      if (file.size > 15 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 15MB limit.`);
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      if (file.type.startsWith('image/')) {
        const base64 = await readFileAsDataURL(file);
        processedAttachments.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          base64,
          previewUrl: base64,
        });
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const base64 = await readFileAsDataURL(file);
        processedAttachments.push({
          id,
          name: file.name,
          size: file.size,
          type: 'application/pdf',
          base64,
        });
      } else {
        // Text-based files (txt, csv, md, json, ts, etc.)
        const textContent = await readFileAsText(file);
        processedAttachments.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          textContent,
        });
      }
    }

    if (processedAttachments.length > 0) {
      onAddAttachments(processedAttachments);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.txt,.md,.json,.doc,.docx"
        className="hidden"
        disabled={disabled}
      />

      {/* Attachment Previews if any are selected */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 animate-in fade-in duration-150">
          <span className="text-[11px] font-mono text-cyan-400 px-1">Attached:</span>
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 group"
            >
              {att.type.startsWith('image/') ? (
                att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-4 h-4 rounded object-cover border border-slate-700"
                  />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                )
              ) : att.type === 'application/pdf' ? (
                <FileText className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <File className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="max-w-[140px] truncate text-xs font-medium">{att.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">({formatFileSize(att.size)})</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(att.id)}
                className="ml-1 p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
