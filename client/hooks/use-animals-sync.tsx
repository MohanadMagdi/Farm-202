import { useState, useEffect, useCallback } from 'react';
import dataService from '@/lib/data-service-unified';
import { Animal, WeightRecord, Barn } from '@shared/types';

/**
 * Hook for unified animal management
 * Ensures consistent animal data across all components
 */

export const useAnimalsSync = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load all animals data
  const loadAnimalsData = useCallback(async () => {
    try {
      const [animalsData, barnsData, weightsData] = await Promise.all([
        dataService.getAnimals(),
        dataService.getBarns(),
        dataService.getWeightRecords()
      ]);

      setAnimals(animalsData);
      setBarns(barnsData);
      setWeightRecords(weightsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading animals data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new animal
  const addAnimal = useCallback(async (animalData: Omit<Animal, 'id'>) => {
    try {
      const newAnimalId = await dataService.createAnimal(animalData);
      await loadAnimalsData(); // Refresh data
      return newAnimalId;
    } catch (error) {
      console.error('Error adding animal:', error);
      throw error;
    }
  }, [loadAnimalsData]);

  // Add weight record
  const addWeightRecord = useCallback(async (weightData: Omit<WeightRecord, 'id'>) => {
    try {
      const newWeightId = await dataService.createWeightRecord(weightData);
      
      // Update animal's current weight
      await dataService.updateAnimal(weightData.animalId, {
        weight: weightData.weight
      });
      
      await loadAnimalsData(); // Refresh data
      return newWeightId;
    } catch (error) {
      console.error('Error adding weight record:', error);
      throw error;
    }
  }, [loadAnimalsData]);

  // Get animals by barn
  const getAnimalsByBarn = useCallback((barnId: string) => {
    return animals.filter(animal => animal.barnId === barnId && !animal.isIsolated);
  }, [animals]);

  // Get animals by category
  const getAnimalsByCategory = useCallback((category: string) => {
    return animals.filter(animal => animal.category === category && !animal.isIsolated);
  }, [animals]);

  // Get recent weight records for an animal
  const getAnimalWeightHistory = useCallback((animalId: string, limit: number = 5) => {
    return weightRecords
      .filter(record => record.animalId === animalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [weightRecords]);

  // Get barn by id
  const getBarnById = useCallback((barnId: string) => {
    return barns.find(barn => barn.id === barnId);
  }, [barns]);

  // Get active barns
  const getActiveBarns = useCallback(() => {
    return barns.filter(barn => barn.isActive);
  }, [barns]);

  // Refresh all data
  const refreshAnimalsData = useCallback(async () => {
    setLoading(true);
    await loadAnimalsData();
  }, [loadAnimalsData]);

  // Initial load
  useEffect(() => {
    loadAnimalsData();
  }, [loadAnimalsData]);

  return {
    // Data
    animals,
    barns,
    weightRecords,
    loading,
    lastUpdate,
    
    // Methods
    addAnimal,
    addWeightRecord,
    refreshAnimalsData,
    
    // Filters
    getAnimalsByBarn,
    getAnimalsByCategory,
    getAnimalWeightHistory,
    getBarnById,
    getActiveBarns
  };
};

export default useAnimalsSync;