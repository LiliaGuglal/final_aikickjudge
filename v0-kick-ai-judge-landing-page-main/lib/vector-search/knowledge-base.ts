// WAKO Knowledge Base Management
// Handles seeding and management of WAKO rules and content

import { KnowledgeItem, WAKOContentType, ContentMetadata } from './types';
import { createVectorSearchService } from './vector-search-service';
import { WAKO_DISCIPLINES, SCORING_POINTS, TECHNIQUES, VIOLATIONS } from './constants';

export class WAKOKnowledgeBase {
  private searchService = createVectorSearchService();

  async seedInitialContent(): Promise<void> {
    console.log('🌱 Seeding WAKO knowledge base...');
    
    const content: KnowledgeItem[] = [
      ...this.createScoringRules(),
      ...this.createTechniqueDescriptions(),
      ...this.createViolationRules(),
      ...this.createGeneralRules()
    ];

    try {
      const ids = await this.searchService.batchIndexContent(content);
      console.log(`✅ Seeded ${ids.length} knowledge items`);
    } catch (error) {
      console.error('❌ Failed to seed knowledge base:', error);
      throw error;
    }
  }

  private createScoringRules(): KnowledgeItem[] {
    const rules: KnowledgeItem[] = [];

    // Point Fighting scoring
    rules.push({
      title: 'Point Fighting Scoring System',
      content: `WAKO Point Fighting scoring system:
- Hand techniques to head or body: 1 point
- Leg techniques to body: 1 point  
- Foot sweep: 1 point
- Leg techniques to head: 2 points
- Jumping leg techniques to body: 2 points
- Jumping leg techniques to head: 3 points
- Fight stops after each scoring technique
- TKO at 10-point difference`,
      type: WAKOContentType.SCORING,
      language: 'en',
      tags: ['point-fighting', 'scoring', 'points'],
      metadata: this.createMetadata(WAKOContentType.SCORING, 'en', 'point_fighting')
    });

    rules.push({
      title: 'Система оцінювання Поінт-файтінг',
      content: `Система оцінювання WAKO Поінт-файтінг:
- Удари руками в голову або корпус: 1 бал
- Удари ногами в корпус: 1 бал
- Підсічка: 1 бал
- Удари ногами в голову: 2 бали
- Удари ногами в корпус у стрибку: 2 бали
- Удари ногами в голову у стрибку: 3 бали
- Бій зупиняється після кожного влучання
- TKO при розриві в 10 балів`,
      type: WAKOContentType.SCORING,
      language: 'uk',
      tags: ['поінт-файтінг', 'оцінювання', 'бали'],
      metadata: this.createMetadata(WAKOContentType.SCORING, 'uk', 'point_fighting')
    });

    // Continuous disciplines scoring
    rules.push({
      title: 'Continuous Disciplines Scoring',
      content: `WAKO continuous disciplines (Light Contact, Kick Light, Full Contact, Low Kick, K-1):
- 1 effective technique = 1 point on clicker
- Fight continues without stopping
- Scoring criteria: allowed target area, clean technique, power, balance
- Round winner: 10:9 (or 10:8 with dominance/knockdown)
- Judge uses clicker to count effective techniques`,
      type: WAKOContentType.SCORING,
      language: 'en',
      tags: ['continuous', 'light-contact', 'full-contact', 'scoring'],
      metadata: this.createMetadata(WAKOContentType.SCORING, 'en')
    });

    return rules;
  }
  private createTechniqueDescriptions(): KnowledgeItem[] {
    const techniques: KnowledgeItem[] = [];

    techniques.push({
      title: 'Basic Hand Techniques',
      content: `Basic hand techniques in kickboxing:
- Jab: Straight punch with lead hand to head or body
- Cross: Straight punch with rear hand, full body rotation
- Hook: Circular punch targeting side of head or body
- Uppercut: Upward punch targeting chin or solar plexus
All hand techniques score 1 point in Point Fighting when clean and controlled`,
      type: WAKOContentType.TECHNIQUE,
      language: 'en',
      tags: ['hand-techniques', 'punches', 'basic'],
      metadata: this.createMetadata(WAKOContentType.TECHNIQUE, 'en')
    });

    techniques.push({
      title: 'Базові техніки рук',
      content: `Базові техніки рук у кікбоксингу:
- Джеб: Прямий удар передньою рукою в голову або корпус
- Кросс: Прямий удар задньою рукою з поворотом корпусу
- Хук: Круговий удар в бік голови або корпусу
- Апперкот: Удар знизу вверх в підборіддя або сонячне сплетіння
Всі удари руками дають 1 бал у Поінт-файтінг при чистому виконанні`,
      type: WAKOContentType.TECHNIQUE,
      language: 'uk',
      tags: ['техніки-рук', 'удари', 'базові'],
      metadata: this.createMetadata(WAKOContentType.TECHNIQUE, 'uk')
    });

    techniques.push({
      title: 'Leg Techniques and Scoring',
      content: `Leg techniques in kickboxing:
- Front kick: Straight kick with ball of foot or shin
- Roundhouse kick: Circular kick with shin or instep
- Side kick: Lateral kick with heel or blade of foot
- Back kick: Reverse kick with heel
- Axe kick: Downward kick with heel
Scoring in Point Fighting: Body kicks = 1 point, Head kicks = 2 points, Jumping kicks = +1 point bonus`,
      type: WAKOContentType.TECHNIQUE,
      language: 'en',
      tags: ['leg-techniques', 'kicks', 'scoring'],
      metadata: this.createMetadata(WAKOContentType.TECHNIQUE, 'en')
    });

    return techniques;
  }

  private createViolationRules(): KnowledgeItem[] {
    const violations: KnowledgeItem[] = [];

    violations.push({
      title: 'Out of Bounds Penalties',
      content: `Out of bounds (tatami) penalties in WAKO:
- 1st exit: Warning
- 2nd exit: Minus 1 point
- 3rd exit: Minus 1 point  
- 4th exit: Disqualification
Applies to all WAKO disciplines. Fighter must stay within designated competition area.`,
      type: WAKOContentType.VIOLATION,
      language: 'en',
      tags: ['out-of-bounds', 'penalties', 'tatami'],
      metadata: this.createMetadata(WAKOContentType.VIOLATION, 'en')
    });

    violations.push({
      title: 'Штрафи за вихід за межі',
      content: `Штрафи за вихід за межі (татамі) в WAKO:
- 1-й вихід: Попередження
- 2-й вихід: Мінус 1 бал
- 3-й вихід: Мінус 1 бал
- 4-й вихід: Дискваліфікація
Застосовується у всіх дисциплінах WAKO. Боєць повинен залишатися в межах змагальної зони.`,
      type: WAKOContentType.VIOLATION,
      language: 'uk',
      tags: ['вихід-за-межі', 'штрафи', 'татамі'],
      metadata: this.createMetadata(WAKOContentType.VIOLATION, 'uk')
    });

    violations.push({
      title: 'Illegal Techniques and Fouls',
      content: `Common fouls in WAKO kickboxing:
- Strikes below the belt
- Strikes with open glove
- Passive fighting/lack of engagement
- Unsportsmanlike conduct
- Equipment violations
- Late hits after "stop" command
Penalties: Warning or minus point depending on severity`,
      type: WAKOContentType.VIOLATION,
      language: 'en',
      tags: ['fouls', 'illegal-techniques', 'penalties'],
      metadata: this.createMetadata(WAKOContentType.VIOLATION, 'en')
    });

    return violations;
  }

  private createGeneralRules(): KnowledgeItem[] {
    const rules: KnowledgeItem[] = [];

    rules.push({
      title: 'WAKO Competition Formats',
      content: `WAKO kickboxing disciplines:
1. Point Fighting: Light contact, stops after each point
2. Light Contact: Continuous light contact to head/body
3. Kick Light: Light contact with mandatory kicks
4. Full Contact: Full power above the belt
5. Low Kick: Full contact including leg kicks
6. K-1: Full contact with knees and leg kicks
Each discipline has specific rules for contact level and allowed techniques.`,
      type: WAKOContentType.RULE,
      language: 'en',
      tags: ['disciplines', 'formats', 'competition'],
      metadata: this.createMetadata(WAKOContentType.RULE, 'en')
    });

    rules.push({
      title: 'Equipment Requirements',
      content: `Required safety equipment in WAKO:
- Head guard (mandatory in amateur competitions)
- Mouthguard
- Gloves (10oz for seniors, 8oz for juniors)
- Shin guards (in Light Contact, Kick Light)
- Groin protection
- Foot protection (Point Fighting, Light Contact)
Equipment must be approved and in good condition.`,
      type: WAKOContentType.EQUIPMENT,
      language: 'en',
      tags: ['equipment', 'safety', 'protection'],
      metadata: this.createMetadata(WAKOContentType.EQUIPMENT, 'en')
    });

    return rules;
  }

  private createMetadata(type: WAKOContentType, language: 'uk' | 'en', discipline?: string): ContentMetadata {
    return {
      type,
      language,
      source: 'WAKO Official Rules',
      tags: [],
      kickboxingContext: {
        sport: 'kickboxing',
        discipline: discipline as any,
        level: 'official',
        rules: ['WAKO']
      }
    };
  }

  async addCustomContent(content: KnowledgeItem): Promise<string> {
    return await this.searchService.indexContent(content);
  }

  async updateContent(id: string, updates: Partial<KnowledgeItem>): Promise<void> {
    await this.searchService.updateContent(id, updates);
  }

  async deleteContent(id: string): Promise<void> {
    await this.searchService.deleteContent(id);
  }

  async getStats() {
    return await this.searchService.getStats();
  }
}

// Singleton instance
let knowledgeBaseInstance: WAKOKnowledgeBase | null = null;

export function getWAKOKnowledgeBase(): WAKOKnowledgeBase {
  if (!knowledgeBaseInstance) {
    knowledgeBaseInstance = new WAKOKnowledgeBase();
  }
  return knowledgeBaseInstance;
}

// Initialize knowledge base on first import
export async function initializeKnowledgeBase(): Promise<void> {
  const kb = getWAKOKnowledgeBase();
  
  try {
    const stats = await kb.getStats();
    if (stats.totalDocuments === 0) {
      console.log('📚 Knowledge base is empty, seeding initial content...');
      await kb.seedInitialContent();
    } else {
      console.log(`📚 Knowledge base ready with ${stats.totalDocuments} documents`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize knowledge base:', error);
    // Don't throw - allow system to work without vector search
  }
}