import { MemoryConfig } from './types';

/**
 * Default configuration values for the memory system
 */
const DEFAULT_CONFIG: MemoryConfig = {
  memoryThreshold: 10,
  recentMessagesLimit: 6,
  sessionTimeoutHours: 24,
  maxSessions: 1000,
};

/**
 * Load and validate memory configuration from environment variables
 * Falls back to safe defaults for invalid values
 */
export function loadMemoryConfig(): MemoryConfig {
  const config: MemoryConfig = { ...DEFAULT_CONFIG };

  try {
    // Load memory threshold
    const memoryThreshold = process.env.MEMORY_THRESHOLD;
    if (memoryThreshold) {
      const parsed = parseInt(memoryThreshold, 10);
      if (parsed > 0 && parsed <= 100) {
        config.memoryThreshold = parsed;
      } else {
        console.warn(`Invalid MEMORY_THRESHOLD: ${memoryThreshold}, using default: ${DEFAULT_CONFIG.memoryThreshold}`);
      }
    }

    // Load recent messages limit
    const recentMessagesLimit = process.env.RECENT_MESSAGES_LIMIT;
    if (recentMessagesLimit) {
      const parsed = parseInt(recentMessagesLimit, 10);
      if (parsed > 0 && parsed <= 20) {
        config.recentMessagesLimit = parsed;
      } else {
        console.warn(`Invalid RECENT_MESSAGES_LIMIT: ${recentMessagesLimit}, using default: ${DEFAULT_CONFIG.recentMessagesLimit}`);
      }
    }

    // Load session timeout
    const sessionTimeoutHours = process.env.SESSION_TIMEOUT_HOURS;
    if (sessionTimeoutHours) {
      const parsed = parseInt(sessionTimeoutHours, 10);
      if (parsed > 0 && parsed <= 168) { // Max 1 week
        config.sessionTimeoutHours = parsed;
      } else {
        console.warn(`Invalid SESSION_TIMEOUT_HOURS: ${sessionTimeoutHours}, using default: ${DEFAULT_CONFIG.sessionTimeoutHours}`);
      }
    }

    // Load max sessions
    const maxSessions = process.env.MAX_SESSIONS;
    if (maxSessions) {
      const parsed = parseInt(maxSessions, 10);
      if (parsed > 0 && parsed <= 10000) {
        config.maxSessions = parsed;
      } else {
        console.warn(`Invalid MAX_SESSIONS: ${maxSessions}, using default: ${DEFAULT_CONFIG.maxSessions}`);
      }
    }

    // Load Gemini API key
    config.geminiApiKey = process.env.GEMINI_API_KEY;

  } catch (error) {
    console.error('Error loading memory configuration:', error);
    console.log('Using default configuration values');
  }

  return config;
}

/**
 * Validate configuration values
 */
export function validateConfig(config: MemoryConfig): boolean {
  return (
    config.memoryThreshold > 0 &&
    config.recentMessagesLimit > 0 &&
    config.sessionTimeoutHours > 0 &&
    config.maxSessions > 0 &&
    config.recentMessagesLimit < config.memoryThreshold
  );
}

/**
 * Get the current memory configuration
 */
export const memoryConfig = loadMemoryConfig();