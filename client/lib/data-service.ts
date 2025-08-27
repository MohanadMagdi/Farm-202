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
  feedingSchedulesService,
  barnEquipmentService,
  feedEfficiencyService,
} from "./firestore";

import { mockFirestore } from "./firebase-mock";
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
  WarehouseType,
  BarnEquipment,
  FeedConsumptionRecord,
  FeedEfficiencyRecord,
} from "@/../../shared/types";

// Determine if we should use mock data (development mode or no Firebase config)
const useMockData =
  import.meta.env.DEV ||
  !import.meta.env.VITE_FIREBASE_PROJECT_ID ||
  import.meta.env.VITE_FIREBASE_PROJECT_ID === "demo-farm-project";

console.log("Data Service Mode:", useMockData ? "Mock Data" : "Firebase");

// Mock service adapters
class MockServiceAdapter<T extends { id: string }> {
  constructor(private collectionName: string) {}

  async getAll(): Promise<T[]> {
    const result = await mockFirestore.collection(this.collectionName).get();
    return result.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
  }

  async getById(id: string): Promise<T | null> {
    const result = await mockFirestore
      .collection(this.collectionName)
      .doc(id)
      .get();
    return result.exists ? ({ id: result.id, ...result.data() } as T) : null;
  }

  async create(data: Omit<T, "id">): Promise<string> {
    const result = await mockFirestore
      .collection(this.collectionName)
      .add(data);
    return result.id;
  }

  async update(id: string, data: Partial<Omit<T, "id">>): Promise<void> {
    await mockFirestore.collection(this.collectionName).doc(id).update(data);
  }

  async delete(id: string): Promise<void> {
    await mockFirestore.collection(this.collectionName).doc(id).delete();
  }

  async query(
    filters: Array<{ field: string; operator: any; value: any }> = [],
  ): Promise<T[]> {
    if (filters.length === 0) {
      return this.getAll();
    }

    // For simplicity, handle single filter for now
    const filter = filters[0];
    const result = await mockFirestore
      .collection(this.collectionName)
      .where(filter.field, filter.operator, filter.value)
      .get();

    return result.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
  }
}

// Extended mock services for specialized operations
class MockAnimalsService extends MockServiceAdapter<Animal> {
  constructor() {
    super("animals");
  }

  async getByCategory(category: AnimalCategory): Promise<Animal[]> {
    return this.query([{ field: "category", operator: "==", value: category }]);
  }

  async getByBarn(barnId: string): Promise<Animal[]> {
    return this.query([{ field: "barnId", operator: "==", value: barnId }]);
  }

  async getIsolated(): Promise<Animal[]> {
    return this.query([{ field: "isIsolated", operator: "==", value: true }]);
  }

  async getPregnant(): Promise<Animal[]> {
    return this.query([{ field: "isPregnant", operator: "==", value: true }]);
  }

  async checkEarTagExists(
    earTagId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const animals = await this.query([
      { field: "earTagId", operator: "==", value: earTagId },
    ]);

    if (excludeId) {
      return animals.some((animal) => animal.id !== excludeId);
    }

    return animals.length > 0;
  }

  async getNextEarTagId(category: AnimalCategory): Promise<string> {
    const prefix =
      category === "male" ? "M" : category === "female" ? "F" : "N";

    const animals = await this.getByCategory(category);

    if (animals.length === 0) {
      return `${prefix}001`;
    }

    // Sort by earTagId and get the last one
    const sortedAnimals = animals.sort((a, b) =>
      a.earTagId.localeCompare(b.earTagId),
    );
    const lastEarTag = sortedAnimals[sortedAnimals.length - 1].earTagId;
    const lastNumber = parseInt(lastEarTag.substring(1));
    const nextNumber = lastNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
  }
}

class MockWarehouseService extends MockServiceAdapter<WarehouseItem> {
  constructor() {
    super("warehouseItems");
  }

  async getByType(type: WarehouseType): Promise<WarehouseItem[]> {
    return this.query([{ field: "type", operator: "==", value: type }]);
  }

  async getLowStock(): Promise<WarehouseItem[]> {
    const items = await this.getAll();
    return items.filter((item) => item.currentStock <= item.minStockLevel);
  }

  async getExpiredItems(): Promise<WarehouseItem[]> {
    const now = new Date();
    const items = await this.getAll();

    return items.filter(
      (item) => item.hasExpiry && item.expiryDate && item.expiryDate < now,
    );
  }

  async getExpiringItems(days: number = 7): Promise<WarehouseItem[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const items = await this.getAll();

    return items.filter(
      (item) =>
        item.hasExpiry &&
        item.expiryDate &&
        item.expiryDate <= futureDate &&
        item.expiryDate >= new Date(),
    );
  }

  async updateRemainingDays(): Promise<void> {
    const items = await this.query([
      { field: "hasExpiry", operator: "==", value: true },
    ]);
    const now = new Date();

    for (const item of items) {
      if (item.expiryDate) {
        const diffTime = item.expiryDate.getTime() - now.getTime();
        const remainingDays = Math.max(
          0,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
        );

        await this.update(item.id, { remainingDays });
      }
    }
  }
}

// Service instances - either Firebase or Mock
export const dataService = {
  animals: useMockData ? new MockAnimalsService() : animalsExtendedService,
  barns: useMockData ? new MockServiceAdapter<Barn>("barns") : barnsService,
  warehouseItems: useMockData
    ? new MockWarehouseService()
    : warehouseExtendedService,
  stockMovements: useMockData
    ? new MockServiceAdapter<StockMovement>("stockMovements")
    : stockMovementsService,
  feedingRecords: useMockData
    ? new MockServiceAdapter<FeedingRecord>("feedingRecords")
    : feedingRecordsService,
  weightRecords: useMockData
    ? new MockServiceAdapter<WeightRecord>("weightRecords")
    : weightRecordsService,
  healthRecords: useMockData
    ? new MockServiceAdapter<HealthRecord>("healthRecords")
    : healthRecordsService,
  barnMovements: useMockData
    ? new MockServiceAdapter<BarnMovement>("barnMovements")
    : barnMovementsService,
  feedingSchedules: useMockData
    ? new MockServiceAdapter<FeedingSchedule>("feedingSchedules")
    : feedingSchedulesService,
  mortalityRecords: useMockData
    ? new MockServiceAdapter<MortalityRecord>("mortalityRecords")
    : new MockServiceAdapter<MortalityRecord>("mortalityRecords"),
  barnEquipment: useMockData
    ? new MockServiceAdapter<BarnEquipment>("barnEquipment")
    : barnEquipmentService,
  feedConsumption: useMockData
    ? new MockServiceAdapter<FeedConsumptionRecord>("feedConsumption")
    : new MockServiceAdapter<FeedConsumptionRecord>("feedConsumption"),
  feedEfficiency: useMockData
    ? new MockServiceAdapter<FeedEfficiencyRecord>("feedEfficiencyRecords")
    : feedEfficiencyService,
};

// Helper functions for common operations
export const farmHelpers = {
  // Calculate ADG for an animal
  calculateADG: (animal: Animal): number => {
    const birthDate = animal.birthDate || animal.purchaseDate;
    const daysSinceBirth = Math.floor(
      (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const estimatedBirthWeight = 3.5; // kg for sheep
    return daysSinceBirth > 0
      ? (animal.weight - estimatedBirthWeight) / daysSinceBirth
      : 0;
  },

  // Calculate barn occupancy
  getBarnOccupancy: async (
    barnId: string,
  ): Promise<{ count: number; capacity: number; percentage: number }> => {
    const [animals, barn] = await Promise.all([
      dataService.animals.getByBarn(barnId),
      dataService.barns.getById(barnId),
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
      dataService.stockMovements.getAll(),
    ]);

    const totalValue = items.reduce(
      (sum, item) => sum + item.currentStock * item.unitPrice,
      0,
    );
    const lowStockItems = items.filter(
      (item) => item.currentStock <= item.minStockLevel,
    );
    const expiredItems = items.filter(
      (item) =>
        item.hasExpiry && item.expiryDate && item.expiryDate < new Date(),
    );
    const expiringItems = items.filter((item) => {
      if (!item.hasExpiry || !item.expiryDate) return false;
      const daysUntilExpiry = Math.ceil(
        (item.expiryDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    });

    return {
      totalItems: items.length,
      totalValue,
      lowStockCount: lowStockItems.length,
      expiredCount: expiredItems.length,
      expiringCount: expiringItems.length,
      recentMovements: movements.slice(0, 10), // Last 10 movements
    };
  },

  // Format currency
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 0,
    }).format(amount);
  },

  // Format weight
  formatWeight: (weight: number): string => {
    return `${weight.toFixed(1)} كيلو`;
  },

  // Calculate feeding efficiency
  calculateFeedingEfficiency: (
    feedPerAnimal: number,
    avgDailyGain: number,
  ): number => {
    return avgDailyGain > 0 ? feedPerAnimal / avgDailyGain : 0;
  },
  
  // Calculate daily feed consumption per animal
  calculateDailyFeedConsumption: async (barnId: string, date: Date): Promise<number> => {
    const [feedRecords, animals] = await Promise.all([
      dataService.feedConsumption.query([
        { field: "barnId", operator: "==", value: barnId },
        { field: "date", operator: "==", value: date },
      ]),
      dataService.animals.getByBarn(barnId),
    ]);
    
    const totalFeed = feedRecords.reduce((sum, record) => sum + record.quantityKg, 0);
    const animalCount = animals.length;
    
    return animalCount > 0 ? totalFeed / animalCount : 0;
  },
  
  // Calculate weekly feed consumption per animal
  calculateWeeklyFeedConsumption: async (barnId: string, endDate: Date): Promise<number> => {
    // Calculate date 7 days before
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);
    
    // Query feed consumption for the week
    // This is simplified for mock data - in production would need proper date range query
    const feedRecords = await dataService.feedConsumption.getAll();
    const weekRecords = feedRecords.filter(record => 
      record.barnId === barnId && 
      record.date >= startDate && 
      record.date <= endDate
    );
    
    const totalFeed = weekRecords.reduce((sum, record) => sum + record.quantityKg, 0);
    
    // Get average animal count for the week
    const animals = await dataService.animals.getByBarn(barnId);
    // In production, would need to account for animal movements during the week
    
    return animals.length > 0 ? totalFeed / animals.length : 0;
  },
  
  // Calculate monthly feed consumption per animal
  calculateMonthlyFeedConsumption: async (barnId: string, endDate: Date): Promise<number> => {
    // Calculate date 30 days before
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    
    // Query feed consumption for the month
    const feedRecords = await dataService.feedConsumption.getAll();
    const monthRecords = feedRecords.filter(record => 
      record.barnId === barnId && 
      record.date >= startDate && 
      record.date <= endDate
    );
    
    const totalFeed = monthRecords.reduce((sum, record) => sum + record.quantityKg, 0);
    
    // Get average animal count for the month
    const animals = await dataService.animals.getByBarn(barnId);
    
    return animals.length > 0 ? totalFeed / animals.length : 0;
  },
  
  // Calculate feed efficiency between weight measurements
  calculateFeedEfficiencyBetweenWeights: async (
    animalId: string, 
    startDate: Date, 
    endDate: Date, 
    startWeight: number, 
    endWeight: number
  ): Promise<{
    feedConsumed: number,
    dailyGain: number,
    feedEfficiency: number
  }> => {
    // Get animal's barn
    const animal = await dataService.animals.getById(animalId);
    if (!animal) return { feedConsumed: 0, dailyGain: 0, feedEfficiency: 0 };
    
    // Calculate total days
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { feedConsumed: 0, dailyGain: 0, feedEfficiency: 0 };
    
    // Get feed consumption for the barn during this period
    const feedRecords = await dataService.feedConsumption.getAll();
    const periodRecords = feedRecords.filter(record => 
      record.barnId === animal.barnId && 
      record.date >= startDate && 
      record.date <= endDate
    );
    
    // Calculate total feed for the barn
    const totalBarnFeed = periodRecords.reduce((sum, record) => sum + record.quantityKg, 0);
    
    // Get average number of animals in the barn during this period
    const animals = await dataService.animals.getByBarn(animal.barnId);
    const avgAnimalCount = animals.length; // Simplified - should account for movements
    
    // Calculate feed per animal during this period
    const feedPerAnimal = avgAnimalCount > 0 ? totalBarnFeed / avgAnimalCount : 0;
    
    // Calculate daily weight gain
    const weightGain = endWeight - startWeight;
    const dailyGain = days > 0 ? weightGain / days : 0;
    
    // Calculate feed efficiency (kg feed per kg gain)
    const feedEfficiency = weightGain > 0 ? feedPerAnimal / weightGain : 0;
    
    return {
      feedConsumed: feedPerAnimal,
      dailyGain,
      feedEfficiency
    };
  },
};

// جدولة النقل التلقائي للمواليد
export const automaticTransferScheduler = {
  
  // فحص دوري كل ساعة للمواليد التي تحتاج نقل
  startPeriodicCheck() {
    // فحص فوري عند البدء
    this.checkAndTransfer();
    
    // جدولة فحص كل ساعة
    setInterval(() => {
      this.checkAndTransfer();
    }, 60 * 60 * 1000); // كل ساعة
    
    console.log('🔄 Automatic Transfer Scheduler Started - checking every hour');
  },

  // فحص وتنفيذ النقل التلقائي
  async checkAndTransfer() {
    try {
      const { automaticWeaningTransferService } = await import('./automatic-weaning-transfer-service');
      const pendingCheck = await automaticWeaningTransferService.checkForPendingTransfers();
      
      if (pendingCheck.overdueCount > 0) {
        console.log(`🚨 Found ${pendingCheck.overdueCount} overdue animals for transfer`);
        
        // تنفيذ النقل التلقائي للمتأخرين فقط
        const result = await automaticWeaningTransferService.runAutomaticTransfer();
        
        if (result.totalTransferred > 0) {
          console.log(`✅ Auto transferred ${result.totalTransferred} animals successfully`);
          
          // يمكن إضافة إشعار للمستخدم هنا
          // notificationService.send(`تم نقل ${result.totalTransferred} مولود تلقائياً`);
        }
      }
    } catch (error) {
      console.error('Error in automatic transfer check:', error);
    }
  },

  // تشغيل النقل الفوري (استدعاء يدوي)
  async runImmediateTransfer() {
    try {
      const { automaticWeaningTransferService } = await import('./automatic-weaning-transfer-service');
      return await automaticWeaningTransferService.runAutomaticTransfer();
    } catch (error) {
      console.error('Error in immediate transfer:', error);
      return {
        readyAnimals: [],
        transferResults: [],
        totalTransferred: 0,
        errors: ['خطأ في النقل الفوري']
      };
    }
  }
};

// Export data mode for debugging
export const dataMode = useMockData ? "mock" : "firebase";

// Add inventory alias for backwards compatibility
(dataService as any).inventory = dataService.warehouseItems;
