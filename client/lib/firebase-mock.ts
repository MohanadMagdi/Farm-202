/**
 * Firebase Hybrid System
 * Uses real Firebase in production, mock data in development/testing
 */

import { formatArabicDate } from "./arabic-utils";
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
  AnimalCategory,
  WarehouseType
} from '@shared/types';

// Legacy types for backward compatibility
export interface LegacyAnimal {
  id: string;
  tagId: string;
  type: "male" | "female" | "newborn";
  birthDate: Date;
  birthWeightKg: number;
  currentWeightKg: number;
  sex: "male" | "female";
  motherId?: string;
  fatherId?: string;
  purchase?: {
    date: Date;
    supplier: string;
    priceEGP: number;
  };
  healthStatus: "healthy" | "sick" | "under_treatment" | "quarantine";
  barnId: string;
  status: "active" | "sold" | "dead";
  metrics: {
    adg: number;
    totalGainKg: number;
    feedConsumedKg: number;
  };
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

// Mock Data Store
class MockFirestore {
  private data: {
    animals: Animal[];
    barns: Barn[];
    warehouseItems: WarehouseItem[];
    stockMovements: StockMovement[];
    feedingRecords: FeedingRecord[];
    weightRecords: WeightRecord[];
    healthRecords: HealthRecord[];
    barnMovements: BarnMovement[];
    feedingSchedules: FeedingSchedule[];
  };

  constructor() {
    this.data = this.initializeData();
  }

  private initializeData() {
    const now = new Date();

    return {
      animals: [
        {
          id: "anim_001",
          earTagId: "M001",
          category: "male" as AnimalCategory,
          sex: "male" as const,
          weight: 75.5,
          supplier: "مزرعة أحمد محمد",
          purchaseDate: new Date("2023-03-20"),
          purchasePrice: 3500,
          currentPrice: 8500,
          barnId: "barn_001",
          healthStatus: "سليم",
          isIsolated: false,
          createdAt: new Date("2023-03-15"),
          updatedAt: now,
          createdBy: "user_001",
          updatedBy: "user_001"
        },
        {
          id: "anim_002",
          earTagId: "M002",
          category: "male" as AnimalCategory,
          sex: "male" as const,
          weight: 95.2,
          supplier: "مزرعة النور",
          purchaseDate: new Date("2022-08-15"),
          purchasePrice: 4200,
          currentPrice: 12000,
          barnId: "barn_001",
          healthStatus: "سليم",
          isIsolated: false,
          createdAt: new Date("2022-08-10"),
          updatedAt: now,
          createdBy: "user_001",
          updatedBy: "user_001"
        },
        {
          id: "anim_003",
          earTagId: "F047",
          category: "female" as AnimalCategory,
          sex: "female" as const,
          weight: 65.2,
          supplier: "مزرعة الصفا",
          purchaseDate: new Date("2022-12-01"),
          purchasePrice: 4200,
          currentPrice: 6800,
          barnId: "barn_002",
          healthStatus: "سليمة",
          isIsolated: false,
          isPregnant: true,
          aiDate: new Date("2024-01-15"),
          expectedBirthDate: new Date("2024-06-15"),
          offspringCount: 2,
          offspringIds: ["anim_004", "anim_005"],
          pricingMethod: "formula" as any,
          createdAt: new Date("2022-11-08"),
          updatedAt: now,
          createdBy: "user_001",
          updatedBy: "user_001"
        },
        {
          id: "anim_004",
          earTagId: "N012",
          category: "newborn" as AnimalCategory,
          sex: "male" as const,
          weight: 12.3,
          barnId: "barn_003",
          healthStatus: "سليم",
          isIsolated: false,
          motherId: "anim_003",
          birthDate: new Date("2024-01-10"),
          createdAt: new Date("2024-01-10"),
          updatedAt: now,
          createdBy: "user_001",
          updatedBy: "user_001",
          purchaseDate: new Date("2024-01-10"),
          purchasePrice: 0
        }
      ] as Animal[],

      barns: [
        {
          id: "barn_001",
          name: "الحظيرة الرئيسية - ذكور",
          type: "male",
          capacity: 50,
          location: "الجانب الشرقي",
          description: "حظيرة مجهزة بأنظمة تهوية حديثة",
          isActive: true,
          createdAt: new Date("2023-01-01"),
          updatedAt: now
        },
        {
          id: "barn_002",
          name: "حظيرة الإناث الرئيسية",
          type: "female",
          capacity: 60,
          location: "الجانب الغربي",
          description: "مخصصة للإناث الحوامل والمرضعات",
          isActive: true,
          createdAt: new Date("2023-01-01"),
          updatedAt: now
        },
        {
          id: "barn_003",
          name: "حظيرة ال��غار",
          type: "newborn",
          capacity: 30,
          location: "المنطقة الوسطى",
          description: "مجهزة بأنظمة تدفئة للصغار",
          isActive: true,
          createdAt: new Date("2023-01-01"),
          updatedAt: now
        }
      ] as Barn[],

      warehouseItems: [
        {
          id: "wh_001",
          name: "دريس البرسيم",
          type: "chemicals" as WarehouseType,
          category: "أعلاف",
          unit: "كيلو",
          currentStock: 650,
          minStockLevel: 500,
          maxStockLevel: 2000,
          unitPrice: 8.5,
          hasExpiry: false,
          location: "المستودع الرئيسي",
          supplier: "مزرعة الوادي الأخضر",
          isActive: true,
          createdAt: new Date("2023-01-01"),
          updatedAt: now
        },
        {
          id: "wh_002",
          name: "تبن القمح",
          type: "chemicals" as WarehouseType,
          category: "أعلاف",
          unit: "كيلو",
          currentStock: 200,
          minStockLevel: 300,
          maxStockLevel: 1500,
          unitPrice: 4.2,
          hasExpiry: false,
          location: "المستودع الرئيسي",
          supplier: "تجار الأعلاف المتحدة",
          isActive: true,
          createdAt: new Date("2023-01-01"),
          updatedAt: now
        },
        {
          id: "wh_003",
          name: "علف مركز 16%",
          type: "chemicals" as WarehouseType,
          category: "أعلاف مركزة",
          unit: "كيلو",
          currentStock: 180,
          minStockLevel: 200,
          maxStockLevel: 1000,
          unitPrice: 12.8,
          hasExpiry: true,
          expiryDate: new Date("2024-06-30"),
          originalExpiryDays: 180,
          remainingDays: 120,
          location: "المستودع الرئيسي",
          supplier: "شركة الأعلاف المتطورة",
          isActive: true,
          createdAt: new Date("2023-01-01"),
          updatedAt: now
        },
        {
          id: "wh_004",
          name: "مضاد حيوي - أوكسي تتراسيكلين",
          type: "medicines" as WarehouseType,
          category: "أدوية",
          unit: "قارورة",
          currentStock: 15,
          minStockLevel: 10,
          maxStockLevel: 50,
          unitPrice: 45.0,
          hasExpiry: true,
          expiryDate: new Date("2024-03-15"),
          originalExpiryDays: 365,
          remainingDays: 45,
          location: "صيدلية المزرعة",
          supplier: "شركة الأدوية البيطرية",
          isActive: true,
          createdAt: new Date("2023-01-01"),
          updatedAt: now
        }
      ] as WarehouseItem[],

      stockMovements: [
        {
          id: "mov_001",
          itemId: "wh_001",
          type: "out" as const,
          quantity: 50,
          unitPrice: 8.5,
          totalCost: 425,
          date: new Date("2024-01-16"),
          reason: "تغذية الحظيرة الرئيسية",
          recordedBy: "user_002",
          notes: "توزيع علف الصباح"
        },
        {
          id: "mov_002", 
          itemId: "wh_002",
          type: "in" as const,
          quantity: 500,
          unitPrice: 4.2,
          totalCost: 2100,
          date: new Date("2024-01-10"),
          reason: "مشتريات جديدة",
          recordedBy: "user_001",
          billNumber: "INV-2024-001",
          notes: "دفعة جديدة من التبن"
        }
      ] as StockMovement[],

      feedingRecords: [
        {
          id: "feed_001",
          barnId: "barn_001",
          feedType: "دريس البرسيم",
          quantityIssued: 50,
          animalsCount: 12,
          feedPerAnimal: 4.17,
          avgDailyGain: 0.35,
          feedingEfficiency: 11.9,
          date: new Date(),
          time: "07:00",
          recordedBy: "user_002",
          notes: "تغذية الصباح"
        }
      ] as FeedingRecord[],

      weightRecords: [
        {
          id: "weight_001",
          animalId: "anim_001",
          weight: 75.5,
          date: new Date(),
          recordedBy: "user_001",
          notes: "وزن أسبوعي"
        }
      ] as WeightRecord[],

      healthRecords: [
        {
          id: "health_001",
          animalId: "anim_001",
          type: "vaccination",
          description: "تطعيم ضد الحمى القلاعية",
          medicineUsed: "لقاح الحمى القلاعية",
          dosage: "2 مل",
          cost: 25,
          date: new Date("2024-01-15"),
          recordedBy: "user_003"
        }
      ] as HealthRecord[],

      barnMovements: [
        {
          id: "barn_mov_001",
          animalId: "anim_001",
          fromBarnId: "barn_003",
          toBarnId: "barn_001",
          date: new Date("2023-06-01"),
          reason: "نقل بعد الفطام",
          recordedBy: "user_001"
        }
      ] as BarnMovement[],

      feedingSchedules: [
        {
          id: "sched_001",
          barnId: "barn_001",
          feedType: "دريس البرسيم",
          quantity: 50,
          timesPerDay: 3,
          scheduledTime: "07:00,13:00,18:00",
          isActive: true,
          createdAt: new Date(),
          updatedAt: now
        }
      ] as FeedingSchedule[]
    };
  }

  // Collection methods compatible with Firestore
  collection(name: string) {
    return {
      get: () => {
        return Promise.resolve({
          docs: (this.data as any)[name]?.map((item: any) => ({
            id: item.id,
            data: () => item,
            exists: true
          })) || []
        });
      },
      add: (doc: any) => {
        const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newDoc = {
          ...doc,
          id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        (this.data as any)[name].push(newDoc);
        return Promise.resolve({ id });
      },
      doc: (id: string) => ({
        get: () => {
          const item = (this.data as any)[name]?.find((item: any) => item.id === id);
          return Promise.resolve({
            exists: !!item,
            id,
            data: () => item
          });
        },
        set: (doc: any) => {
          const index = (this.data as any)[name]?.findIndex((item: any) => item.id === id);
          const newDoc = {
            ...doc,
            id,
            updatedAt: new Date()
          };
          
          if (index !== -1) {
            (this.data as any)[name][index] = newDoc;
          } else {
            (this.data as any)[name].push(newDoc);
          }
          return Promise.resolve();
        },
        update: (updates: any) => {
          const index = (this.data as any)[name]?.findIndex((item: any) => item.id === id);
          if (index !== -1) {
            (this.data as any)[name][index] = {
              ...(this.data as any)[name][index],
              ...updates,
              updatedAt: new Date()
            };
          }
          return Promise.resolve();
        },
        delete: () => {
          const index = (this.data as any)[name]?.findIndex((item: any) => item.id === id);
          if (index !== -1) {
            (this.data as any)[name].splice(index, 1);
          }
          return Promise.resolve();
        }
      }),
      where: (field: string, operator: string, value: any) => ({
        get: () => {
          let filtered = (this.data as any)[name] || [];

          switch (operator) {
            case "==":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes('.') 
                  ? field.split('.').reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue === value;
              });
              break;
            case "!=":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes('.') 
                  ? field.split('.').reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue !== value;
              });
              break;
            case ">":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes('.') 
                  ? field.split('.').reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue > value;
              });
              break;
            case ">=":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes('.') 
                  ? field.split('.').reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue >= value;
              });
              break;
            case "<":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes('.') 
                  ? field.split('.').reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue < value;
              });
              break;
            case "<=":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes('.') 
                  ? field.split('.').reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue <= value;
              });
              break;
            case "array-contains":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes('.') 
                  ? field.split('.').reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return Array.isArray(fieldValue) && fieldValue.includes(value);
              });
              break;
          }

          return Promise.resolve({
            docs: filtered.map((item: any) => ({
              id: item.id,
              data: () => item,
              exists: true
            }))
          });
        }
      })
    };
  }

  // Helper methods
  getCurrentStock(itemId: string): number {
    const item = this.data.warehouseItems.find(item => item.id === itemId);
    return item?.currentStock || 0;
  }

  getBarnOccupancy(barnId: string): number {
    return this.data.animals.filter(animal => 
      animal.barnId === barnId
    ).length;
  }

  calculateADG(animalId: string): number {
    const animal = this.data.animals.find(a => a.id === animalId);
    if (!animal) return 0;

    const birthDate = animal.birthDate || animal.purchaseDate;
    const daysSinceBirth = Math.floor(
      (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Assuming birth weight was around 3.5kg for sheep
    const estimatedBirthWeight = 3.5;
    return daysSinceBirth > 0 
      ? (animal.weight - estimatedBirthWeight) / daysSinceBirth 
      : 0;
  }

  // Get data directly (for non-Firebase operations)
  getData() {
    return this.data;
  }
}

// Export singleton instance
export const mockFirestore = new MockFirestore();

// Firestore-like interface
export const db = mockFirestore;
