import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Send,
  Square,
  ChevronRight,
  Plus,
  Paperclip,
  FileUp,
  Mic,
  Radio,
  Globe,
  Sun,
  Moon,
  BookOpen,
  Settings2,
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
import { TAILORED_PROMPTS } from './data/constants';
import { EtDigitalLogo } from './components/EtDigitalLogo';
import { EricHaloAvatar } from './components/EricHaloAvatar';
import { ChatMessage } from './components/ChatMessage';
import { SidebarThreads, WorkspaceTab } from './components/SidebarThreads';
import { FileAttachmentBar } from './components/FileAttachmentBar';
import { ImageStudioModal } from './components/ImageStudioModal';
import { CustomEtModal } from './components/CustomEtModal';
import { CustomEtSelector } from './components/CustomEtSelector';
import { MemoryBankModal } from './components/MemoryBankModal';
import { VoiceAdvisorModal } from './components/VoiceAdvisorModal';
import { PromptLibraryView } from './components/PromptLibraryView';
import { CustomEtsView } from './components/CustomEtsView';
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
import { streamChatDirectFallback } from './utils/clientGeminiFallback';

const STORAGE_KEY = 'eric_ai_threads_v1';
const THEME_STORAGE_KEY = 'chat_et_theme_v1';

export default function App() {
  // Light / Dark Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active Workspace Tab ('chat' | 'prompts' | 'custom_ets')
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chat');

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
        title: 'New ChatET Session',
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
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Thinking lens lives behind the scenes automatically
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
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [activeThread?.messages, isStreaming, activeTab]);

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
      title: targetEt ? `${targetEt.name} Session` : 'New ChatET Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      focusArea: targetEt?.focusArea || 'all',
      customEtId: targetEtId || undefined,
      messages: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setActiveLens(targetEt?.focusArea || 'all');
    setActiveTab('chat');
    saveThreadToFirestore(newThread);
  };

  const handleSelectEt = (etId: string | null) => {
    setActiveEtId(etId);
    const selectedEt = customEts.find((et) => et.id === etId);
    // Automatically set the behind-the-scenes lens from the Custom ET or default to 'all'
    setActiveLens(selectedEt?.focusArea || 'all');

    if (activeThread.messages.length === 0) {
      const updatedThread: Thread = {
        ...activeThread,
        customEtId: etId || undefined,
        title: selectedEt ? `${selectedEt.name} Session` : 'New ChatET Session',
        focusArea: selectedEt?.focusArea || 'all',
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
          title: 'New ChatET Session',
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
    onCompleteCallback?: (finalText: string) => void,
    overrideEtId?: string | null
  ) => {
    const promptToSend = (customPrompt !== undefined ? customPrompt : input).trim();
    const attachmentsToSend = customAttachments !== undefined ? customAttachments : attachments;

    if ((!promptToSend && attachmentsToSend.length === 0) || isStreaming) return;

    const effectiveEtId = overrideEtId !== undefined ? overrideEtId : activeEtId;
    const effectiveCustomEt = customEts.find((et) => et.id === effectiveEtId);
    const effectiveLens = effectiveCustomEt?.focusArea || activeLens || 'all';

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
      focusArea: effectiveLens,
      attachments: attachmentsToSend.length > 0 ? [...attachmentsToSend] : undefined,
    };

    let updatedTitle = activeThread.title;
    if (
      activeThread.messages.length === 0 ||
      activeThread.title === 'New Advisory Inquiry' ||
      activeThread.title === 'Fresh Strategic Session' ||
      activeThread.title === 'Executive Advisory Session' ||
      activeThread.title === 'New ChatET Session' ||
      activeThread.title.endsWith('Consultation') ||
      activeThread.title.endsWith('Session')
    ) {
      const summaryTitle =
        promptToSend ||
        (attachmentsToSend[0]?.name ? `Audit: ${attachmentsToSend[0].name}` : 'ChatET Session');
      if (effectiveCustomEt) {
        updatedTitle =
          `${effectiveCustomEt.name}: ${summaryTitle.slice(0, 30)}` +
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
      focusArea: effectiveLens,
      isStreaming: true,
    };

    const targetThreadId = activeThread.id;
    const updatedThreadMeta: Thread = {
      ...activeThread,
      title: updatedTitle,
      customEtId: effectiveEtId || undefined,
      focusArea: effectiveLens,
      updatedAt: nowTs,
      messages: [...activeThread.messages, userMessage, placeholderModelMessage],
    };

    setThreads((prev) =>
      prev.map((t) => (t.id === targetThreadId ? updatedThreadMeta : t))
    );

    saveThreadToFirestore(updatedThreadMeta).then(() => {
      saveMessageToFirestore(targetThreadId, userMessage);
    });

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';
    let latestSources: GroundingSource[] | undefined = undefined;

    const applyStreamUpdate = (textDelta: string, sourcesUpdate?: GroundingSource[]) => {
      if (textDelta) {
        accumulatedText += textDelta;
      }
      if (Array.isArray(sourcesUpdate) && sourcesUpdate.length > 0) {
        latestSources = sourcesUpdate;
      }
      if (textDelta || sourcesUpdate) {
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
    };

    try {
      const messagesHistory = activeThread.messages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      const customEtPayload = effectiveCustomEt
        ? {
            name: effectiveCustomEt.name,
            tagline: effectiveCustomEt.tagline,
            instructions: effectiveCustomEt.instructions,
            files: effectiveCustomEt.files,
          }
        : undefined;

      const memoryPayload = memoryItems.map((m) => ({
        id: m.id,
        category: m.category,
        content: m.content,
      }));

      let usedDirectFallback = false;

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messagesHistory,
            currentPrompt: promptToSend,
            focusArea: effectiveLens,
            attachments: attachmentsToSend,
            useWebSearch,
            isVoiceMode,
            customEt: customEtPayload,
            memoryItems: memoryPayload,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Server status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let sseError: string | null = null;

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
                if (parsed.error) {
                  sseError = parsed.error;
                }
                applyStreamUpdate(parsed.text || '', parsed.sources);
              } catch (err) {
                console.warn('Could not parse SSE chunk', err);
              }
            }
          }
        }

        if (sseError && !accumulatedText) {
          throw new Error(sseError);
        }
      } catch (serverErr: any) {
        if (serverErr?.name === 'AbortError') {
          throw serverErr;
        }
        // If backend route returned 404 (e.g. static/shared preview) or stream error, fall back to direct client Gemini stream
        if (!accumulatedText) {
          usedDirectFallback = true;
          await streamChatDirectFallback({
            messages: messagesHistory,
            currentPrompt: promptToSend,
            focusArea: effectiveLens,
            attachments: attachmentsToSend,
            useWebSearch,
            isVoiceMode,
            customEt: customEtPayload,
            memoryItems: memoryPayload,
            onChunk: (textDelta, sourcesUpdate) => {
              applyStreamUpdate(textDelta, sourcesUpdate);
            },
          });
        } else {
          throw serverErr;
        }
      }

      void usedDirectFallback;

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
        console.log('Stream aborted');
      } else {
        console.error('Error fetching stream', err);
        const fallbackMsgContent =
          accumulatedText ||
          `Connection note: Unable to retrieve response. ${err?.message || 'Please check your connection or attached API credentials.'}`;

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
    if (activeThread.messages.length === 0) return;
    const transcript = activeThread.messages
      .map((m) => {
        const roleName = m.role === 'user' ? 'ERIC THOMAS' : 'CHATET';
        const dateStr = new Date(m.timestamp).toLocaleString();
        return `### ${roleName} [${dateStr}]\n\n${m.content}\n\n---\n`;
      })
      .join('\n');

    const header = `# ChatET Transcript: ${activeThread.title}\nDate: ${new Date().toLocaleDateString()}\n\n---\n\n`;
    const fullText = header + transcript;

    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chatet-${activeThread.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full bg-[#080d14] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Drawer / Menu */}
      <SidebarThreads
        threads={threads}
        activeThreadId={activeThreadId}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
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
        onOpenVisualStudio={() => {
          setImageStudioPrompt('');
          setImageStudioOpen(true);
        }}
        onOpenVoiceMode={() => setIsVoiceModalOpen(true)}
        onExportTranscript={handleExportTranscript}
        memoryCount={memoryItems.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 relative h-full">
        {/* Clean 3-Zone Top Navigation Bar */}
        <header className="h-14 px-4 sm:px-6 border-b border-slate-800/80 bg-[#090e17]/90 backdrop-blur-md flex items-center justify-between z-20 flex-shrink-0">
          {/* Zone 1: Menu Trigger + Brand Mark + Active ET Selector */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className="font-heading font-extrabold text-base tracking-tight text-white hidden sm:inline-block"
            >
              Chat<span className="text-cyan-400">ET</span>
            </button>

            <CustomEtSelector
              customEts={customEts}
              activeEtId={activeEtId}
              onSelectEt={(id) => {
                handleSelectEt(id);
                setActiveTab('chat');
              }}
              onCreateNew={() => {
                setEditingCustomEt(null);
                setIsCustomEtModalOpen(true);
              }}
              onEditEt={(et) => {
                setEditingCustomEt(et);
                setIsCustomEtModalOpen(true);
              }}
            />
          </div>

          {/* Zone 2: Clean Workspace Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800/80">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'chat'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'prompts'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Prompt Library
            </button>
            <button
              onClick={() => setActiveTab('custom_ets')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'custom_ets'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom ETs
            </button>
            <button
              onClick={() => {
                setImageStudioPrompt('');
                setImageStudioOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-slate-400 hover:text-white transition-colors"
            >
              Visual Studio
            </button>
            <button
              onClick={() => setIsMemoryBankModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-slate-400 hover:text-white transition-colors"
            >
              Memory ({memoryItems.length})
            </button>
          </nav>

          {/* Zone 3: Essential Right Actions (Voice Mode, Theme Toggle, New Chat) */}
          <div className="flex items-center gap-2">
            {/* Mobile Prompt Library Tab Trigger */}
            <button
              onClick={() => setActiveTab(activeTab === 'prompts' ? 'chat' : 'prompts')}
              className={`md:hidden p-2 rounded-lg border text-xs transition-colors ${
                activeTab === 'prompts'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                  : 'text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Prompt Library"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-cyan-300 border border-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Live Voice Mode"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Voice</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              onClick={() => handleNewThread(activeEtId)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-xs font-semibold text-white transition-all flex items-center gap-1 whitespace-nowrap"
              title="Start new conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Notice Banner (Only when active) */}
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

        {/* Active Tab Views */}
        {activeTab === 'prompts' ? (
          <PromptLibraryView
            onRunPrompt={(promptText, recommendedEtId, enableWebSearch) => {
              if (recommendedEtId !== undefined) {
                handleSelectEt(recommendedEtId);
              }
              if (enableWebSearch) {
                setUseWebSearch(true);
              }
              setActiveTab('chat');
              setTimeout(() => {
                handleSendMessage(
                  promptText,
                  [],
                  false,
                  undefined,
                  recommendedEtId !== undefined ? recommendedEtId : activeEtId
                );
              }, 20);
            }}
            onLoadPromptIntoInput={(promptText, recommendedEtId) => {
              if (recommendedEtId !== undefined) {
                handleSelectEt(recommendedEtId);
              }
              setInput(promptText);
              setActiveTab('chat');
              setTimeout(() => {
                textareaRef.current?.focus();
              }, 50);
            }}
          />
        ) : activeTab === 'custom_ets' ? (
          <CustomEtsView
            customEts={customEts}
            activeEtId={activeEtId}
            onSelectEtAndChat={(etId, starterPrompt) => {
              handleSelectEt(etId);
              setActiveTab('chat');
              if (starterPrompt) {
                setTimeout(() => {
                  handleSendMessage(starterPrompt, [], false, undefined, etId);
                }, 20);
              }
            }}
            onCreateNew={() => {
              setEditingCustomEt(null);
              setIsCustomEtModalOpen(true);
            }}
            onEditEt={(et) => {
              setEditingCustomEt(et);
              setIsCustomEtModalOpen(true);
            }}
          />
        ) : (
          /* Clean Chat Workspace View */
          <>
            <div
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 relative"
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
                <div className="absolute inset-4 z-30 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-400 bg-slate-950/95 backdrop-blur-md pointer-events-none">
                  <FileUp className="w-12 h-12 text-cyan-400 mb-3 animate-bounce" />
                  <div className="text-base font-bold text-slate-100">
                    Drop Documents or Images into ChatET
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                    Attach PDFs, contracts, pitch decks, spreadsheets, or visual mockups.
                  </p>
                </div>
              )}

              {activeThread.messages.length === 0 ? (
                /* Clean, Uncluttered Empty State */
                <div className="max-w-2xl mx-auto py-8 sm:py-14 flex flex-col items-center text-center">
                  <div className="mb-5">
                    <EricHaloAvatar size="md" />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium mb-2">
                    <span>{activeCustomEt ? activeCustomEt.name : 'ChatET'}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {activeCustomEt
                        ? activeCustomEt.tagline
                        : 'Personal Thinking Partner for Eric Thomas'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight mb-3">
                    What are we working on today, Eric?
                  </h1>

                  <p className="text-sm text-slate-400 max-w-lg leading-relaxed mb-8">
                    Direct, first-principles analysis across GOS strategy, Etsy &amp; POD economics, deal audits, 8K visual concepts, and family life.
                  </p>

                  {/* 4 Clean Starter Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left mb-6">
                    {(activeCustomEt?.starterPrompts && activeCustomEt.starterPrompts.length > 0
                      ? activeCustomEt.starterPrompts.map((p, i) => ({
                          title: `Starter 0${i + 1}`,
                          prompt: p,
                        }))
                      : TAILORED_PROMPTS.slice(0, 4)
                    ).map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.prompt)}
                        className="group p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-cyan-500/40 text-left transition-all flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-semibold text-cyan-400 mb-1">
                            {item.title}
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {item.prompt}
                          </p>
                        </div>
                        <div className="flex items-center justify-end text-[11px] text-slate-500 group-hover:text-cyan-400 transition-colors">
                          <span>Ask ChatET</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Link to Full Prompt Library */}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <button
                      onClick={() => setActiveTab('prompts')}
                      className="text-cyan-400 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Browse the full Prompt Library (14 playbooks)</span>
                    </button>
                    {activeCustomEt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <button
                          onClick={() => {
                            setEditingCustomEt(activeCustomEt);
                            setIsCustomEtModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-white inline-flex items-center gap-1"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>Configure {activeCustomEt.name}</span>
                        </button>
                      </>
                    )}
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

            {/* Clean, Minimal Input Bar Area */}
            <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-800/80 bg-[#090e17]/90 backdrop-blur-md flex-shrink-0">
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

                <div className="relative flex flex-col rounded-2xl bg-slate-900/90 border border-slate-700/80 focus-within:border-cyan-500/70 transition-all p-2.5">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      activeCustomEt
                        ? `Message ${activeCustomEt.name}...`
                        : 'Ask ChatET anything, drop a file to audit, or request an 8K visual...'
                    }
                    rows={1}
                    className="w-full bg-transparent text-slate-100 text-sm px-2.5 py-1 focus:outline-none placeholder:text-slate-500 resize-none max-h-44"
                  />

                  <div className="flex items-center justify-between pt-2 px-1.5 mt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => fileTriggerRef.current?.()}
                        disabled={isStreaming}
                        className="p-1.5 px-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
                        title="Attach files (PDF, images, CSV, text)"
                      >
                        <Paperclip className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">Attach</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUseWebSearch(!useWebSearch)}
                        disabled={isStreaming}
                        className={`p-1.5 px-2 rounded-lg transition-colors flex items-center gap-1 text-xs border ${
                          useWebSearch
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                            : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800'
                        }`}
                        title={
                          useWebSearch
                            ? 'Google Search Grounding Active'
                            : 'Enable Google Search Grounding'
                        }
                      >
                        <Globe
                          className={`w-3.5 h-3.5 ${
                            useWebSearch ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="text-xs">{useWebSearch ? 'Web On' : 'Web Off'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={toggleQuickDictation}
                        disabled={isStreaming}
                        className={`p-1.5 px-2 rounded-lg transition-colors flex items-center gap-1 text-xs border ${
                          isDictating
                            ? 'bg-red-950/80 text-red-300 border-red-600/60 animate-pulse'
                            : 'text-slate-400 hover:text-cyan-300 border-transparent hover:bg-slate-800'
                        }`}
                        title="Dictate voice prompt"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-xs">
                          {isDictating ? 'Listening...' : 'Dictate'}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {isStreaming ? (
                        <button
                          onClick={handleStopStream}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={!input.trim() && attachments.length === 0}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold text-xs tracking-wide disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                        >
                          <span>Send</span>
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Visual Image Studio Modal */}
      <ImageStudioModal
        isOpen={imageStudioOpen}
        onClose={() => setImageStudioOpen(false)}
        initialPrompt={imageStudioPrompt}
        onInsertToChat={(imageUrl, promptText) => {
          setActiveTab('chat');
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
