import React, { useState } from 'react';
import {
  X,
  Brain,
  Plus,
  Trash2,
  Check,
  Search,
  Briefcase,
  User,
  Heart,
  ShieldAlert,
  Sparkles,
  Info,
} from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (memory: Omit<MemoryItem, 'id' | 'createdAt'>) => void;
  onDeleteMemory: (id: string) => void;
}

export const MemoryBankModal: React.FC<MemoryBankModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('business');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    onAddMemory({
      category: newCategory,
      content: newContent.trim(),
    });
    setNewContent('');
  };

  const filteredMemories = memories.filter((mem) => {
    const matchesCategory = filterCategory === 'all' || mem.category === filterCategory;
    const matchesSearch = mem.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: MemoryItem['category']) => {
    switch (category) {
      case 'business':
        return <Briefcase className="w-3.5 h-3.5 text-cyan-400" />;
      case 'personal':
        return <User className="w-3.5 h-3.5 text-indigo-400" />;
      case 'parenting':
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case 'preference':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case 'rule':
        return <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0b121e] border border-slate-700/80 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                  Eric's Memory Bank
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  {memories.length} Facts Remembered
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Persistent context and facts remembered across every session, just like pro-tier LLMs.
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

        {/* Add Memory Input */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MemoryItem['category'])}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="business">Business / GOS</option>
                <option value="personal">Personal / Life</option>
                <option value="parenting">Parenting</option>
                <option value="preference">Response Preference</option>
                <option value="rule">Custom Rule</option>
              </select>

              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Teach ChatET something to always remember (e.g. dog's name, retainer price, target clients)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />

              <button
                type="submit"
                disabled={!newContent.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Fact</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>
                Tip: You can also say &quot;Remember that...&quot; directly in any chat to automatically save new context.
              </span>
            </div>
          </form>
        </div>

        {/* Filter / Search Bar */}
        <div className="px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memory..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
            {['all', 'business', 'parenting', 'personal', 'preference', 'rule'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 rounded-md capitalize transition-colors ${
                  filterCategory === cat
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredMemories.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No remembered facts match your filter.
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="group p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-200 flex items-start justify-between gap-3 transition-all"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1 rounded bg-slate-800 border border-slate-700 mt-0.5 flex-shrink-0">
                    {getCategoryIcon(mem.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                        {mem.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(mem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{mem.content}</p>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteMemory(mem.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all flex-shrink-0"
                  title="Forget this memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Memories are stored locally and synced securely to server context.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
