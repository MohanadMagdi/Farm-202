/**
 * Data Synchronization Utility
 * Ensures data consistency and relationships are properly maintained
 */

import { dataService } from './data-service';
import { syncAllMotherChildRelationships, validateAllRelationships } from './animal-relationships';

/**
 * Initialize data relationships on app start
 */
export async function initializeDataSync(): Promise<void> {
  try {
    console.log('🔄 Synchronizing data relationships...');
    
    // Sync all mother-child relationships
    const syncResult = await syncAllMotherChildRelationships();
    
    if (syncResult.synced > 0) {
      console.log(`✅ Synced ${syncResult.synced} relationship(s)`);
    }
    
    if (syncResult.errors.length > 0) {
      console.warn('⚠️ Sync errors:', syncResult.errors);
    }
    
    // Validate all relationships
    const validation = await validateAllRelationships();
    
    if (!validation.isValid) {
      console.warn('⚠️ Data validation issues found:', validation.issues);
    } else {
      console.log('✅ All data relationships are valid');
    }
    
  } catch (error) {
    console.error('❌ Error during data sync:', error);
  }
}

/**
 * Periodic data health check
 */
export async function performDataHealthCheck(): Promise<{
  isHealthy: boolean;
  issues: number;
  lastCheck: Date;
}> {
  try {
    const validation = await validateAllRelationships();
    
    return {
      isHealthy: validation.isValid,
      issues: validation.issues.length,
      lastCheck: new Date()
    };
  } catch (error) {
    console.error('Error during health check:', error);
    return {
      isHealthy: false,
      issues: -1,
      lastCheck: new Date()
    };
  }
}

/**
 * Auto-repair data relationships
 */
export async function autoRepairRelationships(): Promise<{
  repaired: number;
  errors: string[];
}> {
  try {
    console.log('🔧 Auto-repairing relationships...');
    
    const syncResult = await syncAllMotherChildRelationships();
    
    console.log(`🔧 Repaired ${syncResult.synced} relationship(s)`);
    
    return {
      repaired: syncResult.synced,
      errors: syncResult.errors
    };
  } catch (error) {
    console.error('Error during auto-repair:', error);
    return {
      repaired: 0,
      errors: ['حدث خطأ أثناء الإصلاح التلقائي']
    };
  }
}
