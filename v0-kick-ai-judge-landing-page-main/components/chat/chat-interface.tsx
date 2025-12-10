'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, ChatState } from './types';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ErrorBanner } from './error-banner';
import { cn } from '@/lib/utils';

// Generate session ID on client side
function generateClientSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${random}`;
}

interface ChatInterfaceProps {
  className?: string;
  initialMessage?: string | null;
  onMessageSent?: () => void;
}

export function ChatInterface({ className, initialMessage, onMessageSent }: ChatInterfaceProps) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });
  
  // Store the last message for retry functionality
  const lastMessageRef = useRef<string | null>(null);
  
  // Session ID management
  const [sessionId, setSessionId] = useState<string>('');
  
  // Generate session ID on component mount
  useEffect(() => {
    const newSessionId = generateClientSessionId();
    setSessionId(newSessionId);
    console.log('ChatInterface: Generated session ID:', newSessionId);
  }, []);

  // Handle initial message - will be defined after handleSendMessage function

  const handleSendMessage = async (content: string) => {
    // Store message for retry functionality
    lastMessageRef.current = content;
    
    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message to state and clear any previous errors
    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Call API route with session ID
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: content,
          sessionId: sessionId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API error: ${response.status} ${response.statusText}`
        );
      }

      // Check if this is an analytics response (JSON)
      const contentType = response.headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        const analyticsData = await response.json();
        
        if (analyticsData.isAnalytics && analyticsData.content) {
          // Handle analytics response
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: analyticsData.content,
            timestamp: new Date(),
          };

          setChatState((prev) => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
            isLoading: false,
          }));
          
          console.log('Analytics response processed:', {
            confidence: analyticsData.confidence,
            executionTime: analyticsData.executionTime,
            functionsUsed: analyticsData.functionsUsed
          });
          
          return;
        }
      }

      // Update session ID from response headers if provided
      const responseSessionId = response.headers.get('X-Session-Id');
      if (responseSessionId && responseSessionId !== sessionId) {
        setSessionId(responseSessionId);
        console.log('ChatInterface: Updated session ID from server:', responseSessionId);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      // Create assistant message
      const assistantMessageId = crypto.randomUUID();
      let assistantContent = '';

      setChatState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
          },
        ],
      }));

      // Read stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        // Update assistant message with new content
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: assistantContent, isStreaming: true }
              : msg
          ),
        }));
      }

      // Mark streaming as complete
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false }
            : msg
        ),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  // Handle initial message
  useEffect(() => {
    if (initialMessage && sessionId) {
      handleSendMessage(initialMessage);
      onMessageSent?.();
    }
  }, [initialMessage, sessionId]);

  const handleRetry = () => {
    if (lastMessageRef.current) {
      handleSendMessage(lastMessageRef.current);
    }
  };

  const handleDismissError = () => {
    setChatState((prev) => ({
      ...prev,
      error: null,
    }));
  };

  const handleClearChat = async () => {
    if (!sessionId) {
      console.warn('ChatInterface: No session ID available for clearing');
      return;
    }

    try {
      setChatState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/chat/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      if (result.success) {
        // Clear local chat state
        setChatState({
          messages: [],
          isLoading: false,
          error: null,
        });
        
        // Generate new session ID for fresh start
        const newSessionId = generateClientSessionId();
        setSessionId(newSessionId);
        
        console.log('ChatInterface: Chat cleared successfully, new session:', newSessionId);
      } else {
        throw new Error(result.message || 'Failed to clear chat');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear chat';
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full max-h-[600px] border border-zinc-800 rounded-lg bg-zinc-950 shadow-sm',
        className
      )}
    >
      {/* Header with Clear button */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="text-sm text-zinc-400">
          KickAI Суддя • Сесія: {sessionId.slice(-8)}
        </div>
        <button
          onClick={handleClearChat}
          disabled={chatState.isLoading}
          className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Очистити
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-black">
        <MessageList
          messages={chatState.messages}
          isLoading={chatState.isLoading}
        />
      </div>
      
      {/* Error Banner */}
      {chatState.error && (
        <div className="px-4 py-3 border-t border-zinc-800">
          <ErrorBanner
            error={chatState.error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
        </div>
      )}
      
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={chatState.isLoading}
        isLoading={chatState.isLoading}
      />
    </div>
  );
}
