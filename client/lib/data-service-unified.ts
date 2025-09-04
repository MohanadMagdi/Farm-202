/**
 * خدمة البيانات الموحدة
 * نظام موحد لإدارة البيانات يتبديل تلقائياً بين البيانات الحقيقية والوهمية
 * بناءً على متغيرات البيئة
 */

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
} from "@shared/types";

// تحديد نوع البيئة
const USE_MOCK_DATA = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_DATA === 'true';

// خدمات البيانات
class UnifiedDataService {
  private mockService: any;
  private firestoreService: any;
  private currentService: any;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    if (this.initialized) return;

    if (USE_MOCK_DATA) {
      // استيراد البيانات الوهمية في بيئة التطوير
      const mockModule = await import('./firebase-mock');
      this.mockService = mockModule.mockFirestore;
      this.currentService = this.mockService;
      console.log('🔧 تم تفعيل وضع البيانات الوهمية للتطوير');
    } else {
      // استيراد Firebase الحقيقي في بيئة الإنتاج
      const firestoreModule = await import('./firestore');
      this.firestoreService = firestoreModule;
      this.currentService = this.firestoreService;
      console.log('🚀 تم تفعيل وضع Firebase الحقيقي للإنتاج');
    }

    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      this.initializationPromise = null;
    }
  }

  // ========== خدمات الحيوانات ==========
  async getAnimals(): Promise<Animal[]> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      return this.mockService.getData().animals;
    } else {
      return await this.firestoreService.animalsService.getAll();
    }
  }

  async getAnimalById(id: string): Promise<Animal | null> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      const animals = this.mockService.getData().animals;
      return animals.find((animal: Animal) => animal.id === id) || null;
    } else {
      return await this.firestoreService.animalsService.getById(id);
    }
  }

  async createAnimal(animalData: Omit<Animal, 'id'>): Promise<string> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      const newId = `anim_${Date.now()}`;
      const newAnimal = { ...animalData, id: newId, createdAt: new Date(), updatedAt: new Date() };
      this.mockService.getData().animals.push(newAnimal as Animal);
      console.log('🐄 تم إضافة حيوان جديد (وهمي):', newId);
      return newId;
    } else {
      return await this.firestoreService.animalsService.create(animalData);
    }
  }

  async updateAnimal(id: string, updates: Partial<Animal>): Promise<void> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      const animals = this.mockService.getData().animals;
      const index = animals.findIndex((animal: Animal) => animal.id === id);
      if (index !== -1) {
        animals[index] = { ...animals[index], ...updates, updatedAt: new Date() };
        console.log('📝 تم تحديث الحيوان (وهمي):', id);
      }
    } else {
      await this.firestoreService.animalsService.update(id, updates);
    }
  }

  async deleteAnimal(id: string): Promise<void> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      const animals = this.mockService.getData().animals;
      const index = animals.findIndex((animal: Animal) => animal.id === id);
      if (index !== -1) {
        animals.splice(index, 1);
        console.log('🗑️ تم حذف الحيوان (وهمي):', id);
      }
    } else {
      await this.firestoreService.animalsService.delete(id);
    }
  }

  async getAnimalsByCategory(category: Animal['category']): Promise<Animal[]> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      const animals = this.mockService.getData().animals;
      return animals.filter((animal: Animal) => animal.category === category);
    } else {
      return await this.firestoreService.animalsExtendedService.getByCategory(category);
    }
  }

  async getAnimalsByBarn(barnId: string): Promise<Animal[]> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      const animals = this.mockService.getData().animals;
      return animals.filter((animal: Animal) => animal.barnId === barnId);
    } else {
      return await this.firestoreService.animalsExtendedService.getByBarn(barnId);
    }
  }

  // ========== خدمات الحظائر ==========
  async getBarns(): Promise<Barn[]> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      return this.mockService.getData().barns;
    } else {
      return await this.firestoreService.barnsService.getAll();
    }
  }

  async getBarnById(id: string): Promise<Barn | null> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      const barns = this.mockService.getData().barns;
      return barns.find((barn: Barn) => barn.id === id) || null;
    } else {
      return await this.firestoreService.barnsService.getById(id);
    }
  }

  async createBarn(barnData: Omit<Barn, 'id'>): Promise<string> {
    if (USE_MOCK_DATA) {
      const newId = `barn_${Date.now()}`;
      const newBarn = { ...barnData, id: newId, createdAt: new Date(), updatedAt: new Date() };
      this.mockService.getData().barns.push(newBarn as Barn);
      console.log('🏠 تم إضافة حظيرة جديدة (وهمية):', newId);
      return newId;
    } else {
      return await this.firestoreService.barnsService.create(barnData);
    }
  }

  async updateBarn(id: string, updates: Partial<Barn>): Promise<void> {
    if (USE_MOCK_DATA) {
      const barns = this.mockService.getData().barns;
      const index = barns.findIndex((barn: Barn) => barn.id === id);
      if (index !== -1) {
        barns[index] = { ...barns[index], ...updates, updatedAt: new Date() };
        console.log('📝 تم تحديث الحظيرة (وهمية):', id);
      }
    } else {
      await this.firestoreService.barnsService.update(id, updates);
    }
  }

  // ========== خدمات المخزن ==========
  async getWarehouseItems(): Promise<WarehouseItem[]> {
    if (USE_MOCK_DATA) {
      return this.mockService.getData().warehouseItems;
    } else {
      return await this.firestoreService.warehouseItemsService.getAll();
    }
  }

  async getWarehouseItemById(id: string): Promise<WarehouseItem | null> {
    if (USE_MOCK_DATA) {
      const items = this.mockService.getData().warehouseItems;
      return items.find((item: WarehouseItem) => item.id === id) || null;
    } else {
      return await this.firestoreService.warehouseItemsService.getById(id);
    }
  }

  async createWarehouseItem(itemData: Omit<WarehouseItem, 'id'>): Promise<string> {
    if (USE_MOCK_DATA) {
      const newId = `wh_${Date.now()}`;
      const newItem = { ...itemData, id: newId, createdAt: new Date(), updatedAt: new Date() };
      this.mockService.getData().warehouseItems.push(newItem as WarehouseItem);
      console.log('📦 تم إضافة عنصر مخزن جديد (وهمي):', newId);
      return newId;
    } else {
      return await this.firestoreService.warehouseItemsService.create(itemData);
    }
  }

  async updateWarehouseItem(id: string, updates: Partial<WarehouseItem>): Promise<void> {
    if (USE_MOCK_DATA) {
      const items = this.mockService.getData().warehouseItems;
      const index = items.findIndex((item: WarehouseItem) => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...updates, updatedAt: new Date() };
        console.log('📝 تم تحديث عنصر المخزن (وهمي):', id);
      }
    } else {
      await this.firestoreService.warehouseItemsService.update(id, updates);
    }
  }

  async getLowStockItems(): Promise<WarehouseItem[]> {
    if (USE_MOCK_DATA) {
      const items = this.mockService.getData().warehouseItems;
      return items.filter((item: WarehouseItem) => item.currentStock <= item.minStockLevel);
    } else {
      return await this.firestoreService.warehouseExtendedService.getLowStock();
    }
  }

  async getExpiredItems(): Promise<WarehouseItem[]> {
    if (USE_MOCK_DATA) {
      const items = this.mockService.getData().warehouseItems;
      const now = new Date();
      return items.filter((item: WarehouseItem) => 
        item.hasExpiry && 
        item.expiryDate && 
        item.expiryDate < now
      );
    } else {
      return await this.firestoreService.warehouseExtendedService.getExpiredItems();
    }
  }

  // ========== خدمات الحركات المخزنية ==========
  async getStockMovements(): Promise<StockMovement[]> {
    if (USE_MOCK_DATA) {
      return this.mockService.getData().stockMovements;
    } else {
      return await this.firestoreService.stockMovementsService.getAll();
    }
  }

  async createStockMovement(movementData: Omit<StockMovement, 'id'>): Promise<string> {
    if (USE_MOCK_DATA) {
      const newId = `mov_${Date.now()}`;
      const newMovement = { ...movementData, id: newId, createdAt: new Date(), updatedAt: new Date() };
      this.mockService.getData().stockMovements.push(newMovement as StockMovement);
      
      // تحديث المخزن
      const items = this.mockService.getData().warehouseItems;
      const itemIndex = items.findIndex((item: WarehouseItem) => item.id === movementData.itemId);
      if (itemIndex !== -1) {
        const item = items[itemIndex];
        if (movementData.type === 'in') {
          item.currentStock += movementData.quantity;
        } else {
          item.currentStock -= movementData.quantity;
        }
        item.updatedAt = new Date();
      }
      
      console.log('📦 تم إضافة حركة مخزنية جديدة (وهمية):', newId);
      return newId;
    } else {
      return await this.firestoreService.stockMovementsService.create(movementData);
    }
  }

  // ========== خدمات التغذية ==========
  async getFeedingRecords(): Promise<FeedingRecord[]> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      return this.mockService.getData().feedingRecords;
    } else {
      return await this.firestoreService.feedingRecordsService.getAll();
    }
  }

  async createFeedingRecord(feedingData: Omit<FeedingRecord, 'id'>): Promise<string> {
    if (USE_MOCK_DATA) {
      const newId = `feed_${Date.now()}`;
      const newRecord = { ...feedingData, id: newId, createdAt: new Date(), updatedAt: new Date() };
      this.mockService.getData().feedingRecords.push(newRecord as FeedingRecord);
      console.log('🍽️ تم إضافة سجل تغذية جديد (وهمي):', newId);
      return newId;
    } else {
      return await this.firestoreService.feedingRecordsService.create(feedingData);
    }
  }

  // ========== خدمات الأوزان ==========
  async getWeightRecords(): Promise<WeightRecord[]> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      return this.mockService.getData().weightRecords;
    } else {
      return await this.firestoreService.weightRecordsService.getAll();
    }
  }

  async getWeightRecordsByAnimal(animalId: string): Promise<WeightRecord[]> {
    await this.ensureInitialized();
    
    if (USE_MOCK_DATA) {
      const records = this.mockService.getData().weightRecords;
      return records.filter((record: WeightRecord) => record.animalId === animalId);
    } else {
      return await this.firestoreService.weightRecordsService.query([
        { field: 'animalId', operator: '==', value: animalId }
      ], 'date', 'asc');
    }
  }

  async createWeightRecord(weightData: Omit<WeightRecord, 'id'>): Promise<string> {
    if (USE_MOCK_DATA) {
      const newId = `weight_${Date.now()}`;
      const newRecord = { ...weightData, id: newId, createdAt: new Date(), updatedAt: new Date() };
      this.mockService.getData().weightRecords.push(newRecord as WeightRecord);

      // تحديث الوزن الحالي للحيوان
      const animals = this.mockService.getData().animals;
      const animalIndex = animals.findIndex((animal: Animal) => animal.id === weightData.animalId);
      if (animalIndex !== -1) {
        animals[animalIndex].weight = weightData.weight;
        animals[animalIndex].updatedAt = new Date();
      }

      console.log('⚖️ تم إضافة سجل وزن جديد (وهمي):', newId);
      return newId;
    } else {
      return await this.firestoreService.weightRecordsService.create(weightData);
    }
  }

  // ========== خدمات الصحة ==========
  async getHealthRecords(): Promise<HealthRecord[]> {
    if (USE_MOCK_DATA) {
      return this.mockService.getData().healthRecords;
    } else {
      return await this.firestoreService.healthRecordsService.getAll();
    }
  }

  async getHealthRecordsByAnimal(animalId: string): Promise<HealthRecord[]> {
    if (USE_MOCK_DATA) {
      const records = this.mockService.getData().healthRecords;
      return records.filter((record: HealthRecord) => record.animalId === animalId);
    } else {
      return await this.firestoreService.healthRecordsService.query([
        { field: 'animalId', operator: '==', value: animalId }
      ]);
    }
  }

  async createHealthRecord(healthData: Omit<HealthRecord, 'id'>): Promise<string> {
    if (USE_MOCK_DATA) {
      const newId = `health_${Date.now()}`;
      const newRecord = { ...healthData, id: newId, createdAt: new Date(), updatedAt: new Date() };
      this.mockService.getData().healthRecords.push(newRecord as HealthRecord);
      console.log('🏥 تم إضافة سجل صحي جديد (وهمي):', newId);
      return newId;
    } else {
      return await this.firestoreService.healthRecordsService.create(healthData);
    }
  }

  // ========== خدمات نقل الحيوانات ==========
  async getBarnMovements(): Promise<BarnMovement[]> {
    if (USE_MOCK_DATA) {
      return this.mockService.getData().barnMovements;
    } else {
      return await this.firestoreService.barnMovementsService.getAll();
    }
  }

  async createBarnMovement(movementData: Omit<BarnMovement, 'id'>): Promise<string> {
    if (USE_MOCK_DATA) {
      const newId = `barn_mov_${Date.now()}`;
      const newMovement = { ...movementData, id: newId, createdAt: new Date(), updatedAt: new Date() };
      this.mockService.getData().barnMovements.push(newMovement as BarnMovement);

      // تحديث الحيوان
      const animals = this.mockService.getData().animals;
      const animalIndex = animals.findIndex((animal: Animal) => animal.id === movementData.animalId);
      if (animalIndex !== -1) {
        animals[animalIndex].barnId = movementData.toBarnId;
        animals[animalIndex].updatedAt = new Date();
      }

      console.log('🏠 تم إضافة حركة حظيرة جديدة (وهمية):', newId);
      return newId;
    } else {
      return await this.firestoreService.barnMovementsService.create(movementData);
    }
  }

  // ========== خدمات جداول التغذية ==========
  async getFeedingSchedules(): Promise<FeedingSchedule[]> {
    if (USE_MOCK_DATA) {
      return this.mockService.getData().feedingSchedules;
    } else {
      return await this.firestoreService.feedingSchedulesService.getAll();
    }
  }

  async createFeedingSchedule(scheduleData: Omit<FeedingSchedule, 'id'>): Promise<string> {
    if (USE_MOCK_DATA) {
      const newId = `sched_${Date.now()}`;
      const newSchedule = { ...scheduleData, id: newId, createdAt: new Date(), updatedAt: new Date() };
      this.mockService.getData().feedingSchedules.push(newSchedule as FeedingSchedule);
      console.log('📅 تم إضافة جدول تغذية جديد (وهمي):', newId);
      return newId;
    } else {
      return await this.firestoreService.feedingSchedulesService.create(scheduleData);
    }
  }

  // ========== خدمات إضافية ==========
  async syncAllData(): Promise<void> {
    if (USE_MOCK_DATA) {
      console.log('🔄 تم مزامنة البيانات الوهمية');
      // في الوضع الوهمي، نقوم بإعادة تحميل البيانات
      this.mockService.data = this.mockService.initializeData();
    } else {
      console.log('🔄 تتم المزامنة مع Firebase تلقائياً');
      // في Firebase، المزامنة تحدث تلقائياً
    }
  }

  // الحصول على معلومات البيئة الحالية
  getCurrentEnvironment() {
    return {
      isDevelopment: USE_MOCK_DATA,
      dataSource: USE_MOCK_DATA ? 'Mock Data' : 'Firebase',
      environment: USE_MOCK_DATA ? 'Development' : 'Production'
    };
  }
}

// إنشاء مثيل واحد من الخدمة (Singleton)
export const dataService = new UnifiedDataService();

// تصدير الأنواع للاستخدام في المكونات
export type {
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
};

// تصدير خدمات فردية للتوافق مع الكود الحالي
export const {
  getAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  getAnimalsByCategory,
  getAnimalsByBarn,
  getBarns,
  getBarnById,
  createBarn,
  updateBarn,
  getWarehouseItems,
  getWarehouseItemById,
  createWarehouseItem,
  updateWarehouseItem,
  getLowStockItems,
  getExpiredItems,
  getStockMovements,
  createStockMovement,
  getFeedingRecords,
  createFeedingRecord,
  getWeightRecords,
  getWeightRecordsByAnimal,
  createWeightRecord,
  getHealthRecords,
  getHealthRecordsByAnimal,
  createHealthRecord,
  getBarnMovements,
  createBarnMovement,
  getFeedingSchedules,
  createFeedingSchedule,
  syncAllData,
  getCurrentEnvironment
} = dataService;

// تصدير الخدمة كافتراضي
export default dataService;
