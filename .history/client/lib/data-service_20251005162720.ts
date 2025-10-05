/**
 * Data Service Layer
 * Uses local SQLite database via API
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
  AnimalCategory,
  WarehouseType,
  BarnEquipment,
  FeedConsumptionRecord,
  FeedEfficiencyRecord,
} from "@/../../shared/types";

console.log("Data Service Mode: Local API (SQLite)");

// Base API service
class APIService<T extends { id: string }> {
  constructor(private endpoint: string) {}

  async getAll(): Promise<T[]> {
    try {
      const response = await fetch(`/api/${this.endpoint}`);
      if (!response.ok) throw new Error(`Failed to fetch ${this.endpoint}`);
      return response.json();
    } catch (error) {
      console.error(`Error fetching ${this.endpoint}:`, error);
      return [];
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const response = await fetch(`/api/${this.endpoint}/${id}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Failed to fetch ${this.endpoint}/${id}`);
      return response.json();
    } catch (error) {
      console.error(`Error fetching ${this.endpoint}/${id}:`, error);
      return null;
    }
  }

  async create(data: Omit<T, "id">): Promise<string> {
    const response = await fetch(`/api/${this.endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to create ${this.endpoint}`);
    const result = await response.json();
    return result.id || result.data?.id;
  }

  async update(id: string, data: Partial<Omit<T, "id">>): Promise<void> {
    const response = await fetch(`/api/${this.endpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update ${this.endpoint}/${id}`);
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/${this.endpoint}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete ${this.endpoint}/${id}`);
  }

  async query(params: Record<string, any> = {}): Promise<T[]> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      
      const response = await fetch(`/api/${this.endpoint}?${searchParams}`);
      if (!response.ok) throw new Error(`Failed to query ${this.endpoint}`);
      return response.json();
    } catch (error) {
      console.error(`Error querying ${this.endpoint}:`, error);
      return [];
    }
  }
}

// Extended Animals Service
class AnimalsAPIService extends APIService<Animal> {
  async getByCategory(category: AnimalCategory): Promise<Animal[]> {
    return this.query({ category });
  }

  async getByBarn(barnId: string): Promise<Animal[]> {
    return this.query({ barnId });
  }

  async getByEarTag(earTag: string): Promise<Animal | null> {
    const animals = await this.query({ earTag });
    return animals[0] || null;
  }

  async checkEarTagExists(earTag: string, excludeId?: string): Promise<boolean> {
    const animals = await this.query({ earTag });
    if (excludeId) {
      return animals.some(animal => animal.id !== excludeId);
    }
    return animals.length > 0;
  }

  async getNextEarTagId(category: AnimalCategory): Promise<string> {
    const prefix = category === "male" ? "M" : category === "female" ? "F" : "N";
    const animals = await this.getByCategory(category);

    if (animals.length === 0) {
      return `${prefix}001`;
    }

    const sortedAnimals = animals.sort((a, b) => a.earTag.localeCompare(b.earTag));
    const lastEarTag = sortedAnimals[sortedAnimals.length - 1].earTag;
    const lastNumber = parseInt(lastEarTag.substring(1));
    const nextNumber = lastNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
  }
}

// Extended Warehouse Service
class WarehouseAPIService extends APIService<WarehouseItem> {
  async getByType(type: WarehouseType): Promise<WarehouseItem[]> {
    return this.query({ type });
  }

  async getLowStock(): Promise<WarehouseItem[]> {
    const items = await this.getAll();
    return items.filter(item => item.currentStock <= (item.reorderPoint || 0));
  }

  async getExpiredItems(): Promise<WarehouseItem[]> {
    const now = new Date();
    const items = await this.getAll();
    return items.filter(item => 
      item.expiryDate && new Date(item.expiryDate) < now
    );
  }

  async getExpiringItems(days: number = 7): Promise<WarehouseItem[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const now = new Date();

    const items = await this.getAll();
    return items.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      return expiry <= futureDate && expiry >= now;
    });
  }
}

// Helper functions for common operations
export const farmHelpers = {
  // Calculate ADG for an animal
  calculateADG: (animal: Animal): number => {
    const birthDate = animal.birthDate ? new Date(animal.birthDate) : 
                      animal.acquisitionDate ? new Date(animal.acquisitionDate) : null;
    if (!birthDate) return 0;
    
    const daysSinceBirth = Math.floor(
      (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const estimatedBirthWeight = 3.5; // kg for sheep
    const currentWeight = animal.currentWeight || 0;
    return daysSinceBirth > 0
      ? (currentWeight - estimatedBirthWeight) / daysSinceBirth
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
      (sum, item) => sum + item.currentStock * (item.costPerUnit || 0),
      0,
    );
    const lowStockItems = await dataService.warehouseItems.getLowStock();
    const expiredItems = await dataService.warehouseItems.getExpiredItems();
    const expiringItems = await dataService.warehouseItems.getExpiringItems(7);

    return {
      totalItems: items.length,
      totalValue,
      lowStockCount: lowStockItems.length,
      expiredCount: expiredItems.length,
      expiringCount: expiringItems.length,
      recentMovements: movements.slice(0, 10),
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
};

// Service instances
export const dataService = {
  animals: new AnimalsAPIService("animals"),
  barns: new APIService<Barn>("barns"),
  warehouseItems: new WarehouseAPIService("warehouse"),
  stockMovements: new APIService<StockMovement>("stock-movements"),
  feedingRecords: new APIService<FeedingRecord>("feeding"),
  weightRecords: new APIService<WeightRecord>("weights"),
  healthRecords: new APIService<HealthRecord>("health"),
  barnMovements: new APIService<BarnMovement>("barn-movements"),
  feedingSchedules: new APIService<FeedingSchedule>("feeding-schedules"),
  mortalityRecords: new APIService<MortalityRecord>("mortality"),
  barnEquipment: new APIService<BarnEquipment>("barn-equipment"),
  feedEfficiency: new APIService<FeedEfficiencyRecord>("feed-efficiency"),
};

export const dataMode = "local-api";

// Re-export individual services for convenience
export const animalsService = dataService.animals;
export const barnsService = dataService.barns;
export const warehouseService = dataService.warehouseItems;
export const stockMovementsService = dataService.stockMovements;
export const feedingRecordsService = dataService.feedingRecords;
export const weightRecordsService = dataService.weightRecords;
export const healthRecordsService = dataService.healthRecords;
export const barnMovementsService = dataService.barnMovements;
export const feedingSchedulesService = dataService.feedingSchedules;
export const mortalityRecordsService = dataService.mortalityRecords;
export const barnEquipmentService = dataService.barnEquipment;
export const feedEfficiencyService = dataService.feedEfficiency;
