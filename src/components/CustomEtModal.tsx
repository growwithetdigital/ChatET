import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  FileText,
  File,
  Trash2,
  Check,
  Plus,
  Wand2,
  MessageSquarePlus,
  ListChecks,
  AlignLeft,
} from 'lucide-react';
import { CustomET, FileAttachment, FocusAreaId } from '../types';
import { FOCUS_AREAS } from '../data/constants';

interface CustomEtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (et: CustomET) => void;
  onDelete?: (id: string) => void;
  editingEt?: CustomET | null;
}

const COLOR_OPTIONS = [
  'from-cyan-500 to-teal-500',
  'from-blue-500 to-indigo-500',
  'from-emerald-400 to-cyan-500',
  'from-amber-400 to-cyan-500',
  'from-purple-500 to-cyan-500',
  'from-rose-500 to-pink-500',
];

const FOUR_PILLAR_BLUEPRINT = `## 1. PERSONA & TONE
You are a witty, energetic, and deeply knowledgeable strategic advisor for Eric Thomas. Keep your responses engaging, clear, and direct, with zero corporate filler.

## 2. STEP-BY-STEP REASONING GUIDELINES
Think through complex problems step-by-step before giving your final recommendation:
1. First-Principles Breakdown: Strip away assumptions and identify the core mechanism or incentive.
2. Evidence & Unit Math: Quantify the key variables and flag any approximate figures clearly.
3. High-Leverage Prescription: Deliver a concrete, prioritized action plan.

## 3. FEW-SHOT EXAMPLES
- **User Prompt:** "Give me a quick gut-check on this strategy before I commit budget."
- **Ideal Response:**
  **Lead with the direct verdict in one bold sentence.**
  - **Step 1 (Core Bottleneck):** Explain the primary leverage point or hidden risk in 1–2 crisp sentences.
  - **Step 2 (The Math / Tradeoff):** Show the back-of-the-envelope numbers or second-order effects.
  - **Bottom Line:** State the exact next move to validate before spending capital.

## 4. FORMATTING RULES
Use clean Markdown, short conversational paragraphs (2–3 sentences max), concise bullet points for comparisons or steps, and end with a bold **Bottom Line**.`;

export const CustomEtModal: React.FC<CustomEtModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingEt,
}) => {
  const [name, setName] = useState(editingEt?.name || '');
  const [tagline, setTagline] = useState(editingEt?.tagline || '');
  const [instructions, setInstructions] = useState(editingEt?.instructions || '');
  const [focusArea, setFocusArea] = useState<FocusAreaId>(editingEt?.focusArea || 'all');
  const [files, setFiles] = useState<FileAttachment[]>(editingEt?.files || []);
  const [iconName, setIconName] = useState(editingEt?.iconName || 'TrendingUp');
  const [color, setColor] = useState(editingEt?.color || 'from-cyan-500 to-teal-500');
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Interactive Few-Shot Example Builder state
  const [showFewShotBuilder, setShowFewShotBuilder] = useState(false);
  const [sampleUserPrompt, setSampleUserPrompt] = useState('');
  const [sampleIdealResponse, setSampleIdealResponse] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setValidationError(null);
    setConfirmDelete(false);
    setShowFewShotBuilder(false);
    setSampleUserPrompt('');
    setSampleIdealResponse('');

    if (editingEt) {
      setName(editingEt.name);
      setTagline(editingEt.tagline);
      setInstructions(editingEt.instructions);
      setFocusArea(editingEt.focusArea || 'all');
      setFiles(editingEt.files || []);
      setIconName(editingEt.iconName || 'TrendingUp');
      setColor(editingEt.color || 'from-cyan-500 to-teal-500');
    } else {
      setName('');
      setTagline('');
      setInstructions('');
      setFocusArea('all');
      setFiles([]);
      setIconName('TrendingUp');
      setColor('from-cyan-500 to-teal-500');
    }
  }, [editingEt, isOpen]);

  if (!isOpen) return null;

  const appendInstructionBlock = (blockText: string) => {
    setInstructions((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n${blockText}` : blockText;
    });
  };

  const handleInsertFewShotPair = () => {
    if (!sampleUserPrompt.trim() || !sampleIdealResponse.trim()) {
      setValidationError('Please enter both a sample User Prompt and an Ideal Response for the few-shot example.');
      return;
    }
    setValidationError(null);
    const formattedPair = `### Few-Shot Calibration Example\n- **User Prompt:** "${sampleUserPrompt.trim()}"\n- **Ideal Response:**\n${sampleIdealResponse.trim()}`;
    appendInstructionBlock(formattedPair);
    setSampleUserPrompt('');
    setSampleIdealResponse('');
    setShowFewShotBuilder(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    setIsProcessingFiles(true);
    setValidationError(null);
    const newFiles: FileAttachment[] = [];

    for (let i = 0; i < uploaded.length; i++) {
      const file = uploaded[i];
      if (file.size > 15 * 1024 * 1024) {
        setValidationError(`File "${file.name}" exceeds 15MB limit.`);
        continue;
      }

      const id = `kb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newFiles.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          base64,
        });
      } else {
        const textContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(file);
        });
        newFiles.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          textContent,
        });
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setIsProcessingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Please enter a name for this Custom ET.');
      return;
    }

    const customEt: CustomET = {
      id: editingEt?.id || `et-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      tagline: tagline.trim() || 'Specialized Thinking Partner',
      instructions: instructions.trim() || FOUR_PILLAR_BLUEPRINT,
      focusArea,
      files,
      iconName,
      color,
      starterPrompts: editingEt?.starterPrompts,
      createdAt: editingEt?.createdAt || Date.now(),
      updatedAt: Date.now(),
      isBuiltIn: editingEt?.isBuiltIn || false,
    };

    onSave(customEt);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0b121e] border border-slate-700/80 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-md`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                {editingEt ? `Configure Custom ET: ${editingEt.name}` : 'Create Custom ET'}
              </h2>
              <p className="text-xs text-slate-400">
                Calibrate persona &amp; tone, step-by-step reasoning, few-shot examples, and knowledge files.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {validationError && (
            <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-700/70 text-xs text-amber-200 flex items-center justify-between">
              <span>{validationError}</span>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-amber-300 hover:text-white font-mono text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide font-mono">
                Custom ET Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GOS Funnel Auditor, Documentary Producer"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide font-mono">
                Tagline / Scope
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Scrutinizes conversion drop-offs & unit economics"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Primary Focus Lens */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide font-mono">
              Primary Strategic Domain
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FOCUS_AREAS.map((area) => (
                <button
                  type="button"
                  key={area.id}
                  onClick={() => setFocusArea(area.id)}
                  className={`p-2 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                    focusArea === area.id
                      ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{area.shortLabel}</span>
                  {focusArea === area.id && <Check className="w-3.5 h-3.5 text-cyan-400 ml-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* 4-Pillar System Instructions Studio */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide font-mono">
                System Instructions (Persona, Reasoning &amp; Few-Shot Examples)
              </label>
              <button
                type="button"
                onClick={() => setInstructions(FOUR_PILLAR_BLUEPRINT)}
                className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-700/60 flex items-center gap-1 transition-all"
              >
                <Wand2 className="w-3 h-3" />
                <span>Load 4-Pillar Best-Practice Blueprint</span>
              </button>
            </div>

            {/* Quick-Insert Building Block Bar */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <button
                type="button"
                onClick={() =>
                  appendInstructionBlock(
                    `## PERSONA & TONE\nYou are a witty, energetic, and highly knowledgeable advisor for Eric Thomas. Keep your responses engaging, sharp, clear, and direct.`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 text-[11px] flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>+ Persona &amp; Tone</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  appendInstructionBlock(
                    `## STEP-BY-STEP REASONING\nThink through complex problems step-by-step before giving a final answer:\n1. Deconstruct from first principles.\n2. Verify unit math and flag approximate figures.\n3. Deliver the highest-leverage recommendation.`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 text-[11px] flex items-center gap-1 transition-colors"
              >
                <ListChecks className="w-3 h-3 text-cyan-400" />
                <span>+ Step-by-Step Reasoning</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFewShotBuilder(!showFewShotBuilder)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition-colors ${
                  showFewShotBuilder
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border-slate-800'
                }`}
              >
                <MessageSquarePlus className="w-3 h-3 text-cyan-400" />
                <span>+ Add Few-Shot Example</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  appendInstructionBlock(
                    `## FORMATTING RULES\nFormat all answers in clean Markdown: open with a bold 1-sentence thesis, use short conversational paragraphs (2–3 sentences), use concise bullet points for steps or math, and end with a bold **Bottom Line**.`
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 text-[11px] flex items-center gap-1 transition-colors"
              >
                <AlignLeft className="w-3 h-3 text-cyan-400" />
                <span>+ Formatting Rules</span>
              </button>
            </div>

            {/* Interactive Few-Shot Example Pair Builder Drawer */}
            {showFewShotBuilder && (
              <div className="mb-3 p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-cyan-400">
                    Few-Shot Calibration Pair (User Prompt &rarr; Ideal ET Response)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFewShotBuilder(false)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <input
                  type="text"
                  value={sampleUserPrompt}
                  onChange={(e) => setSampleUserPrompt(e.target.value)}
                  placeholder="Sample User Prompt (e.g. 'Should we drop our retainer price to close this deal?')"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <textarea
                  rows={3}
                  value={sampleIdealResponse}
                  onChange={(e) => setSampleIdealResponse(e.target.value)}
                  placeholder="Ideal ET Response (Show the exact tone, step-by-step breakdown, and formatting you want this ET to replicate...)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleInsertFewShotPair}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Append Few-Shot Example to Instructions</span>
                  </button>
                </div>
              </div>
            )}

            <textarea
              rows={7}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Define Persona & Tone, Step-by-Step Reasoning, Few-Shot Prompt/Response Examples, and Markdown Formatting Rules..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-y leading-relaxed"
            />
          </div>

          {/* Knowledge Base Documents */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide font-mono">
                Knowledge Base Files ({files.length})
              </label>
              <span className="text-[11px] text-slate-400">PDFs, Docs, CSVs, Markdown, Style Guides</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.csv,.txt,.md,.json,.doc,.docx"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/70 rounded-xl p-4 text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 transition-all group"
            >
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 mx-auto mb-1.5 transition-colors" />
              <div className="text-xs font-semibold text-slate-200">
                {isProcessingFiles ? 'Processing documents...' : 'Click or drop files to add to this Custom ET'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Uploaded knowledge files will be referenced exclusively by this Custom ET.
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-2.5 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {file.type.includes('pdf') ? (
                        <FileText className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      )}
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Color & Visual Styling */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide font-mono">
              Theme Accent
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full bg-gradient-to-r ${c} transition-all flex items-center justify-center ${
                    color === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            {editingEt && !editingEt.isBuiltIn && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(editingEt.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ET</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-[0.98]"
              >
                {editingEt ? 'Save Changes' : 'Create Custom ET'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
