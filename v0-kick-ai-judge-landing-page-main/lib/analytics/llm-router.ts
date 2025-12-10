/**
 * LLM Router for determining query type and routing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFunctionsSchema } from './function-registry';

export interface RoutingResult {
  isAnalyticsQuery: boolean;
  confidence: number;
  suggestedFunctions: string[];
  reasoning: string;
}

export class LLMRouter {
  private genAI: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  /**
   * Analyze query and determine if it requires analytics
   */
  async analyzeQuery(query: string): Promise<RoutingResult> {
    // First try heuristic approach as fallback
    const heuristicResult = this.getHeuristicRouting(query);
    
    // If heuristic confidence is high enough, use it
    if (heuristicResult.confidence >= 80) {
      console.log('Using heuristic routing (high confidence):', heuristicResult);
      return heuristicResult;
    }
    
    const functionsSchema = getFunctionsSchema();
    
    const prompt = `Ти - експертний роутер для системи аналітики бойових мистецтв. 
Твоя задача: визначити, чи потребує запит користувача аналітики даних, і якщо так - які функції потрібно викликати.

Доступні функції:
${functionsSchema.map(f => `- ${f.name}: ${f.description}`).join('\n')}

Запит користувача: "${query}"

Проаналізуй запит і поверни JSON відповідь у такому форматі:
{
  "isAnalyticsQuery": boolean,
  "confidence": number (0-100),
  "suggestedFunctions": ["function_name1", "function_name2"],
  "reasoning": "пояснення чому це аналітичний/не аналітичний запит"
}

Правила:
- isAnalyticsQuery: true якщо запит стосується статистики, аналітики, порівнянь, трендів
- confidence: рівень впевненості у відсотках
- suggestedFunctions: список функцій які потрібно викликати (може бути порожнім)
- reasoning: коротке пояснення українською

Приклади аналітичних запитів:
- "статистика нокаутів у К1"
- "порівняй KO rate між дисциплінами" 
- "скільки нокаутів у муай тай"
- "статистика бійця Буакав"

Приклади НЕ аналітичних запитів:
- "що таке правила WAKO"
- "як рахуються бали в поінт файтінгу"
- "привіт"`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'models/gemini-2.5-flash',
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent routing
          maxOutputTokens: 500,
        }
      });

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response);
        const llmResult = {
          isAnalyticsQuery: parsed.isAnalyticsQuery || false,
          confidence: parsed.confidence || 0,
          suggestedFunctions: parsed.suggestedFunctions || [],
          reasoning: parsed.reasoning || 'Не вдалося визначити тип запиту'
        };
        
        console.log('LLM routing result:', llmResult);
        return llmResult;
      } catch (parseError) {
        console.error('Failed to parse router response:', response);
        console.log('Falling back to heuristic routing');
        return heuristicResult;
      }
      
    } catch (error) {
      console.error('Router analysis failed:', error);
      console.log('Falling back to heuristic routing');
      return heuristicResult;
    }
  }
  
  /**
   * Quick heuristic check for analytics queries
   */
  isLikelyAnalyticsQuery(query: string): boolean {
    const analyticsKeywords = [
      'статистика', 'аналітика', 'скільки', 'кількість', 'порівняй', 'порівняння',
      'нокаут', 'нокауті', 'нокаутів', 'ko rate', 'тренд', 'історія', 'дані', 'звіт', 'бійець',
      'перемоги', 'поразки', 'відсоток', 'середній', 'загалом', 'всього', 'к1', 'k1',
      'муай тай', 'muay thai', 'бокс', 'boxing', 'mma', 'боїв', 'боях'
    ];
    
    const lowerQuery = query.toLowerCase();
    const hasKeyword = analyticsKeywords.some(keyword => lowerQuery.includes(keyword));
    
    console.log('Analytics keyword check:', {
      query: lowerQuery,
      hasKeyword,
      matchedKeywords: analyticsKeywords.filter(keyword => lowerQuery.includes(keyword))
    });
    
    return hasKeyword;
  }
  
  /**
   * Heuristic-based routing as fallback when LLM fails
   */
  private getHeuristicRouting(query: string): RoutingResult {
    const lowerQuery = query.toLowerCase();
    
    // Define patterns and their corresponding functions
    const patterns = [
      {
        keywords: ['к1', 'k1'],
        functions: ['get_k1_statistics'],
        confidence: 85
      },
      {
        keywords: ['муай тай', 'muay thai'],
        functions: ['get_muay_thai_statistics'],
        confidence: 85
      },
      {
        keywords: ['бокс', 'boxing'],
        functions: ['get_boxing_statistics'],
        confidence: 85
      },
      {
        keywords: ['mma'],
        functions: ['get_mma_statistics'],
        confidence: 85
      },
      {
        keywords: ['порівняй', 'порівняння', 'comparative'],
        functions: ['get_comparative_statistics'],
        confidence: 90
      },
      {
        keywords: ['бійець', 'fighter', 'буакав', 'buakaw', 'rico'],
        functions: ['get_fighter_statistics'],
        confidence: 80
      },
      {
        keywords: ['тренд', 'історія', 'historical'],
        functions: ['get_historical_trends'],
        confidence: 75
      }
    ];
    
    // Check if it's likely an analytics query
    const isAnalytics = this.isLikelyAnalyticsQuery(query);
    
    if (!isAnalytics) {
      return {
        isAnalyticsQuery: false,
        confidence: 95,
        suggestedFunctions: [],
        reasoning: 'Запит не містить ключових слів аналітики'
      };
    }
    
    // Find matching patterns
    const matchedFunctions: string[] = [];
    let maxConfidence = 60; // Base confidence for analytics queries
    
    for (const pattern of patterns) {
      const hasMatch = pattern.keywords.some(keyword => lowerQuery.includes(keyword));
      if (hasMatch) {
        matchedFunctions.push(...pattern.functions);
        maxConfidence = Math.max(maxConfidence, pattern.confidence);
      }
    }
    
    // If no specific patterns matched, use general analytics functions
    if (matchedFunctions.length === 0) {
      if (lowerQuery.includes('нокаут') || lowerQuery.includes('ko')) {
        matchedFunctions.push('get_comparative_statistics');
        maxConfidence = 70;
      } else {
        matchedFunctions.push('get_k1_statistics');
        maxConfidence = 60;
      }
    }
    
    // Remove duplicates
    const uniqueFunctions = [...new Set(matchedFunctions)];
    
    return {
      isAnalyticsQuery: true,
      confidence: maxConfidence,
      suggestedFunctions: uniqueFunctions,
      reasoning: `Евристичний аналіз: знайдено ${uniqueFunctions.length} відповідних функцій`
    };
  }
}