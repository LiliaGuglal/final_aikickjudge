// WAKO Constants and Predefined Content
// Contains constants, enums, and predefined content for WAKO kickboxing

import { WAKOContentType, KickboxingContext } from './types';

// ============================================================================
// WAKO Disciplines
// ============================================================================

export const WAKO_DISCIPLINES = {
  POINT_FIGHTING: 'point_fighting',
  LIGHT_CONTACT: 'light_contact', 
  KICK_LIGHT: 'kick_light',
  FULL_CONTACT: 'full_contact',
  LOW_KICK: 'low_kick',
  K1: 'k1'
} as const;

export const DISCIPLINE_NAMES = {
  [WAKO_DISCIPLINES.POINT_FIGHTING]: {
    en: 'Point Fighting',
    uk: 'Поінт-файтінг'
  },
  [WAKO_DISCIPLINES.LIGHT_CONTACT]: {
    en: 'Light Contact',
    uk: 'Лайт-контакт'
  },
  [WAKO_DISCIPLINES.KICK_LIGHT]: {
    en: 'Kick Light',
    uk: 'Кік-лайт'
  },
  [WAKO_DISCIPLINES.FULL_CONTACT]: {
    en: 'Full Contact',
    uk: 'Фул-контакт'
  },
  [WAKO_DISCIPLINES.LOW_KICK]: {
    en: 'Low Kick',
    uk: 'Лоу-кік'
  },
  [WAKO_DISCIPLINES.K1]: {
    en: 'K-1',
    uk: 'К-1'
  }
} as const;

// ============================================================================
// Scoring Points by Discipline
// ============================================================================

export const SCORING_POINTS = {
  [WAKO_DISCIPLINES.POINT_FIGHTING]: {
    hand_head: 1,
    hand_body: 1,
    leg_body: 1,
    leg_head: 2,
    leg_body_jump: 2,
    leg_head_jump: 3,
    foot_sweep: 1
  },
  // Continuous disciplines use 1 point per effective technique
  [WAKO_DISCIPLINES.LIGHT_CONTACT]: { effective_technique: 1 },
  [WAKO_DISCIPLINES.KICK_LIGHT]: { effective_technique: 1 },
  [WAKO_DISCIPLINES.FULL_CONTACT]: { effective_technique: 1 },
  [WAKO_DISCIPLINES.LOW_KICK]: { effective_technique: 1 },
  [WAKO_DISCIPLINES.K1]: { effective_technique: 1 }
} as const;

// ============================================================================
// Target Areas
// ============================================================================

export const TARGET_AREAS = {
  HEAD: 'head',
  BODY: 'body',
  LEGS: 'legs' // Only for Low Kick and K-1
} as const;

export const ALLOWED_TARGETS = {
  [WAKO_DISCIPLINES.POINT_FIGHTING]: [TARGET_AREAS.HEAD, TARGET_AREAS.BODY],
  [WAKO_DISCIPLINES.LIGHT_CONTACT]: [TARGET_AREAS.HEAD, TARGET_AREAS.BODY],
  [WAKO_DISCIPLINES.KICK_LIGHT]: [TARGET_AREAS.HEAD, TARGET_AREAS.BODY],
  [WAKO_DISCIPLINES.FULL_CONTACT]: [TARGET_AREAS.HEAD, TARGET_AREAS.BODY],
  [WAKO_DISCIPLINES.LOW_KICK]: [TARGET_AREAS.HEAD, TARGET_AREAS.BODY, TARGET_AREAS.LEGS],
  [WAKO_DISCIPLINES.K1]: [TARGET_AREAS.HEAD, TARGET_AREAS.BODY, TARGET_AREAS.LEGS]
} as const;

// ============================================================================
// Common Techniques
// ============================================================================

export const TECHNIQUES = {
  // Hand techniques
  JAB: { en: 'Jab', uk: 'Джеб' },
  CROSS: { en: 'Cross', uk: 'Кросс' },
  HOOK: { en: 'Hook', uk: 'Хук' },
  UPPERCUT: { en: 'Uppercut', uk: 'Апперкот' },
  
  // Leg techniques
  FRONT_KICK: { en: 'Front Kick', uk: 'Прямий удар ногою' },
  ROUNDHOUSE_KICK: { en: 'Roundhouse Kick', uk: 'Круговий удар ногою' },
  SIDE_KICK: { en: 'Side Kick', uk: 'Боковий удар ногою' },
  BACK_KICK: { en: 'Back Kick', uk: 'Задній удар ногою' },
  AXE_KICK: { en: 'Axe Kick', uk: 'Удар зверху вниз' },
  
  // Special techniques
  FOOT_SWEEP: { en: 'Foot Sweep', uk: 'Підсічка' },
  KNEE_STRIKE: { en: 'Knee Strike', uk: 'Удар коліном' }, // K-1 only
  LOW_KICK: { en: 'Low Kick', uk: 'Лоу-кік' } // Low Kick and K-1 only
} as const;

// ============================================================================
// Violations and Penalties
// ============================================================================

export const VIOLATIONS = {
  OUT_OF_BOUNDS: { en: 'Out of bounds', uk: 'Вихід за межі' },
  PASSIVE_FIGHTING: { en: 'Passive fighting', uk: 'Пасивний бій' },
  ILLEGAL_TECHNIQUE: { en: 'Illegal technique', uk: 'Заборонена техніка' },
  UNSPORTSMANLIKE_CONDUCT: { en: 'Unsportsmanlike conduct', uk: 'Неспортивна поведінка' },
  EQUIPMENT_VIOLATION: { en: 'Equipment violation', uk: 'Порушення екіпіровки' },
  LATE_HIT: { en: 'Late hit', uk: 'Пізній удар' },
  CLINCHING: { en: 'Excessive clinching', uk: 'Надмірний клінч' }
} as const;

export const PENALTIES = {
  WARNING: { en: 'Warning', uk: 'Попередження' },
  MINUS_POINT: { en: 'Minus point', uk: 'Мінус бал' },
  DISQUALIFICATION: { en: 'Disqualification', uk: 'Дискваліфікація' }
} as const;

// ============================================================================
// Default Contexts for Different Content Types
// ============================================================================

export const DEFAULT_CONTEXTS: Record<WAKOContentType, Partial<KickboxingContext>> = {
  [WAKOContentType.TECHNIQUE]: {
    sport: 'kickboxing'
  },
  [WAKOContentType.RULE]: {
    sport: 'kickboxing'
  },
  [WAKOContentType.SCORING]: {
    sport: 'kickboxing'
  },
  [WAKOContentType.VIOLATION]: {
    sport: 'kickboxing'
  },
  [WAKOContentType.PRECEDENT]: {
    sport: 'kickboxing'
  },
  [WAKOContentType.EQUIPMENT]: {
    sport: 'kickboxing'
  },
  [WAKOContentType.SAFETY]: {
    sport: 'kickboxing'
  },
  [WAKOContentType.COMPETITION_FORMAT]: {
    sport: 'kickboxing'
  }
};

// ============================================================================
// Search Keywords and Synonyms
// ============================================================================

export const SEARCH_KEYWORDS = {
  SCORING: {
    en: ['points', 'score', 'scoring', 'technique', 'effective', 'valid'],
    uk: ['бали', 'очки', 'оцінка', 'техніка', 'ефективний', 'дійсний']
  },
  VIOLATIONS: {
    en: ['violation', 'penalty', 'warning', 'foul', 'illegal', 'forbidden'],
    uk: ['порушення', 'штраф', 'попередження', 'фол', 'заборонено', 'недозволено']
  },
  TECHNIQUES: {
    en: ['kick', 'punch', 'strike', 'technique', 'attack', 'defense'],
    uk: ['удар', 'техніка', 'атака', 'захист', 'нога', 'рука']
  },
  EQUIPMENT: {
    en: ['equipment', 'gear', 'protection', 'gloves', 'helmet', 'uniform'],
    uk: ['екіпіровка', 'спорядження', 'захист', 'рукавички', 'шолом', 'форма']
  }
} as const;

// ============================================================================
// Utility Functions for Constants
// ============================================================================

export function getDisciplineNames(discipline: string, language: 'en' | 'uk' = 'en'): string {
  const names = DISCIPLINE_NAMES[discipline as keyof typeof DISCIPLINE_NAMES];
  return names ? names[language] : discipline;
}

export function getTechniqueName(technique: string, language: 'en' | 'uk' = 'en'): string {
  const names = TECHNIQUES[technique as keyof typeof TECHNIQUES];
  return names ? names[language] : technique;
}

export function getViolationName(violation: string, language: 'en' | 'uk' = 'en'): string {
  const names = VIOLATIONS[violation as keyof typeof VIOLATIONS];
  return names ? names[language] : violation;
}

export function isValidDiscipline(discipline: string): boolean {
  return Object.values(WAKO_DISCIPLINES).includes(discipline as any);
}

export function getAllowedTargets(discipline: string): string[] {
  return ALLOWED_TARGETS[discipline as keyof typeof ALLOWED_TARGETS] || [];
}

export function getScoringPoints(discipline: string): Record<string, number> {
  return SCORING_POINTS[discipline as keyof typeof SCORING_POINTS] || {};
}