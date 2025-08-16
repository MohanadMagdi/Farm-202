export type AnimalCategory = 'male' | 'female' | 'newborn';
export type AnimalStatus = 'active' | 'sold' | 'dead' | 'isolated';
export type IsolationType = 'health_quarantine' | 'illness' | 'post_birth' | 'feeding';
export type BarnType = 'male' | 'female' | 'newborn' | 'mixed';
export type WarehouseType = 'chemicals' | 'medicines' | 'medical_supplies' | 'equipment' | 'maintenance';
export type UserRole = 'owner' | 'manager' | 'vet' | 'inventory' | 'barn_manager' | 'accountant' | 'sales';
export type MovementType = 'in' | 'out' | 'transfer';
export type PricingMethod = 'manual' | 'formula' | 'market_rate';

export interface Animal {
  id: string;
  earTagId: string; // Unique ear tag ID
  category: AnimalCategory;
  sex: 'male' | 'female';
  weight: number; // Current weight
  supplier?: string;
  purchaseDate: Date;
  purchasePrice: number; // EGP
  currentPrice?: number; // EGP - calculated or manual
  barnId: string;
  healthStatus: string;
  isIsolated: boolean;
  isolationType?: IsolationType;
  isolationDate?: Date;
  isolationReason?: string;
  
  // For females
  isPregnant?: boolean;
  aiDate?: Date; // AI = Artificial Insemination
  expectedBirthDate?: Date;
  offspringCount?: number;
  
  // For newborns
  motherId?: string;
  birthDate?: Date;
  weaningDate?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface WeightRecord {
  id: string;
  animalId: string;
  weight: number;
  date: Date;
  recordedBy: string;
  notes?: string;
}

export interface Barn {
  id: string;
  name: string;
  type: BarnType;
  capacity: number;
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BarnMovement {
  id: string;
  animalId: string;
  fromBarnId?: string;
  toBarnId: string;
  date: Date;
  reason: string;
  recordedBy: string;
}

export interface WarehouseItem {
  id: string;
  name: string;
  type: WarehouseType;
  category: string;
  unit: string; // kg, liters, pieces, etc.
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitPrice: number; // EGP
  
  // Expiry tracking
  hasExpiry: boolean;
  expiryDate?: Date;
  originalExpiryDays?: number;
  remainingDays?: number;
  
  description?: string;
  location?: string;
  supplier?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  unitPrice: number; // EGP
  totalCost: number; // EGP
  fromWarehouse?: string;
  toWarehouse?: string;
  
  // Document tracking
  billNumber?: string;
  receiptNumber?: string;
  documentUrls?: string[];
  
  date: Date;
  reason: string;
  recordedBy: string;
  notes?: string;
}

export interface FeedingSchedule {
  id: string;
  barnId: string;
  feedType: string;
  quantity: number; // kg
  timesPerDay: number;
  scheduledTime: string; // "08:00", "14:00", "20:00"
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedingRecord {
  id: string;
  barnId: string;
  scheduleId?: string;
  feedType: string;
  quantityIssued: number; // kg
  animalsCount: number;
  feedPerAnimal: number; // calculated
  
  // Efficiency metrics
  avgDailyGain?: number;
  feedingEfficiency?: number; // feed per animal / daily weight gain
  
  date: Date;
  time: string;
  recordedBy: string;
  notes?: string;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  type: 'vaccination' | 'treatment' | 'checkup' | 'illness';
  description: string;
  medicineUsed?: string;
  dosage?: string;
  cost: number; // EGP
  vetId?: string;
  date: Date;
  nextAppointment?: Date;
  notes?: string;
  recordedBy: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics and Reports types
export interface AnimalAnalytics {
  totalAnimals: number;
  maleCount: number;
  femaleCount: number;
  newbornCount: number;
  pregnantCount: number;
  isolatedCount: number;
  avgWeight: number;
  totalValue: number; // EGP
}

export interface BarnAnalytics {
  barnId: string;
  barnName: string;
  occupancy: number;
  capacity: number;
  occupancyRate: number;
  totalWeight: number;
  avgWeight: number;
  avgDailyGain: number;
  totalValue: number; // EGP
}

export interface FeedingAnalytics {
  date: string;
  totalFeedIssued: number;
  feedCost: number; // EGP
  avgFeedPerAnimal: number;
  avgFeedingEfficiency: number;
  barnBreakdown: {
    barnId: string;
    barnName: string;
    feedIssued: number;
    animalsCount: number;
    feedPerAnimal: number;
    efficiency: number;
  }[];
}

export interface WarehouseAnalytics {
  type: WarehouseType;
  totalItems: number;
  totalValue: number; // EGP
  lowStockItems: number;
  expiredItems: number;
  expiringItems: number; // expiring within 7 days
}
