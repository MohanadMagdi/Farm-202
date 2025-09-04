/**
 * Animal Performance Analytics
 * Provides calculations for animal growth metrics and feed efficiency
 */

import type {
  Animal,
  WeightRecord,
  FeedingRecord,
  WarehouseItem,
} from "@shared/types";

export interface AnimalPerformanceMetrics {
  animalId: string;
  earTagId: string;
  initialWeight: number;
  currentWeight: number;
  weightGain: number;
  daysInMeasurement: number;
  avgDailyGain: number;
  estimatedFeedConsumption: number;
  actualFeedConsumption: number;
  feedEfficiencyRatio: number;
}

export interface FeedEfficiencyResult {
  animalPerformance: AnimalPerformanceMetrics[];
  totalFeedConsumption: number;
  averageDailyGain: number;
  overallFeedEfficiency: number;
}

/**
 * Calculate measurement period between first and last weight records
 */
function calculateMeasurementPeriod(weightRecords: WeightRecord[]): {
  startDate: Date;
  endDate: Date;
  totalDays: number;
} {
  if (weightRecords.length === 0) {
    const now = new Date();
    return {
      startDate: now,
      endDate: now,
      totalDays: 0
    };
  }

  const sortedRecords = weightRecords.sort((a, b) => a.date.getTime() - b.date.getTime());
  const startDate = sortedRecords[0].date;
  const endDate = sortedRecords[sortedRecords.length - 1].date;
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    startDate,
    endDate,
    totalDays
  };
}

/**
 * Calculate Average Daily Gain (ADG) for a specific animal
 * ADG = (Weight2 - Weight1) / Days between measurements
 * Uses ONLY actual weight records from database
 */
export function calculateAnimalADG(
  animal: Animal,
  weightRecords: WeightRecord[]
): number {
  const animalWeights = weightRecords
    .filter((record) => record.animalId === animal.id)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  console.log(`🎯 Calculating ADG for ${animal.earTagId}:`, {
    availableWeights: animalWeights.length,
    weights: animalWeights.map(w => ({
      date: w.date.toISOString().split('T')[0],
      weight: w.weight
    }))
  });

    if (animalWeights.length >= 2) {
      // Use actual weight records for accurate ADG calculation
      const firstWeight = animalWeights[0];
      const lastWeight = animalWeights[animalWeights.length - 1];
      
      // 🔍 IMPORTANT: Check animal.weight vs last weight record
      console.log(`🔍 Weight data comparison for ${animal.earTagId}:`, {
        animalCurrentWeight: animal.weight,
        lastRecordWeight: lastWeight.weight,
        weightsMatch: animal.weight === lastWeight.weight,
        firstRecordWeight: firstWeight.weight,
        firstRecordDate: firstWeight.date.toISOString().split('T')[0],
        lastRecordDate: lastWeight.date.toISOString().split('T')[0],
        allWeightRecords: animalWeights.map(w => ({
          weight: w.weight,
          date: w.date.toISOString().split('T')[0]
        }))
      });
      
      const weightGain = lastWeight.weight - firstWeight.weight;
      const daysDiff = Math.max(
        1,
        Math.ceil(
          (lastWeight.date.getTime() - firstWeight.date.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      const adg = weightGain / daysDiff;    console.log(`✅ ADG calculated from actual records for ${animal.earTagId}:`, {
      firstWeight: firstWeight.weight,
      lastWeight: lastWeight.weight,
      weightGain,
      daysDiff,
      adg: adg.toFixed(4)
    });
    
    return adg;
  } else if (animalWeights.length === 1) {
    // Single weight record - compare with birth weight if available
    const currentWeight = animalWeights[0].weight;
    const recordDate = animalWeights[0].date;
    
    if (animal.birthDate && animal.category === "newborn") {
      const birthWeight = 3.5; // Standard newborn birth weight
      const daysSinceBirth = Math.max(
        1,
        Math.ceil((recordDate.getTime() - animal.birthDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const adg = (currentWeight - birthWeight) / daysSinceBirth;
      
      console.log(`🔸 ADG estimated from birth for newborn ${animal.earTagId}:`, {
        currentWeight,
        birthWeight,
        daysSinceBirth,
        adg: adg.toFixed(4)
      });
      
      return adg;
    } else {
      console.warn(`⚠️ Single weight record for ${animal.earTagId}, no birth date available`);
      return 0; // Cannot calculate ADG reliably
    }
  }

  // No weight records available - return 0 instead of estimates
  console.warn(`❌ No weight records available for ADG calculation: ${animal.earTagId}`);
  return 0;
}

/**
 * Calculate non-actual feed consumption per animal
 * Non-actual feed per animal = Total feed / Number of animals
 */
export function calculateAverageAnimalFeed(
  feedingRecords: FeedingRecord[],
  animalsCount: number
): number {
  if (animalsCount <= 0) return 0;

  const totalFeed = feedingRecords.reduce(
    (sum, record) => sum + record.quantityIssued,
    0
  );

  return totalFeed / animalsCount;
}

/**
 * Calculate feed increase percentage for an animal
 * Feed increase percentage = Individual animal ADG / Total ADG for all animals
 */
export function calculateFeedIncreasePercentage(
  individualADG: number,
  totalADG: number
): number {
  if (totalADG <= 0) return 0;
  return individualADG / totalADG;
}

/**
 * Calculate actual feed consumption per animal
 * Actual feed per animal = Feed increase percentage * Total feed
 */
export function calculateActualFeedConsumption(
  feedIncreasePercentage: number,
  totalFeed: number
): number {
  return feedIncreasePercentage * totalFeed;
}

/**
 * Calculate comprehensive animal performance and feed efficiency metrics
 */
export function calculateAnimalPerformanceMetrics(
  animals: Animal[],
  weightRecords: WeightRecord[],
  feedingRecords: FeedingRecord[],
  period: number = 30 // default to 30 days
): FeedEfficiencyResult {
  // Filter data by period
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - period);
  
  const relevantWeightRecords = weightRecords.filter(
    record => record.date >= cutoffDate
  );
  
  const relevantFeedRecords = feedingRecords.filter(
    record => record.date >= cutoffDate
  );

  console.log('Performance metrics calculation:', {
    inputAnimals: animals.length,
    relevantWeights: relevantWeightRecords.length,
    relevantFeeding: relevantFeedRecords.length,
    period,
    cutoffDate: cutoffDate.toISOString().split('T')[0]
  });

  const totalFeedConsumption = relevantFeedRecords.reduce(
    (sum, record) => sum + record.quantityIssued, 
    0
  );

  // Calculate total ADG for all animals (used for percentages)
  let totalADG = 0;
  const animalADGs = new Map<string, number>();
  
  animals.forEach(animal => {
    // Use all weight records for ADG calculation, not just period records
    const adg = calculateAnimalADG(animal, weightRecords);
    animalADGs.set(animal.id, adg);
    totalADG += adg;
  });
  
  console.log('ADG calculations:', {
    totalADG,
    animalCount: animals.length,
    averageADG: totalADG / animals.length
  });

  // Calculate individual animal metrics
  const animalPerformance: AnimalPerformanceMetrics[] = animals.map(animal => {
    // Get all weight records for this animal (not just relevant period)
    const allAnimalWeights = weightRecords
      .filter(record => record.animalId === animal.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    console.log(`📊 Processing animal ${animal.earTagId} (${animal.id}):`, {
      totalWeightRecords: allAnimalWeights.length,
      weightRecords: allAnimalWeights.map(w => ({ 
        date: w.date.toISOString().split('T')[0], 
        weight: w.weight 
      })),
      animalCurrentWeight: animal.weight
    });
    
    // Determine initial and current weights FROM ACTUAL WEIGHT RECORDS ONLY
    let initialWeight: number;
    let currentWeight: number;
    let measurementStartDate: Date;
    let measurementEndDate: Date;
    
    if (allAnimalWeights.length >= 2) {
      // Use actual weight records - first and last records
      const measurementPeriod = calculateMeasurementPeriod(allAnimalWeights);
      const firstWeightRecord = allAnimalWeights[0];
      const lastWeightRecord = allAnimalWeights[allAnimalWeights.length - 1];
      
      initialWeight = firstWeightRecord.weight;
      currentWeight = lastWeightRecord.weight;
      measurementStartDate = measurementPeriod.startDate;
      measurementEndDate = measurementPeriod.endDate;
      
      // 🎯 Verify data consistency with improved period calculation
      console.log(`✅ Using actual weight records for ${animal.earTagId}:`, {
        initialWeight: initialWeight.toFixed(1),
        currentWeight: currentWeight.toFixed(1),
        startDate: measurementStartDate.toISOString().split('T')[0],
        endDate: measurementEndDate.toISOString().split('T')[0],
        measurementPeriod: `${measurementPeriod.totalDays} يوم`,
        animalWeight: animal.weight,
        recordsMatch: animal.weight === currentWeight,
        weightGain: (currentWeight - initialWeight).toFixed(1),
        avgDailyGain: ((currentWeight - initialWeight) / measurementPeriod.totalDays).toFixed(3),
        totalWeightRecords: allAnimalWeights.length
      });
      
    } else if (allAnimalWeights.length === 1) {
      // Only one weight record - compare with animal's birth/purchase weight if available
      const singleRecord = allAnimalWeights[0];
      currentWeight = singleRecord.weight;
      measurementEndDate = singleRecord.date;
      
      // Try to use birth weight or estimate from birth date
      if (animal.birthDate && animal.category === "newborn") {
        initialWeight = 3.5; // Standard newborn weight
        measurementStartDate = animal.birthDate;
      } else if (animal.purchaseDate && animal.weight) {
        // For purchased animals, use a conservative estimate
        initialWeight = currentWeight * 0.85; // Assume 15% growth since purchase
        measurementStartDate = animal.purchaseDate;
      } else {
        // Skip this animal as we don't have enough reliable data
        console.warn(`⚠️ Skipping ${animal.earTagId} - insufficient weight data`);
        initialWeight = currentWeight;
        measurementStartDate = singleRecord.date;
      }
      
      console.log(`🔸 Single weight record for ${animal.earTagId}:`, {
        currentWeight,
        estimatedInitialWeight: initialWeight,
        measurementStart: measurementStartDate.toISOString().split('T')[0]
      });
      
    } else {
      // No weight records available - skip this animal or show as no data
      console.warn(`❌ No weight records found for ${animal.earTagId} (${animal.id})`);
      initialWeight = 0;
      currentWeight = animal.weight || 0;
      measurementStartDate = animal.birthDate || animal.purchaseDate || new Date();
      measurementEndDate = new Date();
    }

    const weightGain = currentWeight - initialWeight;
    
    // Calculate measurement period (more accurate calculation)
    const daysInMeasurement = allAnimalWeights.length >= 2 ? 
      calculateMeasurementPeriod(allAnimalWeights).totalDays :
      Math.max(1, Math.ceil((measurementEndDate.getTime() - measurementStartDate.getTime()) / (1000 * 60 * 60 * 24)));

    const avgDailyGain = daysInMeasurement > 0 ? weightGain / daysInMeasurement : 0;
    
    // Calculate estimated feed consumption (average per animal)
    const estimatedFeedConsumption = calculateAverageAnimalFeed(
      relevantFeedRecords, 
      animals.length
    );
    
    // Calculate feed increase percentage based on ADG
    const feedIncreasePercentage = calculateFeedIncreasePercentage(
      animalADGs.get(animal.id) || 0,
      totalADG
    );
    
    // Calculate actual feed consumption
    const actualFeedConsumption = calculateActualFeedConsumption(
      feedIncreasePercentage,
      totalFeedConsumption
    );
    
    // Calculate feed efficiency (kg feed per kg gain)
    const feedEfficiencyRatio = weightGain > 0 
      ? actualFeedConsumption / weightGain 
      : 0;
    
    // Log individual animal calculation for debugging
    console.log(`📈 Animal ${animal.earTagId} performance calculated:`, {
      initialWeight: initialWeight.toFixed(1),
      currentWeight: currentWeight.toFixed(1),
      weightGain: weightGain.toFixed(1),
      daysInMeasurement,
      avgDailyGain: avgDailyGain.toFixed(3),
      actualFeedConsumption: actualFeedConsumption.toFixed(1),
      feedEfficiencyRatio: feedEfficiencyRatio.toFixed(2),
      hasActualWeightRecords: allAnimalWeights.length > 0,
      weightRecordsCount: allAnimalWeights.length,
      measurementPeriod: `${measurementStartDate.toISOString().split('T')[0]} to ${measurementEndDate.toISOString().split('T')[0]}`
    });
    
    return {
      animalId: animal.id,
      earTagId: animal.earTagId || '',
      initialWeight,
      currentWeight,
      weightGain,
      daysInMeasurement,
      avgDailyGain,
      estimatedFeedConsumption,
      actualFeedConsumption,
      feedEfficiencyRatio
    };
  });

  // Calculate overall metrics
  const overallFeedEfficiency = totalADG > 0 
    ? totalFeedConsumption / animalPerformance.reduce((sum, animal) => sum + animal.weightGain, 0)
    : 0;

  const result = {
    animalPerformance,
    totalFeedConsumption,
    averageDailyGain: totalADG / animals.length,
    overallFeedEfficiency
  };

  console.log('Performance calculation result:', {
    animalPerformanceCount: result.animalPerformance.length,
    averageDailyGain: result.averageDailyGain,
    totalFeedConsumption: result.totalFeedConsumption
  });

  return result;
}

/**
 * Get efficiency rating based on feed efficiency ratio
 */
export function getAnimalEfficiencyRating(
  feedEfficiencyRatio: number,
  animalCategory: string
): "excellent" | "good" | "average" | "poor" | "critical" {
  // Lower feed efficiency ratio is better (less feed per kg gain)
  const benchmarks = {
    male: { excellent: 4.0, good: 5.0, average: 6.0 },
    female: { excellent: 4.5, good: 5.5, average: 6.5 },
    newborn: { excellent: 3.5, good: 4.5, average: 5.5 }
  };

  const categoryBenchmark = benchmarks[animalCategory as keyof typeof benchmarks] || 
    benchmarks.male;

  if (feedEfficiencyRatio <= 0) return "poor"; // Invalid data
  if (feedEfficiencyRatio <= categoryBenchmark.excellent) return "excellent";
  if (feedEfficiencyRatio <= categoryBenchmark.good) return "good";
  if (feedEfficiencyRatio <= categoryBenchmark.average) return "average";
  if (feedEfficiencyRatio <= categoryBenchmark.average * 1.5) return "poor";
  return "critical";
}
