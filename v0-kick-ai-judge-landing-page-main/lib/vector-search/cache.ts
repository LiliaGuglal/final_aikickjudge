// Vector Search Caching Layer
// In-memory caching with optional Redis support

import { SearchResponse, CacheEntry } from './types';
import { getVectorConfig } from './config';
import { getVectorSearchMonitor } from './monitoring';

export class VectorSearchCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private config = getVectorConfig();
  private monitor = getVectorSearchMonitor();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval for expired entries
    this.startCleanupInterval();
  }

  /**
   * Get cached search results
   */
  async getSearchResults(query: string, options?: any): Promise<SearchResponse | null> {
    const key = this.generateSearchKey(query, options);
    
    try {
      const cached = this.memoryCache.get(key);
      
      if (cached && !this.isExpired(cached)) {
        this.monitor.logCacheAccess(true, key);
        return cached.value as SearchResponse;
      }
      
      // Remove expired entry
      if (cached) {
        this.memoryCache.delete(key);
      }
      
      this.monitor.logCacheAccess(false, key);
      return null;
    } catch (error: any) {
      console.error('Cache get error:', error.message);
      this.monitor.logCacheAccess(false, key);
      return null;
    }
  }

  /**
   * Cache search results
   */
  async setSearchResults(
    query: string, 
    results: SearchResponse, 
    options?: any
  ): Promise<void> {
    const key = this.generateSearchKey(query, options);
    
    try {
      const entry: CacheEntry<SearchResponse> = {
        key,
        value: results,
        timestamp: new Date(),
        ttl: this.config.cacheTTL
      };
      
      this.memoryCache.set(key, entry);
      
      // Limit cache size to prevent memory issues
      this.enforceMaxSize();
    } catch (error: any) {
      console.error('Cache set error:', error.message);
    }
  }

  /**
   * Get cached embedding
   */
  async getEmbedding(text: string): Promise<number[] | null> {
    const key = this.generateEmbeddingKey(text);
    
    try {
      const cached = this.memoryCache.get(key);
      
      if (cached && !this.isExpired(cached)) {
        this.monitor.logCacheAccess(true, key);
        return cached.value as number[];
      }
      
      if (cached) {
        this.memoryCache.delete(key);
      }
      
      this.monitor.logCacheAccess(false, key);
      return null;
    } catch (error: any) {
      console.error('Cache get embedding error:', error.message);
      this.monitor.logCacheAccess(false, key);
      return null;
    }
  }

  /**
   * Cache embedding
   */
  async setEmbedding(text: string, embedding: number[]): Promise<void> {
    const key = this.generateEmbeddingKey(text);
    
    try {
      const entry: CacheEntry<number[]> = {
        key,
        value: embedding,
        timestamp: new Date(),
        ttl: this.config.cacheTTL * 2 // Embeddings can be cached longer
      };
      
      this.memoryCache.set(key, entry);
      this.enforceMaxSize();
    } catch (error: any) {
      console.error('Cache set embedding error:', error.message);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    console.log('🗑️ Vector search cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const entry of this.memoryCache.values()) {
      if (this.isExpired(entry)) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }
    
    return {
      totalEntries: this.memoryCache.size,
      validEntries,
      expiredEntries,
      memoryUsage: this.estimateMemoryUsage()
    };
  }
  private generateSearchKey(query: string, options?: any): string {
    // Create a stable key from query and options
    const normalizedQuery = query.toLowerCase().trim();
    const optionsStr = options ? JSON.stringify(options) : '';
    return `search:${this.hashString(normalizedQuery + optionsStr)}`;
  }

  private generateEmbeddingKey(text: string): string {
    const normalizedText = text.toLowerCase().trim();
    return `embedding:${this.hashString(normalizedText)}`;
  }

  private hashString(str: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const entryTime = entry.timestamp.getTime();
    return (now - entryTime) > (entry.ttl * 1000);
  }

  private enforceMaxSize(): void {
    const maxEntries = 1000; // Limit to 1000 entries
    
    if (this.memoryCache.size > maxEntries) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      
      const toRemove = entries.slice(0, this.memoryCache.size - maxEntries);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
      
      console.log(`🧹 Cache cleanup: removed ${toRemove.length} old entries`);
    }
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  private cleanupExpired(): void {
    let removedCount = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cache cleanup: removed ${removedCount} expired entries`);
    }
  }

  private estimateMemoryUsage(): string {
    // Rough estimation of memory usage
    let totalSize = 0;
    
    for (const entry of this.memoryCache.values()) {
      // Estimate size based on JSON serialization
      totalSize += JSON.stringify(entry.value).length * 2; // Rough estimate
    }
    
    if (totalSize < 1024) {
      return `${totalSize} bytes`;
    } else if (totalSize < 1024 * 1024) {
      return `${(totalSize / 1024).toFixed(1)} KB`;
    } else {
      return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instance
let cacheInstance: VectorSearchCache | null = null;

export function getVectorSearchCache(): VectorSearchCache {
  if (!cacheInstance) {
    cacheInstance = new VectorSearchCache();
  }
  return cacheInstance;
}

/**
 * Cache decorator for methods
 */
export function cached(ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = getVectorSearchCache();
    
    descriptor.value = async function (...args: any[]) {
      // Generate cache key from method name and arguments
      const key = `${propertyKey}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      const cached = await cache.getSearchResults(key);
      if (cached) {
        return cached;
      }
      
      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      if (result) {
        await cache.setSearchResults(key, result);
      }
      
      return result;
    };
    
    return descriptor;
  };
}