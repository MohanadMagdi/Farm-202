import { Animal, WeightRecord, MortalityRecord, AnimalCategory, MortalityCause } from "@shared/types";
import { dataService } from "./data-service";

export interface ADGDataPoint {
  date: Date;
  weight: number;
  adg: number; // Average Daily Gain since last record
  cumulativeADG: number; // Average since birth/start
  ageInDays: number;
}

export interface GrowthCurveData {
  animalId: string;
  earTagId: string;
  category: AnimalCategory;
  sex: 'male' | 'female';
  birthDate: Date;
  dataPoints: ADGDataPoint[];
  currentWeight: number;
  totalGain: number;
  averageADG: number;
  growthEfficiency: number; // percentage compared to breed standard
}

export interface MortalityAnalytics {
  totalDeaths: number;
  mortalityRate: number; // percentage
  deathsByCause: Record<MortalityCause, number>;
  deathsByMonth: Array<{ month: string; count: number; rate: number }>;
  deathsByCategory: Record<AnimalCategory, number>;
  preventableDeaths: number;
  totalFinancialLoss: number;
  averageAgeAtDeath: number;
  riskFactors: Array<{ factor: string; impact: number; description: string }>;
}

export interface GrowthAnalytics {
  totalAnimalsTracked: number;
  averageADG: number;
  topPerformers: Array<{ animalId: string; earTagId: string; adg: number }>;
  poorPerformers: Array<{ animalId: string; earTagId: string; adg: number }>;
  growthTrends: Array<{ month: string; averageADG: number; count: number }>;
  categoryComparison: Record<AnimalCategory, { averageADG: number; count: number }>;
  weightDistribution: Array<{ range: string; count: number; percentage: number }>;
}

export interface AnalyticsDashboardData {
  mortalityAnalytics: MortalityAnalytics;
  growthAnalytics: GrowthAnalytics;
  adgTrends: Array<{ date: Date; averageADG: number; sampleSize: number }>;
  healthMetrics: {
    healthyCount: number;
    sickCount: number;
    isolatedCount: number;
    mortalityTrend: number; // percentage change from last month
  };
}

// Standard growth benchmarks for comparison
export const GROWTH_BENCHMARKS = {
  male: {
    expectedADG: 250, // grams per day
    minimumADG: 150,
    excellentADG: 350
  },
  female: {
    expectedADG: 200,
    minimumADG: 120,
    excellentADG: 280
  },
  newborn: {
    expectedADG: 180,
    minimumADG: 100,
    excellentADG: 250
  }
};

/**
 * Calculate Average Daily Gain (ADG) between two weight records
 */
export function calculateADG(startWeight: number, endWeight: number, daysBetween: number): number {
  if (daysBetween <= 0) return 0;
  const weightGain = endWeight - startWeight;
  return (weightGain * 1000) / daysBetween; // Convert to grams per day
}

/**
 * Calculate age in days from birth date
 */
export function calculateAgeInDays(birthDate: Date, targetDate?: Date): number {
  const target = targetDate || new Date();
  const diffTime = target.getTime() - birthDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate growth curve data for an animal
 */
export async function generateGrowthCurve(animal: Animal): Promise<GrowthCurveData | null> {
  try {
    if (!animal.birthDate && !animal.purchaseDate) {
      return null; // Can't calculate growth without start date
    }

    const startDate = animal.birthDate || animal.purchaseDate;
    const weightRecords = await dataService.weightRecords.query([
      { field: 'animalId', operator: '==', value: animal.id }
    ]);

    // Sort by date
    const sortedRecords = weightRecords.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Add initial weight (birth/purchase)
    const initialRecord = {
      date: startDate,
      weight: animal.birthDate ? 3.5 : animal.weight, // Assume 3.5kg birth weight
      recordedBy: 'system'
    };

    const allRecords = [initialRecord, ...sortedRecords];
    const dataPoints: ADGDataPoint[] = [];

    let cumulativeGain = 0;
    let totalDays = 0;

    for (let i = 0; i < allRecords.length; i++) {
      const record = allRecords[i];
      const ageInDays = calculateAgeInDays(startDate, record.date);
      
      let adg = 0;
      if (i > 0) {
        const prevRecord = allRecords[i - 1];
        const daysBetween = calculateAgeInDays(prevRecord.date, record.date);
        adg = calculateADG(prevRecord.weight, record.weight, daysBetween);
      }

      if (i > 0) {
        cumulativeGain += (record.weight - allRecords[i - 1].weight) * 1000; // grams
        totalDays = ageInDays;
      }

      const cumulativeADG = totalDays > 0 ? cumulativeGain / totalDays : 0;

      dataPoints.push({
        date: record.date,
        weight: record.weight,
        adg,
        cumulativeADG,
        ageInDays
      });
    }

    const currentWeight = dataPoints[dataPoints.length - 1]?.weight || animal.weight;
    const initialWeight = dataPoints[0]?.weight || 0;
    const totalGain = currentWeight - initialWeight;
    const averageADG = dataPoints.length > 1 ? 
      dataPoints.slice(1).reduce((sum, point) => sum + point.adg, 0) / (dataPoints.length - 1) : 0;

    // Calculate growth efficiency compared to benchmark
    const benchmark = GROWTH_BENCHMARKS[animal.category];
    const growthEfficiency = benchmark ? (averageADG / benchmark.expectedADG) * 100 : 100;

    return {
      animalId: animal.id,
      earTagId: animal.earTagId,
      category: animal.category,
      sex: animal.sex,
      birthDate: startDate,
      dataPoints,
      currentWeight,
      totalGain,
      averageADG,
      growthEfficiency
    };
  } catch (error) {
    console.error('Error generating growth curve:', error);
    return null;
  }
}

/**
 * Get mortality analytics
 */
export async function getMortalityAnalytics(): Promise<MortalityAnalytics> {
  try {
    const mortalityRecords = await dataService.mortalityRecords?.getAll() || [];
    if (!mortalityRecords || mortalityRecords.length === 0) {
      // Return empty analytics if no mortality data
      return {
        totalDeaths: 0,
        mortalityRate: 0,
        deathsByCause: {} as Record<MortalityCause, number>,
        deathsByMonth: [],
        deathsByCategory: {} as Record<AnimalCategory, number>,
        preventableDeaths: 0,
        totalFinancialLoss: 0,
        averageAgeAtDeath: 0,
        riskFactors: []
      };
    }
    const allAnimals = await dataService.animals.getAll();
    const totalAnimals = allAnimals.length + mortalityRecords.length; // Include dead animals

    // Basic stats
    const totalDeaths = mortalityRecords.length;
    const mortalityRate = totalAnimals > 0 ? (totalDeaths / totalAnimals) * 100 : 0;

    // Deaths by cause
    const deathsByCause = mortalityRecords.reduce((acc, record) => {
      acc[record.cause] = (acc[record.cause] || 0) + 1;
      return acc;
    }, {} as Record<MortalityCause, number>);

    // Deaths by month (last 12 months)
    const deathsByMonth: Array<{ month: string; count: number; rate: number }> = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
      
      const monthDeaths = mortalityRecords.filter(record => {
        const recordMonth = record.deathDate.getMonth();
        const recordYear = record.deathDate.getFullYear();
        return recordMonth === monthDate.getMonth() && recordYear === monthDate.getFullYear();
      }).length;

      // Calculate monthly rate (approximate based on average herd size)
      const monthlyRate = totalAnimals > 0 ? (monthDeaths / totalAnimals) * 100 : 0;

      deathsByMonth.push({
        month: monthName,
        count: monthDeaths,
        rate: monthlyRate
      });
    }

    // Deaths by category
    const deathsByCategory = mortalityRecords.reduce((acc, record) => {
      acc[record.animalCategory] = (acc[record.animalCategory] || 0) + 1;
      return acc;
    }, {} as Record<AnimalCategory, number>);

    // Preventable deaths
    const preventableDeaths = mortalityRecords.filter(record => record.preventable).length;

    // Financial loss
    const totalFinancialLoss = mortalityRecords.reduce((sum, record) => sum + record.financialLoss, 0);

    // Average age at death
    const averageAgeAtDeath = mortalityRecords.length > 0 
      ? mortalityRecords.reduce((sum, record) => sum + record.ageAtDeath, 0) / mortalityRecords.length 
      : 0;

    // Risk factors analysis
    const riskFactors = [
      {
        factor: 'الأمراض المعدية',
        impact: ((deathsByCause.illness || 0) / totalDeaths) * 100,
        description: 'نسبة الوفيات بسبب الأمراض'
      },
      {
        factor: 'مضاعفات الولادة',
        impact: ((deathsByCause.birth_complications || 0) / totalDeaths) * 100,
        description: 'نسبة الوفيات أثناء أو بعد الولادة'
      },
      {
        factor: 'الحوادث',
        impact: ((deathsByCause.accident || 0) / totalDeaths) * 100,
        description: 'نسبة الوفيات بسبب الحوادث'
      }
    ].filter(factor => factor.impact > 0).sort((a, b) => b.impact - a.impact);

    return {
      totalDeaths,
      mortalityRate,
      deathsByCause,
      deathsByMonth,
      deathsByCategory,
      preventableDeaths,
      totalFinancialLoss,
      averageAgeAtDeath,
      riskFactors
    };
  } catch (error) {
    console.error('Error calculating mortality analytics:', error);
    return {
      totalDeaths: 0,
      mortalityRate: 0,
      deathsByCause: {} as Record<MortalityCause, number>,
      deathsByMonth: [],
      deathsByCategory: {} as Record<AnimalCategory, number>,
      preventableDeaths: 0,
      totalFinancialLoss: 0,
      averageAgeAtDeath: 0,
      riskFactors: []
    };
  }
}

/**
 * Get growth analytics
 */
export async function getGrowthAnalytics(): Promise<GrowthAnalytics> {
  try {
    const animals = await dataService.animals.getAll();
    const activeAnimals = animals.filter(animal => animal.status === 'active');
    
    // Generate growth curves for all animals
    const growthData: GrowthCurveData[] = [];
    for (const animal of activeAnimals) {
      const curve = await generateGrowthCurve(animal);
      if (curve && curve.averageADG > 0) {
        growthData.push(curve);
      }
    }

    const totalAnimalsTracked = growthData.length;
    const averageADG = totalAnimalsTracked > 0 
      ? growthData.reduce((sum, data) => sum + data.averageADG, 0) / totalAnimalsTracked 
      : 0;

    // Top and poor performers
    const sortedByADG = [...growthData].sort((a, b) => b.averageADG - a.averageADG);
    const topPerformers = sortedByADG.slice(0, 5).map(data => ({
      animalId: data.animalId,
      earTagId: data.earTagId,
      adg: Math.round(data.averageADG)
    }));
    const poorPerformers = sortedByADG.slice(-5).reverse().map(data => ({
      animalId: data.animalId,
      earTagId: data.earTagId,
      adg: Math.round(data.averageADG)
    }));

    // Growth trends by month (last 12 months)
    const growthTrends: Array<{ month: string; averageADG: number; count: number }> = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
      
      // Calculate ADG for animals during this month
      const monthlyADGs: number[] = [];
      growthData.forEach(data => {
        const monthlyPoints = data.dataPoints.filter(point => {
          const pointMonth = point.date.getMonth();
          const pointYear = point.date.getFullYear();
          return pointMonth === monthDate.getMonth() && pointYear === monthDate.getFullYear();
        });
        
        if (monthlyPoints.length > 0) {
          const avgADG = monthlyPoints.reduce((sum, point) => sum + point.adg, 0) / monthlyPoints.length;
          if (avgADG > 0) monthlyADGs.push(avgADG);
        }
      });

      const monthlyAverage = monthlyADGs.length > 0 
        ? monthlyADGs.reduce((sum, adg) => sum + adg, 0) / monthlyADGs.length 
        : 0;

      growthTrends.push({
        month: monthName,
        averageADG: Math.round(monthlyAverage),
        count: monthlyADGs.length
      });
    }

    // Category comparison
    const categoryComparison = growthData.reduce((acc, data) => {
      if (!acc[data.category]) {
        acc[data.category] = { totalADG: 0, count: 0, averageADG: 0 };
      }
      acc[data.category].totalADG += data.averageADG;
      acc[data.category].count += 1;
      acc[data.category].averageADG = acc[data.category].totalADG / acc[data.category].count;
      return acc;
    }, {} as Record<AnimalCategory, { averageADG: number; count: number }>);

    // Weight distribution
    const weightRanges = [
      { min: 0, max: 20, label: '0-20 كيلو' },
      { min: 20, max: 40, label: '20-40 كيلو' },
      { min: 40, max: 60, label: '40-60 كيلو' },
      { min: 60, max: 80, label: '60-80 كيلو' },
      { min: 80, max: 100, label: '80-100 كيلو' },
      { min: 100, max: Infinity, label: '100+ كيلو' }
    ];

    const weightDistribution = weightRanges.map(range => {
      const count = activeAnimals.filter(animal => 
        animal.weight >= range.min && animal.weight < range.max
      ).length;
      const percentage = activeAnimals.length > 0 ? (count / activeAnimals.length) * 100 : 0;
      
      return {
        range: range.label,
        count,
        percentage: Math.round(percentage * 10) / 10
      };
    });

    return {
      totalAnimalsTracked,
      averageADG: Math.round(averageADG),
      topPerformers,
      poorPerformers,
      growthTrends,
      categoryComparison,
      weightDistribution
    };
  } catch (error) {
    console.error('Error calculating growth analytics:', error);
    return {
      totalAnimalsTracked: 0,
      averageADG: 0,
      topPerformers: [],
      poorPerformers: [],
      growthTrends: [],
      categoryComparison: {} as Record<AnimalCategory, { averageADG: number; count: number }>,
      weightDistribution: []
    };
  }
}

/**
 * Get complete analytics dashboard data
 */
export async function getAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  try {
    const [mortalityAnalytics, growthAnalytics] = await Promise.all([
      getMortalityAnalytics(),
      getGrowthAnalytics()
    ]);

    // ADG trends (simplified from growth analytics)
    const adgTrends = growthAnalytics.growthTrends.map(trend => ({
      date: new Date(), // This would be more specific in a real implementation
      averageADG: trend.averageADG,
      sampleSize: trend.count
    }));

    // Health metrics
    const animals = await dataService.animals.getAll();
    const healthyCount = animals.filter(a => 
      a.status === 'active' && !a.isIsolated && !a.healthStatus.includes('مريض')
    ).length;
    const sickCount = animals.filter(a => 
      a.healthStatus.includes('مريض') || a.isIsolated
    ).length;
    const isolatedCount = animals.filter(a => a.isIsolated).length;

    // Calculate mortality trend (this would be more sophisticated in practice)
    const mortalityTrend = mortalityAnalytics.deathsByMonth.length > 1 
      ? mortalityAnalytics.deathsByMonth[mortalityAnalytics.deathsByMonth.length - 1].rate - 
        mortalityAnalytics.deathsByMonth[mortalityAnalytics.deathsByMonth.length - 2].rate
      : 0;

    return {
      mortalityAnalytics,
      growthAnalytics,
      adgTrends,
      healthMetrics: {
        healthyCount,
        sickCount,
        isolatedCount,
        mortalityTrend
      }
    };
  } catch (error) {
    console.error('Error getting analytics dashboard data:', error);
    throw error;
  }
}

/**
 * Record a mortality event
 */
export async function recordMortality(mortalityData: Omit<MortalityRecord, 'id' | 'createdAt'>): Promise<void> {
  try {
    const mortalityRecord: MortalityRecord = {
      ...mortalityData,
      id: `mort_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    // Store mortality record (this would use the actual data service)
    console.log('Recording mortality:', mortalityRecord);
    
    // Update animal status to 'dead'
    await dataService.animals.update(mortalityData.animalId, {
      status: 'dead',
      updatedAt: new Date(),
      updatedBy: mortalityData.recordedBy
    });

  } catch (error) {
    console.error('Error recording mortality:', error);
    throw error;
  }
}
