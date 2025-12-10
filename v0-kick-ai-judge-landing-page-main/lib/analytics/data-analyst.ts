/**
 * Data Analyst for processing and analyzing collected data
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AnalysisResult {
  title: string;
  statistics: Array<{
    emoji: string;
    label: string;
    value: string;
    comment?: string;
  }>;
  insights: Array<{
    emoji: string;
    text: string;
  }>;
  conclusion?: string;
}

export class DataAnalyst {
  private genAI: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }
  
  /**
   * Analyze collected data and generate structured report
   */
  async analyzeData(
    originalQuery: string,
    collectedData: Record<string, any>
  ): Promise<AnalysisResult> {
    
    const prompt = `Ти - експертний аналітик даних бойових мистецтв. 
Твоя задача: проаналізувати зібрані дані та створити структурований звіт з емодзі та форматуванням.

Оригінальний запит користувача: "${originalQuery}"

Зібрані дані:
${JSON.stringify(collectedData, null, 2)}

Створи аналітичний звіт у JSON форматі:
{
  "title": "Назва аналітики (наприклад: 'Аналітика по бійцю K1:')",
  "statistics": [
    {
      "emoji": "📊", 
      "label": "Всього боїв",
      "value": "30",
      "comment": "опціональний коментар"
    }
  ],
  "insights": [
    {
      "emoji": "🧠",
      "text": "Аналітичний висновок або інсайт"
    }
  ],
  "conclusion": "Загальний висновок (опціонально)"
}

Правила для емодзі:
- 📊 для загальної статистики/боїв
- 💥 для нокаутів/KO
- 📈 для відсотків/рейтингів  
- ⏱️ для часу/раундів
- 🧠 для висновків/інсайтів
- 🏆 для перемог
- ❌ для поразок
- 🥊 для боксу
- 🦵 для кікбоксингу/К1/муай тай
- 🤼 для MMA

Правила для коментарів:
- Додавай коментарі для високих/низьких показників
- Наприклад: "Це дуже високий показник!" для KO rate > 70%
- "Нокаутує зазвичай у 2-му раунді" для середнього часу
- "Небезпечний на початку бою" для ранніх нокаутів

Пиши українською мовою, будь експертним та інформативним.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'models/gemini-2.5-flash',
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      });

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      try {
        const parsed = JSON.parse(response);
        return this.validateAndCleanResult(parsed);
      } catch (parseError) {
        console.error('Failed to parse analyst response:', response);
        return this.createFallbackResult(originalQuery, collectedData);
      }
      
    } catch (error) {
      console.error('Data analysis failed:', error);
      return this.createFallbackResult(originalQuery, collectedData);
    }
  }
  
  /**
   * Validate and clean the analysis result
   */
  private validateAndCleanResult(result: any): AnalysisResult {
    return {
      title: result.title || 'Аналітичний звіт',
      statistics: Array.isArray(result.statistics) ? result.statistics : [],
      insights: Array.isArray(result.insights) ? result.insights : [],
      conclusion: result.conclusion
    };
  }
  
  /**
   * Create fallback result when LLM analysis fails
   */
  private createFallbackResult(query: string, data: Record<string, any>): AnalysisResult {
    const statistics: AnalysisResult['statistics'] = [];
    const insights: AnalysisResult['insights'] = [];
    
    // Try to extract basic statistics from data
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if ('totalFights' in value) {
          statistics.push({
            emoji: '📊',
            label: 'Всього боїв',
            value: value.totalFights.toString()
          });
        }
        if ('knockouts' in value) {
          statistics.push({
            emoji: '💥',
            label: 'Нокаутів',
            value: value.knockouts.toString()
          });
        }
        if ('koRate' in value) {
          statistics.push({
            emoji: '📈',
            label: 'KO Rate',
            value: `${value.koRate}%`
          });
        }
      }
    });
    
    if (statistics.length > 0) {
      insights.push({
        emoji: '🧠',
        text: 'Дані успішно зібрано та проаналізовано'
      });
    }
    
    return {
      title: 'Аналітичний звіт',
      statistics,
      insights,
      conclusion: 'Базовий аналіз даних завершено'
    };
  }
}