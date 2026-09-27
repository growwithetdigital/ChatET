import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  Plus,
  Settings2,
  FileText,
  Check,
  Zap,
} from 'lucide-react';
import { CustomET } from '../types';

interface CustomEtSelectorProps {
  customEts: CustomET[];
  activeEtId: string | null; // null means default core Eric AI
  onSelectEt: (id: string | null) => void;
  onCreateNew: () => void;
  onEditEt: (et: CustomET) => void;
}

export const CustomEtSelector: React.FC<CustomEtSelectorProps> = ({
  customEts,
  activeEtId,
  onSelectEt,
  onCreateNew,
  onEditEt,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeEt = customEts.find((et) => et.id === activeEtId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/50 transition-all text-xs text-left group shadow-sm"
        title="Switch Custom ET (Custom GPT / Gem)"
      >
        <div
          className={`w-5 h-5 rounded-lg flex items-center justify-center text-white ${
            activeEt
              ? `bg-gradient-to-r ${activeEt.color || 'from-cyan-500 to-blue-500'}`
              : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
          }`}
        >
          {activeEt ? <Zap className="w-3 h-3 fill-current" /> : <Sparkles className="w-3 h-3" />}
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold leading-none">
            {activeEt ? 'Custom ET' : 'Core Mode'}
          </span>
          <span className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-[170px] leading-tight mt-0.5">
            {activeEt ? activeEt.name : 'ChatET Standard'}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-[#0d1522] border border-slate-700/90 shadow-[0_10px_35px_rgba(0,0,0,0.6)] py-2 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Select Custom ET (Gems)
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateNew();
              }}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>New ET</span>
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            {/* Core Eric AI */}
            <div
              onClick={() => {
                onSelectEt(null);
                setIsOpen(false);
              }}
              className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-start justify-between ${
                activeEtId === null
                  ? 'bg-cyan-950/70 border border-cyan-500/60 text-cyan-200'
                  : 'hover:bg-slate-850 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-400 flex items-center justify-center text-white mt-0.5 flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    ChatET (Core Advisor)
                    {activeEtId === null && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                    All-around thinking partner with automatic first-principles &amp; Seven Rules reasoning.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom ET List */}
            {customEts.map((et) => (
              <div
                key={et.id}
                className={`group p-2.5 rounded-xl transition-all flex items-start justify-between ${
                  activeEtId === et.id
                    ? 'bg-cyan-950/70 border border-cyan-500/60 text-cyan-200'
                    : 'hover:bg-slate-850 text-slate-300'
                }`}
              >
                <div
                  onClick={() => {
                    onSelectEt(et.id);
                    setIsOpen(false);
                  }}
                  className="flex items-start gap-2.5 flex-1 cursor-pointer min-w-0"
                >
                  <div
                    className={`w-6 h-6 rounded-lg bg-gradient-to-r ${
                      et.color || 'from-cyan-500 to-teal-500'
                    } flex items-center justify-center text-white mt-0.5 flex-shrink-0`}
                  >
                    <Zap className="w-3 h-3 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                      <span className="truncate">{et.name}</span>
                      {activeEtId === et.id && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                    </div>
                    {et.tagline && (
                      <p className="text-[11px] text-slate-400 truncate leading-snug mt-0.5">
                        {et.tagline}
                      </p>
                    )}
                    {et.files && et.files.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-cyan-400 font-mono">
                        <FileText className="w-3 h-3" />
                        <span>{et.files.length} knowledge file{et.files.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onEditEt(et);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors ml-1.5 flex-shrink-0"
                  title="Edit Custom ET parameters or knowledge files"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="px-3 pt-2 pb-1 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateNew();
              }}
              className="w-full py-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Custom ET</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
