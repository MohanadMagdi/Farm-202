/**
 * Firebase Mockup Database System
 * Simulates Firebase Firestore for local development and testing
 */

import { formatArabicDate } from './arabic-utils';

// Types matching Firestore document structure
export interface Animal {
  id: string;
  tagId: string;
  type: 'male' | 'female' | 'newborn';
  birthDate: Date;
  birthWeightKg: number;
  currentWeightKg: number;
  sex: 'male' | 'female';
  motherId?: string;
  fatherId?: string;
  purchase?: {
    date: Date;
    supplier: string;
    priceEGP: number;
  };
  healthStatus: 'healthy' | 'sick' | 'under_treatment' | 'quarantine';
  barnId: string;
  status: 'active' | 'sold' | 'dead';
  metrics: {
    adg: number; // Average Daily Gain
    totalGainKg: number;
    feedConsumedKg: number;
  };
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface Barn {
  id: string;
  name: string;
  type: 'male' | 'female' | 'newborn' | 'mixed';
  capacity: number;
  location: string;
  notes?: string;
  active: boolean;
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface InventoryItem {
  id: string;
  category: 'feed' | 'medicine' | 'medical_supply' | 'equipment' | 'maintenance';
  name: string;
  sku: string;
  unit: string;
  concentratePct?: number;
  pricePerUnitEGP: number;
  minLevel: number;
  notes?: string;
  active: boolean;
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface StockBatch {
  id: string;
  inventoryItemId: string;
  qtyIn: number;
  qtyRemaining: number;
  receivedAt: Date;
  supplier: string;
  costEGP: number;
  expiryDate?: Date;
}

export interface StockMovement {
  id: string;
  direction: 'in' | 'out';
  inventoryItemId: string;
  batchId?: string;
  qty: number;
  unit: string;
  reason: 'purchase' | 'issue_to_barn' | 'adjustment' | 'return';
  barnId?: string;
  requestedBy: string;
  approvedBy?: string;
  createdAt: Date;
}

export interface FeedingSchedule {
  id: string;
  barnId: string;
  date: Date;
  sessionsPerDay: number;
  entries: Array<{
    time: string;
    feedItemId: string;
    qtyKgBarnTotal: number;
  }>;
}

export interface FeedingRecord {
  id: string;
  barnId: string;
  animalId?: string;
  time: Date;
  feedItemId: string;
  qtyKg: number;
  recordedBy: string;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  type: 'vaccine' | 'treatment' | 'diagnosis';
  drugId?: string;
  dose?: string;
  date: Date;
  notes?: string;
  vetId: string;
}

export interface User {
  id: string;
  uid: string; // Firebase Auth UID
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'vet' | 'inventory' | 'barn_manager' | 'accountant' | 'sales';
  active: boolean;
  claimsSynced: boolean;
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
    inventory: InventoryItem[];
    stockBatches: StockBatch[];
    stockMovements: StockMovement[];
    feedingSchedules: FeedingSchedule[];
    feedingRecords: FeedingRecord[];
    healthRecords: HealthRecord[];
    users: User[];
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
          tagId: "M001",
          type: "male",
          birthDate: new Date("2023-03-15"),
          birthWeightKg: 4.2,
          currentWeightKg: 75.5,
          sex: "male",
          motherId: "anim_005",
          fatherId: "anim_002",
          purchase: {
            date: new Date("2023-03-20"),
            supplier: "مزرعة أحمد محمد",
            priceEGP: 3500
          },
          healthStatus: "healthy",
          barnId: "barn_001",
          status: "active",
          metrics: {
            adg: 0.35,
            totalGainKg: 71.3,
            feedConsumedKg: 1250
          },
          timestamps: {
            createdAt: new Date("2023-03-15"),
            updatedAt: now
          }
        },
        {
          id: "anim_002",
          tagId: "M002",
          type: "male",
          birthDate: new Date("2022-08-10"),
          birthWeightKg: 4.5,
          currentWeightKg: 95.2,
          sex: "male",
          purchase: {
            date: new Date("2022-08-15"),
            supplier: "مزرعة النور",
            priceEGP: 4200
          },
          healthStatus: "healthy",
          barnId: "barn_001",
          status: "active",
          metrics: {
            adg: 0.42,
            totalGainKg: 90.7,
            feedConsumedKg: 1850
          },
          timestamps: {
            createdAt: new Date("2022-08-10"),
            updatedAt: now
          }
        },
        {
          id: "anim_003",
          tagId: "F047",
          type: "female",
          birthDate: new Date("2022-11-08"),
          birthWeightKg: 3.8,
          currentWeightKg: 65.2,
          sex: "female",
          motherId: "anim_006",
          fatherId: "anim_002",
          purchase: {
            date: new Date("2022-12-01"),
            supplier: "مزرعة الصفا",
            priceEGP: 4200
          },
          healthStatus: "healthy",
          barnId: "barn_002",
          status: "active",
          metrics: {
            adg: 0.28,
            totalGainKg: 61.4,
            feedConsumedKg: 1150
          },
          timestamps: {
            createdAt: new Date("2022-11-08"),
            updatedAt: now
          }
        },
        {
          id: "anim_004",
          tagId: "N012",
          type: "newborn",
          birthDate: new Date("2024-01-10"),
          birthWeightKg: 3.5,
          currentWeightKg: 12.3,
          sex: "male",
          motherId: "anim_003",
          fatherId: "anim_001",
          healthStatus: "healthy",
          barnId: "barn_003",
          status: "active",
          metrics: {
            adg: 0.25,
            totalGainKg: 8.8,
            feedConsumedKg: 45
          },
          timestamps: {
            createdAt: new Date("2024-01-10"),
            updatedAt: now
          }
        }
      ],
      
      barns: [
        {
          id: "barn_001",
          name: "الحظيرة الرئيسية - ذكور",
          type: "male",
          capacity: 50,
          location: "الجانب الشرقي",
          notes: "حظيرة مجهزة بأنظمة تهوية حديثة",
          active: true,
          timestamps: {
            createdAt: new Date("2023-01-01"),
            updatedAt: now
          }
        },
        {
          id: "barn_002",
          name: "حظيرة الإناث الرئيسية",
          type: "female",
          capacity: 60,
          location: "الجانب الغربي",
          notes: "مخصصة للإناث الحوامل والمرضعات",
          active: true,
          timestamps: {
            createdAt: new Date("2023-01-01"),
            updatedAt: now
          }
        },
        {
          id: "barn_003",
          name: "حظيرة الصغار",
          type: "newborn",
          capacity: 30,
          location: "المنطقة الوسطى",
          notes: "مجهزة بأنظمة تدفئة للصغار",
          active: true,
          timestamps: {
            createdAt: new Date("2023-01-01"),
            updatedAt: now
          }
        }
      ],

      inventory: [
        {
          id: "inv_001",
          category: "feed",
          name: "دريس البرسيم",
          sku: "FEED-HAY-001",
          unit: "كيلو",
          pricePerUnitEGP: 8.5,
          minLevel: 500,
          active: true,
          timestamps: {
            createdAt: new Date("2023-01-01"),
            updatedAt: now
          }
        },
        {
          id: "inv_002",
          category: "feed",
          name: "تبن القمح",
          sku: "FEED-STRAW-001",
          unit: "كيلو",
          pricePerUnitEGP: 4.2,
          minLevel: 300,
          active: true,
          timestamps: {
            createdAt: new Date("2023-01-01"),
            updatedAt: now
          }
        },
        {
          id: "inv_003",
          category: "feed",
          name: "علف مركز 16%",
          sku: "FEED-CONC-16",
          unit: "كيلو",
          concentratePct: 16,
          pricePerUnitEGP: 12.8,
          minLevel: 200,
          active: true,
          timestamps: {
            createdAt: new Date("2023-01-01"),
            updatedAt: now
          }
        }
      ],

      stockBatches: [
        {
          id: "batch_001",
          inventoryItemId: "inv_001",
          qtyIn: 1000,
          qtyRemaining: 650,
          receivedAt: new Date("2024-01-15"),
          supplier: "مزرعة الوادي الأخضر",
          costEGP: 8500
        },
        {
          id: "batch_002",
          inventoryItemId: "inv_002",
          qtyIn: 500,
          qtyRemaining: 200,
          receivedAt: new Date("2024-01-10"),
          supplier: "تجار الأعلاف المتحدة",
          costEGP: 2100
        }
      ],

      stockMovements: [
        {
          id: "mov_001",
          direction: "out",
          inventoryItemId: "inv_001",
          batchId: "batch_001",
          qty: 50,
          unit: "كيلو",
          reason: "issue_to_barn",
          barnId: "barn_001",
          requestedBy: "أحمد محمد",
          createdAt: new Date("2024-01-16")
        }
      ],

      feedingSchedules: [
        {
          id: "sched_001",
          barnId: "barn_001",
          date: new Date(),
          sessionsPerDay: 3,
          entries: [
            {
              time: "07:00",
              feedItemId: "inv_001",
              qtyKgBarnTotal: 25
            },
            {
              time: "13:00",
              feedItemId: "inv_002",
              qtyKgBarnTotal: 15
            },
            {
              time: "18:00",
              feedItemId: "inv_003",
              qtyKgBarnTotal: 10
            }
          ]
        }
      ],

      feedingRecords: [
        {
          id: "feed_001",
          barnId: "barn_001",
          animalId: "anim_001",
          time: new Date(),
          feedItemId: "inv_001",
          qtyKg: 2.5,
          recordedBy: "مشرف الحظيرة"
        }
      ],

      healthRecords: [
        {
          id: "health_001",
          animalId: "anim_001",
          type: "vaccine",
          date: new Date("2024-01-15"),
          notes: "تطعيم ضد الحمى القلاعية",
          vetId: "vet_001"
        }
      ],

      users: [
        {
          id: "user_001",
          uid: "firebase_uid_001",
          name: "أحمد محمد",
          email: "ahmed@farm.com",
          role: "owner",
          active: true,
          claimsSynced: true,
          timestamps: {
            createdAt: new Date("2023-01-01"),
            updatedAt: now
          }
        },
        {
          id: "user_002",
          uid: "firebase_uid_002",
          name: "فاطمة علي",
          email: "fatima@farm.com",
          role: "manager",
          active: true,
          claimsSynced: true,
          timestamps: {
            createdAt: new Date("2023-01-01"),
            updatedAt: now
          }
        },
        {
          id: "user_003",
          uid: "firebase_uid_003",
          name: "د. محمود البيطري",
          email: "mahmoud@farm.com",
          role: "vet",
          active: true,
          claimsSynced: true,
          timestamps: {
            createdAt: new Date("2023-01-01"),
            updatedAt: now
          }
        }
      ]
    };
  }

  // Collection methods
  collection(name: string) {
    return {
      get: () => {
        return Promise.resolve({
          docs: (this.data as any)[name]?.map((item: any) => ({
            id: item.id,
            data: () => item
          })) || []
        });
      },
      add: (doc: any) => {
        const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newDoc = {
          ...doc,
          id,
          timestamps: {
            createdAt: new Date(),
            updatedAt: new Date()
          }
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
        update: (updates: any) => {
          const index = (this.data as any)[name]?.findIndex((item: any) => item.id === id);
          if (index !== -1) {
            (this.data as any)[name][index] = {
              ...(this.data as any)[name][index],
              ...updates,
              timestamps: {
                ...(this.data as any)[name][index].timestamps,
                updatedAt: new Date()
              }
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
            case '==':
              filtered = filtered.filter((item: any) => item[field] === value);
              break;
            case '!=':
              filtered = filtered.filter((item: any) => item[field] !== value);
              break;
            case '>':
              filtered = filtered.filter((item: any) => item[field] > value);
              break;
            case '>=':
              filtered = filtered.filter((item: any) => item[field] >= value);
              break;
            case '<':
              filtered = filtered.filter((item: any) => item[field] < value);
              break;
            case '<=':
              filtered = filtered.filter((item: any) => item[field] <= value);
              break;
          }
          
          return Promise.resolve({
            docs: filtered.map((item: any) => ({
              id: item.id,
              data: () => item
            }))
          });
        }
      })
    };
  }

  // Helper methods
  getCurrentStock(inventoryItemId: string): number {
    const batches = this.data.stockBatches.filter(b => b.inventoryItemId === inventoryItemId);
    return batches.reduce((sum, batch) => sum + batch.qtyRemaining, 0);
  }

  getBarnOccupancy(barnId: string): number {
    return this.data.animals.filter(a => a.barnId === barnId && a.status === 'active').length;
  }

  calculateADG(animalId: string): number {
    const animal = this.data.animals.find(a => a.id === animalId);
    if (!animal) return 0;
    
    const daysSinceBirth = Math.floor((new Date().getTime() - animal.birthDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceBirth > 0 ? (animal.currentWeightKg - animal.birthWeightKg) / daysSinceBirth : 0;
  }
}

// Export singleton instance
export const mockFirestore = new MockFirestore();

// Firestore-like interface
export const db = mockFirestore;
