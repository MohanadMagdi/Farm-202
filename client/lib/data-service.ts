/**
 * Data Service Layer
 * Automatically switches between Firebase and Mock data based on environment
 */

import { 
  animalsExtendedService,
  barnsService,
  warehouseExtendedService,
  stockMovementsService,
  feedingRecordsService,
  weightRecordsService,
  healthRecordsService,
  barnMovementsService,
  feedingSchedulesService
} from './firestore';

import { mockFirestore } from './firebase-mock';
import type {
  Animal,
  Barn,
  WarehouseItem,
  StockMovement,
  FeedingRecord,
  WeightRecord,
  HealthRecord,
  BarnMovement,
  FeedingSchedule,
  MortalityRecord,
  AnimalCategory,
  WarehouseType
} from '@shared/types';

// Determine if we should use mock data (development mode or no Firebase config)
const useMockData = import.meta.env.DEV || 
  !import.meta.env.VITE_FIREBASE_PROJECT_ID || 
  import.meta.env.VITE_FIREBASE_PROJECT_ID === 'demo-farm-project';

console.log('Data Service Mode:', useMockData ? 'Mock Data' : 'Firebase');

// Mock service adapters
class MockServiceAdapter<T extends { id: string }> {
  constructor(private collectionName: string) {}

  async getAll(): Promise<T[]> {
    const result = await mockFirestore.collection(this.collectionName).get();
    return result.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  async getById(id: string): Promise<T | null> {
    const result = await mockFirestore.collection(this.collectionName).doc(id).get();
    return result.exists ? { id: result.id, ...result.data() } as T : null;
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    const result = await mockFirestore.collection(this.collectionName).add(data);
    return result.id;
  }

  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    await mockFirestore.collection(this.collectionName).doc(id).update(data);
  }

  async delete(id: string): Promise<void> {
    await mockFirestore.collection(this.collectionName).doc(id).delete();
  }

  async query(
    filters: Array<{ field: string; operator: any; value: any }> = []
  ): Promise<T[]> {
    if (filters.length === 0) {
      return this.getAll();
    }

    // For simplicity, handle single filter for now
    const filter = filters[0];
    const result = await mockFirestore.collection(this.collectionName)
      .where(filter.field, filter.operator, filter.value)
      .get();
    
    return result.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }
}

// Extended mock services for specialized operations
class MockAnimalsService extends MockServiceAdapter<Animal> {
  constructor() {
    super('animals');
  }

  async getByCategory(category: AnimalCategory): Promise<Animal[]> {
    return this.query([{ field: 'category', operator: '==', value: category }]);
  }

  async getByBarn(barnId: string): Promise<Animal[]> {
    return this.query([{ field: 'barnId', operator: '==', value: barnId }]);
  }

  async getIsolated(): Promise<Animal[]> {
    return this.query([{ field: 'isIsolated', operator: '==', value: true }]);
  }

  async getPregnant(): Promise<Animal[]> {
    return this.query([{ field: 'isPregnant', operator: '==', value: true }]);
  }

  async checkEarTagExists(earTagId: string, excludeId?: string): Promise<boolean> {
    const animals = await this.query([{ field: 'earTagId', operator: '==', value: earTagId }]);
    
    if (excludeId) {
      return animals.some(animal => animal.id !== excludeId);
    }
    
    return animals.length > 0;
  }

  async getNextEarTagId(category: AnimalCategory): Promise<string> {
    const prefix = category === 'male' ? 'M' : category === 'female' ? 'F' : 'N';
    
    const animals = await this.getByCategory(category);
    
    if (animals.length === 0) {
      return `${prefix}001`;
    }
    
    // Sort by earTagId and get the last one
    const sortedAnimals = animals.sort((a, b) => a.earTagId.localeCompare(b.earTagId));
    const lastEarTag = sortedAnimals[sortedAnimals.length - 1].earTagId;
    const lastNumber = parseInt(lastEarTag.substring(1));
    const nextNumber = lastNumber + 1;
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }
}

class MockWarehouseService extends MockServiceAdapter<WarehouseItem> {
  constructor() {
    super('warehouseItems');
  }

  async getByType(type: WarehouseType): Promise<WarehouseItem[]> {
    return this.query([{ field: 'type', operator: '==', value: type }]);
  }

  async getLowStock(): Promise<WarehouseItem[]> {
    const items = await this.getAll();
    return items.filter(item => item.currentStock <= item.minStockLevel);
  }

  async getExpiredItems(): Promise<WarehouseItem[]> {
    const now = new Date();
    const items = await this.getAll();
    
    return items.filter(item => 
      item.hasExpiry && 
      item.expiryDate && 
      item.expiryDate < now
    );
  }

  async getExpiringItems(days: number = 7): Promise<WarehouseItem[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const items = await this.getAll();
    
    return items.filter(item => 
      item.hasExpiry && 
      item.expiryDate && 
      item.expiryDate <= futureDate && 
      item.expiryDate >= new Date()
    );
  }

  async updateRemainingDays(): Promise<void> {
    const items = await this.query([{ field: 'hasExpiry', operator: '==', value: true }]);
    const now = new Date();
    
    for (const item of items) {
      if (item.expiryDate) {
        const diffTime = item.expiryDate.getTime() - now.getTime();
        const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        await this.update(item.id, { remainingDays });
      }
    }
  }
}

// Service instances - either Firebase or Mock
export const dataService = {
  animals: useMockData ? new MockAnimalsService() : animalsExtendedService,
  barns: useMockData ? new MockServiceAdapter<Barn>('barns') : barnsService,
  warehouseItems: useMockData ? new MockWarehouseService() : warehouseExtendedService,
  stockMovements: useMockData ? new MockServiceAdapter<StockMovement>('stockMovements') : stockMovementsService,
  feedingRecords: useMockData ? new MockServiceAdapter<FeedingRecord>('feedingRecords') : feedingRecordsService,
  weightRecords: useMockData ? new MockServiceAdapter<WeightRecord>('weightRecords') : weightRecordsService,
  healthRecords: useMockData ? new MockServiceAdapter<HealthRecord>('healthRecords') : healthRecordsService,
  barnMovements: useMockData ? new MockServiceAdapter<BarnMovement>('barnMovements') : barnMovementsService,
  feedingSchedules: useMockData ? new MockServiceAdapter<FeedingSchedule>('feedingSchedules') : feedingSchedulesService,
  mortalityRecords: useMockData ? new MockServiceAdapter<MortalityRecord>('mortalityRecords') : new MockServiceAdapter<MortalityRecord>('mortalityRecords')
};

// Helper functions for common operations
export const farmHelpers = {
  // Calculate ADG for an animal
  calculateADG: (animal: Animal): number => {
    const birthDate = animal.birthDate || animal.purchaseDate;
    const daysSinceBirth = Math.floor(
      (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const estimatedBirthWeight = 3.5; // kg for sheep
    return daysSinceBirth > 0 
      ? (animal.weight - estimatedBirthWeight) / daysSinceBirth 
      : 0;
  },

  // Calculate barn occupancy
  getBarnOccupancy: async (barnId: string): Promise<{ count: number; capacity: number; percentage: number }> => {
    const [animals, barn] = await Promise.all([
      dataService.animals.getByBarn(barnId),
      dataService.barns.getById(barnId)
    ]);
    
    const count = animals.length;
    const capacity = barn?.capacity || 0;
    const percentage = capacity > 0 ? (count / capacity) * 100 : 0;
    
    return { count, capacity, percentage };
  },

  // Get warehouse analytics
  getWarehouseAnalytics: async () => {
    const [items, movements] = await Promise.all([
      dataService.warehouseItems.getAll(),
      dataService.stockMovements.getAll()
    ]);

    const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
    const lowStockItems = items.filter(item => item.currentStock <= item.minStockLevel);
    const expiredItems = items.filter(item => 
      item.hasExpiry && item.expiryDate && item.expiryDate < new Date()
    );
    const expiringItems = items.filter(item => {
      if (!item.hasExpiry || !item.expiryDate) return false;
      const daysUntilExpiry = Math.ceil(
        (item.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    });

    return {
      totalItems: items.length,
      totalValue,
      lowStockCount: lowStockItems.length,
      expiredCount: expiredItems.length,
      expiringCount: expiringItems.length,
      recentMovements: movements.slice(0, 10) // Last 10 movements
    };
  },

  // Format currency
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  },

  // Format weight
  formatWeight: (weight: number): string => {
    return `${weight.toFixed(1)} كيلو`;
  },

  // Calculate feeding efficiency
  calculateFeedingEfficiency: (feedPerAnimal: number, avgDailyGain: number): number => {
    return avgDailyGain > 0 ? feedPerAnimal / avgDailyGain : 0;
  }
};

// Export data mode for debugging
export const dataMode = useMockData ? 'mock' : 'firebase';
