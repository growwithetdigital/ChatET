import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Pin,
  Trash2,
  Search,
  Brain,
  Cloud,
  LogIn,
  LogOut,
  BookOpen,
  Layers,
  Wand2,
  Radio,
  Sun,
  Moon,
  Download,
} from 'lucide-react';
import { Thread, CustomET } from '../types';
import { EtDigitalLogo } from './EtDigitalLogo';
import { EricHaloAvatar } from './EricHaloAvatar';
import { User } from '../firebase';

export type WorkspaceTab = 'chat' | 'prompts' | 'custom_ets';

interface SidebarThreadsProps {
  threads: Thread[];
  activeThreadId: string | null;
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
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
  onOpenVisualStudio: () => void;
  onOpenVoiceMode: () => void;
  onExportTranscript: () => void;
  memoryCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentUser?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export const SidebarThreads: React.FC<SidebarThreadsProps> = ({
  threads,
  activeThreadId,
  activeTab,
  onSelectTab,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onTogglePin,
  isOpen,
  onClose,
  customEts,
  onOpenMemoryBank,
  onOpenVisualStudio,
  onOpenVoiceMode,
  onExportTranscript,
  memoryCount,
  theme,
  onToggleTheme,
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

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) onClose();
  };

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
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#090e17] border-r border-slate-800/90 flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header & New Chat CTA */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                onSelectTab('chat');
                closeOnMobile();
              }}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <EtDigitalLogo size="sm" showSubtitle={false} />
              <div className="h-5 w-[1px] bg-slate-800" />
              <span className="font-heading font-extrabold text-base tracking-tight text-slate-100">
                Chat<span className="text-cyan-400">ET</span>
              </span>
            </div>

            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>

          <button
            onClick={() => {
              onNewThread();
              onSelectTab('chat');
              closeOnMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold text-xs tracking-wide transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Workspace Navigation & Features Menu */}
        <div className="px-3 py-2.5 border-b border-slate-800/70 space-y-1">
          <button
            onClick={() => {
              onSelectTab('chat');
              closeOnMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Chat Workspace</span>
            </span>
          </button>

          <button
            onClick={() => {
              onSelectTab('prompts');
              closeOnMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'prompts'
                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Prompt Library</span>
            </span>
            <span className="text-[11px] text-slate-500">14</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('custom_ets');
              closeOnMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'custom_ets'
                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Custom ETs</span>
            </span>
            <span className="text-[11px] text-slate-500">{customEts.length}</span>
          </button>

          <button
            onClick={() => {
              onOpenVisualStudio();
              closeOnMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Wand2 className="w-4 h-4 text-cyan-400" />
              <span>Visual Studio (8K)</span>
            </span>
          </button>

          <button
            onClick={() => {
              onOpenVoiceMode();
              closeOnMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Live Voice Mode</span>
            </span>
          </button>

          <button
            onClick={() => {
              onOpenMemoryBank();
              closeOnMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span>Memory Bank</span>
            </span>
            <span className="text-[11px] text-slate-500">{memoryCount}</span>
          </button>
        </div>

        {/* Search Chat History */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 text-slate-200 text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500/60 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Thread Lists (Chat History) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {pinnedThreads.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[11px] text-cyan-400 font-semibold">
                <Pin className="w-3 h-3" />
                <span>Pinned</span>
              </div>
              <div className="space-y-1">
                {pinnedThreads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === activeThreadId && activeTab === 'chat'}
                    customEts={customEts}
                    onSelect={() => {
                      onSelectThread(thread.id);
                      onSelectTab('chat');
                      closeOnMobile();
                    }}
                    onDelete={() => onDeleteThread(thread.id)}
                    onTogglePin={() => onTogglePin(thread.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="px-2 mb-1.5 text-[11px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Recent Chats ({recentThreads.length})</span>
              <button
                onClick={onExportTranscript}
                className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                title="Export active chat transcript as Markdown"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
            </div>
            {recentThreads.length === 0 && pinnedThreads.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No conversations found.
              </div>
            ) : (
              <div className="space-y-1">
                {recentThreads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === activeThreadId && activeTab === 'chat'}
                    customEts={customEts}
                    onSelect={() => {
                      onSelectThread(thread.id);
                      onSelectTab('chat');
                      closeOnMobile();
                    }}
                    onDelete={() => onDeleteThread(thread.id)}
                    onTogglePin={() => onTogglePin(thread.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cloud Auth & User Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <EricHaloAvatar size="sm" showStatus={false} />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {currentUser?.displayName || 'Eric Thomas'}
                </div>
                <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  {currentUser ? (
                    <>
                      <Cloud className="w-3 h-3 text-emerald-400" />
                      <span>Cloud Synced</span>
                    </>
                  ) : (
                    <span>Local Vault</span>
                  )}
                </div>
              </div>
            </div>

            {currentUser ? (
              <button
                onClick={onSignOut}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                title={`Signed in as ${currentUser.email || 'Eric'}. Click to sign out.`}
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={onSignIn}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
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
          ? 'bg-cyan-950/40 text-cyan-200 border border-cyan-500/40 font-medium'
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
            <span className="text-[10px] text-cyan-400/80 truncate">
              {associatedEt.name}
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
          title={thread.pinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3 h-3" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
