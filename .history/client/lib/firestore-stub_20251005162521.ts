/**
 * Firestore stub - no longer used
 * Kept for backward compatibility
 */

// Mock service that throws errors if used
const createStubService = (name: string) => ({
  getAll: () => { throw new Error(`${name} service is deprecated. Use dataService instead.`); },
  getById: () => { throw new Error(`${name} service is deprecated. Use dataService instead.`); },
  create: () => { throw new Error(`${name} service is deprecated. Use dataService instead.`); },
  update: () => { throw new Error(`${name} service is deprecated. Use dataService instead.`); },
  delete: () => { throw new Error(`${name} service is deprecated. Use dataService instead.`); },
  query: () => { throw new Error(`${name} service is deprecated. Use dataService instead.`); },
});

export const animalsExtendedService = createStubService('animals');
export const barnsService = createStubService('barns');
export const warehouseExtendedService = createStubService('warehouse');
export const stockMovementsService = createStubService('stockMovements');
export const feedingRecordsService = createStubService('feeding');
export const weightRecordsService = createStubService('weights');
export const healthRecordsService = createStubService('health');
export const barnMovementsService = createStubService('barnMovements');
export const feedingSchedulesService = createStubService('feedingSchedules');
export const barnEquipmentService = createStubService('barnEquipment');
export const feedEfficiencyService = createStubService('feedEfficiency');

console.warn('Firestore services are no longer used. Use dataService from data-service.ts instead.');
