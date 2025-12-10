import { memoryManager } from './memory-manager';
import { memoryConfig } from './config';

/**
 * Cleanup scheduler for automatic session maintenance
 */
export class CleanupScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private cleanupIntervalMs: number;

  constructor(cleanupIntervalMinutes: number = 60) {
    this.cleanupIntervalMs = cleanupIntervalMinutes * 60 * 1000;
  }

  /**
   * Start automatic cleanup scheduling
   */
  start(): void {
    if (this.isRunning) {
      console.warn('CleanupScheduler: Already running');
      return;
    }

    this.isRunning = true;
    
    // Run initial cleanup
    this.runCleanup();
    
    // Schedule periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.cleanupIntervalMs);

    console.log(`CleanupScheduler: Started with ${this.cleanupIntervalMs / 60000} minute intervals`);
  }

  /**
   * Stop automatic cleanup scheduling
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('CleanupScheduler: Stopped');
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<void> {
    try {
      console.log('CleanupScheduler: Running scheduled cleanup...');
      
      const startTime = Date.now();
      const statsBefore = memoryManager.getMemoryStats();
      
      // Run cleanup
      await memoryManager.cleanupInactiveSessions();
      
      const statsAfter = memoryManager.getMemoryStats();
      const duration = Date.now() - startTime;
      
      const sessionsRemoved = statsBefore.totalSessions - statsAfter.totalSessions;
      
      if (sessionsRemoved > 0) {
        console.log(`CleanupScheduler: Cleanup completed in ${duration}ms - removed ${sessionsRemoved} sessions`);
      }
      
    } catch (error) {
      console.error('CleanupScheduler: Cleanup failed:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    intervalMs: number;
    nextCleanupIn?: number;
  } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.cleanupIntervalMs,
    };
  }

  /**
   * Update cleanup interval
   */
  setInterval(minutes: number): void {
    this.cleanupIntervalMs = minutes * 60 * 1000;
    
    if (this.isRunning) {
      // Restart with new interval
      this.stop();
      this.start();
    }
  }
}

/**
 * Global cleanup scheduler instance
 */
export const cleanupScheduler = new CleanupScheduler();

/**
 * Initialize cleanup scheduler if in server environment
 */
export function initializeCleanup(): void {
  // Only start cleanup in server environment
  if (typeof window === 'undefined') {
    cleanupScheduler.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down cleanup scheduler...');
      cleanupScheduler.stop();
    });
    
    process.on('SIGTERM', () => {
      console.log('Shutting down cleanup scheduler...');
      cleanupScheduler.stop();
    });
  }
}