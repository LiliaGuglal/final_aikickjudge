// Chat API Integration for Vector Search
// Integrates vector search enhancement into existing chat flow

import { createVectorSearchService } from './vector-search-service';
import { getSportsContextProcessor } from './context-processor';
import { getVectorSearchMonitor } from './monitoring';
import { initializeKnowledgeBase } from './knowledge-base';
import { getVectorSearchErrorHandler, safeAsync } from './error-handler';
import { ChatEnhancement, Language } from './types';

export class ChatVectorIntegration {
  private searchService = createVectorSearchService();
  private contextProcessor = getSportsContextProcessor();
  private monitor = getVectorSearchMonitor();
  private errorHandler = getVectorSearchErrorHandler();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize knowledge base if needed
      await initializeKnowledgeBase();
      this.isInitialized = true;
      console.log('✅ Vector search integration initialized');
    } catch (error: any) {
      console.error('❌ Vector search initialization failed:', error.message);
      // Don't throw - allow chat to work without vector search
    }
  }

  /**
   * Enhance user query with vector search context
   */
  async enhanceQuery(
    userMessage: string, 
    sessionId?: string
  ): Promise<ChatEnhancement | null> {
    // Return null if not initialized or system is unhealthy
    if (!this.isInitialized || !this.errorHandler.isSystemHealthy()) {
      return null;
    }

    return safeAsync(
      async () => {
        const startTime = Date.now();
        
        // Analyze query for sports context
        const language = this.detectLanguage(userMessage);
        const analysis = this.contextProcessor.analyzeQuery(userMessage, language);
        
        // Skip vector search for low-confidence queries
        if (analysis.confidence < 0.3) {
          this.monitor.logSearch(sessionId || 'unknown', userMessage, 0, Date.now() - startTime);
          return null;
        }

        // Enhance search options based on context
        const searchOptions = this.contextProcessor.enhanceSearchOptions(userMessage, {
          language,
          limit: 3, // Limit for chat context
          threshold: 0.3
        });

        // Perform vector search with error handling
        const enhancement = await this.searchService.enhanceQuery(userMessage, sessionId);
        
        // Log the search
        this.monitor.logSearch(
          sessionId || 'unknown',
          userMessage,
          enhancement.vectorResults.length,
          enhancement.processingTime
        );

        // Return enhancement if we have good results
        if (enhancement.vectorResults.length > 0 && enhancement.confidenceScore > 0.3) {
          return enhancement;
        }

        return null;
      },
      'chat_enhancement',
      null, // fallback value
      sessionId
    );
  }

  /**
   * Build enhanced system prompt with vector context
   */
  buildEnhancedPrompt(
    originalPrompt: string,
    enhancement: ChatEnhancement,
    userMessage: string
  ): string {
    if (!enhancement || enhancement.vectorResults.length === 0) {
      return originalPrompt;
    }

    const language = this.detectLanguage(userMessage);
    const contextHeader = language === 'uk'
      ? '\n\nДодатковий контекст з бази знань WAKO:'
      : '\n\nAdditional context from WAKO knowledge base:';

    const contextItems = enhancement.vectorResults.map((result, index) => {
      const confidence = Math.round(result.similarityScore * 100);
      const title = result.title ? `${result.title}: ` : '';
      return `${index + 1}. ${title}${result.content} (релевантність: ${confidence}%)`;
    });

    const contextSection = `${contextHeader}\n${contextItems.join('\n\n')}`;
    
    const instruction = language === 'uk'
      ? '\n\nВикористовуй цю інформацію для більш точної та детальної відповіді.'
      : '\n\nUse this information to provide a more accurate and detailed response.';

    return `${originalPrompt}${contextSection}${instruction}`;
  }

  /**
   * Check if vector search is available and healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    return safeAsync(
      () => this.searchService.healthCheck(),
      'health_check',
      false // fallback to unhealthy
    );
  }

  /**
   * Get performance metrics for monitoring
   */
  getMetrics() {
    return this.monitor.getMetrics();
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return this.monitor.getHealthStatus();
  }

  private detectLanguage(text: string): Language {
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const cyrillicCount = (text.match(cyrillicPattern) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    
    return cyrillicCount / totalChars > 0.3 ? 'uk' : 'en';
  }
}

// Singleton instance
let integrationInstance: ChatVectorIntegration | null = null;

export function getChatVectorIntegration(): ChatVectorIntegration {
  if (!integrationInstance) {
    integrationInstance = new ChatVectorIntegration();
  }
  return integrationInstance;
}