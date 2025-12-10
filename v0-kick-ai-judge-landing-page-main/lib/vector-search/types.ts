// Vector Search System Types and Interfaces
// Defines all TypeScript types for the vector search integration

// ============================================================================
// WAKO Content Types
// ============================================================================

export enum WAKOContentType {
  TECHNIQUE = 'technique',
  RULE = 'rule',
  SCORING = 'scoring',
  VIOLATION = 'violation',
  PRECEDENT = 'precedent',
  EQUIPMENT = 'equipment',
  SAFETY = 'safety',
  COMPETITION_FORMAT = 'competition_format'
}

export interface KickboxingContext {
  sport: 'kickboxing';
  discipline?: 'point_fighting' | 'light_contact' | 'kick_light' | 'full_contact' | 'low_kick' | 'k1';
  category?: 'junior' | 'cadet' | 'senior' | 'veteran';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  rules?: string[];
  weight_class?: string;
}

// ============================================================================
// Core Vector Search Types
// ============================================================================

export interface VectorDocument {
  id: string;
  vector: number[];
  content: string;
  metadata: ContentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeItem {
  id?: string;
  title: string;
  content: string;
  type: WAKOContentType;
  language: 'uk' | 'en';
  metadata: ContentMetadata;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentMetadata {
  type: WAKOContentType;
  language: 'uk' | 'en';
  source: string;
  tags: string[];
  kickboxingContext: KickboxingContext;
  confidence?: number;
  priority?: number;
  lastUpdated?: Date;
}

// ============================================================================
// Search Operations
// ============================================================================

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  contentTypes?: WAKOContentType[];
  language?: 'uk' | 'en' | 'both';
  discipline?: string;
  includeMetadata?: boolean;
}

export interface SearchResult {
  id: string;
  content: string;
  title?: string;
  metadata: ContentMetadata;
  similarityScore: number;
  relevanceReason?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalFound: number;
  searchTime: number;
  query: string;
  enhancedContext?: string;
}

// ============================================================================
// Integration with Existing Memory System
// ============================================================================

export interface MemoryIntegration {
  sessionId: string;
  vectorContext?: SearchResult[];
  enhancedPrompt?: string;
  fallbackToMemory: boolean;
}

export interface ChatEnhancement {
  originalQuery: string;
  vectorResults: SearchResult[];
  enhancedContext: string;
  confidenceScore: number;
  processingTime: number;
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface EmbeddingService {
  generateEmbedding(text: string, language?: 'uk' | 'en'): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  validateTextLength(text: string): boolean;
  chunkText(text: string, maxTokens: number, overlap: number): string[];
  detectLanguage(text: string): 'uk' | 'en';
}

export interface VectorSearchService {
  // Search operations
  search(query: string, options?: SearchOptions): Promise<SearchResponse>;
  enhanceQuery(query: string, sessionId?: string): Promise<ChatEnhancement>;
  
  // Content management
  indexContent(content: KnowledgeItem): Promise<string>;
  updateContent(id: string, content: Partial<KnowledgeItem>): Promise<void>;
  deleteContent(id: string): Promise<void>;
  batchIndexContent(contents: KnowledgeItem[]): Promise<string[]>;
  
  // Health and maintenance
  healthCheck(): Promise<boolean>;
  getStats(): Promise<VectorDatabaseStats>;
}

export interface ContentManager {
  addContent(content: KnowledgeItem): Promise<string>;
  updateContent(id: string, updates: Partial<KnowledgeItem>): Promise<void>;
  deleteContent(id: string): Promise<void>;
  getContent(id: string): Promise<KnowledgeItem | null>;
  validateContent(content: KnowledgeItem): ValidationResult;
  searchContent(query: string, filters?: ContentFilters): Promise<KnowledgeItem[]>;
}

// ============================================================================
// Configuration and Validation
// ============================================================================

export interface VectorConfig {
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
  supportedLanguages: ('uk' | 'en')[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContentFilters {
  type?: WAKOContentType;
  language?: 'uk' | 'en';
  discipline?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// ============================================================================
// Performance and Monitoring
// ============================================================================

export interface VectorDatabaseStats {
  totalDocuments: number;
  collectionSize: number;
  averageSearchTime: number;
  cacheHitRate: number;
  lastIndexed: Date;
  healthStatus: 'healthy' | 'degraded' | 'error';
}

export interface PerformanceMetrics {
  searchLatency: number;
  embeddingLatency: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  operation: string;
  sessionId?: string;
  query?: string;
  results?: number;
  latency?: number;
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class VectorSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VectorSearchError';
  }
}

export class EmbeddingError extends VectorSearchError {
  constructor(message: string, details?: any) {
    super(message, 'EMBEDDING_ERROR', 'embedding', details);
    this.name = 'EmbeddingError';
  }
}

export class DatabaseError extends VectorSearchError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 'database', details);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends VectorSearchError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 'validation', details);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type Language = 'uk' | 'en';
export type SearchMode = 'semantic' | 'hybrid' | 'keyword';
export type IndexingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BatchOperation<T> {
  items: T[];
  batchSize: number;
  onProgress?: (completed: number, total: number) => void;
  onError?: (error: Error, item: T) => void;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number;
}

// ============================================================================
// WAKO Specific Types
// ============================================================================

export interface WAKORule {
  id: string;
  title: string;
  description: string;
  category: 'scoring' | 'safety' | 'equipment' | 'conduct' | 'competition';
  discipline: string[];
  ruleNumber?: string;
  lastUpdated: Date;
}

export interface ScoringExample {
  id: string;
  technique: string;
  points: number;
  discipline: string;
  description: string;
  videoUrl?: string;
  imageUrl?: string;
}

export interface TechniqueDescription {
  id: string;
  name: string;
  nameUk: string;
  category: 'hand' | 'leg' | 'sweep' | 'combination';
  points: Record<string, number>; // discipline -> points
  description: string;
  descriptionUk: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}