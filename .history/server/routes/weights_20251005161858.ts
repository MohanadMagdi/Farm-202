import { RequestHandler } from "express";
import { animalsDb, weightsDb } from "../db";

/**
 * Weight API endpoints using local SQLite database
 */

export const getAnimalWeightReportHandler: RequestHandler = async (req, res) => {
  try {
    const { animalId } = req.params;
    
    if (!animalId) {
      return res.status(400).json({ error: 'معرف الحيوان مطلوب' });
    }

    const animal = animalsDb.getById(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'الحيوان غير موجود' });
    }

    const weights = weightsDb.getByAnimalId(animalId);

    const mockReport = {
      earTagId: animal.earTag,
      category: animal.category,
      barnId: animal.currentBarnId || '',
      intervals: weights.map((w, idx, arr) => {
        if (idx === 0) return null;
        const prev = arr[idx - 1];
        const daysDiff = Math.abs(new Date(w.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24);
        const weightGain = w.weight - prev.weight;
        return {
          from: prev.date,
          to: w.date,
          startWeight: prev.weight,
          endWeight: w.weight,
          weightGain,
          adg: daysDiff > 0 ? weightGain / daysDiff : 0,
        };
      }).filter(Boolean),
      cumulative: weights,
      totalWeightGain: weights.length > 1 ? weights[weights.length - 1].weight - weights[0].weight : 0,
      overallADG: 0
    };

    res.status(200).json(mockReport);
  } catch (error) {
    console.error('Error in getAnimalWeightReportHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

export const getBarnWeightReportHandler: RequestHandler = async (req, res) => {
  try {
    const { barnId } = req.params;
    
    if (!barnId) {
      return res.status(400).json({ error: 'معرف الحظيرة مطلوب' });
    }

    const mockReport = {
      barn: { id: barnId, name: `حظيرة ${barnId}`, type: "sheep", capacity: 50 },
      kpis: { totalAnimals: 0, averageWeight: 0, meanADG: 0 },
      animals: []
    };

    res.status(200).json(mockReport);
  } catch (error) {
    console.error('Error in getBarnWeightReportHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

export const addAnimalWeightHandler: RequestHandler = async (req, res) => {
  try {
    const { animalId } = req.params;
    const { date, weightKg, notes } = req.body;
    
    if (!animalId || !date || !weightKg) {
      return res.status(400).json({ error: 'البيانات المطلوبة ناقصة' });
    }

    const animal = animalsDb.getById(animalId);
    if (!animal) {
      return res.status(404).json({ error: 'الحيوان غير موجود' });
    }

    const weightId = weightsDb.create({
      animalId,
      weight: parseFloat(weightKg),
      date,
      notes: notes || '',
      recordedBy: 'system',
    });

    res.status(201).json({
      message: 'تم إضافة الوزن بنجاح',
      data: { id: weightId, animalId, date, weightKg: parseFloat(weightKg) }
    });
  } catch (error) {
    console.error('Error in addAnimalWeightHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

export const deleteAnimalWeightHandler: RequestHandler = async (req, res) => {
  try {
    const { animalId, weightId } = req.params;
    
    if (!animalId || !weightId) {
      return res.status(400).json({ error: 'البيانات المطلوبة ناقصة' });
    }

    weightsDb.delete(weightId);

    res.status(200).json({ message: 'تم حذف الوزن بنجاح' });
  } catch (error) {
    console.error('Error in deleteAnimalWeightHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

export const getAllAnimalsWithWeightsHandler: RequestHandler = async (req, res) => {
  try {
    const animals = animalsDb.getAll();
    const animalsWithWeights = animals.map(animal => {
      const weights = weightsDb.getByAnimalId(animal.id);
      return {
        ...animal,
        weights,
        weightCount: weights.length,
      };
    });

    res.status(200).json(animalsWithWeights);
  } catch (error) {
    console.error('Error in getAllAnimalsWithWeightsHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

export const getWeightStatisticsHandler: RequestHandler = async (req, res) => {
  try {
    const stats = weightsDb.getStatistics();

    res.status(200).json({
      totalRecords: stats.totalRecords || 0,
      averageWeight: stats.averageWeight || 0,
      minWeight: stats.minWeight || 0,
      maxWeight: stats.maxWeight || 0,
    });
  } catch (error) {
    console.error('Error in getWeightStatisticsHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};
      totalAnimals: 0,
      trackedAnimals: 0,
      trackingPercentage: 0,
      averageWeightGain: 0,
      averageADG: 0
    };
    res.status(200).json(mockStats);
  } catch (error) {
    console.error('Error in getWeightStatisticsHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};
