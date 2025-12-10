/**
 * Core types for the SummaryMemory system
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SessionData {
  sessionId: string;
  messages: Message[];
  summaries: string[];
  lastActivity: Date;
  messageCount: number;
}

export interface ConversationContext {
  summaries: string[];
  recentMessages: Message[];
  totalMessages: number;
}

export interface MemoryConfig {
  memoryThreshold: number; // 10 messages
  recentMessagesLimit: number; // 6 messages
  sessionTimeoutHours: number; // 24 hours
  maxSessions: number; // 1000 sessions
  geminiApiKey?: string;
}

export interface SummaryGenerator {
  generateSummary(messages: Message[]): Promise<string>;
  isAvailable(): boolean;
}

export interface SummaryMemoryManager {
  addMessage(sessionId: string, message: Message): Promise<void>;
  getContext(sessionId: string): Promise<ConversationContext>;
  clearSession(sessionId: string): Promise<void>;
  cleanupInactiveSessions(): Promise<void>;
}