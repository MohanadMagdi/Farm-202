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
  MortalityRecord,
  AnimalCategory,
  WarehouseType,
} from "@shared/types";

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
    mortalityRecords: MortalityRecord[];
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
          ageMonths: 18,
          supplier: "مزرعة أحمد محمد",
          purchaseDate: new Date("2025-03-20"),
          purchasePrice: 3500,
          currentPrice: 8500,
          barnId: "barn_001",
          healthStatus: "سليم",
          isIsolated: false,
          pricingMethod: "formula" as any,
          weightHistory: [
            { id: "w001_1", date: "2023-03-20", weightKg: 45.0 },
            { id: "w001_2", date: "2023-04-20", weightKg: 52.5 },
            { id: "w001_3", date: "2023-05-20", weightKg: 58.2 },
            { id: "w001_4", date: "2023-06-20", weightKg: 65.8 },
            { id: "w001_5", date: "2023-07-20", weightKg: 71.3 },
            { id: "w001_6", date: "2023-08-20", weightKg: 75.5 }
          ],
          createdAt: new Date("2023-03-15"),
          updatedAt: now,
          createdBy: "user_001",
          updatedBy: "user_001",
        },
        {
          id: "anim_002",
          earTagId: "M002",
          category: "male" as AnimalCategory,
          sex: "male" as const,
          weight: 63.5, // Updated to match latest weight record
          ageMonths: 24,
          supplier: "مزرعة النور",
          purchaseDate: new Date("2025-06-15"),
          purchasePrice: 4200,
          currentPrice: 12000,
          barnId: "barn_001",
          healthStatus: "سليم",
          isIsolated: false,
          pricingMethod: "formula" as any,
          weightHistory: [
            { id: "w002_1", date: "2022-08-15", weightKg: 38.5 },
            { id: "w002_2", date: "2022-10-15", weightKg: 47.2 },
            { id: "w002_3", date: "2022-12-15", weightKg: 58.8 },
            { id: "w002_4", date: "2023-02-15", weightKg: 68.5 },
            { id: "w002_5", date: "2023-04-15", weightKg: 78.2 },
            { id: "w002_6", date: "2023-06-15", weightKg: 87.0 },
            { id: "w002_7", date: "2023-08-15", weightKg: 95.2 }
          ],
          createdAt: new Date("2022-08-10"),
          updatedAt: now,
          createdBy: "user_001",
          updatedBy: "user_001",
        },
        {
          id: "anim_003",
          earTagId: "F047",
          category: "female" as AnimalCategory,
          sex: "female" as const,
          weight: 52.8, // Updated to match latest weight record
          ageMonths: 30,
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
          weightHistory: [
            { id: "w003_1", date: "2022-12-01", weightKg: 42.0 },
            { id: "w003_2", date: "2023-02-01", weightKg: 48.5 },
            { id: "w003_3", date: "2023-04-01", weightKg: 55.0 },
            { id: "w003_4", date: "2023-06-01", weightKg: 58.8 },
            { id: "w003_5", date: "2023-08-01", weightKg: 62.3 },
            { id: "w003_6", date: "2023-10-01", weightKg: 65.2 }
          ],
          createdAt: new Date("2022-11-08"),
          updatedAt: now,
          createdBy: "user_001",
          updatedBy: "user_001",
        },
        {
          id: "anim_004",
          earTagId: "N012",
          category: "newborn" as AnimalCategory,
          sex: "male" as const,
          weight: 12.3,
          ageMonths: 8,
          barnId: "barn_003",
          healthStatus: "سليم",
          isIsolated: false,
          motherId: "anim_003",
          motherEarTagId: "F047",
          birthDate: new Date("2024-01-10"),
          pricingMethod: "formula" as any,
          weightHistory: [
            { id: "w004_1", date: "2024-01-10", weightKg: 3.5 },
            { id: "w004_2", date: "2024-02-10", weightKg: 6.8 },
            { id: "w004_3", date: "2024-03-10", weightKg: 9.2 },
            { id: "w004_4", date: "2024-04-10", weightKg: 12.3 }
          ],
          createdAt: new Date("2024-01-10"),
          updatedAt: now,
          createdBy: "user_001",
          updatedBy: "user_001",
          purchaseDate: new Date("2024-01-10"),
          purchasePrice: 0,
          weaningDate: new Date("2024-03-10"),
        },
        {
          id: "anim_005",
          earTagId: "N013",
          category: "newborn" as AnimalCategory,
          sex: "female" as const,
          weight: 11.8,
          ageMonths: 12,
          barnId: "barn_003",
          healthStatus: "سليمة",
          isIsolated: false,
          motherId: "anim_003",
          motherEarTagId: "F047",
          birthDate: new Date("2024-01-10"),
          pricingMethod: "formula" as any,
          weightHistory: [
            { id: "w005_1", date: "2024-01-10", weightKg: 3.2 },
            { id: "w005_2", date: "2024-02-10", weightKg: 6.4 },
            { id: "w005_3", date: "2024-03-10", weightKg: 8.9 },
            { id: "w005_4", date: "2024-04-10", weightKg: 11.8 }
          ],
          createdAt: new Date("2024-01-10"),
          updatedAt: now,
          createdBy: "user_001",
          updatedBy: "user_001",
          purchaseDate: new Date("2024-01-10"),
          purchasePrice: 0,
          weaningDate: new Date("2024-03-10"),
        },
        // Test animal with many weight entries to demonstrate dynamic columns
        {
          id: "anim_test_multi",
          earTagId: "M006",
          category: "male" as AnimalCategory,
          sex: "male" as const,
          weight: 85.7,
          ageMonths: 20,
          supplier: "مزرعة التجارب",
          purchaseDate: new Date("2025-05-01"),
          purchasePrice: 2800,
          currentPrice: 9500,
          barnId: "barn_001",
          healthStatus: "ممتاز",
          isIsolated: false,
          pricingMethod: "formula" as any,
          weightHistory: [
            { id: "wtest_1", date: "2025-07-01", weightKg: 75.0 },
            { id: "wtest_2", date: "2025-07-15", weightKg: 78.5 },
            { id: "wtest_3", date: "2025-08-01", weightKg: 82.8 },
            { id: "wtest_4", date: "2025-08-15", weightKg: 85.7 },
            { id: "wtest_5", date: "2025-08-30", weightKg: 87.2 }
          ],
          createdAt: new Date("2022-01-01"),
          updatedAt: now,
          createdBy: "user_001",
          updatedBy: "user_001",
        },
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
          updatedAt: now,
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
          updatedAt: now,
        },
        {
          id: "barn_003",
          name: "حظيرة الصغار",
          type: "newborn",
          capacity: 30,
          location: "المنطقة الوسطى",
          description: "مجهزة بأنظمة تدفئة للصغار",
          isActive: true,
          createdAt: new Date("2023-01-01"),
          updatedAt: now,
        },
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
          updatedAt: now,
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
          updatedAt: now,
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
          updatedAt: now,
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
          updatedAt: now,
        },
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
          notes: "توزيع علف الصباح",
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
          notes: "دفعة جديدة من التبن",
        },
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
          date: new Date("2025-08-25"),
          time: "07:00",
          recordedBy: "user_002",
          notes: "تغذية الصباح",
        },
        {
          id: "feed_002",
          barnId: "barn_001",
          feedType: "علف مركز",
          quantityIssued: 25,
          animalsCount: 12,
          feedPerAnimal: 2.08,
          avgDailyGain: 0.45,
          feedingEfficiency: 4.6,
          date: new Date("2025-08-26"),
          time: "13:00",
          recordedBy: "user_002",
          notes: "تغذية الظهر",
        },
        {
          id: "feed_003",
          barnId: "barn_002",
          feedType: "دريس البرسيم",
          quantityIssued: 30,
          animalsCount: 8,
          feedPerAnimal: 3.75,
          avgDailyGain: 0.28,
          feedingEfficiency: 13.4,
          date: new Date("2025-08-27"),
          time: "07:00",
          recordedBy: "user_002",
          notes: "تغذية الإناث",
        },
        {
          id: "feed_004",
          barnId: "barn_003",
          feedType: "لبن صناعي",
          quantityIssued: 15,
          animalsCount: 5,
          feedPerAnimal: 3.0,
          avgDailyGain: 0.25,
          feedingEfficiency: 12.0,
          date: new Date("2025-08-28"),
          time: "08:00",
          recordedBy: "user_002",
          notes: "تغذية المواليد",
        },
        {
          id: "feed_005",
          barnId: "barn_001",
          feedType: "علف مركز",
          quantityIssued: 35,
          animalsCount: 12,
          feedPerAnimal: 2.92,
          avgDailyGain: 0.52,
          feedingEfficiency: 5.6,
          date: new Date("2025-08-29"),
          time: "07:00",
          recordedBy: "user_002",
          notes: "تغذية معززة",
        },
        {
          id: "feed_006",
          barnId: "barn_002",
          feedType: "علف مركز",
          quantityIssued: 20,
          animalsCount: 8,
          feedPerAnimal: 2.5,
          avgDailyGain: 0.32,
          feedingEfficiency: 7.8,
          date: new Date("2025-08-30"),
          time: "13:00",
          recordedBy: "user_002",
          notes: "تغذية الإناث المركزة",
        }
      ] as FeedingRecord[],

      weightRecords: [
        // Weight records for animal M001 (growth over time) - Recent realistic dates
        {
          id: "weight_001",
          animalId: "anim_001",
          weight: 45.2,
          date: new Date("2025-08-01"),
          recordedBy: "user_001",
          notes: "وزن البداية",
        },
        {
          id: "weight_002",
          animalId: "anim_001",
          weight: 52.8,
          date: new Date("2025-08-10"),
          recordedBy: "user_001",
          notes: "وزن أسبوع ونصف",
        },
        {
          id: "weight_003",
          animalId: "anim_001",
          weight: 61.5,
          date: new Date("2025-08-20"),
          recordedBy: "user_001",
          notes: "وزن ثلاثة أسابيع",
        },
        {
          id: "weight_004",
          animalId: "anim_001",
          weight: 68.2,
          date: new Date("2025-08-28"),
          recordedBy: "user_001",
          notes: "وزن قبل النهائي",
        },
        {
          id: "weight_005",
          animalId: "anim_001",
          weight: 75.5,
          date: new Date("2025-09-02"),
          recordedBy: "user_001",
          notes: "الوزن الحالي",
        },
        // Weight records for animal M002
        {
          id: "weight_006",
          animalId: "anim_002",
          weight: 38.5,
          date: new Date("2025-08-05"),
          recordedBy: "user_001",
          notes: "وزن البداية",
        },
        {
          id: "weight_007",
          animalId: "anim_002",
          weight: 47.2,
          date: new Date("2025-08-15"),
          recordedBy: "user_001",
          notes: "وزن عشرة أيام",
        },
        {
          id: "weight_008",
          animalId: "anim_002",
          weight: 55.8,
          date: new Date("2025-08-25"),
          recordedBy: "user_001",
          notes: "وزن عشرين يوم",
        },
        {
          id: "weight_009",
          animalId: "anim_002",
          weight: 63.5,
          date: new Date("2025-09-02"),
          recordedBy: "user_001",
          notes: "وزن حالي",
        },
        // Weight records for female F047 - Recent dates
        {
          id: "weight_010",
          animalId: "anim_003",
          weight: 42.0,
          date: new Date("2025-08-10"),
          recordedBy: "user_001",
          notes: "وزن البداية",
        },
        {
          id: "weight_011",
          animalId: "anim_003",
          weight: 48.5,
          date: new Date("2025-08-20"),
          recordedBy: "user_001",
          notes: "وزن عشرة أيام",
        },
        {
          id: "weight_012",
          animalId: "anim_003",
          weight: 52.8,
          date: new Date("2025-09-01"),
          recordedBy: "user_001",
          notes: "وزن حالي",
        },
        // Weight records for newborn N012 - Recent dates
        {
          id: "weight_013",
          animalId: "anim_004",
          weight: 3.5,
          date: new Date("2025-08-15"),
          recordedBy: "user_001",
          notes: "وزن الميلاد",
        },
        {
          id: "weight_014",
          animalId: "anim_004",
          weight: 8.2,
          date: new Date("2025-08-25"),
          recordedBy: "user_001",
          notes: "وزن عشرة أيام",
        },
        {
          id: "weight_015",
          animalId: "anim_004",
          weight: 12.3,
          date: new Date("2025-09-02"),
          recordedBy: "user_001",
          notes: "وزن حالي",
        },
        // Weight records for newborn N013
        {
          id: "weight_016",
          animalId: "anim_005",
          weight: 3.2,
          date: new Date("2024-01-10"),
          recordedBy: "user_001",
          notes: "وزن الميلاد",
        },
        {
          id: "weight_017",
          animalId: "anim_005",
          weight: 7.8,
          date: new Date("2024-02-10"),
          recordedBy: "user_001",
          notes: "وزن شهري",
        },
        {
          id: "weight_018",
          animalId: "anim_005",
          weight: 11.8,
          date: new Date("2024-03-10"),
          recordedBy: "user_001",
          notes: "وزن حالي",
        },
        // Recent weight records for better calculations
        {
          id: "weight_019",
          animalId: "anim_test_multi",
          weight: 78.2,
          date: new Date("2025-07-10"),
          recordedBy: "user_001",
          notes: "وزن حديث",
        },
        {
          id: "weight_020",
          animalId: "anim_test_multi",
          weight: 82.4,
          date: new Date("2025-08-01"),
          recordedBy: "user_001",
          notes: "وزن شهري",
        },
        {
          id: "weight_021",
          animalId: "anim_test_multi",
          weight: 85.7,
          date: new Date("2025-08-28"),
          recordedBy: "user_001",
          notes: "وزن حالي",
        },
        {
          id: "weight_022",
          animalId: "anim_001",
          weight: 77.8,
          date: new Date("2025-08-31"),
          recordedBy: "user_001",
          notes: "وزن حديث أخير",
        },
        {
          id: "weight_023",
          animalId: "anim_002",
          weight: 66.2,
          date: new Date("2025-08-30"),
          recordedBy: "user_001",
          notes: "وزن حديث للحيوان الثاني",
        },
        {
          id: "weight_021",
          animalId: "anim_003",
          weight: 68.7,
          date: new Date("2025-08-24"),
          recordedBy: "user_001",
          notes: "وزن حديث للأنثى",
        },
        {
          id: "weight_022",
          animalId: "anim_004",
          weight: 15.2,
          date: new Date("2025-08-25"),
          recordedBy: "user_001",
          notes: "وزن حديث للمولود",
        },
        {
          id: "weight_023",
          animalId: "anim_005",
          weight: 14.8,
          date: new Date("2025-08-26"),
          recordedBy: "user_001",
          notes: "وزن حديث للمولود",
        },
        // Additional weight records for multi-weight test animal (anim_test_multi)
        {
          id: "weight_multi_1",
          animalId: "anim_test_multi",
          weight: 75.0,
          date: new Date("2025-07-01"),
          recordedBy: "user_001",
          notes: "وزن 1 للاختبار متعدد الأوزان",
        },
        {
          id: "weight_multi_2",
          animalId: "anim_test_multi",
          weight: 78.5,
          date: new Date("2025-07-15"),
          recordedBy: "user_001",
          notes: "وزن 2 للاختبار متعدد الأوزان",
        },
        {
          id: "weight_multi_3",
          animalId: "anim_test_multi",
          weight: 82.8,
          date: new Date("2025-08-01"),
          recordedBy: "user_001",
          notes: "وزن 3 للاختبار متعدد الأوزان",
        },
        {
          id: "weight_multi_4",
          animalId: "anim_test_multi",
          weight: 85.7,
          date: new Date("2025-08-15"),
          recordedBy: "user_001",
          notes: "وزن 4 للاختبار متعدد الأوزان",
        },
        {
          id: "weight_multi_5",
          animalId: "anim_test_multi",
          weight: 87.2,
          date: new Date("2025-08-30"),
          recordedBy: "user_001",
          notes: "وزن 5 للاختبار متعدد الأوزان",
        },
        // Additional recent weight records for new animals
        {
          id: "weight_024",
          animalId: "anim_006",
          weight: 60.5,
          date: new Date("2025-08-20"),
          recordedBy: "user_001",
          notes: "وزن حديث للأنثى",
        },
        {
          id: "weight_025",
          animalId: "anim_007",
          weight: 63.2,
          date: new Date("2025-08-21"),
          recordedBy: "user_001",
          notes: "وزن حديث للأنثى",
        },
        {
          id: "weight_026",
          animalId: "anim_008",
          weight: 10.5,
          date: new Date("2025-08-23"),
          recordedBy: "user_001",
          notes: "وزن حديث للمولود",
        },
        {
          id: "weight_027",
          animalId: "anim_test_multi",
          weight: 87.4,
          date: new Date("2025-08-28"),
          recordedBy: "user_001",
          notes: "وزن حديث",
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
          recordedBy: "user_003",
        },
      ] as HealthRecord[],

      barnMovements: [
        {
          id: "barn_mov_001",
          animalId: "anim_001",
          fromBarnId: "barn_003",
          toBarnId: "barn_001",
          date: new Date("2023-06-01"),
          reason: "نقل بعد الفطام",
          recordedBy: "user_001",
        },
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
          updatedAt: now,
        },
      ] as FeedingSchedule[],

      mortalityRecords: [
        {
          id: "mort_001",
          animalId: "anim_dead_001",
          animalEarTagId: "M999",
          animalCategory: "male" as AnimalCategory,
          deathDate: new Date("2024-01-15"),
          cause: "illness" as const,
          causeDescription: "التهاب رئوي حاد",
          ageAtDeath: 18, // months
          weightAtDeath: 45.5,
          barnId: "barn_001",
          veterinaryReport: "تم العلاج لمدة أسبوع ولكن لم يستجب للعلاج",
          preventable: true,
          financialLoss: 8500, // EGP
          recordedBy: "user_001",
          createdAt: new Date("2024-01-15"),
          notes: "حالة مؤسفة كان من الممكن تجنبها بالعلاج المبكر",
        },
        {
          id: "mort_002",
          animalId: "anim_dead_002",
          animalEarTagId: "F888",
          animalCategory: "female" as AnimalCategory,
          deathDate: new Date("2024-02-03"),
          cause: "birth_complications" as const,
          causeDescription: "مضاعفات أثناء الولادة",
          ageAtDeath: 36, // months
          weightAtDeath: 52.0,
          barnId: "barn_002",
          veterinaryReport: "ولادة متعسرة أدت إلى نزيف داخلي",
          preventable: false,
          financialLoss: 12000, // EGP
          recordedBy: "user_001",
          createdAt: new Date("2024-02-03"),
          notes: "حالة طبيعية صعبة رغم المتابعة المكثفة",
        },
        {
          id: "mort_003",
          animalId: "anim_dead_003",
          animalEarTagId: "N777",
          animalCategory: "newborn" as AnimalCategory,
          deathDate: new Date("2024-02-20"),
          cause: "accident" as const,
          causeDescription: "إصابة في الرأس",
          ageAtDeath: 2, // months
          weightAtDeath: 15.2,
          barnId: "barn_003",
          veterinaryReport: "إصابة نتيجة سقوط من مكان مرتفع",
          preventable: true,
          financialLoss: 2500, // EGP
          recordedBy: "user_001",
          createdAt: new Date("2024-02-20"),
          notes: "يجب تحسين إجراءات السلامة في حظيرة الصغار",
        },
        {
          id: "mort_004",
          animalId: "anim_dead_004",
          animalEarTagId: "M666",
          animalCategory: "male" as AnimalCategory,
          deathDate: new Date("2024-03-10"),
          cause: "unknown" as const,
          causeDescription: "موت مفاجئ",
          ageAtDeath: 24, // months
          weightAtDeath: 58.0,
          barnId: "barn_001",
          veterinaryReport: "لم يتم تحديد سبب واضح للوفاة",
          preventable: false,
          financialLoss: 9500, // EGP
          recordedBy: "user_001",
          createdAt: new Date("2024-03-10"),
          notes: "حالة نادرة تتطلب مزيد من الفحوصات المخبرية",
        },
        {
          id: "mort_005",
          animalId: "anim_dead_005",
          animalEarTagId: "F555",
          animalCategory: "female" as AnimalCategory,
          deathDate: new Date("2024-03-25"),
          cause: "old_age" as const,
          causeDescription: "شيخوخة طبيعية",
          ageAtDeath: 84, // months (7 years)
          weightAtDeath: 48.5,
          barnId: "barn_002",
          veterinaryReport: "وفاة طبيعية بسبب التقدم في العمر",
          preventable: false,
          financialLoss: 6000, // EGP (lower due to age)
          recordedBy: "user_001",
          createdAt: new Date("2024-03-25"),
          notes: "عاشت حياة مثمرة وأنجبت 15 مولوداً",
        },
      ] as MortalityRecord[],
    };
  }

  // Collection methods compatible with Firestore
  collection(name: string) {
    return {
      get: () => {
        return Promise.resolve({
          docs:
            (this.data as any)[name]?.map((item: any) => ({
              id: item.id,
              data: () => item,
              exists: true,
            })) || [],
        });
      },
      add: (doc: any) => {
        const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newDoc = {
          ...doc,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (this.data as any)[name].push(newDoc);
        return Promise.resolve({ id });
      },
      doc: (id: string) => ({
        get: () => {
          const item = (this.data as any)[name]?.find(
            (item: any) => item.id === id,
          );
          return Promise.resolve({
            exists: !!item,
            id,
            data: () => item,
          });
        },
        set: (doc: any) => {
          const index = (this.data as any)[name]?.findIndex(
            (item: any) => item.id === id,
          );
          const newDoc = {
            ...doc,
            id,
            updatedAt: new Date(),
          };

          if (index !== -1) {
            (this.data as any)[name][index] = newDoc;
          } else {
            (this.data as any)[name].push(newDoc);
          }
          return Promise.resolve();
        },
        update: (updates: any) => {
          const index = (this.data as any)[name]?.findIndex(
            (item: any) => item.id === id,
          );
          if (index !== -1) {
            (this.data as any)[name][index] = {
              ...(this.data as any)[name][index],
              ...updates,
              updatedAt: new Date(),
            };
          }
          return Promise.resolve();
        },
        delete: () => {
          const index = (this.data as any)[name]?.findIndex(
            (item: any) => item.id === id,
          );
          if (index !== -1) {
            (this.data as any)[name].splice(index, 1);
          }
          return Promise.resolve();
        },
      }),
      where: (field: string, operator: string, value: any) => ({
        get: () => {
          let filtered = (this.data as any)[name] || [];

          switch (operator) {
            case "==":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes(".")
                  ? field.split(".").reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue === value;
              });
              break;
            case "!=":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes(".")
                  ? field.split(".").reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue !== value;
              });
              break;
            case ">":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes(".")
                  ? field.split(".").reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue > value;
              });
              break;
            case ">=":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes(".")
                  ? field.split(".").reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue >= value;
              });
              break;
            case "<":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes(".")
                  ? field.split(".").reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue < value;
              });
              break;
            case "<=":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes(".")
                  ? field.split(".").reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return fieldValue <= value;
              });
              break;
            case "array-contains":
              filtered = filtered.filter((item: any) => {
                const fieldValue = field.includes(".")
                  ? field.split(".").reduce((obj, key) => obj?.[key], item)
                  : item[field];
                return Array.isArray(fieldValue) && fieldValue.includes(value);
              });
              break;
          }

          return Promise.resolve({
            docs: filtered.map((item: any) => ({
              id: item.id,
              data: () => item,
              exists: true,
            })),
          });
        },
      }),
    };
  }

  // Helper methods
  getCurrentStock(itemId: string): number {
    const item = this.data.warehouseItems.find((item) => item.id === itemId);
    return item?.currentStock || 0;
  }

  getBarnOccupancy(barnId: string): number {
    return this.data.animals.filter((animal) => animal.barnId === barnId)
      .length;
  }

  calculateADG(animalId: string): number {
    const animal = this.data.animals.find((a) => a.id === animalId);
    if (!animal) return 0;

    const birthDate = animal.birthDate || animal.purchaseDate;
    const daysSinceBirth = Math.floor(
      (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24),
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
