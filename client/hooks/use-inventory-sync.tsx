import { useState, useEffect, useCallback } from 'react';
import { integratedInventoryService } from '@/lib/integrated-inventory-service';
import dataService from '@/lib/data-service-unified';
import { WarehouseItem, FeedMainType } from '@shared/types';

/**
 * Hook for real-time inventory management
 * Ensures consistent inventory data across all components
 */

export const useInventorySync = () => {
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});
  const [feedingSchedule, setFeedingSchedule] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load all warehouse items
  const loadWarehouseItems = useCallback(async () => {
    try {
      // Clean up duplicates before loading data
      await integratedInventoryService.cleanupDuplicateItems();
      
      const [items, feedingData, stockMovements] = await Promise.all([
        dataService.getWarehouseItems(),
        dataService.getFeedingRecords(),
        dataService.getStockMovements()
      ]);
      
      setWarehouseItems(items);
      setFeedingSchedule(feedingData);
      
      // Identify low stock items (current stock less than minimum threshold)
      const lowStock = items.filter(item => {
        const lowThreshold = 10; // Standard low stock threshold
        return item.currentStock <= lowThreshold;
      });
      setLowStockItems(lowStock);
      
      // Update stock levels for feeds
      const levels: Record<string, number> = {};
      for (const item of items) {
        if (item.type === 'feed') {
          // Create keys that match the format used in worker components
          const feedTypes = [
            { mainType: 'concentrated' as FeedMainType, subType: '14%' },
            { mainType: 'concentrated' as FeedMainType, subType: '16%' },
            { mainType: 'concentrated' as FeedMainType, subType: '21%' },
            { mainType: 'saline_material' as FeedMainType, subType: 'hay' },
            { mainType: 'saline_material' as FeedMainType, subType: 'straw' }
          ];
          
          for (const feedType of feedTypes) {
            const normalizedItemName = item.name.trim().toLowerCase();
            const expectedName = feedType.mainType === 'concentrated' 
              ? `علف مركز ${feedType.subType}`.toLowerCase()
              : feedType.subType === 'hay' 
                ? 'مادة مالحة - دريس' 
                : 'مادة مالحة - تبن';
            
            if (normalizedItemName.includes(expectedName.toLowerCase()) || 
                normalizedItemName.includes(feedType.subType.toLowerCase())) {
              const key = `${feedType.mainType}_${feedType.subType}`;
              levels[key] = item.currentStock;
            }
          }
        }
      }
      setStockLevels(levels);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading warehouse items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get stock level for specific feed type
  const getFeedStockLevel = useCallback(async (mainType: FeedMainType, subType: string): Promise<number> => {
    const key = `${mainType}_${subType}`;
    if (stockLevels[key] !== undefined) {
      return stockLevels[key];
    }
    
    // Fallback to integrated service
    return await integratedInventoryService.getFeedStockLevel(mainType, subType);
  }, [stockLevels]);

  // Refresh inventory data
  const refreshInventory = useCallback(async () => {
    setLoading(true);
    await loadWarehouseItems();
  }, [loadWarehouseItems]);

  // Update specific item stock
  const updateItemStock = useCallback(async (itemId: string, newStock: number) => {
    try {
      await dataService.updateWarehouseItem(itemId, { 
        currentStock: newStock,
        updatedAt: new Date()
      });
      
      // Update local state
      setWarehouseItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, currentStock: newStock, updatedAt: new Date() }
          : item
      ));
      
      // Refresh stock levels
      await loadWarehouseItems();
    } catch (error) {
      console.error('Error updating item stock:', error);
      throw error;
    }
  }, [loadWarehouseItems]);

  // Add stock to item
  const addStock = useCallback(async (itemId: string, quantity: number, reason: string = 'إضافة مخزون') => {
    const item = warehouseItems.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');
    
    const newStock = item.currentStock + quantity;
    await updateItemStock(itemId, newStock);
    
    // Record stock movement
    await dataService.createStockMovement({
      itemId,
      type: 'in',
      quantity,
      unitPrice: item.unitPrice,
      totalCost: quantity * item.unitPrice,
      date: new Date(),
      reason,
      recordedBy: 'نظام متكامل'
    });
    
    return newStock;
  }, [warehouseItems, updateItemStock]);

  // Remove stock from item
  const removeStock = useCallback(async (itemId: string, quantity: number, reason: string = 'صرف مخزون') => {
    const item = warehouseItems.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');
    if (item.currentStock < quantity) throw new Error('كمية غير كافية في المخزون');
    
    const newStock = item.currentStock - quantity;
    await updateItemStock(itemId, newStock);
    
    // Record stock movement
    await dataService.createStockMovement({
      itemId,
      type: 'out',
      quantity,
      unitPrice: item.unitPrice,
      totalCost: quantity * item.unitPrice,
      date: new Date(),
      reason,
      recordedBy: 'نظام متكامل'
    });
    
    return newStock;
  }, [warehouseItems, updateItemStock]);

  // Get items by type
  const getItemsByType = useCallback((type: string) => {
    return warehouseItems.filter(item => item.type === type && item.isActive);
  }, [warehouseItems]);

  // Get feed items
  const getFeedItems = useCallback(() => {
    return getItemsByType('feed');
  }, [getItemsByType]);

  // Get medicine items
  const getMedicineItems = useCallback(() => {
    return getItemsByType('medicines');
  }, [getItemsByType]);

  // Listen for warehouse item updates from other components
  useEffect(() => {
    const handleWarehouseItemUpdated = (event: CustomEvent) => {
      console.log('Detected warehouse item update:', event.detail);
      loadWarehouseItems();
    };

    // Add event listener for warehouse item updates
    window.addEventListener('warehouse-item-updated', handleWarehouseItemUpdated as EventListener);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('warehouse-item-updated', handleWarehouseItemUpdated as EventListener);
    };
  }, [loadWarehouseItems]);

  // Initial load
  useEffect(() => {
    loadWarehouseItems();
  }, [loadWarehouseItems]);

  // Add feeding record function
  const addFeedingRecord = useCallback(async (feedingData: any) => {
    try {
      await dataService.createFeedingRecord(feedingData);
      await loadWarehouseItems(); // Refresh data
    } catch (error) {
      console.error('Error adding feeding record:', error);
      throw error;
    }
  }, [loadWarehouseItems]);

  // Add inventory item function
  const addInventoryItem = useCallback(async (itemData: Omit<WarehouseItem, 'id'>) => {
    try {
      const newId = await dataService.createWarehouseItem(itemData);
      await loadWarehouseItems(); // Refresh data
      return newId;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  }, [loadWarehouseItems]);
  
  // Function to clean up duplicate entries in the database
  const cleanupDatabase = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Starting database cleanup for duplicate items...');
      await integratedInventoryService.cleanupDuplicateItems();
      console.log('Database cleanup completed, refreshing data...');
      await loadWarehouseItems();
    } catch (error) {
      console.error('Error cleaning up database:', error);
    } finally {
      setLoading(false);
    }
  }, [loadWarehouseItems]);

  return {
    // Data
    warehouseItems,
    inventory: warehouseItems, // Alias for compatibility
    stockLevels,
    feedingSchedule,
    lowStockItems,
    loading,
    lastUpdate,
    
    // Methods
    refreshInventory,
    getFeedStockLevel,
    updateItemStock,
    addStock,
    removeStock,
    addFeedingRecord,
    addInventoryItem,
    cleanupDatabase,
    
    // Filters
    getItemsByType,
    getFeedItems,
    getMedicineItems
  };
};

// Export as default hook
export default useInventorySync;