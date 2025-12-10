/**
 * SummaryMemory module exports
 */

// Types
export type {
  Message,
  SessionData,
  ConversationContext,
  MemoryConfig,
  SummaryGenerator,
  SummaryMemoryManager,
} from './types';

// Configuration
export {
  loadMemoryConfig,
  validateConfig,
  memoryConfig,
} from './config';

// Utilities
export {
  generateSessionId,
  createEmptySession,
  isSessionInactive,
  updateSessionActivity,
  createMessage,
  formatMessagesForContext,
  validateSessionData,
} from './utils';

// Summary Generator
export {
  SummaryGenerator,
  summaryGenerator,
} from './summary-generator';

// Session Storage
export {
  SessionStorage,
  sessionStorage,
} from './session-storage';

// Memory Manager
export {
  SummaryMemoryManager,
  memoryManager,
} from './memory-manager';

// Summarization Utilities
export {
  needsSummarization,
  getMessagesToSummarize,
  getRecentMessages,
  calculateSummarizationStats,
  validateSummarizationConfig,
  estimateSessionMemoryUsage,
  getSummarizationRecommendations,
  formatSummarizationReport,
} from './summarization-utils';

// Cleanup Scheduler
export {
  CleanupScheduler,
  cleanupScheduler,
  initializeCleanup,
} from './cleanup-scheduler';

// Cleanup Utilities
export {
  analyzeSessionsForCleanup,
  getSessionsByActivity,
  getSessionsToRemoveForLimit,
  calculateCleanupSavings,
  generateCleanupReport,
  isCleanupNeeded,
  formatCleanupStats,
} from './cleanup-utils';

// Session Operations
export {
  clearSessionWithConfirmation,
  initializeNewSession,
  resetSession,
  validateSessionState,
  getSessionOperationLog,
} from './session-operations';
export type {
  SessionClearResult,
  SessionInitResult,
} from './session-operations';

// Session ID Manager
export {
  validateSessionId,
  generateUniqueSessionId,
  isSessionActive,
  normalizeSessionId,
  generateClientSessionId,
  parseSessionId,
  getSessionAge,
  isSessionIdExpired,
  generateSessionIdWithPrefix,
  validateSessionIds,
  getSessionIdStats,
} from './session-id-manager';
export type {
  SessionIdValidation,
} from './session-id-manager';

// Error Handler
export {
  memoryErrorLogger,
  handleStorageError,
  handleSummarizationError,
  handleSessionError,
  handleValidationError,
  handleApiError,
  isMemorySystemHealthy,
  getHealthReport,
  withGracefulDegradation,
} from './error-handler';
export type {
  MemoryError,
  ErrorStats,
} from './error-handler';

// Corruption Recovery
export {
  validateSessionIntegrity,
  repairSessionData,
  detectAndRecoverCorruption,
  performSystemCorruptionCheck,
  generateCorruptionReportSummary,
  CorruptionChecker,
  corruptionChecker,
} from './corruption-recovery';
export type {
  CorruptionReport,
} from './corruption-recovery';

// Configuration Validator
export {
  validateMemoryConfig,
  performConfigHealthCheck,
  getConfigRecommendations,
  generateConfigReport,
  validateEnvironmentVariables,
  autoTuneConfiguration,
} from './config-validator';
export type {
  ConfigValidationResult,
  ConfigHealthCheck,
} from './config-validator';

// System Initialization
export {
  initializeMemorySystem,
  getSystemStatus,
  shutdownMemorySystem,
  restartMemorySystem,
} from './initialize';
export type {
  InitializationResult,
} from './initialize';