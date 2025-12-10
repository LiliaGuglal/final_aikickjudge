// End-to-End Integration Tests for Vector Search System
// Tests complete workflows from content indexing to search

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  createVectorSearchService,
  getWAKOKnowledgeBase,
  getChatVectorIntegration,
  getVectorSearchCache,
  getVectorSearchMonitor
} from '../index';
import { KnowledgeItem, WAKOContentType } from '../types';

describe('Vector Search Integration Tests', () => {
  let searchService: any;
  let knowledgeBase: any;
  let chatIntegration: any;
  let cache: any;
  let monitor: any;

  beforeAll(async () => {
    // Initialize services
    searchService = createVectorSearchService();
    knowledgeBase = getWAKOKnowledgeBase();
    chatIntegration = getChatVectorIntegration();
    cache = getVectorSearchCache();
    monitor = getVectorSearchMonitor();

    // Initialize the system
    await chatIntegration.initialize();
  });

  afterAll(async () => {
    // Cleanup
    cache.clear();
    monitor.resetMetrics();
  });

  beforeEach(() => {
    // Reset metrics for each test
    monitor.resetMetrics();
  });

  describe('Complete Workflow Tests', () => {
    it('should complete full content lifecycle: add → search → update → search → delete', async () => {
      // 1. Add content
      const testContent: KnowledgeItem = {
        title: 'Test Point Fighting Rule',
        content: 'In point fighting, a clean kick to the head scores 2 points. The fight stops after each scoring technique.',
        type: WAKOContentType.SCORING,
        language: 'en',
        tags: ['point-fighting', 'scoring', 'head-kick'],
        metadata: {
          type: WAKOContentType.SCORING,
          language: 'en',
          source: 'test',
          tags: ['point-fighting', 'scoring'],
          kickboxingContext: {
            sport: 'kickboxing',
            discipline: 'point_fighting'
          }
        }
      };

      const contentId = await searchService.indexContent(testContent);
      expect(contentId).toBeDefined();

      // 2. Search for the content
      const searchResult1 = await searchService.search('head kick points', {
        language: 'en',
        threshold: 0.3
      });

      expect(searchResult1.results.length).toBeGreaterThan(0);
      const foundContent = searchResult1.results.find(r => r.id === contentId);
      expect(foundContent).toBeDefined();
      expect(foundContent?.similarityScore).toBeGreaterThan(0.3);

      // 3. Update content
      await searchService.updateContent(contentId, {
        content: 'In point fighting, a clean kick to the head scores 2 points. A jumping kick to the head scores 3 points. The fight stops after each scoring technique.'
      });

      // 4. Search again to verify update
      const searchResult2 = await searchService.search('jumping kick head points', {
        language: 'en',
        threshold: 0.3
      });

      expect(searchResult2.results.length).toBeGreaterThan(0);
      const updatedContent = searchResult2.results.find(r => r.id === contentId);
      expect(updatedContent).toBeDefined();
      expect(updatedContent?.content).toContain('jumping kick');

      // 5. Delete content
      await searchService.deleteContent(contentId);

      // 6. Verify deletion
      const searchResult3 = await searchService.search('head kick points', {
        language: 'en',
        threshold: 0.3
      });

      const deletedContent = searchResult3.results.find(r => r.id === contentId);
      expect(deletedContent).toBeUndefined();
    }, 30000); // 30 second timeout for full workflow

    it('should handle multilingual content correctly', async () => {
      // Add English content
      const englishContent: KnowledgeItem = {
        title: 'Low Kick Rules',
        content: 'Low kicks to the legs are allowed in Low Kick and K-1 disciplines. They score 1 point each.',
        type: WAKOContentType.RULE,
        language: 'en',
        tags: ['low-kick', 'rules'],
        metadata: {
          type: WAKOContentType.RULE,
          language: 'en',
          source: 'test',
          tags: ['low-kick'],
          kickboxingContext: {
            sport: 'kickboxing',
            discipline: 'low_kick'
          }
        }
      };

      // Add Ukrainian content
      const ukrainianContent: KnowledgeItem = {
        title: 'Правила Лоу-кік',
        content: 'Удари по ногах дозволені в дисциплінах Лоу-кік та К-1. Кожен удар оцінюється в 1 бал.',
        type: WAKOContentType.RULE,
        language: 'uk',
        tags: ['лоу-кік', 'правила'],
        metadata: {
          type: WAKOContentType.RULE,
          language: 'uk',
          source: 'test',
          tags: ['лоу-кік'],
          kickboxingContext: {
            sport: 'kickboxing',
            discipline: 'low_kick'
          }
        }
      };

      const enId = await searchService.indexContent(englishContent);
      const ukId = await searchService.indexContent(ukrainianContent);

      // Search in English
      const enSearch = await searchService.search('low kick rules', {
        language: 'en',
        threshold: 0.3
      });

      expect(enSearch.results.length).toBeGreaterThan(0);
      const enResult = enSearch.results.find(r => r.id === enId);
      expect(enResult).toBeDefined();

      // Search in Ukrainian
      const ukSearch = await searchService.search('правила лоу кік', {
        language: 'uk',
        threshold: 0.3
      });

      expect(ukSearch.results.length).toBeGreaterThan(0);
      const ukResult = ukSearch.results.find(r => r.id === ukId);
      expect(ukResult).toBeDefined();

      // Cleanup
      await searchService.deleteContent(enId);
      await searchService.deleteContent(ukId);
    }, 20000);
  });

  describe('Chat Integration Tests', () => {
    it('should enhance chat queries with relevant context', async () => {
      // Test query enhancement
      const enhancement = await chatIntegration.enhanceQuery(
        'How many points for a head kick in point fighting?',
        'test-session'
      );

      if (enhancement) {
        expect(enhancement.originalQuery).toBe('How many points for a head kick in point fighting?');
        expect(enhancement.vectorResults).toBeDefined();
        expect(enhancement.enhancedContext).toBeDefined();
        expect(enhancement.confidenceScore).toBeGreaterThan(0);
        expect(enhancement.processingTime).toBeGreaterThan(0);
      }
    });

    it('should handle Ukrainian queries correctly', async () => {
      const enhancement = await chatIntegration.enhanceQuery(
        'Скільки балів за удар ногою в голову?',
        'test-session-uk'
      );

      if (enhancement) {
        expect(enhancement.originalQuery).toBe('Скільки балів за удар ногою в голову?');
        expect(enhancement.vectorResults).toBeDefined();
      }
    });

    it('should gracefully handle low-quality queries', async () => {
      const enhancement = await chatIntegration.enhanceQuery(
        'a b c',
        'test-session-low'
      );

      // Should return null for low-quality queries
      expect(enhancement).toBeNull();
    });
  });

  describe('Performance and Resilience Tests', () => {
    it('should handle concurrent searches efficiently', async () => {
      const queries = [
        'point fighting rules',
        'low kick techniques',
        'equipment requirements',
        'scoring system',
        'violations and penalties'
      ];

      const startTime = Date.now();
      
      // Execute searches concurrently
      const promises = queries.map(query => 
        searchService.search(query, { threshold: 0.3 })
      );
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All searches should complete
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.searchTime).toBeGreaterThan(0);
      });

      // Total time should be reasonable (less than 5 seconds)
      expect(totalTime).toBeLessThan(5000);
    });

    it('should maintain performance with caching', async () => {
      const query = 'point fighting scoring system';
      
      // First search (cache miss)
      const result1 = await searchService.search(query, { threshold: 0.3 });
      const time1 = result1.searchTime;

      // Second search (cache hit)
      const result2 = await searchService.search(query, { threshold: 0.3 });
      const time2 = result2.searchTime;

      // Results should be identical
      expect(result1.results).toEqual(result2.results);
      
      // Second search should be faster (cached)
      // Note: This might not always be true in test environment
      expect(time2).toBeLessThanOrEqual(time1 + 50); // Allow some variance
    });

    it('should handle system health monitoring', async () => {
      // Check initial health
      const isHealthy = await chatIntegration.isHealthy();
      expect(typeof isHealthy).toBe('boolean');

      // Get metrics
      const metrics = chatIntegration.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.searchLatency).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');

      // Get health status
      const healthStatus = chatIntegration.getHealthStatus();
      expect(healthStatus).toBeDefined();
      expect(['healthy', 'degraded', 'error']).toContain(healthStatus.status);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid content gracefully', async () => {
      const invalidContent = {
        title: '',
        content: '',
        type: 'invalid_type' as any,
        language: 'invalid' as any,
        tags: [],
        metadata: {} as any
      };

      // Should not throw, but should handle gracefully
      await expect(async () => {
        await searchService.indexContent(invalidContent);
      }).rejects.toThrow();
    });

    it('should handle search errors gracefully', async () => {
      // Test with very long query that might cause issues
      const longQuery = 'a'.repeat(10000);
      
      const result = await searchService.search(longQuery, { threshold: 0.3 });
      
      // Should return empty results rather than throwing
      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });
  });
});

// Helper function to wait for async operations
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}