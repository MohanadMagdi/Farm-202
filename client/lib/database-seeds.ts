import { WarehouseItem, StockMovement } from '@shared/types';
import { FEED_TYPES } from '@shared/types';

/**
 * Sample warehouse items for testing the integrated inventory system
 */

export const sampleWarehouseItems: Omit<WarehouseItem, 'id'>[] = [
  // Feed items are now handled by syncFeedTypesToWarehouse in integrated-inventory-service
  // This prevents duplicates and ensures consistency
  
  // Sample medicines
  {
    name: 'بنسلين',
    type: 'medicines',
    category: 'مضاد حيوي',
    unit: 'مليلتر',
    currentStock: 120,
    minStockLevel: 50,
    maxStockLevel: 300,
    unitPrice: 2.5,
    hasExpiry: true,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'لقاح الحمى القلاعية',
    type: 'medicines',
    category: 'تحصين',
    unit: 'أمبولة',
    currentStock: 45,
    minStockLevel: 20,
    maxStockLevel: 100,
    unitPrice: 15.0,
    hasExpiry: true,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'فيتامين أ د 3 هـ',
    type: 'medicines',
    category: 'مكملات غذائية',
    unit: 'مليلتر',
    currentStock: 80,
    minStockLevel: 30,
    maxStockLevel: 150,
    unitPrice: 3.2,
    hasExpiry: true,
    expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years from now
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'ايفرمكتين',
    type: 'medicines',
    category: 'مضاد طفيليات',
    unit: 'مليلتر',
    currentStock: 35,
    minStockLevel: 25,
    maxStockLevel: 100,
    unitPrice: 4.8,
    hasExpiry: true,
    expiryDate: new Date(Date.now() + 545 * 24 * 60 * 60 * 1000), // 1.5 years from now
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'ديكساميثازون',
    type: 'medicines',
    category: 'مضاد التهاب',
    unit: 'مليلتر',
    currentStock: 25,
    minStockLevel: 20,
    maxStockLevel: 80,
    unitPrice: 5.5,
    hasExpiry: true,
    expiryDate: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000), // ~13 months from now
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Sample equipment and supplies
  {
    name: 'حقنة طبية 50 مل',
    type: 'medical_supplies',
    category: 'حقن وإبر',
    unit: 'قطعة',
    currentStock: 25,
    minStockLevel: 20,
    maxStockLevel: 100,
    unitPrice: 12.0,
    hasExpiry: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'قفازات طبية',
    type: 'medical_supplies',
    category: 'حماية شخصية',
    unit: 'صندوق',
    currentStock: 8,
    minStockLevel: 5,
    maxStockLevel: 20,
    unitPrice: 45.0,
    hasExpiry: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'مطهر يدين',
    type: 'chemicals',
    category: 'تطهير وتعقيم',
    unit: 'لتر',
    currentStock: 15,
    minStockLevel: 10,
    maxStockLevel: 50,
    unitPrice: 25.0,
    hasExpiry: true,
    expiryDate: new Date(Date.now() + 910 * 24 * 60 * 60 * 1000), // ~2.5 years
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const sampleStockMovements: Omit<StockMovement, 'id'>[] = [
  {
    itemId: 'concentrated_16', // Will be mapped to actual item ID
    type: 'in',
    quantity: 100,
    unitPrice: 14.0,
    totalCost: 1400,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    reason: 'إدخال علف من العامل',
    recordedBy: 'عامل المزرعة',
    notes: 'علف مركز 16% - دفعة جديدة'
  },
  {
    itemId: 'concentrated_16',
    type: 'out',
    quantity: 25,
    unitPrice: 14.0,
    totalCost: 350,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    reason: 'صرف للحظيرة barn_001',
    recordedBy: 'عامل المزرعة',
    notes: 'تغذية حظيرة الذكور'
  },
  {
    itemId: 'saline_hay',
    type: 'in',
    quantity: 200,
    unitPrice: 8.0,
    totalCost: 1600,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    reason: 'شراء من المورد',
    recordedBy: 'مدير المخزون',
    notes: 'دريس عالي الجودة'
  }
];

/**
 * Initialize sample data for testing
 */
export async function initializeSampleData(dataService: any): Promise<void> {
  try {
    console.log('Initializing sample warehouse data...');
    
    // Add sample warehouse items
    for (const item of sampleWarehouseItems) {
      try {
        await dataService.warehouseItems.create(item);
      } catch (error) {
        // Item might already exist, continue
        console.log(`Item ${item.name} already exists or failed to create`);
      }
    }
    
    // Add sample stock movements
    for (const movement of sampleStockMovements) {
      try {
        await dataService.stockMovements.create(movement);
      } catch (error) {
        // Movement might already exist, continue
        console.log(`Movement failed to create:`, error);
      }
    }
    
    console.log('Sample data initialization completed');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}
