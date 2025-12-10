import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { Message, SummaryGenerator as ISummaryGenerator } from './types';
import { memoryConfig } from './config';

/**
 * SummaryGenerator implementation using Gemini 2.5 Flash
 */
export class SummaryGenerator implements ISummaryGenerator {
  private genAI: GoogleGenerativeAI | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the Gemini API client
   */
  private initialize(): void {
    try {
      if (memoryConfig.geminiApiKey) {
        this.genAI = new GoogleGenerativeAI(memoryConfig.geminiApiKey);
        this.isInitialized = true;
      } else {
        console.warn('SummaryGenerator: GEMINI_API_KEY not configured, summarization will be disabled');
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('SummaryGenerator: Failed to initialize Gemini API:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if the summary generator is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.genAI !== null;
  }

  /**
   * Generate a summary of conversation messages using Gemini 2.5 Flash
   */
  async generateSummary(messages: Message[]): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('SummaryGenerator is not available - API key not configured or initialization failed');
    }

    if (!messages || messages.length === 0) {
      return '';
    }

    try {
      const model = this.genAI!.getGenerativeModel({
        model: 'models/gemini-2.5-flash',
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent summaries
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500, // Limit summary length
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      // Format messages for summarization
      const conversationText = this.formatMessagesForSummary(messages);
      
      // Create summarization prompt
      const prompt = this.createSummaryPrompt(conversationText);

      // Generate summary
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      if (!summary || summary.trim().length === 0) {
        throw new Error('Empty summary generated');
      }

      return summary.trim();

    } catch (error: any) {
      console.error('SummaryGenerator: Failed to generate summary:', error);
      
      // Re-throw with more specific error information
      if (error.message?.includes('API key')) {
        throw new Error('Summary generation failed: Invalid API key');
      } else if (error.message?.includes('safety')) {
        throw new Error('Summary generation failed: Content safety violation');
      } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('Summary generation failed: Rate limit exceeded');
      } else {
        throw new Error(`Summary generation failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Format messages for summarization input
   */
  private formatMessagesForSummary(messages: Message[]): string {
    return messages
      .map(msg => {
        const timestamp = msg.timestamp.toISOString();
        return `[${timestamp}] ${msg.role}: ${msg.content}`;
      })
      .join('\n');
  }

  /**
   * Create the summarization prompt
   */
  private createSummaryPrompt(conversationText: string): string {
    return `Ти — експертний АІ-суддя з кікбоксингу (проект KickAI). 
Створи стислий та інформативний резюме наступної розмови, зберігаючи ключові деталі про правила WAKO, суддівство та оцінювання ударів.

Вимоги до резюме:
- Зберегти всі важливі технічні деталі про правила кікбоксингу
- Включити згадані системи оцінювання та штрафні санкції
- Зберегти контекст питань користувача та відповідей
- Бути стислим, але інформативним
- Писати українською мовою

Розмова для резюме:
${conversationText}

Резюме:`;
  }
}

/**
 * Singleton instance of SummaryGenerator
 */
export const summaryGenerator = new SummaryGenerator();