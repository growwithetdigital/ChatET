import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Send,
  Square,
  Sparkles,
  Download,
  ChevronRight,
  RefreshCw,
  Paperclip,
  Image as ImageIcon,
  Wand2,
  FileUp,
  Brain,
  Zap,
  Settings2,
  FileText,
  Mic,
  Radio,
  Globe,
  Cloud,
  LogIn,
} from 'lucide-react';
import {
  Message,
  Thread,
  FocusAreaId,
  FileAttachment,
  CustomET,
  MemoryItem,
  GroundingSource,
} from './types';
import { FOCUS_AREAS, TAILORED_PROMPTS } from './data/constants';
import { EtDigitalLogo } from './components/EtDigitalLogo';
import { EricHaloAvatar } from './components/EricHaloAvatar';
import { SevenRulesBar } from './components/SevenRulesBar';
import { FocusLensSelector } from './components/FocusLensSelector';
import { ChatMessage } from './components/ChatMessage';
import { SidebarThreads } from './components/SidebarThreads';
import { FileAttachmentBar } from './components/FileAttachmentBar';
import { ImageStudioModal } from './components/ImageStudioModal';
import { CustomEtModal } from './components/CustomEtModal';
import { CustomEtSelector } from './components/CustomEtSelector';
import { MemoryBankModal } from './components/MemoryBankModal';
import { VoiceAdvisorModal } from './components/VoiceAdvisorModal';
import {
  getCustomETs,
  saveCustomETs,
  getMemoryItems,
  saveMemoryItems,
  DEFAULT_CUSTOM_ETS,
  DEFAULT_MEMORY_ITEMS,
} from './utils/storage';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  User,
} from './firebase';
import {
  subscribeToUserVault,
  saveThreadToFirestore,
  deleteThreadFromFirestore,
  saveMessageToFirestore,
  saveCustomEtToFirestore,
  deleteCustomEtFromFirestore,
  saveMemoryToFirestore,
  deleteMemoryFromFirestore,
} from './utils/firestoreSync';

const STORAGE_KEY = 'eric_ai_threads_v1';

export default function App() {
  const [threads, setThreads] = useState<Thread[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load threads from localStorage', e);
    }
    return [
      {
        id: 'thread-default',
        title: 'Executive Advisory Session',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        focusArea: 'all',
        messages: [],
        pinned: true,
      },
    ];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    return threads[0]?.id || 'thread-default';
  });

  // Custom ETs & Memory Bank state
  const [customEts, setCustomEts] = useState<CustomET[]>(getCustomETs);
  const [activeEtId, setActiveEtId] = useState<string | null>(() => {
    const active = threads.find((t) => t.id === (threads[0]?.id || 'thread-default'));
    return active?.customEtId || null;
  });
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>(getMemoryItems);

  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const seededCloudRef = useRef(false);

  // Modals state
  const [isCustomEtModalOpen, setIsCustomEtModalOpen] = useState(false);
  const [editingCustomEt, setEditingCustomEt] = useState<CustomET | null>(null);
  const [isMemoryBankModalOpen, setIsMemoryBankModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Chat & Grounding state
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [isDictating, setIsDictating] = useState(false);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLens, setActiveLens] = useState<FocusAreaId>('all');
  const [imageStudioOpen, setImageStudioOpen] = useState(false);
  const [imageStudioPrompt, setImageStudioPrompt] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileTriggerRef = useRef<(() => void) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dictationRecRef = useRef<any>(null);

  // Track Firebase Authentication state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Attach Firestore real-time listeners once authenticated
  useEffect(() => {
    if (!authReady || !currentUser || !currentUser.emailVerified) return;

    const unsubscribeVault = subscribeToUserVault(currentUser.uid, {
      onThreadsAndMessages: (threadsMeta, messagesByThread) => {
        if (threadsMeta.length === 0) {
          // Seed initial local threads to Firestore once if cloud is empty
          if (!seededCloudRef.current) {
            seededCloudRef.current = true;
            threads.forEach((t) => {
              saveThreadToFirestore(t).then(() => {
                t.messages.forEach((m) => saveMessageToFirestore(t.id, m));
              });
            });
            customEts.forEach((et) => saveCustomEtToFirestore(et));
            memoryItems.forEach((mem) => saveMemoryToFirestore(mem));
          }
          return;
        }

        setThreads((prev) => {
          const prevStreamingMap = new Map<string, Message[]>();
          prev.forEach((pt) => {
            if (pt.messages.some((m) => m.isStreaming)) {
              prevStreamingMap.set(pt.id, pt.messages);
            }
          });

          const merged: Thread[] = threadsMeta.map((meta) => {
            const activeStreamingMsgs = prevStreamingMap.get(meta.id);
            const cloudMsgs = messagesByThread[meta.id] || [];
            return {
              ...meta,
              messages: activeStreamingMsgs || cloudMsgs,
            };
          });

          return merged;
        });
      },
      onCustomEts: (cloudEts) => {
        if (cloudEts.length > 0) {
          // Merge built-in ETs if any are missing
          const cloudIds = new Set(cloudEts.map((e) => e.id));
          const missingBuiltIns = DEFAULT_CUSTOM_ETS.filter((d) => !cloudIds.has(d.id));
          setCustomEts([...cloudEts, ...missingBuiltIns]);
        }
      },
      onMemories: (cloudMemories) => {
        if (cloudMemories.length > 0) {
          setMemoryItems(cloudMemories);
        } else if (DEFAULT_MEMORY_ITEMS.length > 0 && !seededCloudRef.current) {
          DEFAULT_MEMORY_ITEMS.forEach((m) => saveMemoryToFirestore(m));
        }
      },
    });

    return () => unsubscribeVault();
  }, [authReady, currentUser]);

  // Sync threads to local storage cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch (e) {
      console.error('Failed to save threads to localStorage', e);
    }
  }, [threads]);

  // Sync Custom ETs to local storage cache
  useEffect(() => {
    saveCustomETs(customEts);
  }, [customEts]);

  // Sync Memory items to local storage cache
  useEffect(() => {
    saveMemoryItems(memoryItems);
  }, [memoryItems]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const activeCustomEt = customEts.find((et) => et.id === activeEtId);

  useEffect(() => {
    if (activeThread?.focusArea) {
      setActiveLens((activeThread.focusArea as FocusAreaId) || 'all');
    }
    if (activeThread?.customEtId !== undefined) {
      setActiveEtId(activeThread.customEtId || null);
    }
  }, [activeThreadId]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages, isStreaming]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setNoticeBanner('Sign-in was cancelled or blocked by popup settings.');
      setTimeout(() => setNoticeBanner(null), 4000);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const handleNewThread = (etIdToUse?: string | null) => {
    const targetEtId = etIdToUse !== undefined ? etIdToUse : activeEtId;
    const targetEt = customEts.find((et) => et.id === targetEtId);

    const newThread: Thread = {
      id: `thread-${Date.now()}`,
      title: targetEt ? `${targetEt.name} Consultation` : 'New Advisory Inquiry',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      focusArea: targetEt?.focusArea || activeLens,
      customEtId: targetEtId || undefined,
      messages: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    if (targetEt?.focusArea) {
      setActiveLens(targetEt.focusArea);
    }
    saveThreadToFirestore(newThread);
  };

  const handleSelectEt = (etId: string | null) => {
    setActiveEtId(etId);
    const selectedEt = customEts.find((et) => et.id === etId);
    if (selectedEt?.focusArea) {
      setActiveLens(selectedEt.focusArea);
    }

    if (activeThread.messages.length === 0) {
      const updatedThread: Thread = {
        ...activeThread,
        customEtId: etId || undefined,
        title: selectedEt ? `${selectedEt.name} Consultation` : 'New Advisory Inquiry',
        focusArea: selectedEt?.focusArea || activeThread.focusArea,
      };
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? updatedThread : t))
      );
      saveThreadToFirestore(updatedThread);
    }
  };

  const handleSaveCustomEt = (savedEt: CustomET) => {
    setCustomEts((prev) => {
      const idx = prev.findIndex((et) => et.id === savedEt.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedEt;
        return next;
      }
      return [savedEt, ...prev];
    });
    saveCustomEtToFirestore(savedEt);
    handleSelectEt(savedEt.id);
  };

  const handleDeleteCustomEt = (id: string) => {
    setCustomEts((prev) => prev.filter((et) => et.id !== id));
    deleteCustomEtFromFirestore(id);
    if (activeEtId === id) {
      setActiveEtId(null);
    }
  };

  const handleAddMemory = (newMem: Omit<MemoryItem, 'id' | 'createdAt'>) => {
    const item: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      ...newMem,
    };
    setMemoryItems((prev) => [item, ...prev]);
    saveMemoryToFirestore(item);
  };

  const handleDeleteMemory = (id: string) => {
    setMemoryItems((prev) => prev.filter((m) => m.id !== id));
    deleteMemoryFromFirestore(id);
  };

  const handleMemoryDetected = (category: string, content: string) => {
    setMemoryItems((prev) => {
      if (prev.some((m) => m.content.toLowerCase().trim() === content.toLowerCase().trim())) {
        return prev;
      }
      const item: MemoryItem = {
        id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category: (category as any) || 'personal',
        content: content.trim(),
        createdAt: Date.now(),
      };
      saveMemoryToFirestore(item);
      return [item, ...prev];
    });
  };

  const handleDeleteThread = (id: string) => {
    const target = threads.find((t) => t.id === id);
    const msgIds = target?.messages.map((m) => m.id) || [];
    deleteThreadFromFirestore(id, msgIds);

    setThreads((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        const fresh: Thread = {
          id: `thread-${Date.now()}`,
          title: 'Fresh Strategic Session',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          focusArea: 'all',
          messages: [],
        };
        setActiveThreadId(fresh.id);
        saveThreadToFirestore(fresh);
        return [fresh];
      }
      if (activeThreadId === id) {
        setActiveThreadId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleTogglePin = (id: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, pinned: !t.pinned };
          saveThreadToFirestore(updated);
          return updated;
        }
        return t;
      })
    );
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const toggleQuickDictation = () => {
    if (isDictating) {
      if (dictationRecRef.current) {
        try {
          dictationRecRef.current.stop();
        } catch {
          // ignore
        }
        dictationRecRef.current = null;
      }
      setIsDictating(false);
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      // Open full Voice Modal which supports MediaRecorder + Gemini Transcription fallback
      setIsVoiceModalOpen(true);
      return;
    }

    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const spoken = event.results?.[0]?.[0]?.transcript || '';
        if (spoken) {
          setInput((prev) => (prev ? `${prev} ${spoken}` : spoken));
        }
      };

      rec.onend = () => {
        setIsDictating(false);
        dictationRecRef.current = null;
      };

      rec.onerror = () => {
        setIsDictating(false);
        dictationRecRef.current = null;
      };

      rec.start();
      dictationRecRef.current = rec;
      setIsDictating(true);
    } catch {
      setIsVoiceModalOpen(true);
    }
  };

  const processFileList = async (files: FileList | File[]) => {
    const processed: FileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        setNoticeBanner(`File "${file.name}" exceeds 15MB limit.`);
        setTimeout(() => setNoticeBanner(null), 4000);
        continue;
      }
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      if (file.type.startsWith('image/')) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        processed.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          base64,
          previewUrl: base64,
        });
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        processed.push({
          id,
          name: file.name,
          size: file.size,
          type: 'application/pdf',
          base64,
        });
      } else {
        const textContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(file);
        });
        processed.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          textContent,
        });
      }
    }
    if (processed.length > 0) {
      setAttachments((prev) => [...prev, ...processed]);
    }
  };

  const handleSendMessage = async (
    customPrompt?: string,
    customAttachments?: FileAttachment[],
    isVoiceMode = false,
    onCompleteCallback?: (finalText: string) => void
  ) => {
    const promptToSend = (customPrompt !== undefined ? customPrompt : input).trim();
    const attachmentsToSend = customAttachments !== undefined ? customAttachments : attachments;

    if ((!promptToSend && attachmentsToSend.length === 0) || isStreaming) return;

    if (customPrompt === undefined) {
      setInput('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } else if (customAttachments === undefined) {
      setAttachments([]);
    }

    const nowTs = Date.now();
    const userMessage: Message = {
      id: `msg-${nowTs}`,
      role: 'user',
      content:
        promptToSend ||
        `[Analyzed ${attachmentsToSend.length} attached document${attachmentsToSend.length > 1 ? 's' : ''}]`,
      timestamp: nowTs,
      focusArea: activeLens,
      attachments: attachmentsToSend.length > 0 ? [...attachmentsToSend] : undefined,
    };

    let updatedTitle = activeThread.title;
    if (
      activeThread.messages.length === 0 ||
      activeThread.title === 'New Advisory Inquiry' ||
      activeThread.title === 'Fresh Strategic Session' ||
      activeThread.title === 'Executive Advisory Session' ||
      activeThread.title.endsWith('Consultation')
    ) {
      const summaryTitle =
        promptToSend ||
        (attachmentsToSend[0]?.name ? `Audit: ${attachmentsToSend[0].name}` : 'Strategic Session');
      if (activeCustomEt) {
        updatedTitle =
          `${activeCustomEt.name}: ${summaryTitle.slice(0, 30)}` +
          (summaryTitle.length > 30 ? '...' : '');
      } else {
        updatedTitle = summaryTitle.slice(0, 42) + (summaryTitle.length > 42 ? '...' : '');
      }
    }

    const modelMsgId = `msg-model-${nowTs + 1}`;
    const placeholderModelMessage: Message = {
      id: modelMsgId,
      role: 'model',
      content: '',
      timestamp: nowTs + 1,
      focusArea: activeLens,
      isStreaming: true,
    };

    const targetThreadId = activeThread.id;
    const updatedThreadMeta: Thread = {
      ...activeThread,
      title: updatedTitle,
      customEtId: activeEtId || undefined,
      updatedAt: nowTs,
      messages: [...activeThread.messages, userMessage, placeholderModelMessage],
    };

    setThreads((prev) =>
      prev.map((t) => (t.id === targetThreadId ? updatedThreadMeta : t))
    );

    // Persist thread and user message to Firestore (ensuring thread exists first)
    saveThreadToFirestore(updatedThreadMeta).then(() => {
      saveMessageToFirestore(targetThreadId, userMessage);
    });

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';
    let latestSources: GroundingSource[] | undefined = undefined;

    try {
      const messagesHistory = activeThread.messages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesHistory,
          currentPrompt: promptToSend,
          focusArea: activeLens,
          attachments: attachmentsToSend,
          useWebSearch,
          isVoiceMode,
          customEt: activeCustomEt
            ? {
                name: activeCustomEt.name,
                tagline: activeCustomEt.tagline,
                instructions: activeCustomEt.instructions,
                files: activeCustomEt.files,
              }
            : undefined,
          memoryItems: memoryItems.map((m) => ({
            id: m.id,
            category: m.category,
            content: m.content,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value, { stream: true });
        const lines = rawChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
              }
              if (Array.isArray(parsed.sources) && parsed.sources.length > 0) {
                latestSources = parsed.sources;
              }

              if (parsed.text || parsed.sources) {
                setThreads((prev) =>
                  prev.map((t) => {
                    if (t.id === targetThreadId) {
                      const msgs = [...t.messages];
                      const last = msgs[msgs.length - 1];
                      if (last && last.role === 'model') {
                        msgs[msgs.length - 1] = {
                          ...last,
                          content: accumulatedText,
                          sources: latestSources,
                        };
                      }
                      return { ...t, messages: msgs };
                    }
                    return t;
                  })
                );
              }
            } catch (err) {
              console.warn('Could not parse SSE chunk', err);
            }
          }
        }
      }

      const finalizedModelMsg: Message = {
        ...placeholderModelMessage,
        content: accumulatedText || 'Analysis complete.',
        sources: latestSources,
        isStreaming: false,
      };

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === targetThreadId) {
            const msgs = [...t.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === 'model') {
              msgs[msgs.length - 1] = finalizedModelMsg;
            }
            return { ...t, messages: msgs };
          }
          return t;
        })
      );

      saveMessageToFirestore(targetThreadId, finalizedModelMsg);
      onCompleteCallback?.(accumulatedText);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by Eric');
      } else {
        console.error('Error fetching stream', err);
        const fallbackMsgContent =
          accumulatedText ||
          `Connection note: Unable to retrieve counsel. ${err?.message || 'Please check your connection or attached API credentials.'}`;

        const errorModelMsg: Message = {
          ...placeholderModelMessage,
          content: fallbackMsgContent,
          isStreaming: false,
        };

        setThreads((prev) =>
          prev.map((t) => {
            if (t.id === targetThreadId) {
              const msgs = [...t.messages];
              const last = msgs[msgs.length - 1];
              if (last && last.role === 'model') {
                msgs[msgs.length - 1] = errorModelMsg;
              }
              return { ...t, messages: msgs };
            }
            return t;
          })
        );
        onCompleteCallback?.(fallbackMsgContent);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExportTranscript = () => {
    const transcript = activeThread.messages
      .map((m) => {
        const roleName = m.role === 'user' ? 'ERIC THOMAS' : 'ERIC AI (ADVISOR)';
        const dateStr = new Date(m.timestamp).toLocaleString();
        return `### ${roleName} [${dateStr}]\n\n${m.content}\n\n---\n`;
      })
      .join('\n');

    const header = `# Strategic Advisory Transcript: ${activeThread.title}\nDate: ${new Date().toLocaleDateString()}\nFocus Lens: ${activeThread.focusArea}\n\n---\n\n`;
    const fullText = header + transcript;

    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eric-ai-${activeThread.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full bg-[#080d14] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Threads Drawer */}
      <SidebarThreads
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={(id) => {
          setActiveThreadId(id);
          const selected = threads.find((t) => t.id === id);
          if (selected?.customEtId !== undefined) {
            setActiveEtId(selected.customEtId || null);
          }
        }}
        onNewThread={() => handleNewThread(activeEtId)}
        onDeleteThread={handleDeleteThread}
        onTogglePin={handleTogglePin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        customEts={customEts}
        activeEtId={activeEtId}
        onSelectEt={handleSelectEt}
        onCreateCustomEt={() => {
          setEditingCustomEt(null);
          setIsCustomEtModalOpen(true);
        }}
        onOpenMemoryBank={() => setIsMemoryBankModalOpen(true)}
        memoryCount={memoryItems.length}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 sm:lg:pl-80 relative h-full">
        {/* Top Navbar */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-800/90 bg-[#090e17]/80 backdrop-blur-md flex items-center justify-between z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Open threads"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <EtDigitalLogo size="sm" showSubtitle={false} className="cursor-pointer" />
              <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />
              <div className="hidden sm:flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold font-heading tracking-wide text-white">
                    ERIC <span className="text-cyan-400">AI</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                    Thinking Partner
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-[200px] md:max-w-xs">
                  {activeThread.title}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Custom ET Selector dropdown in top bar */}
            <CustomEtSelector
              customEts={customEts}
              activeEtId={activeEtId}
              onSelectEt={handleSelectEt}
              onCreateNew={() => {
                setEditingCustomEt(null);
                setIsCustomEtModalOpen(true);
              }}
              onEditEt={(et) => {
                setEditingCustomEt(et);
                setIsCustomEtModalOpen(true);
              }}
            />

            {/* Live Voice Conversation Button */}
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-xs font-semibold text-cyan-300 border border-cyan-700/60 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.18)]"
              title="Open Live Voice Conversation with Eric AI"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden md:inline">Voice Mode</span>
            </button>

            {/* Persistent Memory Bank button */}
            <button
              onClick={() => setIsMemoryBankModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 hover:border-cyan-500/40 transition-all flex items-center gap-1.5"
              title="Manage Eric's Persistent Memory Bank"
            >
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Memory</span>
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800/60">
                {memoryItems.length}
              </span>
            </button>

            <button
              onClick={() => {
                setImageStudioPrompt('');
                setImageStudioOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-cyan-300 border border-slate-700 transition-all flex items-center gap-1.5"
              title="Open Visual Studio to generate mockups and images"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Visual Studio</span>
            </button>

            <button
              onClick={handleExportTranscript}
              disabled={activeThread.messages.length === 0}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1.5"
              title="Export session transcript (Markdown)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleNewThread(activeEtId)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-cyan-300 border border-slate-700 transition-all flex items-center gap-1.5"
              title="New consultation"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">New Session</span>
            </button>

            {/* Cloud Vault Status / Sign-In */}
            {currentUser ? (
              <div
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-[10px] font-mono text-emerald-300"
                title={`Synced to Cloud Firestore as ${currentUser.email}`}
              >
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>Synced</span>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-cyan-300 transition-colors"
                title="Sign in with Google for Cloud Firestore sync"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xl:inline">Sync</span>
              </button>
            )}

            <EricHaloAvatar size="sm" />
          </div>
        </header>

        {/* Notice Banner */}
        {noticeBanner && (
          <div className="mx-4 sm:mx-6 mt-2 px-3 py-2 rounded-xl bg-amber-950/80 border border-amber-700/60 text-xs text-amber-200 flex items-center justify-between">
            <span>{noticeBanner}</span>
            <button
              onClick={() => setNoticeBanner(null)}
              className="text-amber-300 hover:text-white text-[11px] font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Focus Lens & Rule Guardrails Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-slate-800/50 bg-slate-950/40 flex-shrink-0 space-y-2">
          <FocusLensSelector
            selectedLens={activeLens}
            onSelectLens={(lens) => {
              setActiveLens(lens);
              setThreads((prev) =>
                prev.map((t) => {
                  if (t.id === activeThread.id) {
                    const updated = { ...t, focusArea: lens };
                    saveThreadToFirestore(updated);
                    return updated;
                  }
                  return t;
                })
              );
            }}
          />
          <SevenRulesBar />
        </div>

        {/* Active Custom ET Context Banner */}
        {activeCustomEt && (
          <div className="mx-4 sm:mx-6 mt-3 px-3.5 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                <Zap className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-200 truncate">{activeCustomEt.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/60">
                    Active Custom ET
                  </span>
                  {activeCustomEt.files.length > 0 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-cyan-400" />
                      {activeCustomEt.files.length} knowledge file
                      {activeCustomEt.files.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">{activeCustomEt.tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setEditingCustomEt(activeCustomEt);
                  setIsCustomEtModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 border border-slate-700"
              >
                <Settings2 className="w-3 h-3 text-slate-400" />
                <span>Configure</span>
              </button>
              <button
                onClick={() => handleSelectEt(null)}
                className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Message Stream Scroll Area with Drag-and-Drop */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 relative"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              await processFileList(e.dataTransfer.files);
            }
          }}
        >
          {isDraggingOver && (
            <div className="absolute inset-4 z-30 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-400 bg-slate-950/95 backdrop-blur-md pointer-events-none animate-in fade-in duration-150">
              <FileUp className="w-14 h-14 text-cyan-400 mb-3 animate-bounce" />
              <div className="text-lg font-bold text-slate-100">Drop Documents or Images for Eric AI</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                Instantly attach PDFs, contracts, pitch decks, spreadsheets, marketing reports, or visual mockups.
              </p>
            </div>
          )}

          {activeThread.messages.length === 0 ? (
            /* Empty State: Executive Dossier & Prompt Starters */
            <div className="max-w-3xl mx-auto py-6 sm:py-10 flex flex-col items-center text-center">
              <div className="mb-6 relative">
                <EricHaloAvatar size="lg" />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <EtDigitalLogo size="sm" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight mb-2">
                Private Advisory for <span className="text-cyan-400">Eric Thomas</span>
              </h1>

              <p className="text-sm text-slate-400 max-w-xl leading-relaxed mb-6">
                Your direct, unsweetened thinking partner. Synthesizing 20+ years of growth marketing, entrepreneurship, teenage parenting, and first-principles skepticism with Live Google Search Grounding, Voice Counsel, and Cloud Memory.
              </p>

              {/* 4 Thinking Habits Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-2xl mb-8">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
                  <span className="text-[10px] font-mono text-cyan-400 block font-bold">LENS 01</span>
                  <span className="text-xs font-semibold text-slate-200">Growth Strategist</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Systems, funnels, metrics</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
                  <span className="text-[10px] font-mono text-cyan-400 block font-bold">LENS 02</span>
                  <span className="text-xs font-semibold text-slate-200">Scientific Skeptic</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Flag speculation, demand proof</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
                  <span className="text-[10px] font-mono text-cyan-400 block font-bold">LENS 03</span>
                  <span className="text-xs font-semibold text-slate-200">First Principles</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Fundamentals over consensus</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
                  <span className="text-[10px] font-mono text-cyan-400 block font-bold">LENS 04</span>
                  <span className="text-xs font-semibold text-slate-200">Historian&apos;s Patience</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Context before prescription</span>
                </div>
              </div>

              {/* Tailored Sounding Board Prompt Starters */}
              <div className="w-full text-left max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    {activeCustomEt ? `${activeCustomEt.name} Prompts` : 'Sounding Board Starters'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(activeCustomEt?.starterPrompts && activeCustomEt.starterPrompts.length > 0
                    ? activeCustomEt.starterPrompts.map((p, i) => ({
                        title: `Inquiry 0${i + 1}`,
                        prompt: p,
                      }))
                    : TAILORED_PROMPTS
                  ).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="group p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-[10px] font-mono uppercase text-cyan-400/90 font-semibold mb-1">
                          {item.title}
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-snug">
                          {item.prompt}
                        </p>
                      </div>
                      <div className="flex items-center justify-end mt-2 text-[11px] text-slate-500 group-hover:text-cyan-300 transition-colors">
                        <span>Consult</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Message List */
            <div className="max-w-3xl mx-auto space-y-4">
              {activeThread.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onClarify={(clarifyText) => handleSendMessage(clarifyText)}
                  onOpenImageStudioWithPrompt={(p) => {
                    setImageStudioPrompt(p);
                    setImageStudioOpen(true);
                  }}
                  onMemoryDetected={handleMemoryDetected}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar Area */}
        <div className="p-4 sm:p-6 border-t border-slate-800/90 bg-[#090e17]/90 backdrop-blur-md flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <FileAttachmentBar
              attachments={attachments}
              onAddAttachments={(newAtts) => setAttachments((prev) => [...prev, ...newAtts])}
              onRemoveAttachment={(id) =>
                setAttachments((prev) => prev.filter((a) => a.id !== id))
              }
              onTriggerRef={(trigger) => {
                fileTriggerRef.current = trigger;
              }}
              disabled={isStreaming}
            />

            <div className="relative flex flex-col rounded-2xl bg-slate-900/90 border border-slate-700/80 focus-within:border-cyan-500/70 focus-within:shadow-[0_0_24px_rgba(6,182,212,0.25)] transition-all p-2.5">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeLens === 'all'
                    ? 'Consult Eric AI, search live web facts, speak via voice, or audit documents...'
                    : `Consulting under ${FOCUS_AREAS.find((a) => a.id === activeLens)?.label}...`
                }
                rows={1}
                className="w-full bg-transparent text-slate-100 text-sm px-2.5 py-1 focus:outline-none placeholder:text-slate-500 resize-none max-h-44"
              />

              <div className="flex items-center justify-between pt-2 px-2 border-t border-slate-800/60 mt-1 flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileTriggerRef.current?.()}
                    disabled={isStreaming}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
                    title="Attach files (PDF, images, CSV, text)"
                  >
                    <Paperclip className="w-4 h-4 text-slate-400 hover:text-cyan-300" />
                    <span className="hidden sm:inline text-[11px]">Attach</span>
                  </button>

                  {/* Google Search Grounding Toggle */}
                  <button
                    type="button"
                    onClick={() => setUseWebSearch(!useWebSearch)}
                    disabled={isStreaming}
                    className={`p-1.5 px-2 rounded-lg transition-all flex items-center gap-1 text-xs border ${
                      useWebSearch
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                        : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800'
                    }`}
                    title={
                      useWebSearch
                        ? 'Google Search Grounding Active (Verifies live facts & sources)'
                        : 'Enable Google Search Grounding'
                    }
                  >
                    <Globe className={`w-3.5 h-3.5 ${useWebSearch ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="text-[11px] font-medium">
                      {useWebSearch ? 'Web Grounded' : 'Web Off'}
                    </span>
                  </button>

                  {/* Quick Voice Dictation */}
                  <button
                    type="button"
                    onClick={toggleQuickDictation}
                    disabled={isStreaming}
                    className={`p-1.5 px-2 rounded-lg transition-all flex items-center gap-1 text-xs border ${
                      isDictating
                        ? 'bg-red-950/80 text-red-300 border-red-600/60 animate-pulse'
                        : 'text-slate-400 hover:text-cyan-300 border-transparent hover:bg-slate-800'
                    }`}
                    title="Dictate voice prompt into chat"
                  >
                    <Mic className={`w-3.5 h-3.5 ${isDictating ? 'text-red-400' : 'text-cyan-400'}`} />
                    <span className="hidden sm:inline text-[11px]">
                      {isDictating ? 'Listening...' : 'Dictate'}
                    </span>
                  </button>

                  {/* Live Voice Conversation Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(true)}
                    disabled={isStreaming}
                    className="p-1.5 px-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
                    title="Launch two-way Live Voice Conversation"
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden md:inline text-[11px] text-cyan-400/90 font-medium">
                      Live Voice
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImageStudioPrompt(input.trim());
                      setImageStudioOpen(true);
                    }}
                    disabled={isStreaming}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
                    title="Generate visual mockup or image"
                  >
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span className="hidden lg:inline text-[11px] text-cyan-400/90 font-medium">
                      Visual Studio
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isStreaming ? (
                    <button
                      onClick={handleStopStream}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 text-red-300 border border-red-800 text-xs font-medium hover:bg-red-900 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() && attachments.length === 0}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold text-xs tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                      <span>Inquire</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-500">
              <span>
                Private Advisor to Eric Thomas (ET Digital) • Search Grounded • Voice &amp; Cloud Enabled
              </span>
              <span className="font-mono text-slate-500">Honesty &gt; Helpfulness</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Image Studio Modal */}
      <ImageStudioModal
        isOpen={imageStudioOpen}
        onClose={() => setImageStudioOpen(false)}
        initialPrompt={imageStudioPrompt}
        onInsertToChat={(imageUrl, promptText) => {
          handleSendMessage(
            `Here is a generated visual concept for "${promptText}":\n\n![${promptText}](${imageUrl})\n\nGive me your strategic and creative critique of this concept. What are the key leverage points, aesthetic strengths, and potential vulnerabilities?`
          );
        }}
      />

      {/* Custom ET (Gems) Modal */}
      <CustomEtModal
        isOpen={isCustomEtModalOpen}
        onClose={() => {
          setIsCustomEtModalOpen(false);
          setEditingCustomEt(null);
        }}
        onSave={handleSaveCustomEt}
        onDelete={handleDeleteCustomEt}
        editingEt={editingCustomEt || undefined}
      />

      {/* Persistent Memory Bank Modal */}
      <MemoryBankModal
        isOpen={isMemoryBankModalOpen}
        onClose={() => setIsMemoryBankModalOpen(false)}
        memories={memoryItems}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
      />

      {/* Live Voice Conversation Modal */}
      <VoiceAdvisorModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        activeCustomEt={activeCustomEt}
        activeLens={activeLens}
        useWebSearch={useWebSearch}
        onVoiceTurnSubmit={async (spokenPrompt, onResponseReady) => {
          await handleSendMessage(spokenPrompt, [], true, (finalText) => {
            onResponseReady(finalText);
          });
        }}
      />
    </div>
  );
}
