/**
 * Local SQLite Database Setup
 * Replaces Firebase with a local database
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path (stored in project root)
const DB_PATH = path.join(__dirname, '../../farm-data.db');

// Initialize database lazily to avoid errors during Vite build
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

export const db = new Proxy({} as Database.Database, {
  get(target, prop) {
    return (getDb() as any)[prop];
  }
});

// Create tables
export function initializeDatabase() {
  console.log('Initializing local database...');

  // Animals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY,
      earTag TEXT UNIQUE NOT NULL,
      name TEXT,
      category TEXT NOT NULL,
      breed TEXT,
      gender TEXT,
      birthDate TEXT,
      currentBarnId TEXT,
      motherEarTag TEXT,
      fatherEarTag TEXT,
      status TEXT DEFAULT 'active',
      acquisitionDate TEXT,
      acquisitionCost REAL,
      purchaseWeight REAL,
      currentWeight REAL,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Barns table
  db.exec(`
    CREATE TABLE IF NOT EXISTS barns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      capacity INTEGER,
      currentOccupancy INTEGER DEFAULT 0,
      type TEXT,
      location TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Warehouse items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS warehouse_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      arabicName TEXT,
      type TEXT NOT NULL,
      category TEXT,
      currentStock REAL DEFAULT 0,
      unit TEXT NOT NULL,
      reorderPoint REAL,
      costPerUnit REAL,
      supplier TEXT,
      expiryDate TEXT,
      location TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Stock movements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      itemId TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      date TEXT NOT NULL,
      reference TEXT,
      notes TEXT,
      costPerUnit REAL,
      totalCost REAL,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (itemId) REFERENCES warehouse_items(id)
    )
  `);

  // Weight records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS weight_records (
      id TEXT PRIMARY KEY,
      animalId TEXT NOT NULL,
      weight REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      recordedBy TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
    )
  `);

  // Feeding records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feeding_records (
      id TEXT PRIMARY KEY,
      animalId TEXT,
      barnId TEXT,
      feedType TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      date TEXT NOT NULL,
      cost REAL,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE,
      FOREIGN KEY (barnId) REFERENCES barns(id) ON DELETE SET NULL
    )
  `);

  // Health records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS health_records (
      id TEXT PRIMARY KEY,
      animalId TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      diagnosis TEXT,
      treatment TEXT,
      medication TEXT,
      cost REAL,
      veterinarian TEXT,
      followUpDate TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
    )
  `);

  // Barn movements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS barn_movements (
      id TEXT PRIMARY KEY,
      animalId TEXT NOT NULL,
      fromBarnId TEXT,
      toBarnId TEXT NOT NULL,
      date TEXT NOT NULL,
      reason TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE,
      FOREIGN KEY (fromBarnId) REFERENCES barns(id) ON DELETE SET NULL,
      FOREIGN KEY (toBarnId) REFERENCES barns(id) ON DELETE CASCADE
    )
  `);

  // Feeding schedules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feeding_schedules (
      id TEXT PRIMARY KEY,
      barnId TEXT,
      feedType TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      frequency TEXT NOT NULL,
      time TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT,
      active INTEGER DEFAULT 1,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (barnId) REFERENCES barns(id) ON DELETE CASCADE
    )
  `);

  // Barn equipment table
  db.exec(`
    CREATE TABLE IF NOT EXISTS barn_equipment (
      id TEXT PRIMARY KEY,
      barnId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      quantity INTEGER DEFAULT 1,
      purchaseDate TEXT,
      cost REAL,
      status TEXT DEFAULT 'active',
      maintenanceSchedule TEXT,
      lastMaintenance TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (barnId) REFERENCES barns(id) ON DELETE CASCADE
    )
  `);

  // Mortality records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mortality_records (
      id TEXT PRIMARY KEY,
      animalId TEXT NOT NULL,
      date TEXT NOT NULL,
      cause TEXT,
      age INTEGER,
      weight REAL,
      veterinaryReport TEXT,
      disposalMethod TEXT,
      financialImpact REAL,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Feed efficiency records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS feed_efficiency_records (
      id TEXT PRIMARY KEY,
      animalId TEXT,
      barnId TEXT,
      periodStart TEXT NOT NULL,
      periodEnd TEXT NOT NULL,
      totalFeedConsumed REAL NOT NULL,
      weightGain REAL NOT NULL,
      feedConversionRatio REAL,
      cost REAL,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE,
      FOREIGN KEY (barnId) REFERENCES barns(id) ON DELETE SET NULL
    )
  `);

  // Create indexes for better query performance
  const dbInstance = getDb();
  dbInstance.exec(`
    CREATE INDEX IF NOT EXISTS idx_animals_earTag ON animals(earTag);
    CREATE INDEX IF NOT EXISTS idx_animals_barnId ON animals(currentBarnId);
    CREATE INDEX IF NOT EXISTS idx_animals_category ON animals(category);
    CREATE INDEX IF NOT EXISTS idx_weight_records_animalId ON weight_records(animalId);
    CREATE INDEX IF NOT EXISTS idx_weight_records_date ON weight_records(date);
    CREATE INDEX IF NOT EXISTS idx_feeding_records_animalId ON feeding_records(animalId);
    CREATE INDEX IF NOT EXISTS idx_feeding_records_barnId ON feeding_records(barnId);
    CREATE INDEX IF NOT EXISTS idx_health_records_animalId ON health_records(animalId);
    CREATE INDEX IF NOT EXISTS idx_barn_movements_animalId ON barn_movements(animalId);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_itemId ON stock_movements(itemId);
  `);

  console.log('Database initialized successfully!');
}

// Don't initialize on import - let the server do it when it starts
// initializeDatabase();

export default db;
