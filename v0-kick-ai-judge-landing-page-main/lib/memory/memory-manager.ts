import { Message, ConversationContext, SummaryMemoryManager as ISummaryMemoryManager } from './types';
import { sessionStorage } from './session-storage';
import { summaryGenerator } from './summary-generator';
import { memoryConfig } from './config';
import { createMessage, updateSessionActivity } from './utils';
import { 
  needsSummarization, 
  getMessagesToSummarize, 
  getRecentMessages,
  calculateSummarizationStats,
  formatSummarizationReport 
} from './summarization-utils';
import { 
  handleStorageError, 
  handleSummarizationError, 
  withGracefulDegradation 
} from './error-handler';

/**
 * Main memory manager with automatic summarization
 */
export class SummaryMemoryManager implements ISummaryMemoryManager {
  
  /**
   * Add a message to the session and trigger summarization if needed
   */
  async addMessage(sessionId: string, message: Message): Promise<void> {
    try {
      const session = sessionStorage.getSession(sessionId);
      
      // Add message to session
      session.messages.push(message);
      session.messageCount++;
      updateSessionActivity(session);

      // Check if we need to trigger summarization
      if (needsSummarization(session)) {
        await this.triggerSummarization(sessionId);
      }

      // Update session in storage
      sessionStorage.updateSession(sessionId, session);

    } catch (error) {
      handleStorageError(error instanceof Error ? error : new Error('Unknown error'), sessionId, {
        operation: 'addMessage',
        messageId: message.id,
      });
      throw error;
    }
  }

  /**
   * Get formatted conversation context for a session
   */
  async getContext(sessionId: string): Promise<ConversationContext> {
    try {
      const session = sessionStorage.getSession(sessionId);
      
      // Get recent messages (last N messages)
      const recentMessages = session.messages.slice(-memoryConfig.recentMessagesLimit);
      
      return {
        summaries: [...session.summaries],
        recentMessages: [...recentMessages],
        totalMessages: session.messageCount,
      };

    } catch (error) {
      handleStorageError(error instanceof Error ? error : new Error('Unknown error'), sessionId, {
        operation: 'getContext',
      });
      
      // Return empty context on error (graceful degradation)
      return {
        summaries: [],
        recentMessages: [],
        totalMessages: 0,
      };
    }
  }

  /**
   * Clear all data for a session
   */
  async clearSession(sessionId: string): Promise<void> {
    try {
      sessionStorage.clearSession(sessionId);
      console.log(`MemoryManager: Cleared session ${sessionId}`);
    } catch (error) {
      console.error(`MemoryManager: Failed to clear session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up inactive sessions
   */
  async cleanupInactiveSessions(): Promise<void> {
    try {
      const removedCount = sessionStorage.cleanupInactiveSessions();
      
      // Also enforce session limits
      const limitRemovedCount = sessionStorage.enforceSessionLimit();
      
      if (removedCount > 0 || limitRemovedCount > 0) {
        console.log(`MemoryManager: Cleanup completed - removed ${removedCount} inactive sessions, ${limitRemovedCount} for limit enforcement`);
      }
    } catch (error) {
      console.error('MemoryManager: Failed to cleanup inactive sessions:', error);
      // Don't throw - cleanup failures shouldn't break the system
    }
  }

  /**
   * Trigger summarization for a session when threshold is reached
   */
  private async triggerSummarization(sessionId: string): Promise<void> {
    try {
      const session = sessionStorage.getSession(sessionId);
      
      // Get stats before summarization
      const beforeStats = calculateSummarizationStats(session);
      
      // Only summarize if we have enough messages and summarization is available
      if (!needsSummarization(session)) {
        return;
      }

      if (!summaryGenerator.isAvailable()) {
        console.warn(`MemoryManager: Summarization not available for session ${sessionId}, keeping original messages`);
        return;
      }

      // Get messages to summarize
      const messagesToSummarize = getMessagesToSummarize(session.messages);
      
      if (messagesToSummarize.length === 0) {
        return;
      }

      // Generate summary
      const summary = await summaryGenerator.generateSummary(messagesToSummarize);
      
      if (summary && summary.trim().length > 0) {
        // Add summary to session
        session.summaries.push(summary);
        
        // Keep only recent messages
        session.messages = getRecentMessages(session.messages);
        
        // Get stats after summarization
        const afterStats = calculateSummarizationStats(session);
        
        // Log summarization report
        const report = formatSummarizationReport(sessionId, beforeStats, afterStats, summary.length);
        console.log(`MemoryManager: ${report}`);
      } else {
        console.warn(`MemoryManager: Empty summary generated for session ${sessionId}, keeping original messages`);
      }

    } catch (error) {
      handleSummarizationError(error instanceof Error ? error : new Error('Unknown error'), sessionId, {
        operation: 'triggerSummarization',
        messagesCount: session.messages.length,
      });
      // Don't throw - summarization failures should not break message storage
      // The system will continue with original messages (graceful degradation)
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return sessionStorage.getStats();
  }

  /**
   * Format context for LLM consumption
   */
  formatContextForLLM(context: ConversationContext): string {
    const parts: string[] = [];

    // Add summaries if available
    if (context.summaries.length > 0) {
      parts.push('=== Попередня розмова (резюме) ===');
      context.summaries.forEach((summary, index) => {
        parts.push(`Резюме ${index + 1}: ${summary}`);
      });
      parts.push('');
    }

    // Add recent messages if available
    if (context.recentMessages.length > 0) {
      parts.push('=== Останні повідомлення ===');
      context.recentMessages.forEach(msg => {
        const timestamp = msg.timestamp.toLocaleString('uk-UA');
        parts.push(`[${timestamp}] ${msg.role}: ${msg.content}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Check if a session exists
   */
  hasSession(sessionId: string): boolean {
    return sessionStorage.hasSession(sessionId);
  }
}

/**
 * Singleton instance of SummaryMemoryManager
 */
export const memoryManager = new SummaryMemoryManager();