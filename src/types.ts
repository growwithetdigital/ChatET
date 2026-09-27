export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  base64?: string;
  previewUrl?: string;
  textContent?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface CustomET {
  id: string;
  name: string;
  tagline: string;
  instructions: string;
  files: FileAttachment[];
  focusArea?: FocusAreaId;
  iconName?: string;
  color?: string;
  starterPrompts?: string[];
  createdAt: number;
  updatedAt: number;
  isBuiltIn?: boolean;
}

export interface MemoryItem {
  id: string;
  category: 'business' | 'personal' | 'parenting' | 'preference' | 'rule';
  content: string;
  createdAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  focusArea?: string;
  isStreaming?: boolean;
  attachments?: FileAttachment[];
  sources?: GroundingSource[];
}

export interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  focusArea: string;
  customEtId?: string;
  messages: Message[];
  pinned?: boolean;
}

export type FocusAreaId = 
  | 'all'
  | 'gos'
  | 'ventures'
  | 'parenting'
  | 'first_principles'
  | 'life_personal';

export interface FocusArea {
  id: FocusAreaId;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  color: string;
}

export interface RuleItem {
  id: number;
  name: string;
  summary: string;
  standard: string;
}
