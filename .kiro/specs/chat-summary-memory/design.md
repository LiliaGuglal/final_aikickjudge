# Design Document

## Overview

Модуль SummaryMemory забезпечує інтелектуальне управління пам'яттю для чат-системи KickAI. Система автоматично узагальнює старі повідомлення, зберігаючи останні дослівно, що дозволяє підтримувати довгі розмови без необмеженого зростання пам'яті.

## Architecture

Система складається з наступних основних компонентів:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chat UI       │───▶│   Chat API       │───▶│ SummaryMemory   │
│                 │    │   /api/chat      │    │    Manager      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Clear UI      │───▶│   Clear API      │    │ SummaryGenerator│
│   Button        │    │ /api/chat/clear  │    │   (Gemini 2.0)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components and Interfaces

### SummaryGenerator
Відповідає за створення стислих резюме розмов за допомогою Gemini 2.0 Flash.

```typescript
interface SummaryGenerator {
  generateSummary(messages: Message[]): Promise<string>;
  isAvailable(): boolean;
}
```

### SummaryMemoryManager
Основний менеджер пам'яті з автоматичним узагальненням.

```typescript
interface SummaryMemoryManager {
  addMessage(sessionId: string, message: Message): Promise<void>;
  getContext(sessionId: string): Promise<ConversationContext>;
  clearSession(sessionId: string): Promise<void>;
  cleanupInactiveSessions(): Promise<void>;
}
```

### ConversationContext
Структура для зберігання контексту розмови.

```typescript
interface ConversationContext {
  summaries: string[];
  recentMessages: Message[];
  totalMessages: number;
}
```

## Data Models

### Message
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### SessionData
```typescript
interface SessionData {
  sessionId: string;
  messages: Message[];
  summaries: string[];
  lastActivity: Date;
  messageCount: number;
}
```

### MemoryConfig
```typescript
interface MemoryConfig {
  memoryThreshold: number; // 10 messages
  recentMessagesLimit: number; // 6 messages
  sessionTimeoutHours: number; // 24 hours
  maxSessions: number; // 1000 sessions
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Message Storage Consistency
*For any* valid message and session ID, storing the message should result in the message being retrievable from session memory
**Validates: Requirements 1.1**

### Property 2: Context Inclusion
*For any* session with stored messages, generating context should include both summaries and recent messages when available
**Validates: Requirements 1.2**

### Property 3: Automatic Summarization Trigger
*For any* session, when message count exceeds Memory_Threshold (10), the system should automatically create summaries of older messages
**Validates: Requirements 1.3**

### Property 4: Recent Messages Preservation
*For any* session state, the system should preserve exactly Recent_Messages_Limit (6) messages verbatim regardless of total message count
**Validates: Requirements 1.4**

### Property 5: Context Structure Consistency
*For any* conversation context retrieval, the returned data should contain both summaries array and recent messages array
**Validates: Requirements 1.5**

### Property 6: Graceful Summarization Degradation
*For any* summarization failure, the system should preserve original messages and continue normal operation
**Validates: Requirements 2.2**

### Property 7: Summary Structure Validation
*For any* successful summary generation, the returned data should be a valid string with expected format
**Validates: Requirements 2.5**

### Property 8: Complete Session Clearing
*For any* session clear operation, all session data including messages, summaries, and counters should be removed
**Validates: Requirements 3.1**

### Property 9: Session Reset Completeness
*For any* cleared session, message counter and summaries should be reset to initial state (zero/empty)
**Validates: Requirements 3.2**

### Property 10: Fresh Session Initialization
*For any* session after clearing, the session should behave identically to a newly created session
**Validates: Requirements 3.4**

### Property 11: Inactive Session Marking
*For any* session that becomes inactive, the system should mark it appropriately for cleanup
**Validates: Requirements 4.2**

### Property 12: Cleanup Session Removal
*For any* cleanup operation, old inactive sessions should be removed while active sessions remain untouched
**Validates: Requirements 4.3**

### Property 13: Activity Timestamp Tracking
*For any* session activity, the system should update the session's last activity timestamp
**Validates: Requirements 4.4**

### Property 14: Session Limit Enforcement
*For any* system state where session limit is reached, adding new sessions should trigger removal of oldest sessions
**Validates: Requirements 4.5**

### Property 15: Unique Session Generation
*For any* interface initialization, the system should generate a unique session identifier that doesn't conflict with existing sessions
**Validates: Requirements 5.1**

### Property 16: Session Continuity
*For any* chat interaction within a session, the session identifier should remain consistent throughout the conversation
**Validates: Requirements 5.2**

### Property 17: Error Continuation
*For any* summarization failure, the system should continue processing with original messages without stopping
**Validates: Requirements 6.1**

### Property 18: Memory Operation Resilience
*For any* memory operation failure, the system should log the error and continue processing subsequent operations
**Validates: Requirements 6.2**

### Property 19: Meaningful Error Responses
*For any* API operation failure, the system should return error responses with meaningful messages and appropriate HTTP status codes
**Validates: Requirements 6.3**

### Property 20: Corruption Recovery
*For any* corrupted session data, the system should initialize a fresh session and continue normal operation
**Validates: Requirements 6.4**

### Property 21: Basic Functionality Preservation
*For any* critical memory system failure, the basic chat functionality should remain operational
**Validates: Requirements 6.5**

### Property 22: Configuration Threshold Respect
*For any* custom memory threshold configuration, the system should use the configured values instead of defaults
**Validates: Requirements 7.2**

### Property 23: Default Configuration Fallback
*For any* invalid configuration values, the system should fall back to safe default values and continue operation
**Validates: Requirements 7.4**

## Error Handling

### Graceful Degradation Strategy
- **Summarization Failures**: Continue with original messages, log error
- **Memory Storage Failures**: Attempt retry, fallback to in-memory storage
- **Session Corruption**: Initialize fresh session, preserve current message
- **API Failures**: Return meaningful errors, maintain chat functionality

### Error Recovery Mechanisms
- **Automatic Retry**: For transient failures (network, temporary API issues)
- **Fallback Storage**: In-memory backup when persistent storage fails
- **Session Recreation**: Fresh session initialization on corruption
- **Partial Functionality**: Core chat works even if memory features fail

## Testing Strategy

### Unit Testing Approach
- Test individual components (SummaryGenerator, MemoryManager) in isolation
- Mock external dependencies (Gemini API, storage)
- Verify error handling paths and edge cases
- Test configuration loading and validation

### Property-Based Testing Approach
- Use **fast-check** library for TypeScript property-based testing
- Generate random messages, session IDs, and configurations
- Verify properties hold across all generated inputs
- Test system behavior under various failure conditions
- Each property-based test should run minimum 100 iterations

### Integration Testing
- Test complete flow from UI to storage
- Verify API endpoints work correctly
- Test session management across multiple concurrent sessions
- Validate memory cleanup and summarization workflows

### Performance Testing
- Test memory usage with large conversation histories
- Verify summarization performance with long message sequences
- Test concurrent session handling
- Validate cleanup efficiency with many inactive sessions