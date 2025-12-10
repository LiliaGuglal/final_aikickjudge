import { SessionData, Message } from './types';
import { validateSessionData, createEmptySession } from './utils';
import { sessionStorage } from './session-storage';
import { handleSessionError } from './error-handler';

/**
 * Corruption recovery utilities for the memory system
 */

export interface CorruptionReport {
  sessionId: string;
  isCorrupted: boolean;
  issues: string[];
  recovered: boolean;
  recoveryActions: string[];
}

/**
 * Validate session data integrity
 */
export function validateSessionIntegrity(session: SessionData): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Basic structure validation
  if (!validateSessionData(session)) {
    issues.push('Invalid session data structure');
    return { isValid: false, issues };
  }

  // Validate session ID
  if (!session.sessionId || typeof session.sessionId !== 'string') {
    issues.push('Invalid or missing session ID');
  }

  // Validate messages array
  if (!Array.isArray(session.messages)) {
    issues.push('Messages is not an array');
  } else {
    session.messages.forEach((msg, index) => {
      if (!validateMessage(msg)) {
        issues.push(`Invalid message at index ${index}`);
      }
    });
  }

  // Validate summaries array
  if (!Array.isArray(session.summaries)) {
    issues.push('Summaries is not an array');
  } else {
    session.summaries.forEach((summary, index) => {
      if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
        issues.push(`Invalid summary at index ${index}`);
      }
    });
  }

  // Validate message count consistency
  if (session.messageCount !== session.messages.length) {
    issues.push(`Message count mismatch: count=${session.messageCount}, actual=${session.messages.length}`);
  }

  // Validate timestamp
  if (!(session.lastActivity instanceof Date) || isNaN(session.lastActivity.getTime())) {
    issues.push('Invalid last activity timestamp');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validate individual message integrity
 */
function validateMessage(message: any): message is Message {
  return (
    message &&
    typeof message.id === 'string' &&
    message.id.length > 0 &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.timestamp instanceof Date &&
    !isNaN(message.timestamp.getTime())
  );
}

/**
 * Attempt to repair corrupted session data
 */
export function repairSessionData(session: SessionData): {
  repaired: SessionData;
  actions: string[];
} {
  const actions: string[] = [];
  const repaired = { ...session };

  // Fix session ID if missing
  if (!repaired.sessionId) {
    repaired.sessionId = `recovered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    actions.push('Generated new session ID');
  }

  // Fix messages array
  if (!Array.isArray(repaired.messages)) {
    repaired.messages = [];
    actions.push('Reset messages array');
  } else {
    // Filter out invalid messages
    const validMessages = repaired.messages.filter(msg => validateMessage(msg));
    if (validMessages.length !== repaired.messages.length) {
      repaired.messages = validMessages;
      actions.push(`Removed ${repaired.messages.length - validMessages.length} invalid messages`);
    }
  }

  // Fix summaries array
  if (!Array.isArray(repaired.summaries)) {
    repaired.summaries = [];
    actions.push('Reset summaries array');
  } else {
    // Filter out invalid summaries
    const validSummaries = repaired.summaries.filter(
      summary => summary && typeof summary === 'string' && summary.trim().length > 0
    );
    if (validSummaries.length !== repaired.summaries.length) {
      repaired.summaries = validSummaries;
      actions.push(`Removed ${repaired.summaries.length - validSummaries.length} invalid summaries`);
    }
  }

  // Fix message count
  if (repaired.messageCount !== repaired.messages.length) {
    repaired.messageCount = repaired.messages.length;
    actions.push('Corrected message count');
  }

  // Fix timestamp
  if (!(repaired.lastActivity instanceof Date) || isNaN(repaired.lastActivity.getTime())) {
    repaired.lastActivity = new Date();
    actions.push('Reset last activity timestamp');
  }

  return { repaired, actions };
}

/**
 * Detect and recover from session corruption
 */
export async function detectAndRecoverCorruption(sessionId: string): Promise<CorruptionReport> {
  const report: CorruptionReport = {
    sessionId,
    isCorrupted: false,
    issues: [],
    recovered: false,
    recoveryActions: [],
  };

  try {
    // Check if session exists
    if (!sessionStorage.hasSession(sessionId)) {
      report.issues.push('Session does not exist');
      
      // Create new empty session
      const emptySession = createEmptySession(sessionId);
      sessionStorage.updateSession(sessionId, emptySession);
      
      report.recovered = true;
      report.recoveryActions.push('Created new empty session');
      return report;
    }

    // Get session data
    const session = sessionStorage.getSession(sessionId);
    
    // Validate integrity
    const validation = validateSessionIntegrity(session);
    
    if (!validation.isValid) {
      report.isCorrupted = true;
      report.issues = validation.issues;
      
      // Attempt repair
      const repair = repairSessionData(session);
      
      // Validate repaired data
      const repairedValidation = validateSessionIntegrity(repair.repaired);
      
      if (repairedValidation.isValid) {
        // Update session with repaired data
        sessionStorage.updateSession(sessionId, repair.repaired);
        
        report.recovered = true;
        report.recoveryActions = repair.actions;
      } else {
        // If repair failed, create fresh session
        const emptySession = createEmptySession(sessionId);
        sessionStorage.updateSession(sessionId, emptySession);
        
        report.recovered = true;
        report.recoveryActions = ['Complete session reset - repair failed'];
      }
    }

    return report;

  } catch (error) {
    handleSessionError(error instanceof Error ? error : new Error('Unknown error'), sessionId, {
      operation: 'detectAndRecoverCorruption',
    });

    // If all else fails, create empty session
    try {
      const emptySession = createEmptySession(sessionId);
      sessionStorage.updateSession(sessionId, emptySession);
      
      report.recovered = true;
      report.recoveryActions = ['Emergency session reset due to recovery error'];
    } catch (resetError) {
      report.recovered = false;
      report.recoveryActions = ['Failed to recover session'];
    }

    return report;
  }
}

/**
 * Perform system-wide corruption check
 */
export async function performSystemCorruptionCheck(): Promise<{
  totalSessions: number;
  corruptedSessions: number;
  recoveredSessions: number;
  reports: CorruptionReport[];
}> {
  const allSessionIds = sessionStorage.getAllSessionIds();
  const reports: CorruptionReport[] = [];
  let corruptedSessions = 0;
  let recoveredSessions = 0;

  for (const sessionId of allSessionIds) {
    try {
      const report = await detectAndRecoverCorruption(sessionId);
      reports.push(report);
      
      if (report.isCorrupted) {
        corruptedSessions++;
      }
      
      if (report.recovered) {
        recoveredSessions++;
      }
    } catch (error) {
      console.error(`Failed to check session ${sessionId}:`, error);
      
      reports.push({
        sessionId,
        isCorrupted: true,
        issues: ['Failed to perform corruption check'],
        recovered: false,
        recoveryActions: [],
      });
      
      corruptedSessions++;
    }
  }

  return {
    totalSessions: allSessionIds.length,
    corruptedSessions,
    recoveredSessions,
    reports,
  };
}

/**
 * Generate corruption report summary
 */
export function generateCorruptionReportSummary(
  reports: CorruptionReport[]
): string {
  const totalSessions = reports.length;
  const corruptedSessions = reports.filter(r => r.isCorrupted).length;
  const recoveredSessions = reports.filter(r => r.recovered).length;
  const failedRecoveries = reports.filter(r => r.isCorrupted && !r.recovered).length;

  const lines = [
    '=== Session Corruption Report ===',
    `Total Sessions: ${totalSessions}`,
    `Corrupted Sessions: ${corruptedSessions}`,
    `Successfully Recovered: ${recoveredSessions}`,
    `Failed Recoveries: ${failedRecoveries}`,
  ];

  if (failedRecoveries > 0) {
    lines.push('');
    lines.push('Failed Recovery Sessions:');
    reports
      .filter(r => r.isCorrupted && !r.recovered)
      .forEach(report => {
        lines.push(`  - ${report.sessionId}: ${report.issues.join(', ')}`);
      });
  }

  return lines.join('\n');
}

/**
 * Schedule periodic corruption checks
 */
export class CorruptionChecker {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(intervalMinutes: number = 60): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    this.intervalId = setInterval(async () => {
      try {
        const result = await performSystemCorruptionCheck();
        
        if (result.corruptedSessions > 0) {
          console.log(`CorruptionChecker: Found and recovered ${result.recoveredSessions}/${result.corruptedSessions} corrupted sessions`);
        }
      } catch (error) {
        console.error('CorruptionChecker: Failed to perform system check:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`CorruptionChecker: Started with ${intervalMinutes} minute intervals`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  getStatus(): { isRunning: boolean } {
    return { isRunning: this.isRunning };
  }
}

/**
 * Global corruption checker instance
 */
export const corruptionChecker = new CorruptionChecker();