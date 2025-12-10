// Vector Storage Operations
// Handles CRUD operations for vector documents

// Collection type will be handled dynamically
import { VectorDocument, KnowledgeItem, ContentMetadata, DatabaseError } from './types';
import { getVectorDatabase } from './database';
import { createEmbeddingService } from './embedding-service';

export class VectorStorage {
  private database = getVectorDatabase();
  private embeddingService = createEmbeddingService();

  async storeDocument(item: KnowledgeItem): Promise<string> {
    try {
      const collection = this.database.getCollection();
      const id = item.id || this.generateId();
      
      // Generate embedding for the content
      const embedding = await this.embeddingService.generateEmbedding(
        item.content, 
        item.language
      );

      // Store in ChromaDB
      await collection.add({
        ids: [id],
        embeddings: [embedding],
        documents: [item.content],
        metadatas: [{
          title: item.title,
          type: item.type,
          language: item.language,
          source: item.metadata.source,
          tags: JSON.stringify(item.tags),
          kickboxingContext: JSON.stringify(item.metadata.kickboxingContext),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      });

      return id;
    } catch (error: any) {
      throw new DatabaseError(
        `Failed to store document: ${error.message}`,
        { itemId: item.id, itemType: item.type }
      );
    }
  }

  async updateDocument(id: string, updates: Partial<KnowledgeItem>): Promise<void> {
    try {
      const collection = this.database.getCollection();
      
      // Get existing document
      const existing = await this.getDocument(id);
      if (!existing) {
        throw new DatabaseError(`Document not found: ${id}`);
      }

      // Merge updates
      const updated = { ...existing, ...updates };
      
      // Generate new embedding if content changed
      let embedding: number[] | undefined;
      if (updates.content) {
        embedding = await this.embeddingService.generateEmbedding(
          updates.content,
          updated.language
        );
      }

      // Update in ChromaDB
      const updateData: any = {
        ids: [id],
        documents: updates.content ? [updates.content] : undefined,
        metadatas: [{
          title: updated.title,
          type: updated.type,
          language: updated.language,
          source: updated.metadata?.source || existing.metadata.source,
          tags: JSON.stringify(updated.tags || existing.tags),
          kickboxingContext: JSON.stringify(
            updated.metadata?.kickboxingContext || existing.metadata.kickboxingContext
          ),
          updatedAt: new Date().toISOString()
        }]
      };

      if (embedding) {
        updateData.embeddings = [embedding];
      }

      await collection.update(updateData);
    } catch (error: any) {
      throw new DatabaseError(
        `Failed to update document: ${error.message}`,
        { documentId: id }
      );
    }
  }
  async deleteDocument(id: string): Promise<void> {
    try {
      const collection = this.database.getCollection();
      await collection.delete({ ids: [id] });
    } catch (error: any) {
      throw new DatabaseError(
        `Failed to delete document: ${error.message}`,
        { documentId: id }
      );
    }
  }

  async getDocument(id: string): Promise<KnowledgeItem | null> {
    try {
      const collection = this.database.getCollection();
      const result = await collection.get({
        ids: [id],
        include: ['documents', 'metadatas']
      });

      if (!result.documents || result.documents.length === 0) {
        return null;
      }

      const metadata = result.metadatas?.[0] as any;
      if (!metadata) {
        return null;
      }

      return {
        id,
        title: metadata.title,
        content: result.documents[0],
        type: metadata.type,
        language: metadata.language,
        metadata: {
          type: metadata.type,
          language: metadata.language,
          source: metadata.source,
          tags: JSON.parse(metadata.tags || '[]'),
          kickboxingContext: JSON.parse(metadata.kickboxingContext || '{}')
        },
        tags: JSON.parse(metadata.tags || '[]'),
        createdAt: new Date(metadata.createdAt),
        updatedAt: new Date(metadata.updatedAt)
      };
    } catch (error: any) {
      throw new DatabaseError(
        `Failed to get document: ${error.message}`,
        { documentId: id }
      );
    }
  }

  async batchStore(items: KnowledgeItem[]): Promise<string[]> {
    const ids: string[] = [];
    
    try {
      const collection = this.database.getCollection();
      
      // Generate embeddings for all items
      const contents = items.map(item => item.content);
      const embeddings = await this.embeddingService.generateBatchEmbeddings(contents);
      
      // Prepare batch data
      const batchIds = items.map(item => item.id || this.generateId());
      const documents = items.map(item => item.content);
      const metadatas = items.map(item => ({
        title: item.title,
        type: item.type,
        language: item.language,
        source: item.metadata.source,
        tags: JSON.stringify(item.tags),
        kickboxingContext: JSON.stringify(item.metadata.kickboxingContext),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Store batch
      await collection.add({
        ids: batchIds,
        embeddings,
        documents,
        metadatas
      });

      ids.push(...batchIds);
      return ids;
    } catch (error: any) {
      throw new DatabaseError(
        `Batch storage failed: ${error.message}`,
        { itemCount: items.length, storedCount: ids.length }
      );
    }
  }

  async cleanup(maxDocuments: number): Promise<number> {
    try {
      const collection = this.database.getCollection();
      const count = await collection.count();
      
      if (count <= maxDocuments) {
        return 0;
      }

      // Get oldest documents (simplified - in real implementation would sort by date)
      const toDelete = count - maxDocuments;
      const result = await collection.get({
        limit: toDelete,
        include: ['metadatas']
      });

      if (result.ids && result.ids.length > 0) {
        await collection.delete({ ids: result.ids });
        return result.ids.length;
      }

      return 0;
    } catch (error: any) {
      throw new DatabaseError(
        `Cleanup failed: ${error.message}`,
        { maxDocuments }
      );
    }
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let storageInstance: VectorStorage | null = null;

export function getVectorStorage(): VectorStorage {
  if (!storageInstance) {
    storageInstance = new VectorStorage();
  }
  return storageInstance;
}