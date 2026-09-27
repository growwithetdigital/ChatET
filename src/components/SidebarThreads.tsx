import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Pin,
  Trash2,
  Search,
  Lock,
  Zap,
  Brain,
  Sparkles,
  Cloud,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Thread, CustomET } from '../types';
import { EtDigitalLogo } from './EtDigitalLogo';
import { EricHaloAvatar } from './EricHaloAvatar';
import { User } from '../firebase';

interface SidebarThreadsProps {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
  onTogglePin: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  customEts: CustomET[];
  activeEtId: string | null;
  onSelectEt: (id: string | null) => void;
  onCreateCustomEt: () => void;
  onOpenMemoryBank: () => void;
  memoryCount: number;
  currentUser?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export const SidebarThreads: React.FC<SidebarThreadsProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onTogglePin,
  isOpen,
  onClose,
  customEts,
  activeEtId,
  onSelectEt,
  onCreateCustomEt,
  onOpenMemoryBank,
  memoryCount,
  currentUser,
  onSignIn,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedThreads = filteredThreads.filter((t) => t.pinned);
  const recentThreads = filteredThreads.filter((t) => !t.pinned);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-[#090e17] border-r border-slate-800/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <EtDigitalLogo size="sm" showSubtitle={false} />
              <div className="h-6 w-[1px] bg-slate-800" />
              <span className="font-heading font-extrabold text-sm tracking-wider text-slate-100">
                ERIC<span className="text-cyan-400"> AI</span>
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              Custom ETs &amp; Memory
            </span>
          </div>

          {/* New Strategic Session CTA */}
          <button
            onClick={() => {
              onNewThread();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold text-xs tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Consultation</span>
          </button>
        </div>

        {/* Custom ET's Quick-Select Bar */}
        <div className="px-3 pt-3 pb-1 border-b border-slate-800/60">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
              <Zap className="w-3 h-3" />
              <span>Custom ET&apos;s (Gems)</span>
            </div>
            <button
              onClick={() => {
                onCreateCustomEt();
                if (window.innerWidth < 1024) onClose();
              }}
              className="text-[10px] font-semibold text-slate-400 hover:text-cyan-300 flex items-center gap-0.5 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => onSelectEt(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeEtId === null
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Core</span>
            </button>

            {customEts.map((et) => (
              <button
                key={et.id}
                onClick={() => onSelectEt(et.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  activeEtId === et.id
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
                title={et.tagline || et.name}
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${et.color || 'from-cyan-400 to-blue-500'}`} />
                <span className="truncate max-w-[110px]">{et.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Chat History */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 text-slate-200 text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500/60 placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Thread Lists (Chat History) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Pinned Threads */}
          {pinnedThreads.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                <Pin className="w-3 h-3" />
                <span>Pinned Consultations</span>
              </div>
              <div className="space-y-1">
                {pinnedThreads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === activeThreadId}
                    customEts={customEts}
                    onSelect={() => {
                      onSelectThread(thread.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    onDelete={() => onDeleteThread(thread.id)}
                    onTogglePin={() => onTogglePin(thread.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Threads */}
          <div>
            <div className="px-2 mb-1.5 text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Chat History ({recentThreads.length})</span>
              {currentUser && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  Synced
                </span>
              )}
            </div>
            {recentThreads.length === 0 && pinnedThreads.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-600">
                No past chat history found.
              </div>
            ) : (
              <div className="space-y-1">
                {recentThreads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === activeThreadId}
                    customEts={customEts}
                    onSelect={() => {
                      onSelectThread(thread.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    onDelete={() => onDeleteThread(thread.id)}
                    onTogglePin={() => onTogglePin(thread.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Memory Bank & Cloud Auth Identity Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
          {/* Memory Bank Trigger Button */}
          <button
            onClick={() => {
              onOpenMemoryBank();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
            title="Open Eric's Memory Bank"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  Memory Bank
                </span>
                <span className="text-[10px] text-slate-500">
                  {memoryCount} facts remembered
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              Active
            </span>
          </button>

          {/* Firebase Cloud Sync & User Profile info */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <EricHaloAvatar size="sm" showStatus={false} />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {currentUser?.displayName || 'Eric Thomas'}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono truncate">
                  {currentUser ? 'Cloud Vault Synced' : 'Local Vault Mode'}
                </div>
              </div>
            </div>

            {currentUser ? (
              <button
                onClick={onSignOut}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[10px] font-medium flex items-center gap-1 transition-colors flex-shrink-0"
                title={`Signed in as ${currentUser.email || 'Eric'}. Click to sign out.`}
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={onSignIn}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-[10px] font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                title="Sign in with Google to sync chats, Custom ETs, and Memory Bank across devices"
              >
                <LogIn className="w-3 h-3" />
                <span>Cloud Sync</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  customEts: CustomET[];
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

const ThreadItem: React.FC<ThreadItemProps> = ({
  thread,
  isActive,
  customEts,
  onSelect,
  onDelete,
  onTogglePin,
}) => {
  const associatedEt = thread.customEtId
    ? customEts.find((et) => et.id === thread.customEtId)
    : null;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-all ${
        isActive
          ? 'bg-cyan-950/40 text-cyan-200 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)] font-medium'
          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden mr-2 min-w-0">
        <MessageSquare
          className={`w-3.5 h-3.5 flex-shrink-0 ${
            isActive ? 'text-cyan-400' : 'text-slate-500'
          }`}
        />
        <div className="flex flex-col min-w-0">
          <span className="truncate">{thread.title}</span>
          {associatedEt && (
            <span className="text-[9px] font-mono text-cyan-400/80 truncate">
              ET: {associatedEt.name}
            </span>
          )}
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={`p-1 rounded hover:bg-slate-800 ${
            thread.pinned ? 'text-cyan-400 opacity-100' : 'text-slate-500 hover:text-slate-300'
          }`}
          title={thread.pinned ? 'Unpin consultation' : 'Pin consultation'}
        >
          <Pin className="w-3 h-3" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800"
          title="Delete consultation"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
