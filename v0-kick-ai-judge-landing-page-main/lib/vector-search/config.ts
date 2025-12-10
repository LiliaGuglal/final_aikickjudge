// Vector Search Configuration
// Configuration settings for the vector search system

export interface VectorSearchConfig {
  // Embedding configuration
  embeddingModel: string;
  vectorDimensions: number;
  maxTokensPerChunk: number;
  chunkOverlap: number;
  
  // Search configuration
  similarityThreshold: number;
  maxResults: number;
  searchTimeout: number;
  
  // Database configuration
  chromaUrl: string;
  collectionName: string;
  
  // Performance configuration
  batchSize: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  
  // Language support
  supportedLanguages: string[];
}

export const DEFAULT_VECTOR_CONFIG: VectorSearchConfig = {
  // Embedding settings
  embeddingModel: 'text-embedding-004', // Google's latest embedding model
  vectorDimensions: 768,
  maxTokensPerChunk: 512,
  chunkOverlap: 50,
  
  // Search settings
  similarityThreshold: 0.3,
  maxResults: 5,
  searchTimeout: 200, // 200ms to not delay chat responses
  
  // Database settings
  chromaUrl: process.env.CHROMA_URL || ':memory:', // Use in-memory for development
  collectionName: 'wako_knowledge_base',
  
  // Performance settings
  batchSize: 10,
  cacheEnabled: true,
  cacheTTL: 3600, // 1 hour
  
  // Language support
  supportedLanguages: ['uk', 'en'],
};

export function getVectorConfig(): VectorSearchConfig {
  return {
    ...DEFAULT_VECTOR_CONFIG,
    // Override with environment variables if available
    chromaUrl: process.env.CHROMA_URL || DEFAULT_VECTOR_CONFIG.chromaUrl,
    similarityThreshold: process.env.VECTOR_SIMILARITY_THRESHOLD 
      ? parseFloat(process.env.VECTOR_SIMILARITY_THRESHOLD) 
      : DEFAULT_VECTOR_CONFIG.similarityThreshold,
  };
}