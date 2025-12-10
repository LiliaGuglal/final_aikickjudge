// Comprehensive Error Handling for Vector Search
// Circuit breaker, retry logic, and graceful degradation

import { VectorSearchError, EmbeddingError, DatabaseError } from './types';
import { getVectorSearchMonitor } from './monitoring';

export class VectorSearchErrorHandler {
  private monitor = getVectorSearchMonitor();
  private circuitBreaker = new CircuitBreaker();
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  };

  /**
   * Handle errors with retry logic and circuit breaker
   */
  async handleWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    sessionId?: string
  ): Promise<T | null> {
    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      this.monitor.logWarning(
        operationName,
        'Circuit breaker is open, skipping operation',
        sessionId
      );
      return null;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Success - reset circuit breaker
        this.circuitBreaker.recordSuccess();
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Record failure in circuit breaker
        this.circuitBreaker.recordFailure();
        
        // Log error
        this.monitor.logError(operationName, error.message, sessionId);

        // Don't retry on certain error types
        if (this.isNonRetryableError(error)) {
          break;
        }

        // Don't retry on last attempt
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attempt);
        this.monitor.logWarning(
          operationName,
          `Retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`,
          sessionId
        );
        
        await this.sleep(delay);
      }
    }

    // All retries failed
    this.monitor.logError(
      operationName,
      `All retries failed: ${lastError?.message}`,
      sessionId
    );
    
    return null; // Graceful degradation
  }

  /**
   * Wrap async operations with error handling
   */
  async safeExecute<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackValue: T,
    sessionId?: string
  ): Promise<T> {
    try {
      const result = await this.handleWithRetry(operation, operationName, sessionId);
      return result !== null ? result : fallbackValue;
    } catch (error: any) {
      this.monitor.logError(operationName, error.message, sessionId);
      return fallbackValue;
    }
  }

  /**
   * Check if the system is healthy
   */
  isSystemHealthy(): boolean {
    return !this.circuitBreaker.isOpen();
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    return {
      circuitBreakerState: this.circuitBreaker.getState(),
      ...this.monitor.getHealthStatus()
    };
  }

  /**
   * Reset error handling state
   */
  reset(): void {
    this.circuitBreaker.reset();
  }

  private isNonRetryableError(error: Error): boolean {
    // Don't retry validation errors or authentication errors
    if (error instanceof VectorSearchError) {
      return error.code === 'VALIDATION_ERROR' || 
             error.code === 'AUTHENTICATION_ERROR';
    }
    
    // Don't retry if API key is missing
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      return true;
    }

    return false;
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    );
    
    // Add jitter (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    return Math.round(exponentialDelay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
/**
 * Circuit Breaker Pattern Implementation
 */
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  
  private readonly failureThreshold = 5; // Open after 5 failures
  private readonly recoveryTimeout = 30000; // 30 seconds
  private readonly successThreshold = 3; // Close after 3 successes in half-open

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.warn(`🔴 Circuit breaker opened after ${this.failureCount} failures`);
    } else if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.successCount = 0;
      console.warn('🔴 Circuit breaker reopened due to failure in half-open state');
    }
  }

  recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        console.log('🟢 Circuit breaker closed after successful recovery');
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      // Check if we should transition to half-open
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        console.log('🟡 Circuit breaker transitioned to half-open');
        return false;
      }
      return true;
    }
    
    return false;
  }

  getState(): { state: string; failureCount: number; successCount: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Global error handler instance
 */
let errorHandlerInstance: VectorSearchErrorHandler | null = null;

export function getVectorSearchErrorHandler(): VectorSearchErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new VectorSearchErrorHandler();
  }
  return errorHandlerInstance;
}

/**
 * Decorator for automatic error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  operationName: string,
  fallbackValue?: any
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const errorHandler = getVectorSearchErrorHandler();
      
      return errorHandler.safeExecute(
        () => originalMethod.apply(this, args),
        operationName,
        fallbackValue,
        args[1] // Assume sessionId is second parameter
      );
    };
    
    return descriptor;
  };
}

/**
 * Utility function for safe async operations
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue: T,
  sessionId?: string
): Promise<T> {
  const errorHandler = getVectorSearchErrorHandler();
  return errorHandler.safeExecute(operation, operationName, fallbackValue, sessionId);
}