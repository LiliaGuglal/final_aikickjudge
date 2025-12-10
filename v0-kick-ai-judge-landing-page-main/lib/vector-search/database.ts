// Vector Database Connection and Management
// Handles ChromaDB connection with retry logic and health checks

// Conditional import for server-side only
let ChromaApi: any, Collection: any, OpenAIEmbeddingFunction: any;

if (typeof window === 'undefined') {
  // Server-side import
  try {
    const chromadb = require('chromadb');
    ChromaApi = chromadb.ChromaApi;
    Collection = chromadb.Collection;
    OpenAIEmbeddingFunction = chromadb.OpenAIEmbeddingFunction;
  } catch (error) {
    console.warn('ChromaDB not available:', error);
  }
}
import { DatabaseError, VectorDatabaseStats } from './types';
import { getVectorConfig } from './config';

export class VectorDatabase {
  private client: any | null = null;
  private collection: any | null = null;
  private config = getVectorConfig();
  private retryCount = 0;
  private maxRetries = 5;
  private isConnected = false;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    // Skip initialization on client-side
    if (typeof window !== 'undefined') {
      console.warn('Vector database not available on client-side');
      return;
    }

    try {
      if (!ChromaApi) {
        throw new Error('ChromaDB not available');
      }

      // Handle in-memory mode for development
      if (this.config.chromaUrl === ':memory:') {
        this.client = new ChromaApi();
      } else {
        this.client = new ChromaApi({
          path: this.config.chromaUrl
        });
      }

      await this.ensureCollection();
      this.isConnected = true;
      this.retryCount = 0;
      
      console.log('✅ Vector database connected successfully');
    } catch (error: any) {
      console.error('❌ Vector database connection failed:', error.message);
      await this.handleConnectionError(error);
    }
  }

  private async ensureCollection(): Promise<void> {
    if (!this.client) {
      throw new DatabaseError('Database client not initialized');
    }

    try {
      // Try to get existing collection
      this.collection = await this.client.getCollection({
        name: this.config.collectionName
      });
    } catch (error) {
      // Collection doesn't exist, create it
      try {
        this.collection = await this.client.createCollection({
          name: this.config.collectionName,
          metadata: {
            description: 'WAKO Kickboxing Knowledge Base',
            created: new Date().toISOString(),
            version: '1.0'
          }
        });
        console.log(`📚 Created collection: ${this.config.collectionName}`);
      } catch (createError: any) {
        throw new DatabaseError(
          `Failed to create collection: ${createError.message}`,
          { collectionName: this.config.collectionName }
        );
      }
    }
  }
  private async handleConnectionError(error: any): Promise<void> {
    this.isConnected = false;
    this.retryCount++;

    if (this.retryCount >= this.maxRetries) {
      throw new DatabaseError(
        `Max retries (${this.maxRetries}) exceeded for database connection`,
        { originalError: error.message, retryCount: this.retryCount }
      );
    }

    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const exponentialDelay = baseDelay * Math.pow(2, this.retryCount - 1);
    const jitter = Math.random() * 1000; // Up to 1 second jitter
    const delay = exponentialDelay + jitter;

    console.log(`🔄 Retrying database connection in ${Math.round(delay)}ms (attempt ${this.retryCount}/${this.maxRetries})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    await this.initializeConnection();
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client || !this.collection) {
        return false;
      }

      // Simple health check - try to count documents
      const result = await this.collection.count();
      return typeof result === 'number';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async getStats(): Promise<VectorDatabaseStats> {
    if (!this.collection) {
      throw new DatabaseError('Collection not initialized');
    }

    try {
      const count = await this.collection.count();
      
      return {
        totalDocuments: count,
        collectionSize: count, // Simplified for now
        averageSearchTime: 0, // Will be calculated from metrics
        cacheHitRate: 0, // Will be implemented with caching
        lastIndexed: new Date(),
        healthStatus: this.isConnected ? 'healthy' : 'error'
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to get database stats: ${error.message}`);
    }
  }

  getCollection(): any {
    if (!this.collection) {
      throw new DatabaseError('Collection not initialized');
    }
    return this.collection;
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null && this.collection !== null;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.client = null;
    this.collection = null;
    console.log('🔌 Vector database disconnected');
  }
}

// Singleton instance
let databaseInstance: VectorDatabase | null = null;

export function getVectorDatabase(): VectorDatabase {
  if (!databaseInstance) {
    databaseInstance = new VectorDatabase();
  }
  return databaseInstance;
}