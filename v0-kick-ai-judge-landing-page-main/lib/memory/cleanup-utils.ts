import { SessionData } from './types';
import { memoryConfig } from './config';
import { isSessionInactive } from './utils';

/**
 * Utilities for session cleanup analysis and reporting
 */

/**
 * Analyze sessions for cleanup recommendations
 */
export function analyzeSessionsForCleanup(sessions: SessionData[]): {
  total: number;
  active: number;
  inactive: number;
  overLimit: number;
  recommendations: {
    shouldCleanupInactive: boolean;
    shouldEnforceLimit: boolean;
    inactiveToRemove: number;
    oldestToRemove: number;
  };
} {
  const total = sessions.length;
  const inactive = sessions.filter(session => 
    isSessionInactive(session, memoryConfig.sessionTimeoutHours)
  ).length;
  const active = total - inactive;
  const overLimit = Math.max(0, total - memoryConfig.maxSessions);

  return {
    total,
    active,
    inactive,
    overLimit,
    recommendations: {
      shouldCleanupInactive: inactive > 0,
      shouldEnforceLimit: overLimit > 0,
      inactiveToRemove: inactive,
      oldestToRemove: overLimit,
    },
  };
}

/**
 * Get sessions sorted by activity (oldest first)
 */
export function getSessionsByActivity(sessions: SessionData[]): SessionData[] {
  return [...sessions].sort((a, b) => 
    a.lastActivity.getTime() - b.lastActivity.getTime()
  );
}

/**
 * Get sessions that should be removed for limit enforcement
 */
export function getSessionsToRemoveForLimit(sessions: SessionData[]): SessionData[] {
  const overLimit = sessions.length - memoryConfig.maxSessions;
  
  if (overLimit <= 0) {
    return [];
  }

  const sortedSessions = getSessionsByActivity(sessions);
  return sortedSessions.slice(0, overLimit);
}

/**
 * Calculate memory savings from cleanup
 */
export function calculateCleanupSavings(
  sessionsToRemove: SessionData[]
): {
  sessionsRemoved: number;
  messagesRemoved: number;
  summariesRemoved: number;
  estimatedBytesFreed: number;
} {
  let messagesRemoved = 0;
  let summariesRemoved = 0;
  let estimatedBytesFreed = 0;

  for (const session of sessionsToRemove) {
    messagesRemoved += session.messages.length;
    summariesRemoved += session.summaries.length;
    
    // Estimate bytes (rough calculation)
    const messageBytes = session.messages.reduce((sum, msg) => sum + msg.content.length * 2, 0);
    const summaryBytes = session.summaries.reduce((sum, summary) => sum + summary.length * 2, 0);
    estimatedBytesFreed += messageBytes + summaryBytes + 1000; // + overhead
  }

  return {
    sessionsRemoved: sessionsToRemove.length,
    messagesRemoved,
    summariesRemoved,
    estimatedBytesFreed,
  };
}

/**
 * Generate cleanup report
 */
export function generateCleanupReport(
  beforeStats: ReturnType<typeof analyzeSessionsForCleanup>,
  afterStats: ReturnType<typeof analyzeSessionsForCleanup>,
  duration: number
): string {
  const sessionsRemoved = beforeStats.total - afterStats.total;
  const memoryFreed = (sessionsRemoved * 1000); // Rough estimate

  return [
    '=== Session Cleanup Report ===',
    `Duration: ${duration}ms`,
    `Sessions before: ${beforeStats.total} (${beforeStats.active} active, ${beforeStats.inactive} inactive)`,
    `Sessions after: ${afterStats.total} (${afterStats.active} active, ${afterStats.inactive} inactive)`,
    `Sessions removed: ${sessionsRemoved}`,
    `Estimated memory freed: ${(memoryFreed / 1024).toFixed(2)} KB`,
    `Current limit: ${memoryConfig.maxSessions} sessions`,
    `Timeout threshold: ${memoryConfig.sessionTimeoutHours} hours`,
  ].join('\n');
}

/**
 * Check if cleanup is needed
 */
export function isCleanupNeeded(sessions: SessionData[]): {
  needed: boolean;
  reasons: string[];
  priority: 'low' | 'medium' | 'high';
} {
  const analysis = analyzeSessionsForCleanup(sessions);
  const reasons: string[] = [];
  let priority: 'low' | 'medium' | 'high' = 'low';

  if (analysis.recommendations.shouldCleanupInactive) {
    reasons.push(`${analysis.inactive} inactive sessions found`);
    priority = 'medium';
  }

  if (analysis.recommendations.shouldEnforceLimit) {
    reasons.push(`${analysis.overLimit} sessions over limit`);
    priority = 'high';
  }

  // High memory usage threshold
  if (analysis.total > memoryConfig.maxSessions * 0.8) {
    reasons.push('Approaching session limit');
    if (priority === 'low') priority = 'medium';
  }

  return {
    needed: reasons.length > 0,
    reasons,
    priority,
  };
}

/**
 * Format cleanup statistics for logging
 */
export function formatCleanupStats(stats: ReturnType<typeof analyzeSessionsForCleanup>): string {
  return [
    `Total sessions: ${stats.total}`,
    `Active: ${stats.active}`,
    `Inactive: ${stats.inactive}`,
    `Over limit: ${stats.overLimit}`,
    `Cleanup needed: ${stats.recommendations.shouldCleanupInactive || stats.recommendations.shouldEnforceLimit}`,
  ].join(', ');
}