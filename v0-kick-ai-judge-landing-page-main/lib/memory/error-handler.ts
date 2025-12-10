/**
 * Error handling utilities for the memory system
 */

export interface MemoryError {
  type: 'storage' | 'summarization' | 'session' | 'validation' | 'api';
  message: string;
  sessionId?: string;
  originalError?: Error;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  recentErrors: MemoryError[];
  lastError?: MemoryError;
}

/**
 * Error logger for memory operations
 */
class MemoryErrorLogger {
  private errors: MemoryError[] = [];
  private maxErrors = 100; // Keep last 100 errors

  /**
   * Log a memory error
   */
  logError(error: Omit<MemoryError, 'timestamp'>): void {
    const memoryError: MemoryError = {
      ...error,
      timestamp: new Date(),
    };

    this.errors.push(memoryError);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console with appropriate level
    const logMessage = `MemoryError [${error.type}]: ${error.message}`;
    if (error.sessionId) {
      console.error(`${logMessage} (Session: ${error.sessionId})`);
    } else {
      console.error(logMessage);
    }

    if (error.originalError) {
      console.error('Original error:', error.originalError);
    }
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    const errorsByType: Record<string, number> = {};
    
    for (const error of this.errors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    }

    return {
      totalErrors: this.errors.length,
      errorsByType,
      recentErrors: this.errors.slice(-10), // Last 10 errors
      lastError: this.errors[this.errors.length - 1],
    };
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type: MemoryError['type']): MemoryError[] {
    return this.errors.filter(error => error.type === type);
  }

  /**
   * Get errors by session
   */
  getErrorsBySession(sessionId: string): MemoryError[] {
    return this.errors.filter(error => error.sessionId === sessionId);
  }
}

/**
 * Global error logger instance
 */
export const memoryErrorLogger = new MemoryErrorLogger();

/**
 * Handle storage errors with graceful degradation
 */
export function handleStorageError(error: Error, sessionId?: string, context?: Record<string, any>): void {
  memoryErrorLogger.logError({
    type: 'storage',
    message: `Storage operation failed: ${error.message}`,
    sessionId,
    originalError: error,
    context,
  });
}

/**
 * Handle summarization errors with graceful degradation
 */
export function handleSummarizationError(error: Error, sessionId?: string, context?: Record<string, any>): void {
  memoryErrorLogger.logError({
    type: 'summarization',
    message: `Summarization failed: ${error.message}`,
    sessionId,
    originalError: error,
    context,
  });
}

/**
 * Handle session errors
 */
export function handleSessionError(error: Error, sessionId?: string, context?: Record<string, any>): void {
  memoryErrorLogger.logError({
    type: 'session',
    message: `Session operation failed: ${error.message}`,
    sessionId,
    originalError: error,
    context,
  });
}

/**
 * Handle validation errors
 */
export function handleValidationError(message: string, sessionId?: string, context?: Record<string, any>): void {
  memoryErrorLogger.logError({
    type: 'validation',
    message: `Validation failed: ${message}`,
    sessionId,
    context,
  });
}

/**
 * Handle API errors
 */
export function handleApiError(error: Error, sessionId?: string, context?: Record<string, any>): void {
  memoryErrorLogger.logError({
    type: 'api',
    message: `API operation failed: ${error.message}`,
    sessionId,
    originalError: error,
    context,
  });
}

/**
 * Check if memory system is healthy
 */
export function isMemorySystemHealthy(): {
  healthy: boolean;
  issues: string[];
  errorRate: number;
} {
  const stats = memoryErrorLogger.getStats();
  const issues: string[] = [];
  
  // Check error rate (errors in last 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentErrors = stats.recentErrors.filter(error => error.timestamp > tenMinutesAgo);
  const errorRate = recentErrors.length / 10; // errors per minute

  if (errorRate > 1) {
    issues.push(`High error rate: ${errorRate.toFixed(2)} errors/minute`);
  }

  // Check for critical error types
  const criticalErrors = recentErrors.filter(error => 
    error.type === 'storage' || error.type === 'api'
  );
  
  if (criticalErrors.length > 3) {
    issues.push(`Multiple critical errors: ${criticalErrors.length} in last 10 minutes`);
  }

  return {
    healthy: issues.length === 0,
    issues,
    errorRate,
  };
}

/**
 * Get system health report
 */
export function getHealthReport(): string {
  const health = isMemorySystemHealthy();
  const stats = memoryErrorLogger.getStats();
  
  const lines = [
    '=== Memory System Health Report ===',
    `Status: ${health.healthy ? 'HEALTHY' : 'ISSUES DETECTED'}`,
    `Error Rate: ${health.errorRate.toFixed(2)} errors/minute`,
    `Total Errors: ${stats.totalErrors}`,
  ];

  if (health.issues.length > 0) {
    lines.push('Issues:');
    health.issues.forEach(issue => lines.push(`  - ${issue}`));
  }

  if (stats.errorsByType && Object.keys(stats.errorsByType).length > 0) {
    lines.push('Errors by Type:');
    Object.entries(stats.errorsByType).forEach(([type, count]) => {
      lines.push(`  - ${type}: ${count}`);
    });
  }

  return lines.join('\n');
}

/**
 * Graceful degradation wrapper for memory operations
 */
export async function withGracefulDegradation<T>(
  operation: () => Promise<T>,
  fallback: T,
  errorType: MemoryError['type'],
  sessionId?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    memoryErrorLogger.logError({
      type: errorType,
      message: `Operation failed, using fallback: ${errorMessage}`,
      sessionId,
      originalError: error instanceof Error ? error : undefined,
    });

    return fallback;
  }
}