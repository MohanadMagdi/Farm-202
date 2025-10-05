/**
 * Weights Data Access Layer
 */

import { db } from './database';
import type { WeightRecord } from '../../shared/types';
import { generateId } from '../utils/id-generator';

export const weightsDb = {
  getAll(): WeightRecord[] {
    const stmt = db.prepare('SELECT * FROM weight_records ORDER BY date DESC');
    return stmt.all() as WeightRecord[];
  },

  getById(id: string): WeightRecord | null {
    const stmt = db.prepare('SELECT * FROM weight_records WHERE id = ?');
    return stmt.get(id) as WeightRecord | null;
  },

  getByAnimalId(animalId: string): WeightRecord[] {
    const stmt = db.prepare(`
      SELECT * FROM weight_records 
      WHERE animalId = ? 
      ORDER BY date DESC
    `);
    return stmt.all(animalId) as WeightRecord[];
  },

  create(data: Omit<WeightRecord, 'id' | 'createdAt'>): string {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO weight_records (id, animalId, weight, date, notes, recordedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.animalId,
      data.weight,
      data.date,
      data.notes || null,
      data.recordedBy || null
    );

    // Update animal's current weight
    const updateAnimal = db.prepare(`
      UPDATE animals SET currentWeight = ?, updatedAt = datetime('now')
      WHERE id = ?
    `);
    updateAnimal.run(data.weight, data.animalId);

    return id;
  },

  update(id: string, data: Partial<Omit<WeightRecord, 'id' | 'createdAt'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(id);

    const stmt = db.prepare(`
      UPDATE weight_records SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
  },

  delete(id: string): void {
    const stmt = db.prepare('DELETE FROM weight_records WHERE id = ?');
    stmt.run(id);
  },

  getStatistics(animalId?: string): any {
    let query = `
      SELECT 
        COUNT(*) as totalRecords,
        AVG(weight) as averageWeight,
        MIN(weight) as minWeight,
        MAX(weight) as maxWeight
      FROM weight_records
    `;
    
    if (animalId) {
      query += ' WHERE animalId = ?';
      const stmt = db.prepare(query);
      return stmt.get(animalId);
    }
    
    const stmt = db.prepare(query);
    return stmt.get();
  },
};
