import dataService from './data-service-unified';
import { generateFeedId, getFeedArabicName } from './feed-utils';
import { FeedMainType, WarehouseItem, StockMovement } from '@shared/types';

/**
 * Integrated Inventory Service
 * Manages the connection between worker inputs and inventory system
 */

export class IntegratedInventoryService {
  /**
   * Add feed to inventory with specified details
   * @param params Feed parameters including type, quantity, price, etc.
   * @returns Promise with success status
   */
  async addFeedToInventory(params: { 
    mainType: FeedMainType; 
    subType: string; 
    quantity: number; 
    unitPrice: number; 
    notes: string; 
    recordedBy: string; 
  }): Promise<boolean> {
    try {
      const { mainType, subType, quantity, unitPrice, notes, recordedBy } = params;
      
      // Get the Arabic name for the feed type
      const arabicName = await getFeedArabicName(mainType, subType);
      
      // Check if feed already exists in inventory
      const feedItems = await this.getAvailableFeedItems();
      const existingFeedItem = feedItems.find(item => 
        item.name.toLowerCase().includes(arabicName.toLowerCase())
      );
      
      if (existingFeedItem) {
        // Update existing feed stock
        const newStock = existingFeedItem.currentStock + quantity;
        await dataService.updateWarehouseItem(existingFeedItem.id, {
          ...existingFeedItem,
          currentStock: newStock,
          unitPrice: unitPrice || existingFeedItem.unitPrice,
          updatedAt: new Date()
        });
        
        // Record stock movement
        await dataService.createStockMovement({
          itemId: existingFeedItem.id,
          type: 'in',
          quantity,
          unitPrice,
          totalCost: quantity * unitPrice,
          date: new Date(),
          reason: notes || 'إضافة مخزون',
          recordedBy: recordedBy || 'نظام التغذية'
        });
        
        console.log(`Added ${quantity} units to existing feed: ${arabicName}`);
        return true;
      } else {
        // Create new feed item
        const newItem: Omit<WarehouseItem, 'id'> = {
          name: arabicName,
          type: 'feed',
          category: mainType === 'concentrated' ? 'علف مركز' : 'مادة مالحة',
          currentStock: quantity,
          unit: 'كجم',
          unitPrice: unitPrice,
          isActive: true,
          minStockLevel: 50,
          maxStockLevel: 2000,
          hasExpiry: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Create the item
        const itemId = await dataService.createWarehouseItem(newItem);
        
        // Record stock movement
        await dataService.createStockMovement({
          itemId,
          type: 'in',
          quantity,
          unitPrice,
          totalCost: quantity * unitPrice,
          date: new Date(),
          reason: notes || 'إضافة مخزون جديد',
          recordedBy: recordedBy || 'نظام التغذية'
        });
        
        console.log(`Created new feed item: ${arabicName} with ${quantity} units`);
        return true;
      }
    } catch (error) {
      console.error('Error adding feed to inventory:', error);
      return false;
    }
  }

  /**
   * Add medicine to inventory
   * @param params Medicine parameters
   * @returns Promise with success status
   */
  async addMedicineToInventory(params: {
    name: string;
    type: 'medicine';
    quantity: number;
    unitPrice: number;
    notes?: string;
    recordedBy?: string;
    hasExpiry?: boolean;
    expiryDate?: Date;
  }): Promise<boolean> {
    try {
      const { name, quantity, unitPrice, notes, recordedBy, hasExpiry, expiryDate } = params;
      
      // Check if medicine already exists in inventory
      const medicineItems = await this.getAvailableMedicineItems();
      const existingMedicine = medicineItems.find(item => 
        item.name.toLowerCase().includes(name.toLowerCase())
      );
      
      if (existingMedicine) {
        // Update existing medicine stock
        const newStock = existingMedicine.currentStock + quantity;
        await dataService.updateWarehouseItem(existingMedicine.id, {
          ...existingMedicine,
          currentStock: newStock,
          unitPrice: unitPrice || existingMedicine.unitPrice,
          updatedAt: new Date()
        });
        
        // Record stock movement
        await dataService.createStockMovement({
          itemId: existingMedicine.id,
          type: 'in',
          quantity,
          unitPrice,
          totalCost: quantity * unitPrice,
          date: new Date(),
          reason: notes || 'إضافة دواء',
          recordedBy: recordedBy || 'نظام الصيدلية'
        });
        
        console.log(`Added ${quantity} units to existing medicine: ${name}`);
        return true;
      } else {
        // Create new medicine item
        const newItem: Omit<WarehouseItem, 'id'> = {
          name,
          type: 'medicines',
          category: 'أدوية',
          currentStock: quantity,
          unit: 'قطعة',
          unitPrice: unitPrice,
          isActive: true,
          minStockLevel: 10,
          maxStockLevel: 500,
          hasExpiry: hasExpiry || true,
          expiryDate: expiryDate,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Create the item
        const itemId = await dataService.createWarehouseItem(newItem);
        
        // Record stock movement
        await dataService.createStockMovement({
          itemId,
          type: 'in',
          quantity,
          unitPrice,
          totalCost: quantity * unitPrice,
          date: new Date(),
          reason: notes || 'إضافة دواء جديد',
          recordedBy: recordedBy || 'نظام الصيدلية'
        });
        
        console.log(`Created new medicine item: ${name} with ${quantity} units`);
        return true;
      }
    } catch (error) {
      console.error('Error adding medicine to inventory:', error);
      return false;
    }
  }
  
  /**
   * Remove feed from inventory (for distribution)
   * @param params Distribution parameters
   * @returns Promise with success status
   */
  async distributeFeedFromInventory(params: { 
    mainType: FeedMainType; 
    subType: string; 
    quantity: number; 
    notes: string; 
    recordedBy: string; 
  }): Promise<boolean> {
    try {
      const { mainType, subType, quantity, notes, recordedBy } = params;
      
      // Get the feed item
      const feedItems = await this.getAvailableFeedItems();
      let feedItem: WarehouseItem | undefined;
      
      if (mainType === 'concentrated') {
        feedItem = feedItems.find(item => 
          item.name.includes('علف مركز') && item.name.includes(subType)
        );
      } else if (mainType === 'saline_material') {
        const targetName = subType === 'hay' ? 'دريس' : 'تبن';
        feedItem = feedItems.find(item => 
          item.name.includes('مالحة') && item.name.includes(targetName)
        );
      }
      
      if (!feedItem) {
        console.error('Feed item not found for distribution');
        return false;
      }
      
      // Check stock
      if (feedItem.currentStock < quantity) {
        console.error('Insufficient stock for distribution');
        return false;
      }
      
      // Update stock
      const newStock = feedItem.currentStock - quantity;
      await dataService.updateWarehouseItem(feedItem.id, {
        ...feedItem,
        currentStock: newStock,
        updatedAt: new Date()
      });
      
      // Record stock movement
      await dataService.createStockMovement({
        itemId: feedItem.id,
        type: 'out',
        quantity,
        unitPrice: feedItem.unitPrice,
        totalCost: quantity * feedItem.unitPrice,
        date: new Date(),
        reason: notes || 'صرف علف',
        recordedBy: recordedBy || 'نظام التغذية'
      });
      
      return true;
    } catch (error) {
      console.error('Error distributing feed from inventory:', error);
      return false;
    }
  }
  
  /**
   * Sync predefined feed types to the warehouse
   * Ensures all standard feed types are in the inventory
   */
  async syncFeedTypesToWarehouse(): Promise<void> {
    try {
      console.log('Synchronizing predefined feed types to warehouse...');
      
      // Clean up duplicates first
      await this.cleanupDuplicateItems();
      
      // Get feed types from the standard definitions
      const { FEED_TYPES } = await import('@shared/types');
      
      // Get existing feed items
      const existingFeeds = await this.getAvailableFeedItems();
      
      // Process each standard feed type
      for (const [key, feedType] of Object.entries(FEED_TYPES)) {
        const { mainType, subType, arabicName } = feedType;
        const normalizedName = arabicName.trim().toLowerCase();
        
        // Check if this feed type already exists
        const exists = existingFeeds.some(
          item => item.name.trim().toLowerCase() === normalizedName
        );
        
        if (!exists) {
          // Create default feed item if it doesn't exist
          const newItem: Omit<WarehouseItem, 'id'> = {
            name: arabicName,
            type: 'feed',
            category: mainType === 'concentrated' ? 'علف مركز' : 'مادة مالحة',
            currentStock: 0, // Start with zero stock
            unit: 'كجم',
            unitPrice: 0, // Default price
            isActive: true,
            minStockLevel: 50,
            maxStockLevel: 2000,
            hasExpiry: false,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Create the item
          const itemId = await dataService.createWarehouseItem(newItem);
          console.log(`Created standard feed type: ${arabicName} (ID: ${itemId})`);
        } else {
          console.log(`Feed type already exists: ${arabicName}`);
        }
      }
      
      console.log('Feed type synchronization completed successfully');
    } catch (error) {
      console.error('Error synchronizing feed types:', error);
      throw error;
    }
  }
  
  /**
   * Clean up duplicate warehouse items - Enhanced version with fuzzy matching
   */
  async cleanupDuplicateItems(): Promise<void> {
    try {
      console.log('Starting enhanced cleanup of duplicate warehouse items...');
      const allItems = await dataService.getWarehouseItems();
      
      console.log(`Processing ${allItems.length} total warehouse items for duplicate detection`);
      
      // Enhanced normalization function for item names
      const normalizeString = (str: string): string => {
        return str.trim()
          .toLowerCase()
          // Remove all extra spaces
          .replace(/\\s+/g, ' ')
          // Replace similar Arabic characters
          .replace(/[أإآا]/g, 'ا')
          .replace(/[ىي]/g, 'ي')
          .replace(/[ؤو]/g, 'و')
          .replace(/[ةه]/g, 'ه')
          // Remove common punctuation differences
          .replace(/[٪%]/g, '')
          .replace(/[-_]/g, ' ');
      };

      // Similarity threshold (0.8 means 80% similar)
      const SIMILARITY_THRESHOLD = 0.8;
      
      // Function to check similarity between two strings
      const calculateSimilarity = (str1: string, str2: string): number => {
        // Convert to arrays of normalized characters
        const arr1 = Array.from(normalizeString(str1));
        const arr2 = Array.from(normalizeString(str2));
        
        // Find common characters
        let matches = 0;
        for (const char of arr1) {
          const index = arr2.indexOf(char);
          if (index !== -1) {
            matches++;
            // Remove the matched character to avoid counting it twice
            arr2.splice(index, 1);
          }
        }
        
        // Calculate similarity as a ratio of matches to total unique characters
        const totalChars = Math.max(str1.length, str2.length);
        return totalChars === 0 ? 0 : matches / totalChars;
      };
      
      // Process all items with enhanced grouping
      const grouped: Record<string, WarehouseItem[]> = {};
      
      // First group by type
      const itemsByType: Record<string, WarehouseItem[]> = {};
      for (const item of allItems) {
        if (!itemsByType[item.type]) {
          itemsByType[item.type] = [];
        }
        itemsByType[item.type].push(item);
      }
      
      // For each type, find similar items
      for (const [type, items] of Object.entries(itemsByType)) {
        console.log(`Processing ${items.length} items of type: ${type}`);
        
        // Check each pair of items for similarity
        for (let i = 0; i < items.length; i++) {
          const itemA = items[i];
          const normalizedNameA = normalizeString(itemA.name);
          
          // If this item has already been assigned to a group, skip
          let alreadyGrouped = false;
          for (const groupKey of Object.keys(grouped)) {
            if (grouped[groupKey].some(item => item.id === itemA.id)) {
              alreadyGrouped = true;
              break;
            }
          }
          if (alreadyGrouped) continue;
          
          // Create a new group for this item
          const groupKey = `${type}:${normalizedNameA}:${itemA.id}`;
          grouped[groupKey] = [itemA];
          
          // Find similar items
          for (let j = i + 1; j < items.length; j++) {
            const itemB = items[j];
            
            // Skip if already in a group
            let itemBAlreadyGrouped = false;
            for (const gKey of Object.keys(grouped)) {
              if (grouped[gKey].some(item => item.id === itemB.id)) {
                itemBAlreadyGrouped = true;
                break;
              }
            }
            if (itemBAlreadyGrouped) continue;
            
            // Check if the item names are similar enough
            const similarity = calculateSimilarity(itemA.name, itemB.name);
            if (similarity >= SIMILARITY_THRESHOLD) {
              console.log(`Found similarity (${(similarity * 100).toFixed(2)}%) between "${itemA.name}" and "${itemB.name}"`);
              grouped[groupKey].push(itemB);
            }
          }
        }
      }

      // Process each group of potential duplicates
      let duplicatesFound = false;
      for (const [groupKey, items] of Object.entries(grouped)) {
        if (items.length > 1) {
          duplicatesFound = true;
          console.log(`Found ${items.length} duplicates for key: ${groupKey}`);
          console.log(`Names: ${items.map(i => i.name).join(', ')}`);
          
          // Sort by date (keep newest), current stock (preserve non-zero stock) and name quality
          items.sort((a, b) => {
            // Keep items with stock as higher priority
            if (a.currentStock > 0 && b.currentStock === 0) return -1;
            if (a.currentStock === 0 && b.currentStock > 0) return 1;
            
            // If names differ in length, prefer the longer, more descriptive name
            if (a.name.length !== b.name.length) {
              return b.name.length - a.name.length;
            }
            
            // If both have stock or both don't have stock, prefer newer items
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
          });
          
          // Keep the first item (highest priority by our sorting)
          const itemToKeep = items[0];
          console.log(`Keeping item: ${itemToKeep.id} - ${itemToKeep.name} (Stock: ${itemToKeep.currentStock})`);
          
          // Combine stock from all duplicates
          let combinedStock = itemToKeep.currentStock;
          
          // Process other items (duplicates)
          for (let i = 1; i < items.length; i++) {
            const duplicateItem = items[i];
            console.log(`Merging and removing duplicate: ${duplicateItem.id} - ${duplicateItem.name} (Stock: ${duplicateItem.currentStock})`);
            
            // Add stock from duplicate to the item we're keeping
            combinedStock += duplicateItem.currentStock;
            
            // Delete the duplicate
            await dataService.deleteWarehouseItem(duplicateItem.id);
          }
          
          // Update stock of the item we're keeping
          if (combinedStock !== itemToKeep.currentStock) {
            console.log(`Updating stock of item ${itemToKeep.id} from ${itemToKeep.currentStock} to ${combinedStock}`);
            await dataService.updateWarehouseItem(itemToKeep.id, {
              ...itemToKeep,
              currentStock: combinedStock,
              updatedAt: new Date()
            });
          }
        }
      }
      
      if (!duplicatesFound) {
        console.log('No duplicates found during warehouse cleanup');
      } else {
        console.log('Warehouse cleanup completed successfully');
      }
      
    } catch (error) {
      console.error('Error cleaning up duplicate warehouse items:', error);
    }
  }
  
  /**
   * Get available feed items
   * @returns List of feed items
   */
  async getAvailableFeedItems(): Promise<WarehouseItem[]> {
    const items = await dataService.getWarehouseItems();
    return items.filter(item => item.type === 'feed' && item.isActive !== false);
  }
  
  /**
   * Get available medicine items
   * @returns List of medicine items
   */
  async getAvailableMedicineItems(): Promise<WarehouseItem[]> {
    const items = await dataService.getWarehouseItems();
    return items.filter(item => item.type === 'medicines' && item.isActive !== false);
  }
  
  /**
   * Get available equipment items
   * @returns List of equipment items
   */
  async getAvailableEquipmentItems(): Promise<WarehouseItem[]> {
    const items = await dataService.getWarehouseItems();
    return items.filter(item => item.type === 'equipment' && item.isActive !== false);
  }
  
  /**
   * Get feed stock level by type
   * @param mainType Main feed type
   * @param subType Sub type
   * @returns Current stock level
   */
  async getFeedStockLevel(mainType: FeedMainType, subType: string): Promise<number> {
    try {
      // Get all feed items
      const feedItems = await this.getAvailableFeedItems();
      
      // For concentrated feed, look for pattern like "علف مركز 14%"
      if (mainType === 'concentrated') {
        const targetFeed = feedItems.find(item => 
          item.name.includes('علف مركز') && item.name.includes(subType)
        );
        return targetFeed?.currentStock || 0;
      }
      
      // For saline materials, look for specific types
      if (mainType === 'saline_material') {
        const targetName = subType === 'hay' ? 'دريس' : 'تبن';
        const targetFeed = feedItems.find(item => 
          item.name.includes('مالحة') && item.name.includes(targetName)
        );
        return targetFeed?.currentStock || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting feed stock level:', error);
      return 0;
    }
  }
  
  /**
   * Record feeding operation and update stock
   * @param feedingData Feeding data
   * @returns Success status
   */
  async recordFeeding(feedingData: any): Promise<boolean> {
    try {
      // Extract data
      const { 
        feedType, 
        feedSubType, 
        quantity, 
        barnId, 
        animalCount 
      } = feedingData;
      
      // Get matching feed item
      const feedItems = await this.getAvailableFeedItems();
      let feedItem: WarehouseItem | undefined;
      
      if (feedType === 'concentrated') {
        feedItem = feedItems.find(item => 
          item.name.includes('علف مركز') && item.name.includes(feedSubType)
        );
      } else if (feedType === 'saline_material') {
        const targetName = feedSubType === 'hay' ? 'دريس' : 'تبن';
        feedItem = feedItems.find(item => 
          item.name.includes('مالحة') && item.name.includes(targetName)
        );
      }
      
      if (!feedItem) {
        console.error('Feed item not found for feeding operation');
        return false;
      }
      
      // Check stock
      if (feedItem.currentStock < quantity) {
        console.error('Insufficient stock for feeding operation');
        return false;
      }
      
      // Create feeding record
      await dataService.createFeedingRecord({
        ...feedingData,
        date: new Date(),
        feedItemId: feedItem.id,
        feedItemName: feedItem.name,
      });
      
      // Update stock
      const newStock = feedItem.currentStock - quantity;
      await dataService.updateWarehouseItem(feedItem.id, {
        ...feedItem,
        currentStock: newStock,
        updatedAt: new Date()
      });
      
      // Record stock movement
      await dataService.createStockMovement({
        itemId: feedItem.id,
        type: 'out',
        quantity,
        unitPrice: feedItem.unitPrice,
        totalCost: quantity * feedItem.unitPrice,
        date: new Date(),
        reason: `تغذية (حظيرة ${barnId} - ${animalCount} حيوان)`,
        recordedBy: 'نظام التغذية'
      });
      
      return true;
    } catch (error) {
      console.error('Error recording feeding operation:', error);
      return false;
    }
  }
  
  /**
   * Get current stock levels for all feed types
   * @returns Record of stock levels by feed type
   */
  async getAllFeedStockLevels(): Promise<Record<string, number>> {
    try {
      const result: Record<string, number> = {
        'concentrated_14%': 0,
        'concentrated_16%': 0,
        'concentrated_21%': 0,
        'saline_material_hay': 0,
        'saline_material_straw': 0
      };
      
      const feedItems = await this.getAvailableFeedItems();
      
      for (const item of feedItems) {
        const name = item.name.toLowerCase();
        
        // Concentrated feed types
        if (name.includes('علف مركز') || name.includes('مركز')) {
          if (name.includes('14%')) {
            result['concentrated_14%'] = item.currentStock;
          } else if (name.includes('16%')) {
            result['concentrated_16%'] = item.currentStock;
          } else if (name.includes('21%')) {
            result['concentrated_21%'] = item.currentStock;
          }
        }
        
        // Saline materials
        if (name.includes('مالحة') || name.includes('مادة مالحة')) {
          if (name.includes('دريس') || name.includes('hay')) {
            result['saline_material_hay'] = item.currentStock;
          } else if (name.includes('تبن') || name.includes('straw')) {
            result['saline_material_straw'] = item.currentStock;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error getting all feed stock levels:', error);
      return {};
    }
  }
}

// Export an instance of the service
export const integratedInventoryService = new IntegratedInventoryService();

// Default export for convenience
export default integratedInventoryService;