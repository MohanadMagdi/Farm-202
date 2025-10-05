/**
 * Animals Data Access Layer
 */

import { db } from './database';
import type { Animal } from '../../shared/types';
import { generateId } from '../utils/id-generator';

export const animalsDb = {
  getAll(): Animal[] {
    const stmt = db.prepare('SELECT * FROM animals ORDER BY createdAt DESC');
    return stmt.all() as Animal[];
  },

  getById(id: string): Animal | null {
    const stmt = db.prepare('SELECT * FROM animals WHERE id = ?');
    return stmt.get(id) as Animal | null;
  },

  getByEarTag(earTag: string): Animal | null {
    const stmt = db.prepare('SELECT * FROM animals WHERE earTag = ?');
    return stmt.get(earTag) as Animal | null;
  },

  getByBarn(barnId: string): Animal[] {
    const stmt = db.prepare('SELECT * FROM animals WHERE currentBarnId = ?');
    return stmt.all(barnId) as Animal[];
  },

  getByCategory(category: string): Animal[] {
    const stmt = db.prepare('SELECT * FROM animals WHERE category = ?');
    return stmt.all(category) as Animal[];
  },

  create(data: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO animals (
        id, earTag, name, category, breed, gender, birthDate,
        currentBarnId, motherEarTag, fatherEarTag, status,
        acquisitionDate, acquisitionCost, purchaseWeight,
        currentWeight, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.earTag,
      data.name || null,
      data.category,
      data.breed || null,
      data.gender || null,
      data.birthDate || null,
      data.currentBarnId || null,
      data.motherEarTag || null,
      data.fatherEarTag || null,
      data.status || 'active',
      data.acquisitionDate || null,
      data.acquisitionCost || null,
      data.purchaseWeight || null,
      data.currentWeight || null,
      data.notes || null
    );

    return id;
  },

  update(id: string, data: Partial<Omit<Animal, 'id' | 'createdAt'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    fields.push('updatedAt = datetime("now")');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE animals SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
  },

  delete(id: string): void {
    const stmt = db.prepare('DELETE FROM animals WHERE id = ?');
    stmt.run(id);
  },

  search(query: string): Animal[] {
    const stmt = db.prepare(`
      SELECT * FROM animals 
      WHERE earTag LIKE ? OR name LIKE ? OR breed LIKE ?
      ORDER BY createdAt DESC
    `);
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm, searchTerm) as Animal[];
  },
};
