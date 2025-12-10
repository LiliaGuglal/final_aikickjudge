// Vector Search Monitoring and Logging
// Comprehensive logging and performance monitoring

import { LogEntry, PerformanceMetrics } from './types';

export class VectorSearchMonitor {
  private metrics: PerformanceMetrics = {
    searchLatency: 0,
    embeddingLatency: 0,
    cacheHitRate: 0,
    errorRate: 0,
    throughput: 0
  };

  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 log entries
  private searchCount = 0;
  private errorCount = 0;
  private cacheHits = 0;
  private cacheRequests = 0;

  /**
   * Log a search operation
   */
  logSearch(sessionId: string, query: string, results: number, latency: number): void {
    this.addLog({
      timestamp: new Date(),
      level: 'info',
      operation: 'search',
      sessionId,
      query: this.sanitizeQuery(query),
      results,
      latency
    });

    this.updateSearchMetrics(latency);
    console.log(`🔍 Vector search: "${query.substring(0, 50)}..." → ${results} results (${latency}ms)`);
  }

  /**
   * Log an embedding operation
   */
  logEmbedding(text: string, latency: number, language?: string): void {
    this.addLog({
      timestamp: new Date(),
      level: 'info',
      operation: 'embedding',
      query: `${language || 'auto'}: ${this.sanitizeQuery(text)}`,
      latency
    });

    this.updateEmbeddingMetrics(latency);
  }

  /**
   * Log an error
   */
  logError(operation: string, error: string, sessionId?: string, query?: string): void {
    this.addLog({
      timestamp: new Date(),
      level: 'error',
      operation,
      sessionId,
      query: query ? this.sanitizeQuery(query) : undefined,
      error
    });

    this.errorCount++;
    this.updateErrorRate();
    console.error(`❌ Vector search error in ${operation}: ${error}`);
  }

  /**
   * Log a warning
   */
  logWarning(operation: string, message: string, sessionId?: string): void {
    this.addLog({
      timestamp: new Date(),
      level: 'warn',
      operation,
      sessionId,
      error: message
    });

    console.warn(`⚠️ Vector search warning in ${operation}: ${message}`);
  }

  /**
   * Log cache hit/miss
   */
  logCacheAccess(hit: boolean, key: string): void {
    this.cacheRequests++;
    if (hit) {
      this.cacheHits++;
    }

    this.updateCacheHitRate();
    
    this.addLog({
      timestamp: new Date(),
      level: 'debug',
      operation: 'cache',
      query: `${hit ? 'HIT' : 'MISS'}: ${key.substring(0, 50)}`
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent logs
   */
  getLogs(limit: number = 100, level?: 'info' | 'warn' | 'error' | 'debug'): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    return filteredLogs
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'error';
    metrics: PerformanceMetrics;
    issues: string[];
  } {
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'error' = 'healthy';

    // Check error rate
    if (this.metrics.errorRate > 0.1) { // More than 10% errors
      issues.push(`High error rate: ${(this.metrics.errorRate * 100).toFixed(1)}%`);
      status = 'error';
    } else if (this.metrics.errorRate > 0.05) { // More than 5% errors
      issues.push(`Elevated error rate: ${(this.metrics.errorRate * 100).toFixed(1)}%`);
      status = 'degraded';
    }

    // Check search latency
    if (this.metrics.searchLatency > 500) { // More than 500ms
      issues.push(`High search latency: ${this.metrics.searchLatency}ms`);
      status = status === 'error' ? 'error' : 'degraded';
    }

    // Check embedding latency
    if (this.metrics.embeddingLatency > 1000) { // More than 1s
      issues.push(`High embedding latency: ${this.metrics.embeddingLatency}ms`);
      status = status === 'error' ? 'error' : 'degraded';
    }

    // Check cache hit rate
    if (this.metrics.cacheHitRate < 0.3 && this.cacheRequests > 10) { // Less than 30% hit rate
      issues.push(`Low cache hit rate: ${(this.metrics.cacheHitRate * 100).toFixed(1)}%`);
      if (status === 'healthy') status = 'degraded';
    }

    return {
      status,
      metrics: this.metrics,
      issues
    };
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.metrics = {
      searchLatency: 0,
      embeddingLatency: 0,
      cacheHitRate: 0,
      errorRate: 0,
      throughput: 0
    };
    this.searchCount = 0;
    this.errorCount = 0;
    this.cacheHits = 0;
    this.cacheRequests = 0;
  }

  /**
   * Clear old logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private updateSearchMetrics(latency: number): void {
    this.searchCount++;
    
    // Update average search latency
    this.metrics.searchLatency = this.calculateMovingAverage(
      this.metrics.searchLatency,
      latency,
      Math.min(this.searchCount, 100) // Use last 100 searches for average
    );

    // Update throughput (searches per minute)
    this.updateThroughput();
  }

  private updateEmbeddingMetrics(latency: number): void {
    // Update average embedding latency
    this.metrics.embeddingLatency = this.calculateMovingAverage(
      this.metrics.embeddingLatency,
      latency,
      50 // Use last 50 embeddings for average
    );
  }

  private updateErrorRate(): void {
    const totalOperations = this.searchCount + this.errorCount;
    this.metrics.errorRate = totalOperations > 0 ? this.errorCount / totalOperations : 0;
  }

  private updateCacheHitRate(): void {
    this.metrics.cacheHitRate = this.cacheRequests > 0 ? this.cacheHits / this.cacheRequests : 0;
  }

  private updateThroughput(): void {
    // Simple throughput calculation - could be improved with time windows
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentSearches = this.logs.filter(
      log => log.operation === 'search' && 
             log.timestamp.getTime() > oneMinuteAgo
    ).length;
    
    this.metrics.throughput = recentSearches;
  }

  private calculateMovingAverage(currentAvg: number, newValue: number, windowSize: number): number {
    if (currentAvg === 0) {
      return newValue;
    }
    
    const alpha = 1 / windowSize;
    return currentAvg * (1 - alpha) + newValue * alpha;
  }

  private sanitizeQuery(query: string): string {
    // Remove potentially sensitive information and limit length
    return query
      .replace(/\b\d{4,}\b/g, '[NUMBER]') // Replace long numbers
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Replace emails
      .substring(0, 100); // Limit length
  }
}

// Singleton instance
let monitorInstance: VectorSearchMonitor | null = null;

export function getVectorSearchMonitor(): VectorSearchMonitor {
  if (!monitorInstance) {
    monitorInstance = new VectorSearchMonitor();
  }
  return monitorInstance;
}

// Performance measurement decorator
export function measurePerformance<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const monitor = getVectorSearchMonitor();
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const latency = Date.now() - startTime;
      
      if (operation === 'search') {
        monitor.logSearch('', args[0] || '', result?.results?.length || 0, latency);
      } else if (operation === 'embedding') {
        monitor.logEmbedding(args[0] || '', latency);
      }
      
      return result;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      monitor.logError(operation, error.message);
      throw error;
    }
  }) as T;
}