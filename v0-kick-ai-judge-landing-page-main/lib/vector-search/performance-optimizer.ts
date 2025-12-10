// Performance Optimization for Vector Search
// Query optimization, batch processing, and parallel execution

import { SearchOptions, SearchResult, KnowledgeItem } from './types';
import { getVectorConfig } from './config';
import { getVectorSearchMonitor } from './monitoring';

export class PerformanceOptimizer {
  private config = getVectorConfig();
  private monitor = getVectorSearchMonitor();
  private queryCache = new Map<string, SearchResult[]>();

  /**
   * Optimize search options for better performance
   */
  optimizeSearchOptions(query: string, options: SearchOptions): SearchOptions {
    const optimized = { ...options };

    // Limit results to reasonable number
    if (!optimized.limit || optimized.limit > 10) {
      optimized.limit = Math.min(optimized.limit || this.config.maxResults, 10);
    }

    // Increase threshold for better performance if query is short
    if (query.length < 20 && (!optimized.threshold || optimized.threshold < 0.4)) {
      optimized.threshold = 0.4;
    }

    // Add content type filters if we can infer them from query
    if (!optimized.contentTypes) {
      optimized.contentTypes = this.inferContentTypes(query);
    }

    return optimized;
  }

  /**
   * Pre-filter queries to avoid unnecessary vector searches
   */
  shouldSkipVectorSearch(query: string): boolean {
    // Skip very short queries
    if (query.trim().length < 3) {
      return true;
    }

    // Skip queries that are just numbers or special characters
    if (/^[\d\s\-\+\*\/\=\(\)]+$/.test(query)) {
      return true;
    }

    // Skip queries with only stop words (simplified check)
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = query.toLowerCase().split(/\s+/);
    const meaningfulWords = words.filter(word => !stopWords.includes(word));
    
    if (meaningfulWords.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Batch process multiple embeddings efficiently
   */
  async batchProcessEmbeddings(
    texts: string[],
    embeddingFunction: (text: string) => Promise<number[]>
  ): Promise<number[][]> {
    const results: number[][] = [];
    const batchSize = this.config.batchSize;

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(text => embeddingFunction(text));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Add small delay between batches to avoid rate limiting
        if (i + batchSize < texts.length) {
          await this.sleep(100);
        }
      } catch (error: any) {
        console.error(`Batch processing failed at batch ${i}:`, error.message);
        throw error;
      }
    }

    return results;
  }

  /**
   * Optimize result ranking and filtering
   */
  optimizeResults(
    results: SearchResult[],
    query: string,
    options: SearchOptions
  ): SearchResult[] {
    let optimized = [...results];

    // Remove duplicates based on content similarity
    optimized = this.removeDuplicates(optimized);

    // Boost results that match query keywords exactly
    optimized = this.boostKeywordMatches(optimized, query);

    // Apply diversity filtering to avoid too similar results
    optimized = this.applyDiversityFilter(optimized);

    // Sort by optimized score
    optimized.sort((a, b) => {
      const scoreA = this.calculateOptimizedScore(a, query);
      const scoreB = this.calculateOptimizedScore(b, query);
      return scoreB - scoreA;
    });

    // Limit final results
    const limit = options.limit || this.config.maxResults;
    return optimized.slice(0, limit);
  }

  /**
   * Parallel processing for multiple search operations
   */
  async parallelSearch<T>(
    operations: (() => Promise<T>)[],
    maxConcurrency: number = 3
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += maxConcurrency) {
      const batch = operations.slice(i, i + maxConcurrency);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Query preprocessing for better matching
   */
  preprocessQuery(query: string): string {
    let processed = query.toLowerCase().trim();

    // Remove extra whitespace
    processed = processed.replace(/\s+/g, ' ');

    // Expand common abbreviations in kickboxing
    const abbreviations: Record<string, string> = {
      'pf': 'point fighting',
      'lc': 'light contact',
      'fc': 'full contact',
      'lk': 'low kick',
      'ko': 'knockout',
      'tko': 'technical knockout'
    };

    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      processed = processed.replace(regex, full);
    });

    return processed;
  }
  private inferContentTypes(query: string): string[] | undefined {
    const lowerQuery = query.toLowerCase();
    
    // Scoring-related keywords
    if (this.containsAny(lowerQuery, ['point', 'score', 'бал', 'очк'])) {
      return ['scoring'];
    }
    
    // Technique-related keywords
    if (this.containsAny(lowerQuery, ['kick', 'punch', 'technique', 'удар', 'техніка'])) {
      return ['technique'];
    }
    
    // Violation-related keywords
    if (this.containsAny(lowerQuery, ['violation', 'penalty', 'foul', 'порушення', 'штраф'])) {
      return ['violation'];
    }
    
    // Equipment-related keywords
    if (this.containsAny(lowerQuery, ['equipment', 'gear', 'glove', 'екіпіровка', 'рукавички'])) {
      return ['equipment'];
    }
    
    return undefined;
  }

  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      // Create a signature based on content similarity
      const signature = this.createContentSignature(result.content);
      if (seen.has(signature)) {
        return false;
      }
      seen.add(signature);
      return true;
    });
  }

  private boostKeywordMatches(results: SearchResult[], query: string): SearchResult[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    
    return results.map(result => {
      const content = result.content.toLowerCase();
      let keywordMatches = 0;
      
      queryWords.forEach(word => {
        if (word.length > 2 && content.includes(word)) {
          keywordMatches++;
        }
      });
      
      // Boost similarity score based on keyword matches
      const boost = keywordMatches * 0.05; // 5% boost per keyword match
      result.similarityScore = Math.min(1.0, result.similarityScore + boost);
      
      return result;
    });
  }

  private applyDiversityFilter(results: SearchResult[]): SearchResult[] {
    if (results.length <= 3) {
      return results;
    }

    const diverse: SearchResult[] = [results[0]]; // Always include top result
    
    for (let i = 1; i < results.length && diverse.length < 5; i++) {
      const candidate = results[i];
      
      // Check if candidate is too similar to existing results
      const isTooSimilar = diverse.some(existing => 
        this.calculateContentSimilarity(candidate.content, existing.content) > 0.8
      );
      
      if (!isTooSimilar) {
        diverse.push(candidate);
      }
    }
    
    return diverse;
  }

  private calculateOptimizedScore(result: SearchResult, query: string): number {
    let score = result.similarityScore;
    
    // Boost based on content type relevance
    if (result.metadata.type === 'scoring' && this.containsAny(query.toLowerCase(), ['point', 'score', 'бал'])) {
      score += 0.1;
    }
    
    // Boost based on language match
    const queryLanguage = this.detectLanguage(query);
    if (result.metadata.language === queryLanguage) {
      score += 0.05;
    }
    
    // Boost based on content length (prefer more detailed content)
    if (result.content.length > 100) {
      score += 0.02;
    }
    
    return Math.min(1.0, score);
  }

  private createContentSignature(content: string): string {
    // Create a signature based on first 50 characters and length
    const normalized = content.toLowerCase().replace(/\s+/g, ' ').trim();
    return `${normalized.substring(0, 50)}_${normalized.length}`;
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    // Simple Jaccard similarity based on words
    const words1 = new Set(content1.toLowerCase().split(/\s+/));
    const words2 = new Set(content2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private detectLanguage(text: string): 'uk' | 'en' {
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const cyrillicCount = (text.match(cyrillicPattern) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    
    return cyrillicCount / totalChars > 0.3 ? 'uk' : 'en';
  }

  private containsAny(text: string, terms: string[]): boolean {
    return terms.some(term => text.includes(term));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let optimizerInstance: PerformanceOptimizer | null = null;

export function getPerformanceOptimizer(): PerformanceOptimizer {
  if (!optimizerInstance) {
    optimizerInstance = new PerformanceOptimizer();
  }
  return optimizerInstance;
}

/**
 * Performance monitoring decorator
 */
export function withPerformanceMonitoring(operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const monitor = getVectorSearchMonitor();
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const latency = Date.now() - startTime;
        
        // Log performance metrics
        if (operationName === 'search') {
          monitor.logSearch('perf', args[0] || '', result?.results?.length || 0, latency);
        } else if (operationName === 'embedding') {
          monitor.logEmbedding(args[0] || '', latency);
        }
        
        return result;
      } catch (error: any) {
        const latency = Date.now() - startTime;
        monitor.logError(operationName, error.message);
        throw error;
      }
    };
    
    return descriptor;
  };
}