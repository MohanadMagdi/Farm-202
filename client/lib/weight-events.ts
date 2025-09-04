/**
 * Weight Events System
 * Simple event system to notify components when weights are updated
 */

type WeightUpdateListener = (animalId: string, newWeight: number) => void;

class WeightEventSystem {
  private listeners: Set<WeightUpdateListener> = new Set();

  // Add listener for weight updates
  onWeightUpdate(listener: WeightUpdateListener) {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners about weight update
  notifyWeightUpdate(animalId: string, newWeight: number) {
    console.log(`📢 Broadcasting weight update: Animal ${animalId} → ${newWeight} kg`);
    this.listeners.forEach(listener => {
      try {
        listener(animalId, newWeight);
      } catch (error) {
        console.error('Error in weight update listener:', error);
      }
    });
  }

  // Get number of active listeners (for debugging)
  getListenerCount(): number {
    return this.listeners.size;
  }
}

// Export singleton instance
export const weightEvents = new WeightEventSystem();
