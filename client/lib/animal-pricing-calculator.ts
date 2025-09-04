/**
 * Animal Pricing Calculator
 * Calculates the actual feed cost and total cost for individual animals
 * Based on the formulas provided for accurate animal pricing
 */

import type { Animal, WeightRecord, FeedingRecord, WarehouseItem } from "@shared/types";

export interface AnimalCostBreakdown {
  animalId: string;
  earTagId: string;
  
  // Growth metrics
  initialWeight: number;
  currentWeight: number;
  weightGain: number;
  daysInMeasurement: number;
  avgDailyGain: number; // ADG
  
  // Feed calculations based on provided formulas
  nonActualFeedPerAnimal: number; // إجمالي العلف / عدد الحيوانات
  growthPercentage: number; // نسبة الزيادة = ADG الفردي / مجموع ADG الكلي
  actualFeedConsumption: number; // كمية الأكل الفعلية = نسبة الزيادة * إجمالي العلف
  
  // Cost calculations
  feedCostPerKg: number; // تكلفة الكيلو من العلف
  totalFeedCost: number; // تكلفة العلف الكلية للحيوان
  purchasePrice: number; // سعر الشراء
  totalInvestment: number; // إجمالي الاستثمار (شراء + علف)
  
  // Pricing calculations
  currentMarketPrice: number; // السعر الحالي في السوق
  profitLoss: number; // الربح أو الخسارة
  profitMargin: number; // هامش الربح %
  recommendedSellPrice: number; // السعر المقترح للبيع
}

/**
 * Calculate Average Daily Gain (ADG) for an animal
 * ADG = (وزن 2 - وزن 1) / فرق التواريخ (عدد الأيام)
 */
export function calculateADG(
  animal: Animal,
  weightRecords: WeightRecord[]
): { adg: number; weightGain: number; daysInMeasurement: number } {
  const animalWeights = weightRecords
    .filter(record => record.animalId === animal.id)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (animalWeights.length >= 2) {
    const firstWeight = animalWeights[0];
    const lastWeight = animalWeights[animalWeights.length - 1];
    const weightGain = lastWeight.weight - firstWeight.weight;
    const daysDiff = Math.max(
      1,
      Math.ceil((lastWeight.date.getTime() - firstWeight.date.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    return {
      adg: weightGain / daysDiff,
      weightGain,
      daysInMeasurement: daysDiff
    };
  }

  return { adg: 0, weightGain: 0, daysInMeasurement: 0 };
}

/**
 * Calculate non-actual feed consumption per animal
 * كمية الأكل الغير فعلي للحيوان الواحد = إجمالي العلف / عدد الحيوانات
 */
export function calculateNonActualFeedPerAnimal(
  totalFeed: number,
  animalsCount: number
): number {
  if (animalsCount <= 0) return 0;
  return totalFeed / animalsCount;
}

/**
 * Calculate growth percentage for an animal
 * نسبة الزيادة (%) = معدل الزيادة اليومية لحيوان معين (ADG₁) / مجموع معدل الزيادة اليومية لجميع الحيوانات (ADG_Total)
 */
export function calculateGrowthPercentage(
  individualADG: number,
  totalADG: number
): number {
  if (totalADG <= 0) return 0;
  return individualADG / totalADG;
}

/**
 * Calculate actual feed consumption for an animal
 * كمية الأكل الفعلية للحيوان الواحد (kilo) = نسبة الزيادة * إجمالي العلف
 */
export function calculateActualFeedConsumption(
  growthPercentage: number,
  totalFeed: number
): number {
  return growthPercentage * totalFeed;
}

/**
 * Calculate total cost breakdown for an animal including feed costs
 */
export function calculateAnimalCostBreakdown(
  animal: Animal,
  allAnimals: Animal[],
  weightRecords: WeightRecord[],
  feedingRecords: FeedingRecord[],
  feedCostPerKg: number = 3.5, // متوسط تكلفة الكيلو من العلف
  period: number = 30
): AnimalCostBreakdown {
  // Filter data by period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - period);
  
  const relevantWeightRecords = weightRecords.filter(
    record => record.date >= cutoffDate
  );
  
  const relevantFeedRecords = feedingRecords.filter(
    record => record.date >= cutoffDate
  );

  // Calculate ADG for this animal
  const { adg: avgDailyGain, weightGain, daysInMeasurement } = calculateADG(animal, relevantWeightRecords);
  
  // Calculate total feed consumption in period
  const totalFeedConsumption = relevantFeedRecords.reduce(
    (sum, record) => sum + record.quantityIssued, 
    0
  );
  
  // Calculate total ADG for all animals
  const totalADG = allAnimals.reduce((sum, a) => {
    const { adg } = calculateADG(a, relevantWeightRecords);
    return sum + adg;
  }, 0);
  
  // Calculate non-actual feed per animal (baseline)
  const nonActualFeedPerAnimal = calculateNonActualFeedPerAnimal(
    totalFeedConsumption, 
    allAnimals.length
  );
  
  // Calculate growth percentage using the provided formula
  const growthPercentage = calculateGrowthPercentage(avgDailyGain, totalADG);
  
  // Calculate actual feed consumption using the provided formula
  const actualFeedConsumption = calculateActualFeedConsumption(
    growthPercentage,
    totalFeedConsumption
  );
  
  // Calculate costs
  const totalFeedCost = actualFeedConsumption * feedCostPerKg;
  const purchasePrice = animal.purchasePrice || 0;
  const totalInvestment = purchasePrice + totalFeedCost;
  
  // Market pricing
  const currentMarketPrice = animal.currentPrice || animal.weight * 120; // افتراض 120 جنيه للكيلو
  const profitLoss = currentMarketPrice - totalInvestment;
  const profitMargin = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;
  
  // Recommended sell price (with 20% profit margin)
  const recommendedSellPrice = totalInvestment * 1.2;
  
  const animalWeights = relevantWeightRecords
    .filter(record => record.animalId === animal.id)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const initialWeight = animalWeights.length > 0 
    ? animalWeights[0].weight 
    : (animal.category === "newborn" ? 3.5 : animal.weight || 0);
  
  const currentWeight = animalWeights.length > 0 
    ? animalWeights[animalWeights.length - 1].weight 
    : animal.weight || 0;

  return {
    animalId: animal.id,
    earTagId: animal.earTagId || '',
    initialWeight,
    currentWeight,
    weightGain,
    daysInMeasurement,
    avgDailyGain,
    nonActualFeedPerAnimal,
    growthPercentage,
    actualFeedConsumption,
    feedCostPerKg,
    totalFeedCost,
    purchasePrice,
    totalInvestment,
    currentMarketPrice,
    profitLoss,
    profitMargin,
    recommendedSellPrice
  };
}

/**
 * Calculate cost breakdown for all animals in a group
 */
export function calculateGroupCostBreakdown(
  animals: Animal[],
  weightRecords: WeightRecord[],
  feedingRecords: FeedingRecord[],
  feedCostPerKg: number = 3.5,
  period: number = 30
): AnimalCostBreakdown[] {
  return animals.map(animal => 
    calculateAnimalCostBreakdown(animal, animals, weightRecords, feedingRecords, feedCostPerKg, period)
  );
}
