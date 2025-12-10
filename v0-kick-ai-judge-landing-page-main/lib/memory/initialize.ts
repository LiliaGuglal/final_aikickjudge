import { memoryConfig } from './config';
import { cleanupScheduler } from './cleanup-scheduler';
import { corruptionChecker } from './corruption-recovery';
import { performConfigHealthCheck, generateConfigReport } from './config-validator';
import { memoryErrorLogger } from './error-handler';

/**
 * Initialize the SummaryMemory system
 */

let isInitialized = false;

export interface InitializationResult {
  success: boolean;
  message: string;
  warnings: string[];
  config: typeof memoryConfig;
}

/**
 * Initialize the memory system with all components
 */
export function initializeMemorySystem(): InitializationResult {
  if (isInitialized) {
    return {
      success: true,
      message: 'Memory system already initialized',
      warnings: [],
      config: memoryConfig,
    };
  }

  const warnings: string[] = [];

  try {
    console.log('Initializing SummaryMemory system...');

    // Validate configuration
    const healthCheck = performConfigHealthCheck();
    
    if (healthCheck.overall === 'critical') {
      const criticalIssues = healthCheck.issues
        .filter(issue => issue.level === 'error')
        .map(issue => issue.message);
      
      return {
        success: false,
        message: `Critical configuration errors: ${criticalIssues.join(', ')}`,
        warnings,
        config: memoryConfig,
      };
    }

    // Collect warnings
    healthCheck.issues
      .filter(issue => issue.level === 'warning')
      .forEach(issue => warnings.push(issue.message));

    // Log configuration report
    const configReport = generateConfigReport();
    console.log(configReport);

    // Initialize cleanup scheduler (only in server environment)
    if (typeof window === 'undefined') {
      try {
        cleanupScheduler.start(60); // Run every hour
        console.log('Memory cleanup scheduler started');
      } catch (error) {
        console.warn('Failed to start cleanup scheduler:', error);
        warnings.push('Cleanup scheduler failed to start');
      }

      // Initialize corruption checker
      try {
        corruptionChecker.start(120); // Run every 2 hours
        console.log('Corruption checker started');
      } catch (error) {
        console.warn('Failed to start corruption checker:', error);
        warnings.push('Corruption checker failed to start');
      }

      // Set up graceful shutdown handlers
      const shutdownHandler = () => {
        console.log('Shutting down memory system...');
        cleanupScheduler.stop();
        corruptionChecker.stop();
        console.log('Memory system shutdown complete');
      };

      process.on('SIGINT', shutdownHandler);
      process.on('SIGTERM', shutdownHandler);
    }

    isInitialized = true;

    console.log('SummaryMemory system initialized successfully');
    
    return {
      success: true,
      message: 'Memory system initialized successfully',
      warnings,
      config: memoryConfig,
    };

  } catch (error) {
    console.error('Failed to initialize memory system:', error);
    
    return {
      success: false,
      message: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      warnings,
      config: memoryConfig,
    };
  }
}

/**
 * Get system status
 */
export function getSystemStatus(): {
  initialized: boolean;
  config: typeof memoryConfig;
  schedulers: {
    cleanup: { isRunning: boolean };
    corruption: { isRunning: boolean };
  };
  errors: {
    totalErrors: number;
    recentErrors: number;
  };
} {
  const errorStats = memoryErrorLogger.getStats();
  const recentErrors = errorStats.recentErrors.filter(
    error => error.timestamp > new Date(Date.now() - 10 * 60 * 1000)
  ).length;

  return {
    initialized: isInitialized,
    config: memoryConfig,
    schedulers: {
      cleanup: cleanupScheduler.getStatus(),
      corruption: corruptionChecker.getStatus(),
    },
    errors: {
      totalErrors: errorStats.totalErrors,
      recentErrors,
    },
  };
}

/**
 * Shutdown the memory system gracefully
 */
export function shutdownMemorySystem(): void {
  if (!isInitialized) {
    return;
  }

  console.log('Shutting down memory system...');
  
  try {
    cleanupScheduler.stop();
    corruptionChecker.stop();
    
    isInitialized = false;
    console.log('Memory system shutdown complete');
  } catch (error) {
    console.error('Error during memory system shutdown:', error);
  }
}

/**
 * Restart the memory system
 */
export function restartMemorySystem(): InitializationResult {
  shutdownMemorySystem();
  return initializeMemorySystem();
}

/**
 * Auto-initialize if in server environment
 */
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Auto-initialize in server environment, but not during tests
  setTimeout(() => {
    const result = initializeMemorySystem();
    if (!result.success) {
      console.error('Auto-initialization failed:', result.message);
    }
  }, 1000); // Delay to allow other modules to load
}