import { integratedInventoryService } from './integrated-inventory-service';
import { dataService } from './data-service';
import { initializeSampleData } from './database-seeds';

/**
 * Database Initialization Service
 * Ensures that basic feed and medicine items exist in the warehouse
 */

export class DatabaseInitService {
  
  /**
   * Initialize all required warehouse items
   */
  static async initializeWarehouse(): Promise<void> {
    try {
      console.log('Initializing warehouse items...');
      
      // Clean up any duplicate items first
      await integratedInventoryService.cleanupDuplicateItems();
      
      // Initialize feed types
      await this.initializeFeedTypes();
      
      // Initialize basic medicine types
      await this.initializeBasicMedicines();
      
      // Initialize sample data for testing
      await initializeSampleData(dataService);
      
      console.log('Warehouse initialization completed successfully');
    } catch (error) {
      console.error('Error initializing warehouse:', error);
      throw error;
    }
  }
  
  /**
   * Initialize all standardized feed types
   */
  private static async initializeFeedTypes(): Promise<void> {
    console.log('Initializing feed types...');
    
    try {
      await integratedInventoryService.syncFeedTypesToWarehouse();
      console.log('Feed types initialized successfully');
    } catch (error) {
      console.error('Error initializing feed types:', error);
      throw error;
    }
  }
  
  /**
   * Initialize basic medicine categories
   */
  private static async initializeBasicMedicines(): Promise<void> {
    console.log('Initializing basic medicines...');
    
    const basicMedicines = [
      {
        name: 'بنسلين',
        type: 'مضاد حيوي',
        unit: 'مليلتر',
        category: 'علاج',
        minStock: 50,
        maxStock: 200
      },
      {
        name: 'لقاح الحمى القلاعية',
        type: 'تحصين',
        unit: 'أمبولة',
        category: 'تحصين',
        minStock: 20,
        maxStock: 100
      },
      {
        name: 'فيتامين أ د 3 هـ',
        type: 'فيتامين',
        unit: 'مليلتر',
        category: 'مكملات غذائية',
        minStock: 30,
        maxStock: 150
      },
      {
        name: 'ايفرمكتين',
        type: 'مضاد طفيليات',
        unit: 'مليلتر',
        category: 'علاج',
        minStock: 25,
        maxStock: 100
      },
      {
        name: 'ديكساميثازون',
        type: 'مضاد التهاب',
        unit: 'مليلتر',
        category: 'علاج',
        minStock: 20,
        maxStock: 80
      }
    ];
    
    for (const medicine of basicMedicines) {
      try {
        // Check if medicine already exists
        const existingItems = await dataService.warehouseItems.getAll();
        const exists = existingItems.some(item => 
          item.name === medicine.name && item.type === 'medicines'
        );
        
        if (!exists) {
          console.log(`Creating medicine: ${medicine.name}`);
          await integratedInventoryService.addMedicineToInventory({
            name: medicine.name,
            type: 'medicine',
            quantity: 0, // Start with 0 stock
            unitPrice: 0,
            notes: `دواء أساسي - ${medicine.category}`,
            recordedBy: 'النظام'
          });
        }
      } catch (error) {
        console.error(`Error creating medicine ${medicine.name}:`, error);
        // Continue with next medicine
      }
    }
    
    console.log('Basic medicines initialized successfully');
  }
  
  /**
   * Check if warehouse needs initialization
   */
  static async needsInitialization(): Promise<boolean> {
    try {
      const allItems = await dataService.warehouseItems.getAll();
      
      // Check if feed items exist
      const feedItems = allItems.filter(item => item.type === 'feed');
      const medicineItems = allItems.filter(item => item.type === 'medicines');
      
      // Need initialization if we have less than 3 feed types or no medicines
      return feedItems.length < 3 || medicineItems.length === 0;
    } catch (error) {
      console.error('Error checking initialization status:', error);
      return true; // If error, assume initialization is needed
    }
  }
  
  /**
   * Auto-initialize warehouse on app start if needed
   */
  static async autoInitialize(): Promise<void> {
    try {
      const needsInit = await this.needsInitialization();
      
      if (needsInit) {
        console.log('Warehouse needs initialization. Starting auto-initialization...');
        await this.initializeWarehouse();
      } else {
        console.log('Warehouse already initialized.');
      }
    } catch (error) {
      console.error('Error during auto-initialization:', error);
      // Don't throw error to prevent app from crashing
    }
  }
}

// Auto-initialize on module load (but don't block)
DatabaseInitService.autoInitialize().catch(error => 
  console.error('Background warehouse initialization failed:', error)
);