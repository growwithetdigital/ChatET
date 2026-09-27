import React from 'react';
import {
  Plus,
  Settings2,
  FileText,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { CustomET } from '../types';

interface CustomEtsViewProps {
  customEts: CustomET[];
  activeEtId: string | null;
  onSelectEtAndChat: (etId: string | null, starterPrompt?: string) => void;
  onCreateNew: () => void;
  onEditEt: (et: CustomET) => void;
}

export const CustomEtsView: React.FC<CustomEtsViewProps> = ({
  customEts,
  activeEtId,
  onSelectEtAndChat,
  onCreateNew,
  onEditEt,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="text-xs text-cyan-400 font-medium mb-1">
              Specialized Personas · Custom Instructions · Knowledge Files
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
              Custom ETs
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Specialized thinking partners pre-loaded with custom instructions, few-shot calibration examples, and uploaded reference documents.
            </p>
          </div>

          <button
            onClick={onCreateNew}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom ET</span>
          </button>
        </div>

        {/* Core ChatET Default Card */}
        <div
          className={`p-5 rounded-2xl bg-slate-900/90 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            activeEtId === null
              ? 'border-cyan-500/60'
              : 'border-slate-800/90 hover:border-slate-700'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
              <span>Core Mode</span>
              {activeEtId === null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Active
                  </span>
                </>
              )}
            </div>
            <h3 className="text-base font-bold font-heading text-white">
              ChatET Standard (All-Around Thinking Partner)
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl">
              Your holistic personal advisor across GOS strategy, entrepreneurship, parenting, finances, science, and daily life—operating automatically with the Seven Rules and first-principles reasoning behind the scenes.
            </p>
          </div>

          <button
            onClick={() => onSelectEtAndChat(null)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 self-start sm:self-center"
          >
            <span>Open in Chat</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Custom ETs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customEts.map((et) => {
            const isSelected = activeEtId === et.id;
            return (
              <div
                key={et.id}
                className={`p-5 rounded-2xl bg-slate-900/90 border transition-all flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'border-cyan-500/60'
                    : 'border-slate-800/90 hover:border-cyan-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                        <span className="text-cyan-400 font-medium">
                          {et.isBuiltIn ? 'Built-In ET' : 'Custom ET'}
                        </span>
                        {et.files && et.files.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {et.files.length} file{et.files.length > 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-bold font-heading text-white">
                        {et.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => onEditEt(et)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Configure instructions & knowledge files"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{et.tagline}</p>

                  {/* Starter Prompts */}
                  {et.starterPrompts && et.starterPrompts.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] text-slate-400 font-medium">
                        Quick Starters:
                      </div>
                      {et.starterPrompts.slice(0, 2).map((sp, i) => (
                        <button
                          key={i}
                          onClick={() => onSelectEtAndChat(et.id, sp)}
                          className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-left text-xs text-slate-300 transition-colors line-clamp-2"
                        >
                          &ldquo;{sp}&rdquo;
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => onEditEt(et)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Edit Instructions &amp; Files
                  </button>

                  <button
                    onClick={() => onSelectEtAndChat(et.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span>Activate in Chat</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
