// Sports Context Processing
// Handles domain-specific understanding and terminology

import { 
  WAKOContentType, 
  KickboxingContext, 
  SearchOptions,
  Language 
} from './types';
import { 
  WAKO_DISCIPLINES, 
  TECHNIQUES, 
  VIOLATIONS, 
  SEARCH_KEYWORDS,
  getDisciplineNames,
  getTechniqueName,
  getViolationName
} from './constants';

export class SportsContextProcessor {
  
  /**
   * Analyzes query to extract sports-specific context and intent
   */
  analyzeQuery(query: string, language: Language): QueryAnalysis {
    const normalizedQuery = query.toLowerCase();
    
    return {
      language,
      detectedDiscipline: this.detectDiscipline(normalizedQuery, language),
      contentTypes: this.detectContentTypes(normalizedQuery, language),
      techniques: this.extractTechniques(normalizedQuery, language),
      violations: this.extractViolations(normalizedQuery, language),
      scoringIntent: this.detectScoringIntent(normalizedQuery, language),
      keywords: this.extractKeywords(normalizedQuery, language),
      confidence: this.calculateConfidence(normalizedQuery, language)
    };
  }

  /**
   * Enhances search options based on sports context
   */
  enhanceSearchOptions(query: string, baseOptions: SearchOptions = {}): SearchOptions {
    const analysis = this.analyzeQuery(
      query, 
      baseOptions.language || this.detectLanguage(query)
    );

    const enhanced: SearchOptions = {
      ...baseOptions,
      language: analysis.language
    };

    // Add content type filters based on detected intent
    if (analysis.contentTypes.length > 0) {
      enhanced.contentTypes = analysis.contentTypes;
    }

    // Add discipline filter if detected
    if (analysis.detectedDiscipline) {
      enhanced.discipline = analysis.detectedDiscipline;
    }

    return enhanced;
  }

  /**
   * Processes and normalizes sports terminology
   */
  normalizeSportsTerms(text: string, language: Language): string {
    let normalized = text;

    // Normalize technique names
    Object.entries(TECHNIQUES).forEach(([key, names]) => {
      const searchTerm = names[language];
      const standardTerm = names.en; // Use English as standard
      
      const regex = new RegExp(`\\b${this.escapeRegex(searchTerm)}\\b`, 'gi');
      normalized = normalized.replace(regex, standardTerm);
    });

    // Normalize discipline names
    Object.entries(WAKO_DISCIPLINES).forEach(([key, discipline]) => {
      const displayName = getDisciplineNames(discipline, language);
      const regex = new RegExp(`\\b${this.escapeRegex(displayName)}\\b`, 'gi');
      normalized = normalized.replace(regex, discipline.replace('_', ' '));
    });

    return normalized;
  }

  private detectDiscipline(query: string, language: Language): string | undefined {
    // Check for discipline keywords
    for (const [key, discipline] of Object.entries(WAKO_DISCIPLINES)) {
      const disciplineName = getDisciplineNames(discipline, language).toLowerCase();
      if (query.includes(disciplineName) || query.includes(discipline)) {
        return discipline;
      }
    }

    // Check for discipline-specific terms
    if (this.containsAny(query, ['point', 'поінт', 'stop', 'зупинка'])) {
      return WAKO_DISCIPLINES.POINT_FIGHTING;
    }
    
    if (this.containsAny(query, ['continuous', 'безперервн', 'light contact', 'лайт'])) {
      return WAKO_DISCIPLINES.LIGHT_CONTACT;
    }

    if (this.containsAny(query, ['low kick', 'лоу', 'leg kick', 'удар по ногах'])) {
      return WAKO_DISCIPLINES.LOW_KICK;
    }

    return undefined;
  }
  private detectContentTypes(query: string, language: Language): WAKOContentType[] {
    const types: WAKOContentType[] = [];

    // Scoring-related queries
    if (this.containsKeywords(query, SEARCH_KEYWORDS.SCORING[language])) {
      types.push(WAKOContentType.SCORING);
    }

    // Technique-related queries
    if (this.containsKeywords(query, SEARCH_KEYWORDS.TECHNIQUES[language])) {
      types.push(WAKOContentType.TECHNIQUE);
    }

    // Violation-related queries
    if (this.containsKeywords(query, SEARCH_KEYWORDS.VIOLATIONS[language])) {
      types.push(WAKOContentType.VIOLATION);
    }

    // Equipment-related queries
    if (this.containsKeywords(query, SEARCH_KEYWORDS.EQUIPMENT[language])) {
      types.push(WAKOContentType.EQUIPMENT);
    }

    // Rule-related queries (default if nothing specific detected)
    if (types.length === 0 || this.containsAny(query, ['rule', 'правило', 'regulation', 'регламент'])) {
      types.push(WAKOContentType.RULE);
    }

    return types;
  }

  private extractTechniques(query: string, language: Language): string[] {
    const techniques: string[] = [];

    Object.entries(TECHNIQUES).forEach(([key, names]) => {
      const searchTerm = names[language].toLowerCase();
      if (query.includes(searchTerm)) {
        techniques.push(key);
      }
    });

    return techniques;
  }

  private extractViolations(query: string, language: Language): string[] {
    const violations: string[] = [];

    Object.entries(VIOLATIONS).forEach(([key, names]) => {
      const searchTerm = names[language].toLowerCase();
      if (query.includes(searchTerm)) {
        violations.push(key);
      }
    });

    return violations;
  }

  private detectScoringIntent(query: string, language: Language): boolean {
    const scoringTerms = language === 'uk' 
      ? ['бал', 'очк', 'оцін', 'скільки', 'як оцін']
      : ['point', 'score', 'how many', 'scoring', 'worth'];
    
    return this.containsAny(query, scoringTerms);
  }

  private extractKeywords(query: string, language: Language): string[] {
    const keywords: string[] = [];
    
    // Extract all sports-related keywords
    Object.values(SEARCH_KEYWORDS).forEach(categoryKeywords => {
      categoryKeywords[language].forEach(keyword => {
        if (query.includes(keyword.toLowerCase())) {
          keywords.push(keyword);
        }
      });
    });

    return keywords;
  }

  private calculateConfidence(query: string, language: Language): number {
    let confidence = 0;
    
    // Base confidence for language detection
    confidence += 0.2;
    
    // Boost for sports terminology
    const sportsTerms = this.extractKeywords(query, language);
    confidence += Math.min(sportsTerms.length * 0.15, 0.6);
    
    // Boost for specific techniques or violations
    const techniques = this.extractTechniques(query, language);
    const violations = this.extractViolations(query, language);
    confidence += Math.min((techniques.length + violations.length) * 0.1, 0.3);
    
    // Boost for discipline detection
    if (this.detectDiscipline(query, language)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  private detectLanguage(text: string): Language {
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const cyrillicCount = (text.match(cyrillicPattern) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    
    return cyrillicCount / totalChars > 0.3 ? 'uk' : 'en';
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  private containsAny(text: string, terms: string[]): boolean {
    return terms.some(term => text.includes(term.toLowerCase()));
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Query analysis result interface
export interface QueryAnalysis {
  language: Language;
  detectedDiscipline?: string;
  contentTypes: WAKOContentType[];
  techniques: string[];
  violations: string[];
  scoringIntent: boolean;
  keywords: string[];
  confidence: number;
}

// Singleton instance
let contextProcessorInstance: SportsContextProcessor | null = null;

export function getSportsContextProcessor(): SportsContextProcessor {
  if (!contextProcessorInstance) {
    contextProcessorInstance = new SportsContextProcessor();
  }
  return contextProcessorInstance;
}