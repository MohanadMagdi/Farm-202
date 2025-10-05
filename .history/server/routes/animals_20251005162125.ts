import { RequestHandler } from "express";
import { animalsDb } from "../db";

/**
 * Animals API endpoints using local SQLite database
 */

export const getAllAnimalsHandler: RequestHandler = async (req, res) => {
  try {
    const { category, barnId, earTag } = req.query;

    let animals;
    if (category) {
      animals = animalsDb.getByCategory(category as string);
    } else if (barnId) {
      animals = animalsDb.getByBarn(barnId as string);
    } else if (earTag) {
      const animal = animalsDb.getByEarTag(earTag as string);
      animals = animal ? [animal] : [];
    } else {
      animals = animalsDb.getAll();
    }

    res.status(200).json(animals);
  } catch (error) {
    console.error('Error in getAllAnimalsHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

export const getAnimalByIdHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const animal = animalsDb.getById(id);

    if (!animal) {
      return res.status(404).json({ error: 'الحيوان غير موجود' });
    }

    res.status(200).json(animal);
  } catch (error) {
    console.error('Error in getAnimalByIdHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

export const createAnimalHandler: RequestHandler = async (req, res) => {
  try {
    const data = req.body;

    // Check if earTag already exists
    const existing = animalsDb.getByEarTag(data.earTag);
    if (existing) {
      return res.status(400).json({ error: 'رقم الأذن موجود مسبقاً' });
    }

    const id = animalsDb.create(data);

    res.status(201).json({
      message: 'تم إضافة الحيوان بنجاح',
      data: { id }
    });
  } catch (error) {
    console.error('Error in createAnimalHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

export const updateAnimalHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const animal = animalsDb.getById(id);
    if (!animal) {
      return res.status(404).json({ error: 'الحيوان غير موجود' });
    }

    animalsDb.update(id, data);

    res.status(200).json({ message: 'تم تحديث الحيوان بنجاح' });
  } catch (error) {
    console.error('Error in updateAnimalHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};

export const deleteAnimalHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const animal = animalsDb.getById(id);
    if (!animal) {
      return res.status(404).json({ error: 'الحيوان غير موجود' });
    }

    animalsDb.delete(id);

    res.status(200).json({ message: 'تم حذف الحيوان بنجاح' });
  } catch (error) {
    console.error('Error in deleteAnimalHandler:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};
