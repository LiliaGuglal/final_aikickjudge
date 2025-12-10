/**
 * Function registry for analytics system
 */

import {
  getK1Statistics,
  getMuayThaiStatistics,
  getBoxingStatistics,
  getMMAStatistics,
  getFighterStatistics,
  getComparativeStatistics,
  getHistoricalTrends,
  FightData,
  FighterStats
} from './data-sources';

export interface AnalyticsFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (...args: any[]) => Promise<any>;
}

/**
 * Registry of all available analytics functions
 */
export const ANALYTICS_FUNCTIONS: AnalyticsFunction[] = [
  {
    name: "get_k1_statistics",
    description: "Отримати статистику боїв K1 включаючи кількість нокаутів, загальну кількість боїв та KO rate",
    parameters: {
      type: "object",
      properties: {},
      required: []
    },
    handler: async (): Promise<FightData> => {
      return await getK1Statistics();
    }
  },
  
  {
    name: "get_muay_thai_statistics", 
    description: "Отримати статистику боїв Muay Thai включаючи нокаути та загальну статистику",
    parameters: {
      type: "object",
      properties: {},
      required: []
    },
    handler: async (): Promise<FightData> => {
      return await getMuayThaiStatistics();
    }
  },
  
  {
    name: "get_boxing_statistics",
    description: "Отримати статистику боксерських боїв включаючи нокаути та KO rate",
    parameters: {
      type: "object", 
      properties: {},
      required: []
    },
    handler: async (): Promise<FightData> => {
      return await getBoxingStatistics();
    }
  },
  
  {
    name: "get_mma_statistics",
    description: "Отримати статистику MMA боїв включаючи нокаути та фініші",
    parameters: {
      type: "object",
      properties: {},
      required: []
    },
    handler: async (): Promise<FightData> => {
      return await getMMAStatistics();
    }
  },
  
  {
    name: "get_fighter_statistics",
    description: "Отримати статистику конкретного бійця включаючи перемоги, поразки та нокаути",
    parameters: {
      type: "object",
      properties: {
        fighter_name: {
          type: "string",
          description: "Ім'я бійця для пошуку статистики"
        }
      },
      required: ["fighter_name"]
    },
    handler: async (fighterName: string): Promise<FighterStats> => {
      return await getFighterStatistics(fighterName);
    }
  },
  
  {
    name: "get_comparative_statistics",
    description: "Отримати порівняльну статистику між різними дисциплінами бойових мистецтв",
    parameters: {
      type: "object",
      properties: {},
      required: []
    },
    handler: async (): Promise<FightData[]> => {
      return await getComparativeStatistics();
    }
  },
  
  {
    name: "get_historical_trends",
    description: "Отримати історичні тренди KO rate для конкретної дисципліни",
    parameters: {
      type: "object",
      properties: {
        discipline: {
          type: "string",
          description: "Назва дисципліни (K1, Muay Thai, Boxing, MMA)"
        }
      },
      required: ["discipline"]
    },
    handler: async (discipline: string): Promise<{year: number; koRate: number}[]> => {
      return await getHistoricalTrends(discipline);
    }
  }
];

/**
 * Get function by name
 */
export function getFunction(name: string): AnalyticsFunction | undefined {
  return ANALYTICS_FUNCTIONS.find(fn => fn.name === name);
}

/**
 * Execute function with parameters
 */
export async function executeFunction(name: string, parameters: Record<string, any>): Promise<any> {
  const func = getFunction(name);
  if (!func) {
    throw new Error(`Function ${name} not found`);
  }
  
  try {
    // Extract parameters in the correct order
    const args: any[] = [];
    if (func.parameters.required) {
      for (const param of func.parameters.required) {
        args.push(parameters[param]);
      }
    }
    
    return await func.handler(...args);
  } catch (error) {
    console.error(`Error executing function ${name}:`, error);
    throw error;
  }
}

/**
 * Get functions schema for LLM
 */
export function getFunctionsSchema() {
  return ANALYTICS_FUNCTIONS.map(func => ({
    name: func.name,
    description: func.description,
    parameters: func.parameters
  }));
}