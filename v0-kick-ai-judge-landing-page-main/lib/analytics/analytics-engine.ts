/**
 * Main Analytics Engine - orchestrates the entire analytics pipeline
 */

import { LLMRouter, RoutingResult } from './llm-router';
import { DataAnalyst, AnalysisResult } from './data-analyst';
import { OutputFormatter } from './output-formatter';
import { executeFunction } from './function-registry';

export interface AnalyticsResponse {
  isAnalytics: boolean;
  content: string;
  confidence: number;
  executionTime: number;
  functionsUsed: string[];
}

export class AnalyticsEngine {
  private router: LLMRouter;
  private analyst: DataAnalyst;
  private formatter: OutputFormatter;
  
  constructor(apiKey: string) {
    this.router = new LLMRouter(apiKey);
    this.analyst = new DataAnalyst(apiKey);
    this.formatter = new OutputFormatter();
  }
  
  /**
   * Process user query through the complete analytics pipeline
   */
  async processQuery(query: string): Promise<AnalyticsResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Route the query
      console.log('🔍 Step 1: Routing query...');
      const routing = await this.router.analyzeQuery(query);
      
      if (!routing.isAnalyticsQuery || routing.confidence < 60) {
        return {
          isAnalytics: false,
          content: '',
          confidence: routing.confidence,
          executionTime: Date.now() - startTime,
          functionsUsed: []
        };
      }
      
      console.log('✅ Analytics query detected:', routing);
      
      // Step 2: Execute functions to collect data
      console.log('📊 Step 2: Collecting data...');
      const collectedData: Record<string, any> = {};
      const functionsUsed: string[] = [];
      
      for (const functionName of routing.suggestedFunctions) {
        try {
          console.log(`Executing function: ${functionName}`);
          const result = await executeFunction(functionName, {});
          collectedData[functionName] = result;
          functionsUsed.push(functionName);
        } catch (error) {
          console.error(`Failed to execute ${functionName}:`, error);
          // Continue with other functions
        }
      }
      
      if (Object.keys(collectedData).length === 0) {
        return {
          isAnalytics: true,
          content: this.formatter.formatErrorMessage('Не вдалося зібрати дані для аналізу'),
          confidence: routing.confidence,
          executionTime: Date.now() - startTime,
          functionsUsed: []
        };
      }
      
      console.log('✅ Data collected:', Object.keys(collectedData));
      
      // Step 3: Analyze the collected data
      console.log('🧠 Step 3: Analyzing data...');
      const analysis = await this.analyst.analyzeData(query, collectedData);
      
      // Step 4: Format the output
      console.log('📝 Step 4: Formatting output...');
      let formattedOutput: string;
      
      // Special handling for comparative analysis
      if (routing.suggestedFunctions.includes('get_comparative_statistics')) {
        const comparativeData = collectedData['get_comparative_statistics'];
        if (Array.isArray(comparativeData)) {
          formattedOutput = this.formatter.formatComparativeAnalysis(comparativeData);
        } else {
          formattedOutput = this.formatter.formatAnalysisResult(analysis);
        }
      } else {
        formattedOutput = this.formatter.formatAnalysisResult(analysis);
      }
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Analytics completed in ${executionTime}ms`);
      
      return {
        isAnalytics: true,
        content: formattedOutput,
        confidence: routing.confidence,
        executionTime,
        functionsUsed
      };
      
    } catch (error) {
      console.error('Analytics engine error:', error);
      
      return {
        isAnalytics: true,
        content: this.formatter.formatErrorMessage(
          error instanceof Error ? error.message : 'Невідома помилка аналітики'
        ),
        confidence: 0,
        executionTime: Date.now() - startTime,
        functionsUsed: []
      };
    }
  }
  
  /**
   * Quick check if query might be analytics-related
   */
  isLikelyAnalyticsQuery(query: string): boolean {
    return this.router.isLikelyAnalyticsQuery(query);
  }
  
  /**
   * Get available analytics capabilities
   */
  getCapabilities(): string[] {
    return [
      'Статистика K1 боїв',
      'Статистика Muay Thai',
      'Статистика боксу', 
      'Статистика MMA',
      'Статистика конкретних бійців',
      'Порівняльна аналітика дисциплін',
      'Історичні тренди KO rate'
    ];
  }
}