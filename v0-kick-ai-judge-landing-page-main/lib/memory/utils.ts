import { Message, SessionData } from './types';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new empty session
 */
export function createEmptySession(sessionId: string): SessionData {
  return {
    sessionId,
    messages: [],
    summaries: [],
    lastActivity: new Date(),
    messageCount: 0,
  };
}

/**
 * Check if a session is inactive based on timeout
 */
export function isSessionInactive(session: SessionData, timeoutHours: number): boolean {
  const now = new Date();
  const timeoutMs = timeoutHours * 60 * 60 * 1000;
  return (now.getTime() - session.lastActivity.getTime()) > timeoutMs;
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(session: SessionData): void {
  session.lastActivity = new Date();
}

/**
 * Create a message object
 */
export function createMessage(
  role: 'user' | 'assistant',
  content: string,
  id?: string
): Message {
  return {
    id: id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: new Date(),
  };
}

/**
 * Format messages for context display
 */
export function formatMessagesForContext(messages: Message[]): string {
  return messages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
}

/**
 * Validate session data structure
 */
export function validateSessionData(data: any): data is SessionData {
  return (
    data &&
    typeof data.sessionId === 'string' &&
    Array.isArray(data.messages) &&
    Array.isArray(data.summaries) &&
    data.lastActivity instanceof Date &&
    typeof data.messageCount === 'number'
  );
}