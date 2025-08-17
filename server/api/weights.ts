/**
 * Weight Reports API Routes
 * Handles animal weight tracking and barn aggregation reports
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { 
  generateAnimalWeightReport,
  computeBarnKPIs,
  AnimalWeightHistory,
  validateWeightEntry,
  checkDuplicateDate,
  WeightEntry
} from '@/lib/weights';
import { dataService } from '@/lib/data-service';
import { firestore } from '@/lib/firestore';
import { verifyToken } from '@/lib/auth';

// GET /api/reports/animal/[animalId]
export async function getAnimalWeightReport(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'غير مخول' });
    }

    const { animalId } = req.query;
    const { from, to } = req.query;

    if (!animalId || typeof animalId !== 'string') {
      return res.status(400).json({ error: 'معرف الحيوان مطلوب' });
    }

    // Get animal data
    const animal = await dataService.animals.getById(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'الحيوان غير موجود' });
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

    // Generate report
    const report = generateAnimalWeightReport(
      weightHistory,
      from as string,
      to as string
    );

    return res.status(200).json({
      success: true,
      data: report,
    });

  } catch (error) {
    console.error('Error generating animal weight report:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ أثناء إنشاء تقرير الأوزان',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
}

// GET /api/reports/barn/[barnId]
export async function getBarnWeightReport(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'غير مخول' });
    }

    const { barnId } = req.query;
    const { from, to } = req.query;

    if (!barnId || typeof barnId !== 'string') {
      return res.status(400).json({ error: 'معرف الحظيرة مطلوب' });
    }

    // Get barn data
    const barn = await dataService.barns.getById(barnId);
    if (!barn) {
      return res.status(404).json({ error: 'الحظيرة غير موجودة' });
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
    const kpis = computeBarnKPIs(
      weightHistories,
      feedingRecords,
      from as string,
      to as string
    );

    // Generate individual animal reports for the table
    const animalReports = weightHistories.map(animal => 
      generateAnimalWeightReport(animal, from as string, to as string)
    );

    return res.status(200).json({
      success: true,
      data: {
        barn: {
          id: barn.id,
          name: barn.name,
          type: barn.type,
          capacity: barn.capacity,
        },
        kpis,
        animals: animalReports,
        dateRange: {
          from: from as string,
          to: to as string,
        },
      },
    });

  } catch (error) {
    console.error('Error generating barn weight report:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ أثناء إنشاء تقرير الحظيرة',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
}

// POST /api/animals/[animalId]/weights
export async function addAnimalWeight(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'غير مخول' });
    }

    const { animalId } = req.query;
    const { date, weightKg } = req.body;

    if (!animalId || typeof animalId !== 'string') {
      return res.status(400).json({ error: 'معرف الحيوان مطلوب' });
    }

    // Validate input
    const validationErrors = validateWeightEntry(date, weightKg);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'بيانات غير صالحة',
        details: validationErrors
      });
    }

    // Get current animal data
    const animal = await dataService.animals.getById(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'الحيوان غير موجود' });
    }

    // Check for duplicate date
    const existingWeights = animal.weightHistory || [];
    if (checkDuplicateDate(existingWeights, date)) {
      return res.status(400).json({ 
        error: 'يوجد وزن مسجل بالفعل في هذا التاريخ'
      });
    }

    // Create new weight entry
    const newWeightEntry: WeightEntry = {
      id: `weight_${Date.now()}`,
      date,
      weightKg: parseFloat(weightKg),
    };

    // Add to weight history
    const updatedWeightHistory = [...existingWeights, newWeightEntry]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Update animal record
    await dataService.animals.update(animalId, {
      weightHistory: updatedWeightHistory,
      weight: parseFloat(weightKg), // Update current weight
      updatedAt: new Date(),
    });

    // Generate updated report
    const weightHistory: AnimalWeightHistory = {
      earTagId: animal.earTagId,
      category: animal.category,
      birthDate: animal.birthDate?.toISOString?.()?.split('T')[0],
      purchaseDate: animal.purchaseDate?.toISOString?.()?.split('T')[0],
      barnId: animal.barnId,
      weightHistory: updatedWeightHistory,
    };

    const report = generateAnimalWeightReport(weightHistory);

    return res.status(201).json({
      success: true,
      message: 'تم إضافة الوزن بنجاح',
      data: {
        weightEntry: newWeightEntry,
        report,
      },
    });

  } catch (error) {
    console.error('Error adding animal weight:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ أثناء إضافة الوزن',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
}

// DELETE /api/animals/[animalId]/weights/[weightId]
export async function deleteAnimalWeight(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'غير مخول' });
    }

    const { animalId, weightId } = req.query;

    if (!animalId || typeof animalId !== 'string') {
      return res.status(400).json({ error: 'معرف الحيوان مطلوب' });
    }

    if (!weightId || typeof weightId !== 'string') {
      return res.status(400).json({ error: 'معرف الوزن مطلوب' });
    }

    // Get current animal data
    const animal = await dataService.animals.getById(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'الحيوان غير موجود' });
    }

    // Find and remove weight entry
    const existingWeights = animal.weightHistory || [];
    const weightIndex = existingWeights.findIndex(w => w.id === weightId);
    
    if (weightIndex === -1) {
      return res.status(404).json({ error: 'الوزن غير موجود' });
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
    });

    return res.status(200).json({
      success: true,
      message: 'تم حذف الوزن بنجاح',
      data: {
        remainingWeights: updatedWeightHistory.length,
      },
    });

  } catch (error) {
    console.error('Error deleting animal weight:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ أثناء حذف الوزن',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
}

// Utility function to verify Firebase Auth token
async function verifyToken(req: NextApiRequest) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    
    // In a real implementation, you would verify the Firebase token here
    // For now, we'll simulate a successful verification
    return { uid: 'test-user', role: 'admin' };
  } catch (error) {
    return null;
  }
}
