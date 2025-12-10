// Vector Search Service
// Main service for semantic search and query enhancement

import { 
  VectorSearchService as IVectorSearchService,
  SearchOptions, 
  SearchResponse, 
  SearchResult,
  ChatEnhancement,
  KnowledgeItem,
  VectorDatabaseStats,
  WAKOContentType
} from './types';
import { getVectorDatabase } from './database';
import { getVectorStorage } from './storage';
import { createEmbeddingService } from './embedding-service';
import { getVectorConfig } from './config';
import { getVectorSearchCache } from './cache';
import { getPerformanceOptimizer } from './performance-optimizer';

export class VectorSearchService implements IVectorSearchService {
  private database = getVectorDatabase();
  private storage = getVectorStorage();
  private embeddingService = createEmbeddingService();
  private config = getVectorConfig();
  private cache = getVectorSearchCache();
  private optimizer = getPerformanceOptimizer();

  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      // Pre-filter queries that should skip vector search
      if (this.optimizer.shouldSkipVectorSearch(query)) {
        return {
          results: [],
          totalFound: 0,
          searchTime: Date.now() - startTime,
          query,
          enhancedContext: ''
        };
      }

      // Optimize search options
      const optimizedOptions = this.optimizer.optimizeSearchOptions(query, options);
      
      // Preprocess query for better matching
      const processedQuery = this.optimizer.preprocessQuery(query);

      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = await this.cache.getSearchResults(processedQuery, optimizedOptions);
        if (cached) {
          return cached;
        }
      }
      const collection = this.database.getCollection();
      
      // Generate embedding for query
      const queryEmbedding = await this.embeddingService.generateEmbedding(
        processedQuery,
        optimizedOptions.language || this.embeddingService.detectLanguage(processedQuery)
      );

      // Prepare search parameters
      const limit = optimizedOptions.limit || this.config.maxResults;
      const threshold = optimizedOptions.threshold || this.config.similarityThreshold;

      // Build where clause for filtering
      const whereClause: any = {};
      if (optimizedOptions.contentTypes && optimizedOptions.contentTypes.length > 0) {
        whereClause.type = { $in: optimizedOptions.contentTypes };
      }
      if (optimizedOptions.language && optimizedOptions.language !== 'both') {
        whereClause.language = optimizedOptions.language;
      }

      // Perform vector search
      const searchResults = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit * 2, // Get more results to filter by threshold
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        include: ['documents', 'metadatas', 'distances']
      });

      // Process and filter results
      const results: SearchResult[] = [];
      
      if (searchResults.documents && searchResults.documents[0]) {
        const documents = searchResults.documents[0];
        const metadatas = searchResults.metadatas?.[0] || [];
        const distances = searchResults.distances?.[0] || [];
        const ids = searchResults.ids?.[0] || [];

        for (let i = 0; i < documents.length; i++) {
          const distance = distances[i];
          const similarity = 1 - distance; // Convert distance to similarity

          // Filter by similarity threshold
          if (similarity >= threshold) {
            const metadata = metadatas[i] as any;
            
            results.push({
              id: ids[i],
              content: documents[i],
              title: metadata?.title,
              metadata: {
                type: metadata?.type || WAKOContentType.RULE,
                language: metadata?.language || 'en',
                source: metadata?.source || 'unknown',
                tags: JSON.parse(metadata?.tags || '[]'),
                kickboxingContext: JSON.parse(metadata?.kickboxingContext || '{}')
              },
              similarityScore: similarity,
              relevanceReason: this.generateRelevanceReason(similarity, metadata?.type)
            });
          }
        }
      }

      // Optimize results with performance optimizer
      const finalResults = this.optimizer.optimizeResults(results, processedQuery, optimizedOptions);

      const searchTime = Date.now() - startTime;

      const response: SearchResponse = {
        results: finalResults,
        totalFound: results.length,
        searchTime,
        query,
        enhancedContext: this.buildEnhancedContext(finalResults, query)
      };

      // Cache the response
      if (this.config.cacheEnabled && finalResults.length > 0) {
        await this.cache.setSearchResults(processedQuery, response, optimizedOptions);
      }

      return response;
    } catch (error: any) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }
  async enhanceQuery(query: string, sessionId?: string): Promise<ChatEnhancement> {
    const startTime = Date.now();
    
    try {
      // Detect language and search for relevant context
      const language = this.embeddingService.detectLanguage(query);
      const searchResponse = await this.search(query, { 
        language,
        limit: 3, // Limit for chat context
        includeMetadata: true
      });

      // Build enhanced context for LLM
      const enhancedContext = this.buildChatContext(searchResponse.results, query, language);
      
      // Calculate confidence based on similarity scores
      const avgSimilarity = searchResponse.results.length > 0
        ? searchResponse.results.reduce((sum, r) => sum + r.similarityScore, 0) / searchResponse.results.length
        : 0;

      const processingTime = Date.now() - startTime;

      return {
        originalQuery: query,
        vectorResults: searchResponse.results,
        enhancedContext,
        confidenceScore: avgSimilarity,
        processingTime
      };
    } catch (error: any) {
      // Return fallback enhancement on error
      return {
        originalQuery: query,
        vectorResults: [],
        enhancedContext: '',
        confidenceScore: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  async indexContent(content: KnowledgeItem): Promise<string> {
    return await this.storage.storeDocument(content);
  }

  async updateContent(id: string, content: Partial<KnowledgeItem>): Promise<void> {
    await this.storage.updateDocument(id, content);
  }

  async deleteContent(id: string): Promise<void> {
    await this.storage.deleteDocument(id);
  }

  async batchIndexContent(contents: KnowledgeItem[]): Promise<string[]> {
    return await this.storage.batchStore(contents);
  }

  async healthCheck(): Promise<boolean> {
    return await this.database.healthCheck();
  }

  async getStats(): Promise<VectorDatabaseStats> {
    return await this.database.getStats();
  }

  private buildEnhancedContext(results: SearchResult[], query: string): string {
    if (results.length === 0) {
      return '';
    }

    const language = this.embeddingService.detectLanguage(query);
    const contextParts: string[] = [];

    results.forEach((result, index) => {
      const title = result.title ? `${result.title}: ` : '';
      contextParts.push(`${index + 1}. ${title}${result.content}`);
    });

    const header = language === 'uk' 
      ? 'Релевантна інформація з бази знань WAKO:'
      : 'Relevant information from WAKO knowledge base:';

    return `${header}\n\n${contextParts.join('\n\n')}`;
  }

  private buildChatContext(results: SearchResult[], query: string, language: 'uk' | 'en'): string {
    if (results.length === 0) {
      return '';
    }

    const header = language === 'uk'
      ? 'Додатковий контекст з бази знань WAKO:'
      : 'Additional context from WAKO knowledge base:';

    const contextItems = results.map(result => {
      const confidence = Math.round(result.similarityScore * 100);
      return `• ${result.content} (релевантність: ${confidence}%)`;
    });

    return `${header}\n${contextItems.join('\n')}`;
  }

  private generateRelevanceReason(similarity: number, contentType?: string): string {
    const percentage = Math.round(similarity * 100);
    
    if (similarity > 0.8) {
      return `Висока релевантність (${percentage}%) - пряме відношення до запиту`;
    } else if (similarity > 0.5) {
      return `Середня релевантність (${percentage}%) - схожа тематика`;
    } else {
      return `Низька релевантність (${percentage}%) - загальний контекст`;
    }
  }
}

// Factory function
export function createVectorSearchService(): VectorSearchService {
  return new VectorSearchService();
}