import { SessionData } from './types';
import { createEmptySession, updateSessionActivity, validateSessionData } from './utils';
import { memoryConfig } from './config';

/**
 * In-memory session storage with management capabilities
 */
export class SessionStorage {
  private sessions: Map<string, SessionData> = new Map();

  /**
   * Get a session by ID, create if it doesn't exist
   */
  getSession(sessionId: string): SessionData {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = createEmptySession(sessionId);
      this.sessions.set(sessionId, session);
    } else {
      // Update activity timestamp
      updateSessionActivity(session);
    }

    return session;
  }

  /**
   * Check if a session exists
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Update a session
   */
  updateSession(sessionId: string, sessionData: SessionData): void {
    if (!validateSessionData(sessionData)) {
      throw new Error(`Invalid session data for session ${sessionId}`);
    }
    
    updateSessionActivity(sessionData);
    this.sessions.set(sessionId, sessionData);
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Clear all data for a session (reset to empty state)
   */
  clearSession(sessionId: string): void {
    const emptySession = createEmptySession(sessionId);
    this.sessions.set(sessionId, emptySession);
  }

  /**
   * Get all session IDs
   */
  getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get all sessions
   */
  getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get inactive sessions based on timeout
   */
  getInactiveSessions(): SessionData[] {
    const now = new Date();
    const timeoutMs = memoryConfig.sessionTimeoutHours * 60 * 60 * 1000;
    
    return Array.from(this.sessions.values()).filter(session => {
      return (now.getTime() - session.lastActivity.getTime()) > timeoutMs;
    });
  }

  /**
   * Remove inactive sessions
   */
  cleanupInactiveSessions(): number {
    const inactiveSessions = this.getInactiveSessions();
    let removedCount = 0;

    for (const session of inactiveSessions) {
      if (this.sessions.delete(session.sessionId)) {
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`SessionStorage: Cleaned up ${removedCount} inactive sessions`);
    }

    return removedCount;
  }

  /**
   * Enforce session limit by removing oldest sessions
   */
  enforceSessionLimit(): number {
    const currentCount = this.sessions.size;
    const maxSessions = memoryConfig.maxSessions;
    
    if (currentCount <= maxSessions) {
      return 0;
    }

    // Sort sessions by last activity (oldest first)
    const sortedSessions = Array.from(this.sessions.values())
      .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime());

    const sessionsToRemove = currentCount - maxSessions;
    let removedCount = 0;

    for (let i = 0; i < sessionsToRemove; i++) {
      const session = sortedSessions[i];
      if (this.sessions.delete(session.sessionId)) {
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`SessionStorage: Removed ${removedCount} oldest sessions to enforce limit`);
    }

    return removedCount;
  }

  /**
   * Get memory usage statistics
   */
  getStats(): {
    totalSessions: number;
    totalMessages: number;
    totalSummaries: number;
    oldestSession: Date | null;
    newestSession: Date | null;
  } {
    const sessions = Array.from(this.sessions.values());
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        totalSummaries: 0,
        oldestSession: null,
        newestSession: null,
      };
    }

    const totalMessages = sessions.reduce((sum, session) => sum + session.messageCount, 0);
    const totalSummaries = sessions.reduce((sum, session) => sum + session.summaries.length, 0);
    
    const activities = sessions.map(s => s.lastActivity);
    const oldestSession = new Date(Math.min(...activities.map(d => d.getTime())));
    const newestSession = new Date(Math.max(...activities.map(d => d.getTime())));

    return {
      totalSessions: sessions.length,
      totalMessages,
      totalSummaries,
      oldestSession,
      newestSession,
    };
  }
}

/**
 * Singleton instance of SessionStorage
 */
export const sessionStorage = new SessionStorage();