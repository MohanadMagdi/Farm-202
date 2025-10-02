import dataService from './data-service-unified';
import { generateFeedId, getFeedArabicName } from './feed-utils';
import { FeedMainType, WarehouseItem, StockMovement } from '@shared/types';

/**
 * Integrated Inventory Service
 * Manages the connection between worker inputs and inventory system
 */

export class IntegratedInventoryService {
  
  /**
   *          if (existingItem.currentStock <= 0 && initialStock > 0) {
            await dataService.updateWarehouseItem(existingItem.id, {lean up duplicate warehouse items - Enhanced version
   */
  async cleanupDuplicateItems(): Promise<void> {
    try {
      console.log('Starting cleanup of duplicate warehouse items...');
      const allItems = await dataService.warehouseItems.getAll();
      
      // Process all items with enhanced grouping
      const grouped = allItems.reduce((acc, item) => {
        // Create a unique key based on name and type
        const normalizedName = item.name.trim().toLowerCase().replace(/\s+/g, ' ');
        const groupKey = `${item.type}:${normalizedName}`;
        
        // For feed items, also check if they match standardized names
        if (item.type === 'feed') {
          // Check if this matches any standardized feed name
          const feedTypes = [
            'علف مركز 14%', 'علف مركز 16%', 'علف مركز 21%',
            'مادة مالحة - دريس', 'مادة مالحة - تبن'
          ];
          
          for (const standardName of feedTypes) {
            const normalizedStandard = standardName.trim().toLowerCase().replace(/\s+/g, ' ');
            if (normalizedName === normalizedStandard) {
              // Use the standard name as group key to ensure consistent grouping
              const standardGroupKey = `feed:${normalizedStandard}`;
              if (!acc[standardGroupKey]) {
                acc[standardGroupKey] = [];
              }
              acc[standardGroupKey].push(item);
              return acc;
            }
          }
        }
        
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
      }, {} as Record<string, WarehouseItem[]>);
      
      let duplicatesFound = 0;
      let itemsRemoved = 0;
      
      // Process duplicates
      for (const [groupKey, duplicates] of Object.entries(grouped)) {
        if (duplicates.length > 1) {
          duplicatesFound++;
          console.log(`Found ${duplicates.length} duplicates for: ${groupKey}`);
          console.log('Duplicate items:', duplicates.map(d => ({
            id: d.id,
            name: d.name,
            stock: d.currentStock,
            updatedAt: d.updatedAt
          })));
          
          // Sort by creation date (keep oldest) and then by stock (keep highest)
          const sortedDuplicates = duplicates.sort((a, b) => {
            // First priority: creation date (older first)
            const dateA = a.createdAt || new Date(0);
            const dateB = b.createdAt || new Date(0);
            if (dateA.getTime() !== dateB.getTime()) {
              return dateA.getTime() - dateB.getTime();
            }
            // Second priority: stock level (higher first)
            return b.currentStock - a.currentStock;
          });
          
          const keeper = sortedDuplicates[0];
          const toRemove = sortedDuplicates.slice(1);
          
          // Calculate total stock from all duplicates
          let totalStock = 0;
          let totalValue = 0;
          let latestUpdate = keeper.updatedAt || new Date();
          
          for (const item of duplicates) {
            totalStock += item.currentStock;
            totalValue += (item.currentStock * item.unitPrice);
            if (item.updatedAt && item.updatedAt > latestUpdate) {
              latestUpdate = item.updatedAt;
            }
          }
          
          // Calculate weighted average price
          const avgPrice = totalStock > 0 ? totalValue / totalStock : keeper.unitPrice;
          
          // Update keeper with consolidated data
          await dataService.updateWarehouseItem(keeper.id, {
            currentStock: totalStock,
            unitPrice: avgPrice,
            updatedAt: latestUpdate,
            // Keep the best of all attributes
            minStockLevel: Math.max(...duplicates.map(d => d.minStockLevel || 0)),
            maxStockLevel: Math.max(...duplicates.map(d => d.maxStockLevel || 0)),
            location: duplicates.find(d => d.location)?.location || keeper.location,
            supplier: duplicates.find(d => d.supplier)?.supplier || keeper.supplier,
            description: duplicates.find(d => d.description)?.description || keeper.description
          });
          
          // Remove duplicates
          for (const duplicate of toRemove) {
            try {
              await dataService.deleteWarehouseItem(duplicate.id);
              itemsRemoved++;
              console.log(`Removed duplicate: ${duplicate.id} - ${duplicate.name}`);
            } catch (deleteError) {
              console.error(`Failed to delete duplicate ${duplicate.id}:`, deleteError);
            }
          }
          
          console.log(`Consolidated ${duplicates.length} items into one with total stock: ${totalStock}`);
        }
      }
      
      console.log(`Cleanup completed: ${duplicatesFound} groups with duplicates found, ${itemsRemoved} items removed`);
      
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      throw error;
    }
  }
  
  /**
   * Add feed to inventory - creates/updates warehouse item and records stock movement
   */
  async addFeedToInventory(params: {
    mainType: FeedMainType;
    subType: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
    recordedBy: string;
  }): Promise<{ warehouseItem: WarehouseItem; stockMovement: StockMovement }> {
    const { mainType, subType, quantity, unitPrice = 0, notes, recordedBy } = params;
    
    const feedId = generateFeedId(mainType, subType);
    const feedName = getFeedArabicName(mainType, subType);
    
    try {
      // Check if warehouse item exists
      let warehouseItem = await this.findOrCreateFeedWarehouseItem(mainType, subType);
      
      // Update stock quantity
      warehouseItem.currentStock += quantity;
      warehouseItem.updatedAt = new Date();
      
      // Update warehouse item
      await dataService.warehouseItems.update(warehouseItem.id, warehouseItem);
      
      // Create stock movement record
      const stockMovementId = await dataService.stockMovements.create({
        itemId: warehouseItem.id,
        type: 'in',
        quantity,
        unitPrice,
        totalCost: quantity * unitPrice,
        date: new Date(),
        reason: 'إدخال علف من العامل',
        recordedBy,
        notes
      });
      
      const stockMovement = await dataService.stockMovements.getById(stockMovementId);
      return { warehouseItem, stockMovement };
      
    } catch (error) {
      console.error('Error adding feed to inventory:', error);
      throw new Error('فشل في إضافة العلف للمخزون');
    }
  }
  
  /**
   * Distribute feed from inventory - updates warehouse item and records stock movement
   */
  async distributeFeedFromInventory(params: {
    mainType: FeedMainType;
    subType: string;
    quantity: number;
    barnId: string;
    notes?: string;
    recordedBy: string;
  }): Promise<{ warehouseItem: WarehouseItem; stockMovement: StockMovement }> {
    const { mainType, subType, quantity, barnId, notes, recordedBy } = params;
    
    const feedId = generateFeedId(mainType, subType);
    const feedName = getFeedArabicName(mainType, subType);
    
    try {
      // Check if warehouse item exists
      let warehouseItem = await this.findOrCreateFeedWarehouseItem(mainType, subType);
      
      // Check if enough stock is available
      if (warehouseItem.currentStock < quantity) {
        throw new Error(`المخزون غير كافي. المتوفر: ${warehouseItem.currentStock} كيلو، المطلوب: ${quantity} كيلو`);
      }
      
      // Update stock quantity
      warehouseItem.currentStock -= quantity;
      warehouseItem.updatedAt = new Date();
      
      // Update warehouse item
      await dataService.warehouseItems.update(warehouseItem.id, warehouseItem);
      
      // Create stock movement record
      const stockMovementId = await dataService.stockMovements.create({
        itemId: warehouseItem.id,
        type: 'out',
        quantity,
        unitPrice: warehouseItem.unitPrice,
        totalCost: quantity * warehouseItem.unitPrice,
        date: new Date(),
        reason: `صرف للحظيرة ${barnId}`,
        recordedBy,
        notes
      });
      
      const stockMovement = await dataService.stockMovements.getById(stockMovementId);
      return { warehouseItem, stockMovement };
      
    } catch (error) {
      console.error('Error distributing feed from inventory:', error);
      throw error;
    }
  }
  
  /**
   * Add medicine to inventory
   */
  async addMedicineToInventory(params: {
    name: string;
    type: string;
    quantity: number;
    unit: string;
    unitPrice?: number;
    expiryDate?: Date;
    notes?: string;
    recordedBy: string;
  }): Promise<{ warehouseItem: WarehouseItem; stockMovement: StockMovement }> {
    const { name, type, quantity, unit, unitPrice = 0, expiryDate, notes, recordedBy } = params;
    
    try {
      // Check if warehouse item exists
      let warehouseItem = await this.findOrCreateMedicineWarehouseItem(name, type, unit, expiryDate);
      
      // Update stock quantity
      warehouseItem.currentStock += quantity;
      warehouseItem.updatedAt = new Date();
      
      // Update warehouse item
      await dataService.warehouseItems.update(warehouseItem.id, warehouseItem);
      
      // Create stock movement record
      const stockMovementId = await dataService.stockMovements.create({
        itemId: warehouseItem.id,
        type: 'in',
        quantity,
        unitPrice,
        totalCost: quantity * unitPrice,
        date: new Date(),
        reason: 'إدخال دواء من العامل',
        recordedBy,
        notes
      });
      
      const stockMovement = await dataService.stockMovements.getById(stockMovementId);
      return { warehouseItem, stockMovement };
      
    } catch (error) {
      console.error('Error adding medicine to inventory:', error);
      throw new Error('فشل في إضافة الدواء للمخزون');
    }
  }
  
  /**
   * Get available feed items from inventory
   */
  async getAvailableFeedItems(): Promise<WarehouseItem[]> {
    try {
      const allItems = await dataService.warehouseItems.getAll();
      return allItems.filter(item => 
        item.type === 'feed' && 
        item.isActive && 
        item.currentStock > 0
      );
    } catch (error) {
      console.error('Error getting available feed items:', error);
      return [];
    }
  }
  
  /**
   * Get available medicine items from inventory
   */
  async getAvailableMedicineItems(): Promise<WarehouseItem[]> {
    try {
      const allItems = await dataService.warehouseItems.getAll();
      return allItems.filter(item => 
        item.type === 'medicines' && 
        item.isActive && 
        item.currentStock > 0
      );
    } catch (error) {
      console.error('Error getting available medicine items:', error);
      return [];
    }
  }
  
  /**
   * Get stock level for specific feed type
   */
  async getFeedStockLevel(mainType: FeedMainType, subType: string): Promise<number> {
    try {
      const warehouseItem = await this.findOrCreateFeedWarehouseItem(mainType, subType);
      return warehouseItem.currentStock;
    } catch (error) {
      console.error('Error getting feed stock level:', error);
      return 0;
    }
  }
  
  /**
   * Find existing feed warehouse item or create new one with initial stock
   */
  private async findOrCreateFeedWarehouseItemWithStock(
    mainType: FeedMainType, 
    subType: string, 
    initialStock: number = 0, 
    unitPrice: number = 0
  ): Promise<WarehouseItem> {
    const feedId = generateFeedId(mainType, subType);
    const feedName = getFeedArabicName(mainType, subType);
    
    try {
      // Try to find existing item with comprehensive matching logic
      const existingItems = await dataService.warehouseItems.getAll();
      let existingItem = existingItems.find(item => {
        // First check by exact ID match
        if (item.id === feedId) return true;
        
        // Then check by exact name match
        if (item.name === feedName) return true;
        
        // For feed type items, check normalized names
        if (item.type === 'feed') {
          const normalizedItemName = item.name.trim().toLowerCase().replace(/\s+/g, ' ');
          const normalizedFeedName = feedName.trim().toLowerCase().replace(/\s+/g, ' ');
          
          // Exact normalized match
          if (normalizedItemName === normalizedFeedName) return true;
        }
        
        return false;
      });
      
      if (existingItem) {
        // Update existing item with better values if needed
        if (existingItem.currentStock <= 0 && initialStock > 0) {
          await dataService.warehouseItems.update(existingItem.id, {
            currentStock: initialStock,
            unitPrice: unitPrice || existingItem.unitPrice,
            updatedAt: new Date()
          });
          existingItem.currentStock = initialStock;
          existingItem.unitPrice = unitPrice || existingItem.unitPrice;
        }
        return existingItem;
      }
      
      // Create new warehouse item with proper initial values
      const newItem: Omit<WarehouseItem, 'id'> = {
        name: feedName,
        type: 'feed',
        category: mainType === 'concentrated' ? 'أعلاف مركزة' : 'أعلاف خشنة',
        unit: 'كيلو',
        currentStock: initialStock,
        minStockLevel: mainType === 'concentrated' ? 50 : 100,
        maxStockLevel: mainType === 'concentrated' ? 500 : 800,
        unitPrice: unitPrice,
        hasExpiry: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newItemId = await dataService.warehouseItems.create(newItem);
      return await dataService.warehouseItems.getById(newItemId);
      
    } catch (error) {
      console.error('Error finding/creating feed warehouse item:', error);
      throw error;
    }
  }

  /**
   * Find existing feed warehouse item or create new one (legacy method)
   */
  private async findOrCreateFeedWarehouseItem(mainType: FeedMainType, subType: string): Promise<WarehouseItem> {
    const feedId = generateFeedId(mainType, subType);
    const feedName = getFeedArabicName(mainType, subType);
    
    try {
      // Try to find existing item with comprehensive matching logic
      const existingItems = await dataService.warehouseItems.getAll();
      let existingItem = existingItems.find(item => {
        // First check by exact ID match
        if (item.id === feedId) return true;
        
        // Then check by exact name match
        if (item.name === feedName) return true;
        
        // For feed type items, check normalized names
        if (item.type === 'feed') {
          const normalizedItemName = item.name.trim().toLowerCase().replace(/\s+/g, ' ');
          const normalizedFeedName = feedName.trim().toLowerCase().replace(/\s+/g, ' ');
          
          // Exact normalized match
          if (normalizedItemName === normalizedFeedName) return true;
          
          // Check if names contain the same key components
          const itemWords = normalizedItemName.split(' ').filter(w => w.length > 2);
          const feedWords = normalizedFeedName.split(' ').filter(w => w.length > 2);
          
          // If both have the same significant words, consider them the same
          if (itemWords.length > 0 && feedWords.length > 0) {
            const commonWords = itemWords.filter(word => feedWords.includes(word));
            if (commonWords.length >= Math.min(itemWords.length, feedWords.length)) {
              return true;
            }
          }
        }
        
        return false;
      });
      
      // If multiple matches found, pick the first one and log warning
      const allMatches = existingItems.filter(item => {
        if (item.type === 'feed') {
          const normalizedItemName = item.name.trim().toLowerCase().replace(/\s+/g, ' ');
          const normalizedFeedName = feedName.trim().toLowerCase().replace(/\s+/g, ' ');
          return normalizedItemName === normalizedFeedName;
        }
        return false;
      });
      
      if (allMatches.length > 1) {
        console.warn(`Multiple matches found for ${feedName}:`, allMatches.map(m => m.id));
        existingItem = allMatches[0]; // Use first match
      }
      
      if (existingItem) {
        return existingItem;
      }
      
      // Create new warehouse item
      const newItem: Omit<WarehouseItem, 'id'> = {
        name: feedName,
        type: 'feed',
        category: mainType === 'concentrated' ? 'أعلاف مركزة' : 'أعلاف خشنة',
        unit: 'كيلو',
        currentStock: 0,
        minStockLevel: 100, // Default minimum stock
        maxStockLevel: 1000, // Default maximum stock
        unitPrice: 0,
        hasExpiry: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newItemId = await dataService.warehouseItems.create(newItem);
      return await dataService.warehouseItems.getById(newItemId);
      
    } catch (error) {
      console.error('Error finding/creating feed warehouse item:', error);
      throw error;
    }
  }
  
  /**
   * Find existing medicine warehouse item or create new one
   */
  private async findOrCreateMedicineWarehouseItem(
    name: string, 
    type: string, 
    unit: string,
    expiryDate?: Date
  ): Promise<WarehouseItem> {
    try {
      // Try to find existing item with better matching
      const existingItems = await dataService.getWarehouseItems();
      let existingItem = existingItems.find(item => {
        if (item.type !== 'medicines') return false;
        
        const normalizedItemName = item.name.trim().toLowerCase().replace(/\s+/g, ' ');
        const normalizedSearchName = name.trim().toLowerCase().replace(/\s+/g, ' ');
        
        return normalizedItemName === normalizedSearchName;
      });
      
      if (existingItem) {
        return existingItem;
      }
      
      // Create new warehouse item
      const newItem: Omit<WarehouseItem, 'id'> = {
        name,
        type: 'medicines',
        category: type,
        unit,
        currentStock: 0,
        minStockLevel: 10, // Default minimum stock for medicines
        maxStockLevel: 100, // Default maximum stock for medicines
        unitPrice: 0,
        hasExpiry: !!expiryDate,
        expiryDate,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newItemId = await dataService.warehouseItems.create(newItem);
      return await dataService.warehouseItems.getById(newItemId);
      
    } catch (error) {
      console.error('Error finding/creating medicine warehouse item:', error);
      throw error;
    }
  }
  
  /**
   * Sync all feed types to warehouse items with proper initial stock
   */
  async syncFeedTypesToWarehouse(): Promise<void> {
    const feedTypes = [
      { mainType: 'concentrated' as FeedMainType, subType: '14%', initialStock: 150, price: 12.5 },
      { mainType: 'concentrated' as FeedMainType, subType: '16%', initialStock: 75, price: 14.0 },
      { mainType: 'concentrated' as FeedMainType, subType: '21%', initialStock: 220, price: 16.5 },
      { mainType: 'saline_material' as FeedMainType, subType: 'hay', initialStock: 300, price: 8.0 },
      { mainType: 'saline_material' as FeedMainType, subType: 'straw', initialStock: 180, price: 6.5 }
    ];
    
    for (const feedType of feedTypes) {
      await this.findOrCreateFeedWarehouseItemWithStock(
        feedType.mainType, 
        feedType.subType, 
        feedType.initialStock, 
        feedType.price
      );
    }
  }
}

// Export singleton instance
export const integratedInventoryService = new IntegratedInventoryService();