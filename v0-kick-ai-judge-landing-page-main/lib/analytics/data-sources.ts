/**
 * Data sources for combat sports analytics
 */

export interface FightData {
  totalFights: number;
  knockouts: number;
  koRate: number;
  averageRound: number;
  discipline: string;
  timeframe: string;
}

export interface FighterStats {
  name: string;
  wins: number;
  losses: number;
  knockouts: number;
  koRate: number;
  discipline: string;
}

/**
 * Simulated data source for K1 statistics
 */
export async function getK1Statistics(): Promise<FightData> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    totalFights: 30,
    knockouts: 25,
    koRate: 83.3,
    averageRound: 2.1,
    discipline: "K1",
    timeframe: "2024"
  };
}

/**
 * Simulated data source for Muay Thai statistics
 */
export async function getMuayThaiStatistics(): Promise<FightData> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return {
    totalFights: 45,
    knockouts: 18,
    koRate: 40.0,
    averageRound: 3.2,
    discipline: "Muay Thai",
    timeframe: "2024"
  };
}

/**
 * Simulated data source for Boxing statistics
 */
export async function getBoxingStatistics(): Promise<FightData> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    totalFights: 28,
    knockouts: 12,
    koRate: 42.9,
    averageRound: 4.1,
    discipline: "Boxing",
    timeframe: "2024"
  };
}

/**
 * Simulated data source for MMA statistics
 */
export async function getMMAStatistics(): Promise<FightData> {
  await new Promise(resolve => setTimeout(resolve, 550));
  
  return {
    totalFights: 35,
    knockouts: 8,
    koRate: 22.9,
    averageRound: 2.8,
    discipline: "MMA",
    timeframe: "2024"
  };
}

/**
 * Get fighter-specific statistics
 */
export async function getFighterStatistics(fighterName: string): Promise<FighterStats> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simulated fighter data
  const fighters: Record<string, FighterStats> = {
    "buakaw": {
      name: "Buakaw Banchamek",
      wins: 238,
      losses: 24,
      knockouts: 68,
      koRate: 28.6,
      discipline: "Muay Thai"
    },
    "rico": {
      name: "Rico Verhoeven",
      wins: 63,
      losses: 10,
      knockouts: 33,
      koRate: 52.4,
      discipline: "K1"
    },
    "default": {
      name: fighterName,
      wins: 15,
      losses: 3,
      knockouts: 8,
      koRate: 53.3,
      discipline: "K1"
    }
  };
  
  const key = fighterName.toLowerCase();
  return fighters[key] || fighters["default"];
}

/**
 * Get comparative statistics across disciplines
 */
export async function getComparativeStatistics(): Promise<FightData[]> {
  const [k1, muayThai, boxing, mma] = await Promise.all([
    getK1Statistics(),
    getMuayThaiStatistics(),
    getBoxingStatistics(),
    getMMAStatistics()
  ]);
  
  return [k1, muayThai, boxing, mma];
}

/**
 * Get historical trends data
 */
export async function getHistoricalTrends(discipline: string): Promise<{
  year: number;
  koRate: number;
}[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Simulated historical data
  return [
    { year: 2020, koRate: 45.2 },
    { year: 2021, koRate: 52.1 },
    { year: 2022, koRate: 48.7 },
    { year: 2023, koRate: 55.3 },
    { year: 2024, koRate: 58.9 }
  ];
}