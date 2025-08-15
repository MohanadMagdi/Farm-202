import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  Animal, 
  Barn, 
  WarehouseItem, 
  StockMovement, 
  FeedingRecord, 
  WeightRecord,
  HealthRecord,
  BarnMovement,
  FeedingSchedule
} from '@shared/types';

// Collection references
export const collections = {
  animals: 'animals',
  barns: 'barns',
  barnMovements: 'barnMovements',
  warehouseItems: 'warehouseItems',
  stockMovements: 'stockMovements',
  feedingSchedules: 'feedingSchedules',
  feedingRecords: 'feedingRecords',
  weightRecords: 'weightRecords',
  healthRecords: 'healthRecords',
  users: 'users'
} as const;

// Helper function to convert Firestore data
function convertTimestamps<T>(data: any): T {
  const converted = { ...data };
  
  // Convert Timestamp objects to Date objects
  Object.keys(converted).forEach(key => {
    if (converted[key] && typeof converted[key].toDate === 'function') {
      converted[key] = converted[key].toDate();
    }
  });
  
  return converted as T;
}

// Helper function to prepare data for Firestore
function prepareForFirestore(data: any) {
  const prepared = { ...data };
  
  // Convert Date objects to Timestamp objects
  Object.keys(prepared).forEach(key => {
    if (prepared[key] instanceof Date) {
      prepared[key] = Timestamp.fromDate(prepared[key]);
    }
  });
  
  return prepared;
}

// Generic CRUD operations
export class FirestoreService<T extends { id: string }> {
  constructor(private collectionName: string) {}

  async getAll(): Promise<T[]> {
    const snapshot = await getDocs(collection(db, this.collectionName));
    return snapshot.docs.map(doc => convertTimestamps<T>({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return convertTimestamps<T>({
      id: snapshot.id,
      ...snapshot.data()
    });
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    const preparedData = prepareForFirestore({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const docRef = await addDoc(collection(db, this.collectionName), preparedData);
    return docRef.id;
  }

  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    const preparedData = prepareForFirestore({
      ...data,
      updatedAt: serverTimestamp()
    });
    
    await updateDoc(docRef, preparedData);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async query(
    filters: Array<{ field: string; operator: any; value: any }> = [],
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
  ): Promise<T[]> {
    let q = collection(db, this.collectionName);
    
    // Apply filters
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value)) as any;
    });
    
    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection)) as any;
    }
    
    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount)) as any;
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertTimestamps<T>({
      id: doc.id,
      ...doc.data()
    }));
  }

  subscribe(
    callback: (data: T[]) => void,
    filters: Array<{ field: string; operator: any; value: any }> = [],
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc'
  ): Unsubscribe {
    let q = collection(db, this.collectionName);
    
    // Apply filters
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value)) as any;
    });
    
    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection)) as any;
    }
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => convertTimestamps<T>({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    });
  }
}

// Service instances
export const animalsService = new FirestoreService<Animal>(collections.animals);
export const barnsService = new FirestoreService<Barn>(collections.barns);
export const warehouseItemsService = new FirestoreService<WarehouseItem>(collections.warehouseItems);
export const stockMovementsService = new FirestoreService<StockMovement>(collections.stockMovements);
export const feedingRecordsService = new FirestoreService<FeedingRecord>(collections.feedingRecords);
export const weightRecordsService = new FirestoreService<WeightRecord>(collections.weightRecords);
export const healthRecordsService = new FirestoreService<HealthRecord>(collections.healthRecords);
export const barnMovementsService = new FirestoreService<BarnMovement>(collections.barnMovements);
export const feedingSchedulesService = new FirestoreService<FeedingSchedule>(collections.feedingSchedules);

// Specialized service methods
export class AnimalsExtendedService extends FirestoreService<Animal> {
  constructor() {
    super(collections.animals);
  }

  async getByCategory(category: Animal['category']): Promise<Animal[]> {
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
    const filters = [{ field: 'earTagId', operator: '==', value: earTagId }];
    const animals = await this.query(filters);
    
    if (excludeId) {
      return animals.some(animal => animal.id !== excludeId);
    }
    
    return animals.length > 0;
  }

  async getNextEarTagId(category: Animal['category']): Promise<string> {
    const prefix = category === 'male' ? 'M' : category === 'female' ? 'F' : 'N';
    
    const animals = await this.query(
      [{ field: 'category', operator: '==', value: category }],
      'earTagId',
      'desc',
      1
    );
    
    if (animals.length === 0) {
      return `${prefix}001`;
    }
    
    const lastEarTag = animals[0].earTagId;
    const lastNumber = parseInt(lastEarTag.substring(1));
    const nextNumber = lastNumber + 1;
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }
}

export const animalsExtendedService = new AnimalsExtendedService();

// Warehouse specialized methods
export class WarehouseExtendedService extends FirestoreService<WarehouseItem> {
  constructor() {
    super(collections.warehouseItems);
  }

  async getByType(type: WarehouseItem['type']): Promise<WarehouseItem[]> {
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

export const warehouseExtendedService = new WarehouseExtendedService();
