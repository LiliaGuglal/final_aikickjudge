// Test Setup for Vector Search Integration Tests
// Sets up test environment and mocks

import { beforeAll, afterAll } from 'vitest';

// Mock environment variables for testing
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.CHROMA_URL = ':memory:';
process.env.VECTOR_SEARCH_ENABLED = 'true';
process.env.VECTOR_SIMILARITY_THRESHOLD = '0.3';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up vector search integration tests...');
  
  // Any global setup can go here
});

afterAll(async () => {
  console.log('🧹 Cleaning up vector search integration tests...');
  
  // Any global cleanup can go here
});