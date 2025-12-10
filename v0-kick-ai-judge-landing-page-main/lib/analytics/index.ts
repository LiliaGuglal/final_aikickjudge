/**
 * Analytics system exports
 */

// Main engine
export { AnalyticsEngine } from './analytics-engine';
export type { AnalyticsResponse } from './analytics-engine';

// Components
export { LLMRouter } from './llm-router';
export type { RoutingResult } from './llm-router';

export { DataAnalyst } from './data-analyst';
export type { AnalysisResult } from './data-analyst';

export { OutputFormatter } from './output-formatter';

// Function system
export { 
  ANALYTICS_FUNCTIONS, 
  getFunction, 
  executeFunction, 
  getFunctionsSchema 
} from './function-registry';
export type { AnalyticsFunction } from './function-registry';

// Data sources
export {
  getK1Statistics,
  getMuayThaiStatistics,
  getBoxingStatistics,
  getMMAStatistics,
  getFighterStatistics,
  getComparativeStatistics,
  getHistoricalTrends
} from './data-sources';
export type { FightData, FighterStats } from './data-sources';