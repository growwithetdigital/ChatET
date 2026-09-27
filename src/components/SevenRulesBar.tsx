import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';
import { SEVEN_RULES } from '../data/constants';

interface SevenRulesBarProps {
  className?: string;
}

export const SevenRulesBar: React.FC<SevenRulesBarProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`rounded-xl border border-cyan-500/20 bg-slate-900/70 backdrop-blur-md overflow-hidden transition-all ${className}`}>
      {/* Bar Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold tracking-wide uppercase text-cyan-300 font-mono">
              The Seven Rules
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Non-negotiable reasoning protocol (Honesty over helpfulness)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
            7 Active
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Rules List */}
      {isOpen && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80 bg-slate-950/50">
          <p className="text-xs text-slate-400 mb-2.5 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            Every response from Eric AI must strictly abide by these guardrails:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {SEVEN_RULES.map((rule) => (
              <div
                key={rule.id}
                className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="flex items-center justify-center w-4 h-4 rounded bg-cyan-950 text-cyan-400 font-mono text-[10px] font-bold">
                    {rule.id}
                  </span>
                  <span className="font-semibold text-slate-200 tracking-wide text-[11px]">
                    {rule.name}
                  </span>
                </div>
                <div className="text-[11px] text-cyan-300/90 font-mono mb-0.5">
                  {rule.summary}
                </div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  {rule.standard}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2.5 p-2 rounded-lg bg-cyan-950/30 border border-cyan-900/40 text-[11px] text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Priority: If helpfulness conflicts with honesty, honesty wins every single time.</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono font-medium">
              Zero Throat-Clearing
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
