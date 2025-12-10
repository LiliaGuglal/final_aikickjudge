// Embedding Service for Vector Search
// Integrates with Google Generative AI for text embeddings

import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmbeddingService, Language, EmbeddingError } from './types';
import { getVectorConfig } from './config';
import { getVectorSearchCache } from './cache';

export class GoogleEmbeddingService implements EmbeddingService {
  private genAI: GoogleGenerativeAI;
  private config = getVectorConfig();
  private model: any;
  private cache = getVectorSearchCache();

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new EmbeddingError('GEMINI_API_KEY is required for embedding service');
    }
    
    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.embeddingModel 
    });
  }

  async generateEmbedding(text: string, language?: Language): Promise<number[]> {
    try {
      if (!this.validateTextLength(text)) {
        throw new EmbeddingError(`Text too long: ${text.length} characters`);
      }

      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = await this.cache.getEmbedding(text);
        if (cached) {
          return cached;
        }
      }

      const result = await this.model.embedContent(text);
      const embedding = result.embedding.values;

      // Cache the result
      if (this.config.cacheEnabled && embedding) {
        await this.cache.setEmbedding(text, embedding);
      }

      return embedding;
    } catch (error: any) {
      throw new EmbeddingError(
        `Failed to generate embedding: ${error.message}`,
        { text: text.substring(0, 100), language }
      );
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);
      } catch (error: any) {
        throw new EmbeddingError(
          `Batch embedding failed at batch ${Math.floor(i / this.config.batchSize)}`,
          { batchIndex: i, batchSize: batch.length }
        );
      }
    }
    
    return embeddings;
  }
  validateTextLength(text: string): boolean {
    // Approximate token count (1 token ≈ 4 characters for Ukrainian/English)
    const approximateTokens = text.length / 4;
    return approximateTokens <= this.config.maxTokensPerChunk;
  }

  chunkText(text: string, maxTokens: number, overlap: number): string[] {
    const maxChars = maxTokens * 4; // Approximate character limit
    const overlapChars = overlap * 4;
    
    if (text.length <= maxChars) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxChars;
      
      // Try to break at sentence boundary
      if (end < text.length) {
        const sentenceEnd = text.lastIndexOf('.', end);
        const questionEnd = text.lastIndexOf('?', end);
        const exclamationEnd = text.lastIndexOf('!', end);
        
        const bestEnd = Math.max(sentenceEnd, questionEnd, exclamationEnd);
        if (bestEnd > start + maxChars * 0.5) {
          end = bestEnd + 1;
        }
      }

      chunks.push(text.substring(start, end).trim());
      start = end - overlapChars;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  detectLanguage(text: string): Language {
    // Simple language detection based on Cyrillic characters
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const cyrillicCount = (text.match(cyrillicPattern) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    
    // If more than 30% Cyrillic characters, assume Ukrainian
    return cyrillicCount / totalChars > 0.3 ? 'uk' : 'en';
  }
}

// Factory function for creating embedding service
export function createEmbeddingService(apiKey?: string): EmbeddingService {
  return new GoogleEmbeddingService(apiKey);
}