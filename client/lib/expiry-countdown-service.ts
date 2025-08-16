import { dataService } from "./data-service";
import { updateItemExpiryCountdown } from "./expiry-notifications";

/**
 * Background service for automatically updating expiry countdown
 */
export class ExpiryCountdownService {
  private static instance: ExpiryCountdownService;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Singleton pattern
  static getInstance(): ExpiryCountdownService {
    if (!ExpiryCountdownService.instance) {
      ExpiryCountdownService.instance = new ExpiryCountdownService();
    }
    return ExpiryCountdownService.instance;
  }

  /**
   * Start the automatic countdown update service
   * Updates every hour during business hours, once daily otherwise
   */
  start(): void {
    if (this.isRunning) {
      console.log("Expiry countdown service is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting expiry countdown service...");

    // Run immediately on start
    this.updateExpiryCountdown();

    // Schedule regular updates
    this.scheduleUpdates();
  }

  /**
   * Stop the automatic countdown update service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("Expiry countdown service stopped");
  }

  /**
   * Check if the service is currently running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Schedule regular updates based on time of day
   */
  private scheduleUpdates(): void {
    // Update every hour during business hours (6 AM - 10 PM)
    // Update once daily during off hours
    const updateInterval = this.getUpdateInterval();

    this.intervalId = setInterval(() => {
      this.updateExpiryCountdown();
    }, updateInterval);
  }

  /**
   * Get appropriate update interval based on current time
   */
  private getUpdateInterval(): number {
    const now = new Date();
    const hour = now.getHours();

    // During business hours (6 AM - 10 PM): update every hour
    if (hour >= 6 && hour <= 22) {
      return 60 * 60 * 1000; // 1 hour
    }

    // During off hours: update every 6 hours
    return 6 * 60 * 60 * 1000; // 6 hours
  }

  /**
   * Update expiry countdown for all warehouse items
   */
  private async updateExpiryCountdown(): Promise<void> {
    try {
      console.log("Updating expiry countdown for all warehouse items...");

      // Get all warehouse items
      const items = await dataService.warehouseItems.getAll();

      // Update remaining days using our countdown system
      const updatedItems = updateItemExpiryCountdown(items);

      // Save updated items back to the database
      const itemsToUpdate = updatedItems.filter(
        (item) => item.hasExpiry && item.remainingDays !== undefined,
      );

      for (const item of itemsToUpdate) {
        try {
          await dataService.warehouseItems.update(item.id, {
            remainingDays: item.remainingDays,
          });
        } catch (error) {
          console.error(`Error updating item ${item.id}:`, error);
        }
      }

      console.log(`Updated expiry countdown for ${itemsToUpdate.length} items`);

      // Log items that need attention
      const expiredItems = updatedItems.filter(
        (item) =>
          item.hasExpiry &&
          item.remainingDays !== undefined &&
          item.remainingDays < 0,
      );

      const expiringSoon = updatedItems.filter(
        (item) =>
          item.hasExpiry &&
          item.remainingDays !== undefined &&
          item.remainingDays >= 0 &&
          item.remainingDays <= 7,
      );

      if (expiredItems.length > 0) {
        console.warn(`⚠️ ${expiredItems.length} items have expired`);
      }

      if (expiringSoon.length > 0) {
        console.warn(`⏰ ${expiringSoon.length} items expiring within 7 days`);
      }
    } catch (error) {
      console.error("Error updating expiry countdown:", error);
    }
  }

  /**
   * Force an immediate update of expiry countdown
   */
  async forceUpdate(): Promise<void> {
    await this.updateExpiryCountdown();
  }

  /**
   * Get the next scheduled update time
   */
  getNextUpdateTime(): Date {
    if (!this.isRunning || !this.intervalId) {
      return new Date();
    }

    const interval = this.getUpdateInterval();
    return new Date(Date.now() + interval);
  }

  /**
   * Get service status information
   */
  getStatus(): {
    isRunning: boolean;
    nextUpdate: Date;
    updateInterval: number;
  } {
    return {
      isRunning: this.isRunning,
      nextUpdate: this.getNextUpdateTime(),
      updateInterval: this.getUpdateInterval(),
    };
  }
}

// Export singleton instance
export const expiryCountdownService = ExpiryCountdownService.getInstance();

// Auto-start the service when this module is imported
if (typeof window !== "undefined") {
  // Only start in browser environment
  expiryCountdownService.start();

  // Stop service when page unloads
  window.addEventListener("beforeunload", () => {
    expiryCountdownService.stop();
  });
}
