export type AIModel = 'gpt' | 'claude' | 'gemini';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  originalContent?: string; // For audit log
  sanitizedContent?: string; // For audit log
  model: AIModel;
  timestamp: number;
  isSanitizing?: boolean;
  status?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface SanitizationRule {
  name: string;
  pattern: RegExp;
  placeholder: string;
}

export interface SanitizedResult {
  text: string;
  matches: { rule: string; value: string; placeholder: string }[];
}

export interface FileSanitizationResult {
  file: File;
  sanitizedText?: string;
  matches: { rule: string; value: string; placeholder: string }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: string;
  details: string;
  type: 'info' | 'warning' | 'success';
}
