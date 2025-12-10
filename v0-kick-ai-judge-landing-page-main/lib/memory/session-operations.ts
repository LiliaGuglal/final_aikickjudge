import { memoryManager } from './memory-manager';
import { sessionStorage } from './session-storage';
import { generateSessionId, createEmptySession } from './utils';

/**
 * High-level session operations with validation and confirmation
 */

export interface SessionClearResult {
  success: boolean;
  sessionId: string;
  message: string;
  previousStats?: {
    messageCount: number;
    summariesCount: number;
  };
}

export interface SessionInitResult {
  success: boolean;
  sessionId: string;
  message: string;
}

/**
 * Clear a session with confirmation and statistics
 */
export async function clearSessionWithConfirmation(sessionId: string): Promise<SessionClearResult> {
  try {
    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string') {
      return {
        success: false,
        sessionId: sessionId || '',
        message: 'Invalid session ID provided',
      };
    }

    // Get session stats before clearing
    let previousStats;
    if (memoryManager.hasSession(sessionId)) {
      const context = await memoryManager.getContext(sessionId);
      previousStats = {
        messageCount: context.totalMessages,
        summariesCount: context.summaries.length,
      };
    }

    // Clear the session
    await memoryManager.clearSession(sessionId);

    // Verify clearing was successful
    const contextAfter = await memoryManager.getContext(sessionId);
    const isCleared = contextAfter.totalMessages === 0 && contextAfter.summaries.length === 0;

    if (!isCleared) {
      return {
        success: false,
        sessionId,
        message: 'Session clearing verification failed',
        previousStats,
      };
    }

    return {
      success: true,
      sessionId,
      message: previousStats 
        ? `Session cleared successfully. Removed ${previousStats.messageCount} messages and ${previousStats.summariesCount} summaries.`
        : 'Session cleared successfully.',
      previousStats,
    };

  } catch (error) {
    console.error(`SessionOperations: Failed to clear session ${sessionId}:`, error);
    
    return {
      success: false,
      sessionId,
      message: `Failed to clear session: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Initialize a new session with validation
 */
export function initializeNewSession(): SessionInitResult {
  try {
    const sessionId = generateSessionId();
    
    // Verify session was created
    const session = sessionStorage.getSession(sessionId);
    
    if (!session || session.sessionId !== sessionId) {
      return {
        success: false,
        sessionId: '',
        message: 'Failed to create new session',
      };
    }

    return {
      success: true,
      sessionId,
      message: 'New session initialized successfully',
    };

  } catch (error) {
    console.error('SessionOperations: Failed to initialize new session:', error);
    
    return {
      success: false,
      sessionId: '',
      message: `Failed to initialize session: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Reset session to fresh state (clear + reinitialize)
 */
export async function resetSession(sessionId: string): Promise<SessionClearResult> {
  try {
    const clearResult = await clearSessionWithConfirmation(sessionId);
    
    if (!clearResult.success) {
      return clearResult;
    }

    // Verify session is in fresh state
    const context = await memoryManager.getContext(sessionId);
    const isFresh = context.totalMessages === 0 && 
                   context.summaries.length === 0 && 
                   context.recentMessages.length === 0;

    if (!isFresh) {
      return {
        success: false,
        sessionId,
        message: 'Session reset verification failed',
        previousStats: clearResult.previousStats,
      };
    }

    return {
      ...clearResult,
      message: clearResult.previousStats 
        ? `Session reset successfully. Removed ${clearResult.previousStats.messageCount} messages and ${clearResult.previousStats.summariesCount} summaries.`
        : 'Session reset successfully.',
    };

  } catch (error) {
    console.error(`SessionOperations: Failed to reset session ${sessionId}:`, error);
    
    return {
      success: false,
      sessionId,
      message: `Failed to reset session: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate session state
 */
export async function validateSessionState(sessionId: string): Promise<{
  isValid: boolean;
  issues: string[];
  stats: {
    messageCount: number;
    summariesCount: number;
    recentMessagesCount: number;
  };
}> {
  const issues: string[] = [];
  
  try {
    if (!sessionId) {
      issues.push('Session ID is empty');
    }

    if (!memoryManager.hasSession(sessionId)) {
      issues.push('Session does not exist');
    }

    const context = await memoryManager.getContext(sessionId);
    
    // Check for data consistency
    if (context.totalMessages < 0) {
      issues.push('Invalid total message count');
    }

    if (context.summaries.some(s => !s || s.trim().length === 0)) {
      issues.push('Empty summaries found');
    }

    if (context.recentMessages.some(m => !m.id || !m.content)) {
      issues.push('Invalid messages found');
    }

    return {
      isValid: issues.length === 0,
      issues,
      stats: {
        messageCount: context.totalMessages,
        summariesCount: context.summaries.length,
        recentMessagesCount: context.recentMessages.length,
      },
    };

  } catch (error) {
    issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      isValid: false,
      issues,
      stats: {
        messageCount: 0,
        summariesCount: 0,
        recentMessagesCount: 0,
      },
    };
  }
}

/**
 * Get session operation history (for debugging)
 */
export function getSessionOperationLog(): string[] {
  // This would be implemented with actual logging in a production system
  // For now, return empty array
  return [];
}