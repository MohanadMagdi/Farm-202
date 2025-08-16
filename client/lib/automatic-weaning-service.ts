import { performAutomaticWeaningCheck, getBreedingWorkflowStats } from "./breeding-workflow";

/**
 * Background service for automatic weaning monitoring and processing
 */
export class AutomaticWeaningService {
  private static instance: AutomaticWeaningService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastCheck: Date | null = null;

  // Singleton pattern
  static getInstance(): AutomaticWeaningService {
    if (!AutomaticWeaningService.instance) {
      AutomaticWeaningService.instance = new AutomaticWeaningService();
    }
    return AutomaticWeaningService.instance;
  }

  /**
   * Start the automatic weaning monitoring service
   * Checks twice daily for weaning candidates
   */
  start(): void {
    if (this.isRunning) {
      console.log('Automatic weaning service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting automatic weaning service...');

    // Run initial check
    this.performWeaningCheck();

    // Schedule regular checks (every 12 hours)
    this.scheduleChecks();
  }

  /**
   * Stop the automatic weaning service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.lastCheck = null;
    console.log('Automatic weaning service stopped');
  }

  /**
   * Check if the service is currently running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the last check time
   */
  getLastCheckTime(): Date | null {
    return this.lastCheck;
  }

  /**
   * Schedule regular weaning checks
   */
  private scheduleChecks(): void {
    // Check every 12 hours (twice daily)
    const checkInterval = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    
    this.intervalId = setInterval(() => {
      this.performWeaningCheck();
    }, checkInterval);
  }

  /**
   * Perform weaning check and log results
   */
  private async performWeaningCheck(): Promise<void> {
    try {
      this.lastCheck = new Date();
      console.log('Performing automatic weaning check...');
      
      const results = await performAutomaticWeaningCheck();
      
      // Log results
      console.log(`Weaning check completed:`, {
        scanned: results.scanned,
        readyForWeaning: results.readyForWeaning,
        autoTransferred: results.autoTransferred,
        timestamp: this.lastCheck
      });

      // Log notifications to console for admin visibility
      if (results.notifications.length > 0) {
        console.log('Weaning notifications:', results.notifications);
      }

      // Log detailed statistics
      const stats = await getBreedingWorkflowStats();
      if (stats.overdue > 0) {
        console.warn(`⚠️ ${stats.overdue} newborns are overdue for weaning`);
      }
      
      if (stats.readyForWeaning > 0) {
        console.info(`ℹ️ ${stats.readyForWeaning} newborns are ready for weaning`);
      }

      if (results.autoTransferred > 0) {
        console.info(`✅ Successfully auto-transferred ${results.autoTransferred} animals`);
      }

    } catch (error) {
      console.error('Error in automatic weaning check:', error);
    }
  }

  /**
   * Force an immediate weaning check
   */
  async forceCheck(): Promise<void> {
    await this.performWeaningCheck();
  }

  /**
   * Get service status information
   */
  getStatus(): {
    isRunning: boolean;
    lastCheck: Date | null;
    nextCheck: Date | null;
    checkInterval: number;
  } {
    const checkInterval = 12 * 60 * 60 * 1000; // 12 hours
    const nextCheck = this.lastCheck 
      ? new Date(this.lastCheck.getTime() + checkInterval)
      : null;

    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      nextCheck,
      checkInterval
    };
  }

  /**
   * Configure check frequency (in hours)
   */
  setCheckInterval(hours: number): void {
    if (hours < 1 || hours > 24) {
      throw new Error('Check interval must be between 1 and 24 hours');
    }

    // Stop current schedule
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Start new schedule with updated interval
    if (this.isRunning) {
      const checkInterval = hours * 60 * 60 * 1000;
      this.intervalId = setInterval(() => {
        this.performWeaningCheck();
      }, checkInterval);

      console.log(`Updated weaning check interval to ${hours} hours`);
    }
  }

  /**
   * Get summary of weaning activities for reporting
   */
  async getActivitySummary(): Promise<{
    totalNewborns: number;
    readyForWeaning: number;
    overdue: number;
    averageAge: number;
    lastCheckTime: Date | null;
    serviceStatus: string;
  }> {
    try {
      const stats = await getBreedingWorkflowStats();
      
      return {
        totalNewborns: stats.totalNewborns,
        readyForWeaning: stats.readyForWeaning,
        overdue: stats.overdue,
        averageAge: stats.averageWeaningAge,
        lastCheckTime: this.lastCheck,
        serviceStatus: this.isRunning ? 'Active' : 'Stopped'
      };
    } catch (error) {
      console.error('Error getting activity summary:', error);
      return {
        totalNewborns: 0,
        readyForWeaning: 0,
        overdue: 0,
        averageAge: 0,
        lastCheckTime: this.lastCheck,
        serviceStatus: 'Error'
      };
    }
  }
}

// Export singleton instance
export const automaticWeaningService = AutomaticWeaningService.getInstance();

// Auto-start the service when this module is imported
if (typeof window !== 'undefined') {
  // Only start in browser environment
  automaticWeaningService.start();
  
  // Stop service when page unloads
  window.addEventListener('beforeunload', () => {
    automaticWeaningService.stop();
  });
}
