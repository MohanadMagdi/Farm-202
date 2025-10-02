import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useInventorySync } from '@/hooks/use-inventory-sync';
import { useAnimalsSync } from '@/hooks/use-animals-sync';
import { FeedingTab } from '@/components/worker/FeedingTab';
import { MedicinesTab } from '@/components/worker/MedicinesTab';
import { InventorySection } from '@/components/worker/InventorySection';
import { AnimalsSection } from '@/components/worker/AnimalsSection';
import { AddAnimalModal } from '@/components/worker/AddAnimalModal';
import { AddWeightModal } from '@/components/worker/AddWeightModal';
import { StockAlert } from '@/components/worker/StockAlert';
import dataService from '@/lib/data-service-unified';
import { 
  Plus, 
  Weight, 
  Beef, 
  Package,
  Wheat,
  AlertTriangle,
  RefreshCw 
} from 'lucide-react';

/**
 * Unified Worker Dashboard
 * Combines inventory, feeding, and animal management in one integrated interface
 * All data is synchronized with admin panels through unified services
 */

export default function WorkerDashboard() {
  const [activeTab, setActiveTab] = useState('animals');
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Unified data hooks
  const {
    warehouseItems,
    inventory,
    lowStockItems,
    feedingSchedule,
    loading: inventoryLoading,
    refreshInventory,
    addFeedingRecord,
    addInventoryItem,
    cleanupDatabase
  } = useInventorySync();

  const {
    animals,
    barns,
    weightRecords,
    loading: animalsLoading,
    addAnimal,
    addWeightRecord,
    refreshAnimalsData,
    getAnimalsByBarn,
    getActiveBarns
  } = useAnimalsSync();

  const isLoading = inventoryLoading || animalsLoading;

  // Refresh all data
  const handleRefreshAll = async () => {
    await Promise.all([
      refreshInventory(),
      refreshAnimalsData()
    ]);
    setRefreshKey(prev => prev + 1);
  };

  // Handle database cleanup
  const handleCleanupDatabase = async () => {
    try {
      if (cleanupDatabase) {
        await cleanupDatabase();
        // إعادة تحميل البيانات بعد التنظيف
        await handleRefreshAll();
      }
    } catch (error) {
      console.error('Error during database cleanup:', error);
    }
  };

  // Quick stats
  const totalAnimals = animals.length;
  const activeBarns = getActiveBarns();
  const lowStockCount = lowStockItems.length;
  const recentFeedings = feedingSchedule.filter(feed => {
    const feedDate = new Date(feed.date);
    const today = new Date();
    return feedDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم العامل</h1>
            <p className="text-gray-600 mt-1">إدارة شاملة للمخزون والتغذية والحيوانات</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleRefreshAll}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>
            
            <Button
              onClick={handleCleanupDatabase}
              variant="secondary"
              size="sm"
              disabled={isLoading}
            >
              <Package className="h-4 w-4 ml-2" />
              تنظيف المخزون
            </Button>
            
            <Button
              onClick={() => setShowAddAnimal(true)}
              variant="default"
              size="sm"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة حيوان
            </Button>
            
            <Button
              onClick={() => setShowAddWeight(true)}
              variant="default"
              size="sm"
            >
              <Weight className="h-4 w-4 ml-2" />
              تسجيل وزن
            </Button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الحيوانات</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAnimals}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Beef className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">الحظائر النشطة</p>
                  <p className="text-2xl font-bold text-gray-900">{activeBarns.length}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">تغذية اليوم</p>
                  <p className="text-2xl font-bold text-gray-900">{recentFeedings}</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wheat className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">تنبيهات المخزون</p>
                  <p className="text-2xl font-bold text-red-900">{lowStockCount}</p>
                  {lowStockCount > 0 && (
                    <Badge variant="destructive" className="mt-1">
                      مخزون منخفض
                    </Badge>
                  )}
                </div>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  lowStockCount > 0 ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <AlertTriangle className={`h-4 w-4 ${
                    lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {lowStockCount > 0 && (
          <StockAlert lowStockItems={lowStockItems} />
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="animals">الحيوانات</TabsTrigger>
            <TabsTrigger value="feeding">التغذية</TabsTrigger>
            <TabsTrigger value="medicines">الأدوية</TabsTrigger>
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
          </TabsList>



          <TabsContent value="animals">
            <AnimalsSection
              animals={animals}
              barns={barns}
              weightRecords={weightRecords}
              onAddAnimal={() => setShowAddAnimal(true)}
              onAddWeight={() => setShowAddWeight(true)}
              refreshKey={refreshKey}
            />
          </TabsContent>

          <TabsContent value="feeding">
            <FeedingTab key={refreshKey} />
          </TabsContent>

          <TabsContent value="medicines">
            <MedicinesTab key={refreshKey} />
          </TabsContent>

          <TabsContent value="inventory">
            <InventorySection
              inventory={inventory}
              lowStockItems={lowStockItems}
              onAddItem={{
                addInventoryItem,
                addStock: async (itemId, quantity, reason) => {
                  try {
                    return await dataService.updateWarehouseItem(itemId, {
                      currentStock: inventory.find(i => i.id === itemId)?.currentStock + quantity || quantity
                    }).then(() => {
                      // تسجيل حركة المخزون
                      const item = inventory.find(i => i.id === itemId);
                      if (item) {
                        return dataService.createStockMovement({
                          itemId,
                          type: 'in',
                          quantity,
                          unitPrice: item.unitPrice,
                          totalCost: quantity * item.unitPrice,
                          date: new Date(),
                          reason: reason || 'إضافة مخزون من واجهة العامل',
                          recordedBy: 'عامل المزرعة'
                        }).then(() => {
                          refreshInventory();
                          return true;
                        });
                      }
                    });
                  } catch (error) {
                    console.error("Error adding stock:", error);
                    throw error;
                  }
                },
                removeStock: async (itemId, quantity, reason) => {
                  try {
                    const item = inventory.find(i => i.id === itemId);
                    if (!item) throw new Error('Item not found');
                    if (item.currentStock < quantity) throw new Error('كمية غير كافية في المخزون');
                    
                    return await dataService.updateWarehouseItem(itemId, {
                      currentStock: Math.max(0, item.currentStock - quantity)
                    }).then(() => {
                      return dataService.createStockMovement({
                        itemId,
                        type: 'out',
                        quantity,
                        unitPrice: item.unitPrice,
                        totalCost: quantity * item.unitPrice,
                        date: new Date(),
                        reason: reason || 'صرف مخزون من واجهة العامل',
                        recordedBy: 'عامل المزرعة'
                      }).then(() => {
                        refreshInventory();
                        return true;
                      });
                    });
                  } catch (error) {
                    console.error("Error removing stock:", error);
                    throw error;
                  }
                }
              }}
              refreshKey={refreshKey}
            />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <AddAnimalModal
          open={showAddAnimal}
          onOpenChange={setShowAddAnimal}
          onSuccess={async (animalData) => {
            await addAnimal(animalData);
            setShowAddAnimal(false);
            handleRefreshAll();
          }}
          barns={activeBarns}
        />

        <AddWeightModal
          open={showAddWeight}
          onOpenChange={setShowAddWeight}
          onSuccess={async (weightData) => {
            await addWeightRecord(weightData);
            setShowAddWeight(false);
            handleRefreshAll();
          }}
          animals={animals}
        />
      </div>
    </div>
  );
}