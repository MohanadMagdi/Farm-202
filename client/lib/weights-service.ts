/**
 * Weight Reports Service
 * Handles animal weight tracking and barn aggregation reports
 * Works with both Firebase and Mock data services
 */

import { 
  generateAnimalWeightReport,
  computeBarnKPIs,
  AnimalWeightHistory,
  validateWeightEntry,
  checkDuplicateDate,
  WeightEntry,
  AnimalWeightReport
} from './weights';
import { dataService } from './data-service';
import type { Animal } from '@shared/types';

/**
 * Get animal weight report
 */
export async function getAnimalWeightReport(
  animalId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AnimalWeightReport> {
  try {
    // Get animal data
    const animal = await dataService.animals.getById(animalId);
    if (!animal) {
      throw new Error('الحيوان غير موجود');
    }

    // Convert to weight history format
    const weightHistory: AnimalWeightHistory = {
      earTagId: animal.earTagId,
      category: animal.category,
      birthDate: animal.birthDate?.toISOString?.()?.split('T')[0],
      purchaseDate: animal.purchaseDate?.toISOString?.()?.split('T')[0],
      barnId: animal.barnId,
      weightHistory: animal.weightHistory || [],
    };

    // Generate and return report
    return generateAnimalWeightReport(weightHistory, dateFrom, dateTo);

  } catch (error) {
    console.error('Error generating animal weight report:', error);
    throw new Error('حدث خطأ أثناء إنشاء تقرير الأوزان');
  }
}

/**
 * Get barn weight report with KPIs
 */
export async function getBarnWeightReport(
  barnId: string,
  dateFrom?: string,
  dateTo?: string
) {
  try {
    // Get barn data
    const barn = await dataService.barns.getById(barnId);
    if (!barn) {
      throw new Error('الحظيرة غير موجودة');
    }

    // Get animals in barn
    const allAnimals = await dataService.animals.getAll();
    const barnAnimals = allAnimals.filter(animal => animal.barnId === barnId);

    // Convert to weight history format
    const weightHistories: AnimalWeightHistory[] = barnAnimals.map(animal => ({
      earTagId: animal.earTagId,
      category: animal.category,
      birthDate: animal.birthDate?.toISOString?.()?.split('T')[0],
      purchaseDate: animal.purchaseDate?.toISOString?.()?.split('T')[0],
      barnId: animal.barnId,
      weightHistory: animal.weightHistory || [],
    }));

    // Get feeding records for the barn (if available)
    let feedingRecords: any[] = [];
    try {
      const allFeeding = await dataService.feedingRecords.getAll();
      feedingRecords = allFeeding.filter(record => record.barnId === barnId);
    } catch (error) {
      console.warn('Feeding records not available:', error);
    }

    // Compute barn KPIs
    const kpis = computeBarnKPIs(weightHistories, feedingRecords, dateFrom, dateTo);

    // Generate individual animal reports
    const animalReports = weightHistories.map(animal => 
      generateAnimalWeightReport(animal, dateFrom, dateTo)
    );

    return {
      barn: {
        id: barn.id,
        name: barn.name,
        type: barn.type,
        capacity: barn.capacity,
      },
      kpis,
      animals: animalReports,
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
    };

  } catch (error) {
    console.error('Error generating barn weight report:', error);
    throw new Error('حدث خطأ أثناء إنشاء تقرير الحظيرة');
  }
}

/**
 * Add weight entry to animal
 */
export async function addAnimalWeight(
  animalId: string, 
  date: string, 
  weightKg: number
): Promise<AnimalWeightReport> {
  try {
    // Validate input
    const validationErrors = validateWeightEntry(date, weightKg);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    // Get current animal data
    const animal = await dataService.animals.getById(animalId);
    if (!animal) {
      throw new Error('الحيوان غير موجود');
    }

    // Check for duplicate date
    const existingWeights = animal.weightHistory || [];
    if (checkDuplicateDate(existingWeights, date)) {
      throw new Error('يوجد وزن مسجل بالفعل في هذا التاريخ');
    }

    // Create new weight entry
    const newWeightEntry: WeightEntry = {
      id: `weight_${Date.now()}`,
      date,
      weightKg: parseFloat(weightKg.toString()),
    };

    // Add to weight history and sort by date
    const updatedWeightHistory = [...existingWeights, newWeightEntry]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Update animal record
    await dataService.animals.update(animalId, {
      weightHistory: updatedWeightHistory,
      weight: parseFloat(weightKg.toString()), // Update current weight
      updatedAt: new Date(),
    } as any);

    // Generate and return updated report
    const weightHistory: AnimalWeightHistory = {
      earTagId: animal.earTagId,
      category: animal.category,
      birthDate: animal.birthDate?.toISOString?.()?.split('T')[0],
      purchaseDate: animal.purchaseDate?.toISOString?.()?.split('T')[0],
      barnId: animal.barnId,
      weightHistory: updatedWeightHistory,
    };

    return generateAnimalWeightReport(weightHistory);

  } catch (error) {
    console.error('Error adding animal weight:', error);
    throw new Error(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة الوزن');
  }
}

/**
 * Delete weight entry from animal
 */
export async function deleteAnimalWeight(animalId: string, weightId: string): Promise<void> {
  try {
    // Get current animal data
    const animal = await dataService.animals.getById(animalId);
    if (!animal) {
      throw new Error('الحيوان غير موجود');
    }

    // Find and remove weight entry
    const existingWeights = animal.weightHistory || [];
    const weightExists = existingWeights.some(w => w.id === weightId);
    
    if (!weightExists) {
      throw new Error('الوزن غير موجود');
    }

    // Remove the weight entry
    const updatedWeightHistory = existingWeights.filter(w => w.id !== weightId);

    // Update current weight to the latest remaining weight
    const latestWeight = updatedWeightHistory.length > 0 
      ? updatedWeightHistory[updatedWeightHistory.length - 1].weightKg
      : animal.weight; // Keep existing if no weights remain

    // Update animal record
    await dataService.animals.update(animalId, {
      weightHistory: updatedWeightHistory,
      weight: latestWeight,
      updatedAt: new Date(),
    } as any);

  } catch (error) {
    console.error('Error deleting animal weight:', error);
    throw new Error(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الوزن');
  }
}

/**
 * Get all animals with weight tracking data
 */
export async function getAllAnimalsWithWeights(): Promise<AnimalWeightReport[]> {
  try {
    const allAnimals = await dataService.animals.getAll();
    
    const reports = allAnimals
      .filter(animal => animal.weightHistory && animal.weightHistory.length > 0)
      .map(animal => {
        const weightHistory: AnimalWeightHistory = {
          earTagId: animal.earTagId,
          category: animal.category,
          birthDate: animal.birthDate?.toISOString?.()?.split('T')[0],
          purchaseDate: animal.purchaseDate?.toISOString?.()?.split('T')[0],
          barnId: animal.barnId,
          weightHistory: animal.weightHistory || [],
        };
        
        return generateAnimalWeightReport(weightHistory);
      });

    return reports;

  } catch (error) {
    console.error('Error getting animals with weights:', error);
    throw new Error('حدث خطأ أثناء جلب بيانات الأوزان');
  }
}

/**
 * Get weight statistics for dashboard
 */
export async function getWeightStatistics() {
  try {
    const allAnimals = await dataService.animals.getAll();
    
    const animalsWithWeights = allAnimals.filter(animal => 
      animal.weightHistory && animal.weightHistory.length > 0
    );

    const totalAnimals = allAnimals.length;
    const trackedAnimals = animalsWithWeights.length;
    
    let totalWeightGain = 0;
    let totalADG = 0;
    let animalCount = 0;

    animalsWithWeights.forEach(animal => {
      const weightHistory: AnimalWeightHistory = {
        earTagId: animal.earTagId,
        category: animal.category,
        birthDate: animal.birthDate?.toISOString?.()?.split('T')[0],
        purchaseDate: animal.purchaseDate?.toISOString?.()?.split('T')[0],
        barnId: animal.barnId,
        weightHistory: animal.weightHistory || [],
      };
      
      const report = generateAnimalWeightReport(weightHistory);
      
      if (report.totalWeightGain && report.overallADG) {
        totalWeightGain += report.totalWeightGain;
        if (report.overallADG > 0) {
          totalADG += report.overallADG;
          animalCount++;
        }
      }
    });

    const averageWeightGain = trackedAnimals > 0 ? totalWeightGain / trackedAnimals : 0;
    const averageADG = animalCount > 0 ? totalADG / animalCount : 0;

    return {
      totalAnimals,
      trackedAnimals,
      trackingPercentage: totalAnimals > 0 ? (trackedAnimals / totalAnimals) * 100 : 0,
      averageWeightGain: Math.round(averageWeightGain * 1000) / 1000,
      averageADG: Math.round(averageADG * 1000) / 1000,
    };

  } catch (error) {
    console.error('Error getting weight statistics:', error);
    throw new Error('حدث خطأ أثناء جلب إحصائيات الأوزان');
  }
}
