import { sessionStorage } from './session-storage';
import { generateSessionId } from './utils';

/**
 * Advanced session ID management with validation and uniqueness guarantees
 */

export interface SessionIdValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId: string): SessionIdValidation {
  const errors: string[] = [];

  if (!sessionId) {
    errors.push('Session ID is required');
  } else {
    // Check format: session_timestamp_randomstring
    const sessionIdPattern = /^session_\d+_[a-z0-9]+$/;
    if (!sessionIdPattern.test(sessionId)) {
      errors.push('Session ID has invalid format');
    }

    // Check length (should be reasonable)
    if (sessionId.length < 20 || sessionId.length > 50) {
      errors.push('Session ID has invalid length');
    }

    // Check for potentially dangerous characters
    if (sessionId.includes('..') || sessionId.includes('/') || sessionId.includes('\\')) {
      errors.push('Session ID contains invalid characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a unique session ID with collision detection
 */
export function generateUniqueSessionId(maxAttempts: number = 10): string {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const sessionId = generateSessionId();
    
    // Check if this ID already exists
    if (!sessionStorage.hasSession(sessionId)) {
      return sessionId;
    }
    
    console.warn(`SessionIdManager: Generated duplicate session ID on attempt ${attempt + 1}: ${sessionId}`);
  }
  
  // If we still have collisions after max attempts, add extra randomness
  const timestamp = Date.now();
  const extraRandom = Math.random().toString(36).substr(2, 12);
  const fallbackId = `session_${timestamp}_${extraRandom}_fallback`;
  
  console.warn(`SessionIdManager: Using fallback session ID after ${maxAttempts} attempts: ${fallbackId}`);
  return fallbackId;
}

/**
 * Check if session ID exists and is active
 */
export function isSessionActive(sessionId: string): boolean {
  const validation = validateSessionId(sessionId);
  if (!validation.isValid) {
    return false;
  }

  return sessionStorage.hasSession(sessionId);
}

/**
 * Get session ID from various input formats
 */
export function normalizeSessionId(input: string | undefined | null): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  const validation = validateSessionId(trimmed);
  
  return validation.isValid ? trimmed : null;
}

/**
 * Generate session ID for client use (browser-safe)
 */
export function generateClientSessionId(): string {
  // For client-side use, we want a session ID that's safe for URLs and storage
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${random}`;
}

/**
 * Parse session ID components
 */
export function parseSessionId(sessionId: string): {
  isValid: boolean;
  timestamp?: number;
  randomPart?: string;
  createdAt?: Date;
} {
  const validation = validateSessionId(sessionId);
  if (!validation.isValid) {
    return { isValid: false };
  }

  try {
    const parts = sessionId.split('_');
    if (parts.length >= 3 && parts[0] === 'session') {
      const timestamp = parseInt(parts[1], 10);
      const randomPart = parts.slice(2).join('_');
      
      return {
        isValid: true,
        timestamp,
        randomPart,
        createdAt: new Date(timestamp),
      };
    }
  } catch (error) {
    console.error('SessionIdManager: Failed to parse session ID:', error);
  }

  return { isValid: false };
}

/**
 * Get session age in milliseconds
 */
export function getSessionAge(sessionId: string): number | null {
  const parsed = parseSessionId(sessionId);
  if (!parsed.isValid || !parsed.timestamp) {
    return null;
  }

  return Date.now() - parsed.timestamp;
}

/**
 * Check if session ID is expired based on age
 */
export function isSessionIdExpired(sessionId: string, maxAgeHours: number): boolean {
  const age = getSessionAge(sessionId);
  if (age === null) {
    return true; // Invalid session IDs are considered expired
  }

  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return age > maxAgeMs;
}

/**
 * Generate session ID with custom prefix (for testing or special cases)
 */
export function generateSessionIdWithPrefix(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Batch validate multiple session IDs
 */
export function validateSessionIds(sessionIds: string[]): {
  valid: string[];
  invalid: Array<{ sessionId: string; errors: string[] }>;
} {
  const valid: string[] = [];
  const invalid: Array<{ sessionId: string; errors: string[] }> = [];

  for (const sessionId of sessionIds) {
    const validation = validateSessionId(sessionId);
    if (validation.isValid) {
      valid.push(sessionId);
    } else {
      invalid.push({
        sessionId,
        errors: validation.errors,
      });
    }
  }

  return { valid, invalid };
}

/**
 * Get session ID statistics
 */
export function getSessionIdStats(): {
  totalSessions: number;
  validSessions: number;
  invalidSessions: number;
  averageAge: number;
  oldestSession: string | null;
  newestSession: string | null;
} {
  const allSessionIds = sessionStorage.getAllSessionIds();
  const validation = validateSessionIds(allSessionIds);
  
  let totalAge = 0;
  let oldestAge = 0;
  let newestAge = Infinity;
  let oldestSession: string | null = null;
  let newestSession: string | null = null;

  for (const sessionId of validation.valid) {
    const age = getSessionAge(sessionId);
    if (age !== null) {
      totalAge += age;
      
      if (age > oldestAge) {
        oldestAge = age;
        oldestSession = sessionId;
      }
      
      if (age < newestAge) {
        newestAge = age;
        newestSession = sessionId;
      }
    }
  }

  return {
    totalSessions: allSessionIds.length,
    validSessions: validation.valid.length,
    invalidSessions: validation.invalid.length,
    averageAge: validation.valid.length > 0 ? totalAge / validation.valid.length : 0,
    oldestSession,
    newestSession,
  };
}