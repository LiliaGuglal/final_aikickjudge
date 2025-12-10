import { MemoryConfig } from './types';
import { memoryConfig } from './config';

/**
 * Advanced configuration validation utilities
 */

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface ConfigHealthCheck {
  overall: 'healthy' | 'warning' | 'critical';
  issues: Array<{
    level: 'error' | 'warning' | 'info';
    message: string;
    field?: string;
  }>;
}

/**
 * Comprehensive configuration validation
 */
export function validateMemoryConfig(config: MemoryConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Memory threshold validation
  if (config.memoryThreshold <= 0) {
    errors.push('Memory threshold must be greater than 0');
  } else if (config.memoryThreshold < 5) {
    warnings.push('Memory threshold is very low, may cause frequent summarization');
  } else if (config.memoryThreshold > 50) {
    warnings.push('Memory threshold is very high, may use excessive memory');
  }

  // Recent messages limit validation
  if (config.recentMessagesLimit <= 0) {
    errors.push('Recent messages limit must be greater than 0');
  } else if (config.recentMessagesLimit >= config.memoryThreshold) {
    errors.push('Recent messages limit must be less than memory threshold');
  } else if (config.recentMessagesLimit < 3) {
    warnings.push('Recent messages limit is very low, may lose conversation context');
  }

  // Session timeout validation
  if (config.sessionTimeoutHours <= 0) {
    errors.push('Session timeout must be greater than 0');
  } else if (config.sessionTimeoutHours < 1) {
    warnings.push('Session timeout is very short, sessions may expire too quickly');
  } else if (config.sessionTimeoutHours > 168) { // 1 week
    warnings.push('Session timeout is very long, may accumulate too many sessions');
  }

  // Max sessions validation
  if (config.maxSessions <= 0) {
    errors.push('Max sessions must be greater than 0');
  } else if (config.maxSessions < 10) {
    warnings.push('Max sessions is very low, may cause frequent cleanup');
  } else if (config.maxSessions > 10000) {
    warnings.push('Max sessions is very high, may use excessive memory');
  }

  // API key validation
  if (!config.geminiApiKey) {
    warnings.push('Gemini API key not configured, summarization will be disabled');
    recommendations.push('Set GEMINI_API_KEY environment variable to enable summarization');
  } else if (config.geminiApiKey.length < 20) {
    warnings.push('Gemini API key appears to be too short');
  }

  // Ratio validations
  const ratio = config.recentMessagesLimit / config.memoryThreshold;
  if (ratio > 0.8) {
    warnings.push('Recent messages limit is too close to memory threshold');
    recommendations.push('Consider increasing memory threshold or decreasing recent messages limit');
  } else if (ratio < 0.3) {
    recommendations.push('Recent messages limit is quite low relative to threshold, consider increasing for better context');
  }

  // Performance recommendations
  if (config.memoryThreshold * config.maxSessions > 100000) {
    recommendations.push('High memory usage expected with current settings, monitor system resources');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations,
  };
}

/**
 * Perform configuration health check
 */
export function performConfigHealthCheck(): ConfigHealthCheck {
  const validation = validateMemoryConfig(memoryConfig);
  const issues: ConfigHealthCheck['issues'] = [];

  // Add errors as critical issues
  validation.errors.forEach(error => {
    issues.push({
      level: 'error',
      message: error,
    });
  });

  // Add warnings
  validation.warnings.forEach(warning => {
    issues.push({
      level: 'warning',
      message: warning,
    });
  });

  // Add recommendations as info
  validation.recommendations.forEach(recommendation => {
    issues.push({
      level: 'info',
      message: recommendation,
    });
  });

  // Determine overall health
  let overall: ConfigHealthCheck['overall'] = 'healthy';
  if (validation.errors.length > 0) {
    overall = 'critical';
  } else if (validation.warnings.length > 0) {
    overall = 'warning';
  }

  return {
    overall,
    issues,
  };
}

/**
 * Get configuration recommendations based on usage patterns
 */
export function getConfigRecommendations(stats: {
  averageSessionLength: number;
  averageMessagesPerSession: number;
  summarizationSuccessRate: number;
}): string[] {
  const recommendations: string[] = [];

  // Adjust memory threshold based on session length
  if (stats.averageMessagesPerSession > memoryConfig.memoryThreshold * 2) {
    recommendations.push('Consider increasing memory threshold - sessions are typically longer than threshold');
  } else if (stats.averageMessagesPerSession < memoryConfig.memoryThreshold * 0.5) {
    recommendations.push('Consider decreasing memory threshold - sessions are typically shorter than threshold');
  }

  // Adjust recent messages based on patterns
  if (stats.averageSessionLength > 0) {
    const optimalRecentMessages = Math.min(
      Math.max(3, Math.ceil(stats.averageMessagesPerSession * 0.3)),
      memoryConfig.memoryThreshold - 1
    );
    
    if (Math.abs(optimalRecentMessages - memoryConfig.recentMessagesLimit) > 2) {
      recommendations.push(`Consider setting recent messages limit to ${optimalRecentMessages} based on usage patterns`);
    }
  }

  // Summarization recommendations
  if (stats.summarizationSuccessRate < 0.8) {
    recommendations.push('Low summarization success rate - check API key and network connectivity');
  }

  return recommendations;
}

/**
 * Generate configuration report
 */
export function generateConfigReport(): string {
  const validation = validateMemoryConfig(memoryConfig);
  const health = performConfigHealthCheck();
  
  const lines = [
    '=== Memory Configuration Report ===',
    `Overall Health: ${health.overall.toUpperCase()}`,
    '',
    'Current Configuration:',
    `  Memory Threshold: ${memoryConfig.memoryThreshold} messages`,
    `  Recent Messages Limit: ${memoryConfig.recentMessagesLimit} messages`,
    `  Session Timeout: ${memoryConfig.sessionTimeoutHours} hours`,
    `  Max Sessions: ${memoryConfig.maxSessions}`,
    `  API Key Configured: ${memoryConfig.geminiApiKey ? 'Yes' : 'No'}`,
    '',
  ];

  if (validation.errors.length > 0) {
    lines.push('ERRORS:');
    validation.errors.forEach(error => lines.push(`  ❌ ${error}`));
    lines.push('');
  }

  if (validation.warnings.length > 0) {
    lines.push('WARNINGS:');
    validation.warnings.forEach(warning => lines.push(`  ⚠️  ${warning}`));
    lines.push('');
  }

  if (validation.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS:');
    validation.recommendations.forEach(rec => lines.push(`  💡 ${rec}`));
  }

  return lines.join('\n');
}

/**
 * Validate environment variables and provide suggestions
 */
export function validateEnvironmentVariables(): {
  valid: string[];
  invalid: Array<{ name: string; value: string; issue: string }>;
  missing: string[];
  suggestions: string[];
} {
  const valid: string[] = [];
  const invalid: Array<{ name: string; value: string; issue: string }> = [];
  const missing: string[] = [];
  const suggestions: string[] = [];

  // Check each environment variable
  const envVars = [
    { name: 'MEMORY_THRESHOLD', current: process.env.MEMORY_THRESHOLD, type: 'number', min: 1, max: 100 },
    { name: 'RECENT_MESSAGES_LIMIT', current: process.env.RECENT_MESSAGES_LIMIT, type: 'number', min: 1, max: 20 },
    { name: 'SESSION_TIMEOUT_HOURS', current: process.env.SESSION_TIMEOUT_HOURS, type: 'number', min: 1, max: 168 },
    { name: 'MAX_SESSIONS', current: process.env.MAX_SESSIONS, type: 'number', min: 1, max: 10000 },
    { name: 'GEMINI_API_KEY', current: process.env.GEMINI_API_KEY, type: 'string', minLength: 20 },
  ];

  for (const envVar of envVars) {
    if (!envVar.current) {
      missing.push(envVar.name);
      continue;
    }

    if (envVar.type === 'number') {
      const parsed = parseInt(envVar.current, 10);
      if (isNaN(parsed)) {
        invalid.push({
          name: envVar.name,
          value: envVar.current,
          issue: 'Not a valid number',
        });
      } else if (envVar.min && parsed < envVar.min) {
        invalid.push({
          name: envVar.name,
          value: envVar.current,
          issue: `Below minimum value ${envVar.min}`,
        });
      } else if (envVar.max && parsed > envVar.max) {
        invalid.push({
          name: envVar.name,
          value: envVar.current,
          issue: `Above maximum value ${envVar.max}`,
        });
      } else {
        valid.push(envVar.name);
      }
    } else if (envVar.type === 'string') {
      if (envVar.minLength && envVar.current.length < envVar.minLength) {
        invalid.push({
          name: envVar.name,
          value: envVar.current.substring(0, 10) + '...',
          issue: `Too short (minimum ${envVar.minLength} characters)`,
        });
      } else {
        valid.push(envVar.name);
      }
    }
  }

  // Generate suggestions
  if (missing.includes('GEMINI_API_KEY')) {
    suggestions.push('Set GEMINI_API_KEY to enable conversation summarization');
  }
  
  if (missing.length > 0) {
    suggestions.push('Missing environment variables will use default values');
  }

  return { valid, invalid, missing, suggestions };
}

/**
 * Auto-tune configuration based on system resources
 */
export function autoTuneConfiguration(): {
  recommendations: Record<string, number>;
  reasoning: string[];
} {
  const recommendations: Record<string, number> = {};
  const reasoning: string[] = [];

  // Estimate available memory (rough heuristic)
  const estimatedMemoryMB = typeof process !== 'undefined' && process.memoryUsage 
    ? process.memoryUsage().heapTotal / 1024 / 1024 
    : 512; // Default assumption

  // Adjust max sessions based on available memory
  const recommendedMaxSessions = Math.min(
    Math.max(100, Math.floor(estimatedMemoryMB / 2)), // 2MB per session estimate
    5000
  );

  if (recommendedMaxSessions !== memoryConfig.maxSessions) {
    recommendations.MAX_SESSIONS = recommendedMaxSessions;
    reasoning.push(`Adjusted max sessions to ${recommendedMaxSessions} based on estimated memory`);
  }

  // Adjust memory threshold for better performance
  const recommendedThreshold = Math.max(8, Math.min(20, memoryConfig.memoryThreshold));
  if (recommendedThreshold !== memoryConfig.memoryThreshold) {
    recommendations.MEMORY_THRESHOLD = recommendedThreshold;
    reasoning.push(`Adjusted memory threshold to ${recommendedThreshold} for optimal performance`);
  }

  return { recommendations, reasoning };
}