import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { Thread, Message, CustomET, MemoryItem, FocusAreaId, GroundingSource, FileAttachment } from '../types';

// Validation constants synchronized verbatim with firebase-blueprint.json & firestore.rules
const ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const VALID_FOCUS_AREAS = ['all', 'gos', 'ventures', 'parenting', 'first_principles', 'life_personal'];
const VALID_MEMORY_CATEGORIES = ['business', 'personal', 'parenting', 'preference', 'rule'];

export function sanitizeId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 && ID_REGEX.test(cleaned) ? cleaned : `id_${Date.now()}`;
}

function clampString(val: string | undefined | null, minLen: number, maxLen: number, fallback = 'N/A'): string {
  const str = (val ?? '').trim();
  if (str.length < minLen) {
    return fallback.slice(0, maxLen);
  }
  return str.slice(0, maxLen);
}

function sanitizeFocusArea(area?: string): FocusAreaId {
  if (area && VALID_FOCUS_AREAS.includes(area)) {
    return area as FocusAreaId;
  }
  return 'all';
}

function sanitizeCategory(cat?: string): MemoryItem['category'] {
  if (cat && VALID_MEMORY_CATEGORIES.includes(cat)) {
    return cat as MemoryItem['category'];
  }
  return 'personal';
}

export function serializeSources(sources?: GroundingSource[]): string {
  if (!sources || sources.length === 0) return '';
  return sources
    .map((s) => `${(s.title || 'Source').replace(/\|/g, ' ')}|||${s.uri}`)
    .join('\n')
    .slice(0, 10000);
}

export function deserializeSources(sourcesText?: string): GroundingSource[] | undefined {
  if (!sourcesText || !sourcesText.trim()) return undefined;
  const lines = sourcesText.split('\n').filter(Boolean);
  const parsed: GroundingSource[] = [];
  for (const line of lines) {
    const [title, uri] = line.split('|||');
    if (uri && uri.trim()) {
      parsed.push({
        title: (title || uri).trim(),
        uri: uri.trim(),
      });
    }
  }
  return parsed.length > 0 ? parsed : undefined;
}

export function serializeKnowledgeFiles(files?: FileAttachment[]): {
  knowledgeText: string;
  knowledgeFileNames: string;
} {
  if (!files || files.length === 0) {
    return { knowledgeText: '', knowledgeFileNames: '' };
  }
  const names = files
    .map((f) => `${f.name.replace(/\|/g, '_')}:${f.size || 0}:${f.type || 'text/plain'}`)
    .join('||')
    .slice(0, 2000);

  const combinedText = files
    .map((f) => `=== FILE: ${f.name} ===\n${f.textContent || ''}\n=== END FILE: ${f.name} ===`)
    .join('\n\n')
    .slice(0, 150000);

  return {
    knowledgeText: combinedText,
    knowledgeFileNames: names,
  };
}

export function deserializeKnowledgeFiles(
  knowledgeText?: string,
  knowledgeFileNames?: string
): FileAttachment[] {
  if (!knowledgeFileNames || !knowledgeFileNames.trim()) return [];
  const entries = knowledgeFileNames.split('||').filter(Boolean);
  const files: FileAttachment[] = [];

  for (let i = 0; i < entries.length; i++) {
    const parts = entries[i].split(':');
    const name = parts[0] || `Document_${i + 1}.md`;
    const size = parseInt(parts[1] || '0', 10) || 0;
    const type = parts[2] || 'text/markdown';

    // Extract section from knowledgeText if available
    let textContent = '';
    if (knowledgeText) {
      const markerStart = `=== FILE: ${name} ===\n`;
      const markerEnd = `\n=== END FILE: ${name} ===`;
      const startIdx = knowledgeText.indexOf(markerStart);
      if (startIdx !== -1) {
        const contentStart = startIdx + markerStart.length;
        const endIdx = knowledgeText.indexOf(markerEnd, contentStart);
        textContent =
          endIdx !== -1
            ? knowledgeText.slice(contentStart, endIdx)
            : knowledgeText.slice(contentStart);
      } else if (entries.length === 1) {
        textContent = knowledgeText;
      }
    }

    files.push({
      id: `file-${i}-${name.replace(/[^a-zA-Z0-9]/g, '')}`,
      name,
      size,
      type,
      textContent,
    });
  }

  return files;
}

// ============================================================================
// Firestore Mutation Helpers (Strictly Aligned with firestore.rules)
// ============================================================================

export async function saveThreadToFirestore(thread: Thread): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const threadId = sanitizeId(thread.id);
  const path = `threads/${threadId}`;
  const ref = doc(db, 'threads', threadId);

  const title = clampString(thread.title, 1, 200, 'Advisory Consultation');
  const focusArea = sanitizeFocusArea(thread.focusArea);
  const customEtId = clampString(thread.customEtId || 'none', 1, 128, 'none');
  const pinned = Boolean(thread.pinned);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: user.uid,
        title,
        focusArea,
        customEtId,
        pinned,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        title,
        focusArea,
        customEtId,
        pinned,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteThreadFromFirestore(
  threadIdRaw: string,
  messageIds: string[] = []
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const threadId = sanitizeId(threadIdRaw);
  const path = `threads/${threadId}`;

  try {
    for (const mId of messageIds) {
      const cleanMsgId = sanitizeId(mId);
      await deleteDoc(doc(db, 'messages', cleanMsgId));
    }
    await deleteDoc(doc(db, 'threads', threadId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMessageToFirestore(
  threadIdRaw: string,
  message: Message
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const threadId = sanitizeId(threadIdRaw);
  const messageId = sanitizeId(message.id);
  const path = `messages/${messageId}`;
  const ref = doc(db, 'messages', messageId);

  const role = message.role === 'model' ? 'model' : 'user';
  const content = clampString(message.content, 1, 100000, '...');
  const focusArea = sanitizeFocusArea(message.focusArea);
  const sourcesText = serializeSources(message.sources);
  const msgTimestamp = Math.max(1, Math.floor(message.timestamp || Date.now()));

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: user.uid,
        threadId,
        role,
        content,
        focusArea,
        sourcesText,
        msgTimestamp,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        content,
        sourcesText,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCustomEtToFirestore(et: CustomET): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const etId = sanitizeId(et.id);
  const path = `customEts/${etId}`;
  const ref = doc(db, 'customEts', etId);

  const name = clampString(et.name, 1, 100, 'Custom ET');
  const tagline = clampString(et.tagline, 1, 250, 'Specialized Advisor');
  const instructions = clampString(et.instructions, 1, 25000, 'Provide strategic analysis.');
  const focusArea = sanitizeFocusArea(et.focusArea);
  const color = clampString(et.color || 'from-cyan-500 to-teal-500', 1, 64, 'from-cyan-500 to-teal-500');
  const { knowledgeText, knowledgeFileNames } = serializeKnowledgeFiles(et.files);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: user.uid,
        name,
        tagline,
        instructions,
        focusArea,
        color,
        knowledgeText,
        knowledgeFileNames,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        name,
        tagline,
        instructions,
        focusArea,
        color,
        knowledgeText,
        knowledgeFileNames,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomEtFromFirestore(etIdRaw: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const etId = sanitizeId(etIdRaw);
  const path = `customEts/${etId}`;
  try {
    await deleteDoc(doc(db, 'customEts', etId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMemoryToFirestore(mem: MemoryItem): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const memId = sanitizeId(mem.id);
  const path = `memories/${memId}`;
  const ref = doc(db, 'memories', memId);

  const category = sanitizeCategory(mem.category);
  const content = clampString(mem.content, 1, 2000, 'Remembered fact');

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerId: user.uid,
        category,
        content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        category,
        content,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMemoryFromFirestore(memIdRaw: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const memId = sanitizeId(memIdRaw);
  const path = `memories/${memId}`;
  try {
    await deleteDoc(doc(db, 'memories', memId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// Real-Time Firestore Listeners (Authenticated & Verified Users Only)
// ============================================================================

export function subscribeToUserVault(
  uid: string,
  callbacks: {
    onThreadsAndMessages: (threadsMeta: Array<Omit<Thread, 'messages'>>, messagesByThread: Record<string, Message[]>) => void;
    onCustomEts: (ets: CustomET[]) => void;
    onMemories: (memories: MemoryItem[]) => void;
  }
): () => void {
  let cachedThreads: Array<Omit<Thread, 'messages'>> = [];
  let cachedMessages: Record<string, Message[]> = {};

  const emitThreads = () => {
    callbacks.onThreadsAndMessages(cachedThreads, cachedMessages);
  };

  const threadsQuery = query(collection(db, 'threads'), where('ownerId', '==', uid));
  const unsubThreads = onSnapshot(
    threadsQuery,
    (snapshot) => {
      cachedThreads = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const createdMs = d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now();
        const updatedMs = d.updatedAt?.toMillis ? d.updatedAt.toMillis() : createdMs;
        return {
          id: docSnap.id,
          title: d.title || 'Consultation',
          focusArea: d.focusArea || 'all',
          customEtId: d.customEtId && d.customEtId !== 'none' ? d.customEtId : undefined,
          pinned: Boolean(d.pinned),
          createdAt: createdMs,
          updatedAt: updatedMs,
        };
      });
      cachedThreads.sort((a, b) => b.updatedAt - a.updatedAt);
      emitThreads();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'threads');
    }
  );

  const messagesQuery = query(collection(db, 'messages'), where('ownerId', '==', uid));
  const unsubMessages = onSnapshot(
    messagesQuery,
    (snapshot) => {
      const grouped: Record<string, Message[]> = {};
      snapshot.docs.forEach((docSnap) => {
        const d = docSnap.data();
        const tId = d.threadId;
        if (!tId) return;
        if (!grouped[tId]) grouped[tId] = [];
        grouped[tId].push({
          id: docSnap.id,
          role: d.role === 'model' ? 'model' : 'user',
          content: d.content || '',
          timestamp: typeof d.msgTimestamp === 'number' ? d.msgTimestamp : Date.now(),
          focusArea: d.focusArea || 'all',
          sources: deserializeSources(d.sourcesText),
        });
      });
      for (const tId of Object.keys(grouped)) {
        grouped[tId].sort((a, b) => a.timestamp - b.timestamp);
      }
      cachedMessages = grouped;
      emitThreads();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    }
  );

  const etsQuery = query(collection(db, 'customEts'), where('ownerId', '==', uid));
  const unsubEts = onSnapshot(
    etsQuery,
    (snapshot) => {
      const ets: CustomET[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const createdMs = d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now();
        const updatedMs = d.updatedAt?.toMillis ? d.updatedAt.toMillis() : createdMs;
        return {
          id: docSnap.id,
          name: d.name || 'Custom ET',
          tagline: d.tagline || '',
          instructions: d.instructions || '',
          focusArea: (d.focusArea as FocusAreaId) || 'all',
          color: d.color || 'from-cyan-500 to-teal-500',
          files: deserializeKnowledgeFiles(d.knowledgeText, d.knowledgeFileNames),
          createdAt: createdMs,
          updatedAt: updatedMs,
        };
      });
      ets.sort((a, b) => b.updatedAt - a.updatedAt);
      callbacks.onCustomEts(ets);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customEts');
    }
  );

  const memoriesQuery = query(collection(db, 'memories'), where('ownerId', '==', uid));
  const unsubMemories = onSnapshot(
    memoriesQuery,
    (snapshot) => {
      const mems: MemoryItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const createdMs = d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now();
        return {
          id: docSnap.id,
          category: sanitizeCategory(d.category),
          content: d.content || '',
          createdAt: createdMs,
        };
      });
      mems.sort((a, b) => b.createdAt - a.createdAt);
      callbacks.onMemories(mems);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'memories');
    }
  );

  return () => {
    unsubThreads();
    unsubMessages();
    unsubEts();
    unsubMemories();
  };
}
