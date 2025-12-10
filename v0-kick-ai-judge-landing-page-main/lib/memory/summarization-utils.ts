import { Message, SessionData } from './types';
import { memoryConfig } from './config';

/**
 * Utilities for summarization logic
 */

/**
 * Check if a session needs summarization
 */
export function needsSummarization(session: SessionData): boolean {
  return session.messageCount >= memoryConfig.memoryThreshold;
}

/**
 * Get messages that should be summarized (excluding recent messages)
 */
export function getMessagesToSummarize(messages: Message[]): Message[] {
  const messagesToKeep = memoryConfig.recentMessagesLimit;
  
  if (messages.length <= messagesToKeep) {
    return [];
  }
  
  return messages.slice(0, -messagesToKeep);
}

/**
 * Get recent messages that should be preserved
 */
export function getRecentMessages(messages: Message[]): Message[] {
  const messagesToKeep = memoryConfig.recentMessagesLimit;
  return messages.slice(-messagesToKeep);
}

/**
 * Calculate summarization statistics
 */
export function calculateSummarizationStats(session: SessionData): {
  totalMessages: number;
  messagesToSummarize: number;
  recentMessages: number;
  summariesCount: number;
  needsSummarization: boolean;
} {
  const messagesToSummarize = getMessagesToSummarize(session.messages);
  const recentMessages = getRecentMessages(session.messages);
  
  return {
    totalMessages: session.messageCount,
    messagesToSummarize: messagesToSummarize.length,
    recentMessages: recentMessages.length,
    summariesCount: session.summaries.length,
    needsSummarization: needsSummarization(session),
  };
}

/**
 * Validate summarization configuration
 */
export function validateSummarizationConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (memoryConfig.memoryThreshold <= 0) {
    errors.push('Memory threshold must be greater than 0');
  }
  
  if (memoryConfig.recentMessagesLimit <= 0) {
    errors.push('Recent messages limit must be greater than 0');
  }
  
  if (memoryConfig.recentMessagesLimit >= memoryConfig.memoryThreshold) {
    errors.push('Recent messages limit must be less than memory threshold');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate memory usage for a session
 */
export function estimateSessionMemoryUsage(session: SessionData): {
  messagesSize: number;
  summariesSize: number;
  totalSize: number;
  estimatedBytes: number;
} {
  const messagesSize = session.messages.reduce((sum, msg) => sum + msg.content.length, 0);
  const summariesSize = session.summaries.reduce((sum, summary) => sum + summary.length, 0);
  const totalSize = messagesSize + summariesSize;
  
  // Rough estimate: each character ≈ 2 bytes (UTF-16) + object overhead
  const estimatedBytes = totalSize * 2 + (session.messages.length + session.summaries.length) * 100;
  
  return {
    messagesSize,
    summariesSize,
    totalSize,
    estimatedBytes,
  };
}

/**
 * Get summarization recommendations for a session
 */
export function getSummarizationRecommendations(session: SessionData): {
  shouldSummarize: boolean;
  reason: string;
  messagesCount: number;
  summariesCount: number;
} {
  const stats = calculateSummarizationStats(session);
  
  if (stats.needsSummarization) {
    return {
      shouldSummarize: true,
      reason: `Session has ${stats.totalMessages} messages, exceeding threshold of ${memoryConfig.memoryThreshold}`,
      messagesCount: stats.messagesToSummarize,
      summariesCount: stats.summariesCount,
    };
  }
  
  return {
    shouldSummarize: false,
    reason: `Session has ${stats.totalMessages} messages, below threshold of ${memoryConfig.memoryThreshold}`,
    messagesCount: 0,
    summariesCount: stats.summariesCount,
  };
}

/**
 * Format summarization report
 */
export function formatSummarizationReport(
  sessionId: string,
  beforeStats: ReturnType<typeof calculateSummarizationStats>,
  afterStats: ReturnType<typeof calculateSummarizationStats>,
  summaryLength: number
): string {
  return [
    `Summarization Report for Session: ${sessionId}`,
    `Before: ${beforeStats.totalMessages} messages, ${beforeStats.summariesCount} summaries`,
    `After: ${afterStats.totalMessages} messages, ${afterStats.summariesCount} summaries`,
    `Summarized: ${beforeStats.messagesToSummarize} messages into ${summaryLength} characters`,
    `Memory saved: ${beforeStats.messagesToSummarize - afterStats.recentMessages} messages`,
  ].join('\n');
}