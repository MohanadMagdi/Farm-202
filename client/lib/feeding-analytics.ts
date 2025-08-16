/**
 * Advanced Feeding Analytics and Efficiency Calculations
 * Provides comprehensive feeding efficiency metrics and insights
 */

import type {
  FeedingRecord,
  Animal,
  Barn,
  WarehouseItem,
  WeightRecord,
} from "@shared/types";

export interface FeedingEfficiencyMetrics {
  // Basic metrics
  totalFeedIssued: number; // kg
  animalsCount: number;
  feedPerAnimal: number; // kg per animal
  avgDailyGain: number; // kg per day
  feedingEfficiency: number; // feed per kg gain

  // Advanced metrics
  feedConversionRatio: number; // FCR - industry standard
  costPerKgGain: number; // EGP per kg of weight gain
  feedCostPerAnimal: number; // EGP per animal
  totalFeedCost: number; // EGP

  // Performance indicators
  efficiencyRating: "excellent" | "good" | "average" | "poor" | "critical";
  benchmarkComparison: number; // percentage vs industry benchmark
  trendDirection: "improving" | "stable" | "declining";

  // Optimization suggestions
  optimizationScore: number; // 0-100
  recommendations: string[];
  potentialSavings: number; // EGP per month
}

export interface FeedingTrends {
  period: string;
  feedPerAnimal: number;
  efficiency: number;
  cost: number;
  weightGain: number;
}

export interface BarnFeedingComparison {
  barnId: string;
  barnName: string;
  animalsCount: number;
  feedPerAnimal: number;
  efficiency: number;
  cost: number;
  ranking: number;
  efficiencyVsAverage: number; // percentage difference
}

// Industry benchmarks for different animal categories
const FEEDING_BENCHMARKS = {
  male: {
    excellentFCR: 3.0,
    goodFCR: 4.0,
    averageFCR: 5.0,
    targetADG: 0.25, // kg per day
    maxFeedPerAnimal: 2.5, // kg per day
  },
  female: {
    excellentFCR: 3.5,
    goodFCR: 4.5,
    averageFCR: 5.5,
    targetADG: 0.2, // kg per day
    maxFeedPerAnimal: 2.0, // kg per day
  },
  newborn: {
    excellentFCR: 2.5,
    goodFCR: 3.5,
    averageFCR: 4.5,
    targetADG: 0.15, // kg per day
    maxFeedPerAnimal: 1.0, // kg per day
  },
};

/**
 * Calculate comprehensive feeding efficiency metrics
 */
export function calculateFeedingEfficiencyMetrics(
  feedingRecords: FeedingRecord[],
  animals: Animal[],
  weightRecords: WeightRecord[],
  warehouseItems: WarehouseItem[],
): FeedingEfficiencyMetrics {
  const totalFeedIssued = feedingRecords.reduce(
    (sum, record) => sum + record.quantityServed,
    0,
  );
  const animalsCount = animals.length;
  const feedPerAnimal = animalsCount > 0 ? totalFeedIssued / animalsCount : 0;

  // Calculate average daily gain from weight records
  const avgDailyGain = calculateAverageDailyGain(animals, weightRecords);

  // Feed conversion ratio (industry standard metric)
  const feedConversionRatio =
    avgDailyGain > 0 ? feedPerAnimal / avgDailyGain : 0;
  const feedingEfficiency = feedConversionRatio; // Same as FCR

  // Calculate costs
  const totalFeedCost = calculateFeedCost(feedingRecords, warehouseItems);
  const feedCostPerAnimal = animalsCount > 0 ? totalFeedCost / animalsCount : 0;
  const costPerKgGain = avgDailyGain > 0 ? feedCostPerAnimal / avgDailyGain : 0;

  // Performance rating
  const efficiencyRating = getEfficiencyRating(feedConversionRatio, animals);
  const benchmarkComparison = getBenchmarkComparison(
    feedConversionRatio,
    animals,
  );

  // Calculate optimization score and recommendations
  const optimizationScore = calculateOptimizationScore(
    feedConversionRatio,
    feedPerAnimal,
    avgDailyGain,
    animals,
  );
  const recommendations = generateRecommendations(
    feedConversionRatio,
    feedPerAnimal,
    avgDailyGain,
    animals,
  );
  const potentialSavings = calculatePotentialSavings(
    totalFeedCost,
    optimizationScore,
  );

  return {
    totalFeedIssued,
    animalsCount,
    feedPerAnimal,
    avgDailyGain,
    feedingEfficiency,
    feedConversionRatio,
    costPerKgGain,
    feedCostPerAnimal,
    totalFeedCost,
    efficiencyRating,
    benchmarkComparison,
    trendDirection: "stable", // TODO: Calculate from historical data
    optimizationScore,
    recommendations,
    potentialSavings,
  };
}

/**
 * Calculate average daily gain from weight records
 */
export function calculateAverageDailyGain(
  animals: Animal[],
  weightRecords: WeightRecord[],
): number {
  if (animals.length === 0) return 0;

  let totalGain = 0;
  let totalDays = 0;

  animals.forEach((animal) => {
    const animalWeights = weightRecords
      .filter((record) => record.animalId === animal.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (animalWeights.length >= 2) {
      const firstWeight = animalWeights[0];
      const lastWeight = animalWeights[animalWeights.length - 1];
      const weightGain = lastWeight.weight - firstWeight.weight;
      const daysDiff = Math.max(
        1,
        Math.ceil(
          (lastWeight.date.getTime() - firstWeight.date.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      totalGain += weightGain;
      totalDays += daysDiff;
    } else {
      // Estimate based on birth date or purchase date
      const startDate = animal.birthDate || animal.purchaseDate;
      const daysSinceStart = Math.max(
        1,
        Math.ceil(
          (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      // Estimate birth weight for calculation
      const estimatedBirthWeight =
        animal.category === "newborn"
          ? 3.5
          : animal.category === "female"
            ? 25
            : 20; // kg

      const estimatedGain = Math.max(0, animal.weight - estimatedBirthWeight);
      totalGain += estimatedGain;
      totalDays += daysSinceStart;
    }
  });

  return totalDays > 0 ? totalGain / totalDays : 0;
}

/**
 * Calculate feed cost from feeding records
 */
export function calculateFeedCost(
  feedingRecords: FeedingRecord[],
  warehouseItems: WarehouseItem[],
): number {
  return feedingRecords.reduce((totalCost, record) => {
    const item = warehouseItems.find((item) => item.id === record.feedType);
    const unitPrice = item?.averagePrice || 0;
    return totalCost + record.quantityServed * unitPrice;
  }, 0);
}

/**
 * Get efficiency rating based on FCR and animal type
 */
export function getEfficiencyRating(
  fcr: number,
  animals: Animal[],
): "excellent" | "good" | "average" | "poor" | "critical" {
  if (animals.length === 0 || fcr === 0) return "poor";

  // Get average benchmark based on animal categories
  const categoryCount = animals.reduce(
    (count, animal) => {
      count[animal.category] = (count[animal.category] || 0) + 1;
      return count;
    },
    {} as Record<string, number>,
  );

  const dominantCategory = Object.keys(categoryCount).reduce((a, b) =>
    categoryCount[a] > categoryCount[b] ? a : b,
  ) as keyof typeof FEEDING_BENCHMARKS;

  const benchmark = FEEDING_BENCHMARKS[dominantCategory];

  if (fcr <= benchmark.excellentFCR) return "excellent";
  if (fcr <= benchmark.goodFCR) return "good";
  if (fcr <= benchmark.averageFCR) return "average";
  if (fcr <= benchmark.averageFCR * 1.5) return "poor";
  return "critical";
}

/**
 * Compare performance against industry benchmark
 */
export function getBenchmarkComparison(fcr: number, animals: Animal[]): number {
  if (animals.length === 0 || fcr === 0) return 0;

  const categoryCount = animals.reduce(
    (count, animal) => {
      count[animal.category] = (count[animal.category] || 0) + 1;
      return count;
    },
    {} as Record<string, number>,
  );

  const dominantCategory = Object.keys(categoryCount).reduce((a, b) =>
    categoryCount[a] > categoryCount[b] ? a : b,
  ) as keyof typeof FEEDING_BENCHMARKS;

  const benchmark = FEEDING_BENCHMARKS[dominantCategory].goodFCR;
  return ((benchmark - fcr) / benchmark) * 100; // Positive = better than benchmark
}

/**
 * Calculate optimization score (0-100)
 */
export function calculateOptimizationScore(
  fcr: number,
  feedPerAnimal: number,
  adg: number,
  animals: Animal[],
): number {
  if (animals.length === 0) return 0;

  let score = 100;

  // FCR scoring (40% weight)
  const rating = getEfficiencyRating(fcr, animals);
  const fcrScore =
    rating === "excellent"
      ? 40
      : rating === "good"
        ? 30
        : rating === "average"
          ? 20
          : rating === "poor"
            ? 10
            : 0;

  score = fcrScore;

  // ADG scoring (30% weight)
  const avgTargetADG = 0.2; // kg per day average target
  const adgScore = Math.min(30, (adg / avgTargetADG) * 30);
  score += adgScore;

  // Feed per animal scoring (30% weight)
  const avgMaxFeed = 2.0; // kg per day average max
  const feedScore =
    feedPerAnimal <= avgMaxFeed
      ? 30
      : Math.max(0, 30 - (feedPerAnimal - avgMaxFeed) * 10);
  score += feedScore;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate optimization recommendations
 */
export function generateRecommendations(
  fcr: number,
  feedPerAnimal: number,
  adg: number,
  animals: Animal[],
): string[] {
  const recommendations: string[] = [];

  if (fcr > 5.0) {
    recommendations.push(
      "معدل تحويل العلف مرتفع جداً - راجع نوعية العلف وتركيبته",
    );
    recommendations.push("تحقق من الحالة الصحية للحيوانات وتطعيماتها");
  }

  if (feedPerAnimal > 2.5) {
    recommendations.push(
      "كمية العلف للحيوان الواحد مرتفعة - قم بتقليل الكمية تدريجياً",
    );
    recommendations.push("راجع جودة العلف والتخزين السليم");
  }

  if (adg < 0.15) {
    recommendations.push("معدل النمو اليومي منخفض - حسّن نوعية العلف");
    recommendations.push("تأكد من توفر المياه النظيفة باستمرار");
    recommendations.push("راجع كثافة الحيوانات في الحظائر");
  }

  if (fcr >= 3.0 && fcr <= 4.0) {
    recommendations.push("أداء جيد! حافظ على نظام التغذية الحالي");
    recommendations.push("راقب الأداء بانتظام للحفاظ على الكفاءة");
  }

  if (recommendations.length === 0) {
    recommendations.push("الأداء ممتاز! استمر على النهج الحالي");
  }

  return recommendations;
}

/**
 * Calculate potential monthly savings
 */
export function calculatePotentialSavings(
  currentCost: number,
  optimizationScore: number,
): number {
  const improvementPotential = (100 - optimizationScore) / 100;
  const monthlyCost = currentCost * 30; // Assuming daily cost
  return monthlyCost * improvementPotential * 0.15; // 15% potential savings
}

/**
 * Compare feeding efficiency across barns
 */
export function compareBarnEfficiency(
  feedingRecords: FeedingRecord[],
  barns: Barn[],
  animals: Animal[],
  weightRecords: WeightRecord[],
): BarnFeedingComparison[] {
  const barnComparisons = barns.map((barn) => {
    const barnAnimals = animals.filter((animal) => animal.barnId === barn.id);
    const barnFeeding = feedingRecords.filter(
      (record) => record.barnId === barn.id,
    );

    const totalFeed = barnFeeding.reduce(
      (sum, record) => sum + record.quantityServed,
      0,
    );
    const feedPerAnimal =
      barnAnimals.length > 0 ? totalFeed / barnAnimals.length : 0;
    const adg = calculateAverageDailyGain(barnAnimals, weightRecords);
    const efficiency = adg > 0 ? feedPerAnimal / adg : 0;

    return {
      barnId: barn.id,
      barnName: barn.name,
      animalsCount: barnAnimals.length,
      feedPerAnimal,
      efficiency,
      cost: totalFeed * 15, // Estimate cost per kg
      ranking: 0,
      efficiencyVsAverage: 0,
    };
  });

  // Calculate rankings and averages
  const avgEfficiency =
    barnComparisons.reduce((sum, barn) => sum + barn.efficiency, 0) /
    barnComparisons.length;

  barnComparisons.forEach((barn) => {
    barn.efficiencyVsAverage =
      avgEfficiency > 0
        ? ((avgEfficiency - barn.efficiency) / avgEfficiency) * 100
        : 0;
  });

  // Sort by efficiency (lower is better) and assign rankings
  barnComparisons.sort((a, b) => a.efficiency - b.efficiency);
  barnComparisons.forEach((barn, index) => {
    barn.ranking = index + 1;
  });

  return barnComparisons;
}

/**
 * Generate feeding trends over time
 */
export function generateFeedingTrends(
  feedingRecords: FeedingRecord[],
  animals: Animal[],
  weightRecords: WeightRecord[],
  days: number = 30,
): FeedingTrends[] {
  const trends: FeedingTrends[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayRecords = feedingRecords.filter(
      (record) => record.date.toDateString() === date.toDateString(),
    );

    const totalFeed = dayRecords.reduce(
      (sum, record) => sum + record.quantityServed,
      0,
    );
    const feedPerAnimal = animals.length > 0 ? totalFeed / animals.length : 0;
    const adg = calculateAverageDailyGain(animals, weightRecords);
    const efficiency = adg > 0 ? feedPerAnimal / adg : 0;
    const cost = totalFeed * 15; // Estimate cost

    trends.push({
      period: date.toLocaleDateString("ar-EG"),
      feedPerAnimal,
      efficiency,
      cost,
      weightGain: adg,
    });
  }

  return trends;
}

/**
 * Format efficiency metrics for display
 */
export function formatEfficiencyMetrics(metrics: FeedingEfficiencyMetrics) {
  return {
    ...metrics,
    totalFeedIssuedFormatted: `${metrics.totalFeedIssued.toFixed(1)} كيلو`,
    feedPerAnimalFormatted: `${metrics.feedPerAnimal.toFixed(1)} كيلو`,
    avgDailyGainFormatted: `${metrics.avgDailyGain.toFixed(2)} كيلو/يوم`,
    feedingEfficiencyFormatted: `${metrics.feedingEfficiency.toFixed(1)}`,
    totalFeedCostFormatted: `${metrics.totalFeedCost.toLocaleString("ar-EG")} جنيه`,
    costPerKgGainFormatted: `${metrics.costPerKgGain.toFixed(1)} جنيه/كيلو`,
    potentialSavingsFormatted: `${metrics.potentialSavings.toLocaleString("ar-EG")} جنيه/شهر`,
  };
}
