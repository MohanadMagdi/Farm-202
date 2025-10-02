import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { WarehouseItem } from '@shared/types';
import { Package, Plus, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import dataService from '@/lib/data-service-unified';

interface InventorySectionProps {
  inventory: WarehouseItem[];
  lowStockItems: WarehouseItem[];
  onAddItem: any; // تم تغيير النوع ليشمل كل الوظائف المتاحة في hook
  refreshKey: number;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  inventory,
  lowStockItems,
  onAddItem,
  refreshKey
}) => {
  const [itemBeingUpdated, setItemBeingUpdated] = React.useState<string | null>(null);
  const [showStockUpdateDialog, setShowStockUpdateDialog] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<WarehouseItem | null>(null);
  const [updateQuantity, setUpdateQuantity] = React.useState<number>(0);
  const [updateType, setUpdateType] = React.useState<'add' | 'remove'>('add');
  
  const feedItems = inventory.filter(item => item.type === 'feed');
  const medicineItems = inventory.filter(item => item.type === 'medicines');
  const equipmentItems = inventory.filter(item => item.type === 'equipment');

  const getStockStatus = (item: WarehouseItem) => {
    if (item.currentStock <= 10) return 'critical';
    if (item.currentStock <= 20) return 'low';
    return 'good';
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">حرج</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">منخفض</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-700">جيد</Badge>;
    }
  };

  // وظيفة لفتح نافذة تحديث المخزون
  const openStockUpdateDialog = (item: WarehouseItem, type: 'add' | 'remove') => {
    setSelectedItem(item);
    setUpdateType(type);
    setUpdateQuantity(0);
    setShowStockUpdateDialog(true);
  };
  
  // وظيفة لتنفيذ تحديث المخزون
  const handleStockUpdate = async () => {
    if (!selectedItem || updateQuantity <= 0) return;
    
    try {
      setItemBeingUpdated(selectedItem.id);
      
      const itemId = selectedItem.id;
      const originalStock = selectedItem.currentStock;
      let newStock = originalStock;
      let success = false;
      
      if (updateType === 'add') {
        // استخدام وظيفة إضافة المخزون من props
        await onAddItem.addStock(itemId, updateQuantity, 'إضافة مخزون من واجهة العامل');
        newStock = originalStock + updateQuantity;
        success = true;
      } else {
        // استخدام وظيفة إزالة المخزون من props
        if (originalStock >= updateQuantity) {
          await onAddItem.removeStock(itemId, updateQuantity, 'صرف مخزون من واجهة العامل');
          newStock = originalStock - updateQuantity;
          success = true;
        } else {
          // إذا كانت الكمية المطلوبة أكثر من المتاح
          alert('الكمية المطلوبة أكبر من المخزون المتاح');
        }
      }
      
      if (success) {
        // إغلاق النافذة وإعادة تعيين القيم
        setShowStockUpdateDialog(false);
        setSelectedItem(null);
        setUpdateQuantity(0);
        
        const action = updateType === 'add' ? 'إضافة' : 'صرف';
        alert(`تم ${action} ${updateQuantity} ${selectedItem.unit} من ${selectedItem.name} بنجاح`);
      }
    } catch (error) {
      console.error('خطأ في تحديث المخزون:', error);
      alert('حدث خطأ أثناء تحديث المخزون. يرجى المحاولة مرة أخرى.');
    } finally {
      setItemBeingUpdated(null);
    }
  };

  const ItemCard = ({ item }: { item: WarehouseItem }) => {
    const status = getStockStatus(item);
    const isUpdating = itemBeingUpdated === item.id;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium text-sm">{item.name}</h4>
            </div>
            {getStockBadge(status)}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">المتوفر:</span>
              <span className="font-medium">{item.currentStock} {item.unit}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">السعر:</span>
              <span className="font-medium">{item.unitPrice} ج.م</span>
            </div>

            {item.supplier && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">المورد:</span>
                <span className="font-medium text-xs">{item.supplier}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">آخر تحديث:</span>
              <span className="text-xs text-gray-500">
                {new Date(item.updatedAt).toLocaleDateString('ar-EG')}
              </span>
            </div>
            
            {/* أزرار تحديث المخزون */}
            <div className="flex justify-between gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700"
                onClick={() => openStockUpdateDialog(item, 'add')}
                disabled={isUpdating}
              >
                <TrendingUp className="h-4 w-4 ml-1" />
                إضافة
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700"
                onClick={() => openStockUpdateDialog(item, 'remove')}
                disabled={isUpdating || item.currentStock <= 0}
              >
                <TrendingDown className="h-4 w-4 ml-1" />
                صرف
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الأصناف</p>
                <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">مخزون منخفض</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">أصناف الأعلاف</p>
                <p className="text-2xl font-bold text-green-600">{feedItems.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              تنبيه: مخزون منخفض
            </CardTitle>
            <CardDescription className="text-red-700">
              يوجد {lowStockItems.length} صنف بحاجة لإعادة تموين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map((item, index) => (
                <div key={`low-stock-${item.id}-${index}`} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="font-medium text-sm">{item.name}</span>
                  <span className="text-red-600 font-bold">{item.currentStock} {item.unit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed Items */}
      {feedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الأعلاف</CardTitle>
            <CardDescription>جميع أنواع الأعلاف المتوفرة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedItems.map((item, index) => (
                <ItemCard key={`feed-${item.id}-${index}`} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medicine Items */}
      {medicineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>الأدوية والمستلزمات الطبية</CardTitle>
            <CardDescription>الأدوية والمستلزمات الطبية المتوفرة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicineItems.map((item, index) => (
                <ItemCard key={`medicine-${item.id}-${index}`} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment Items */}
      {equipmentItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المعدات والأدوات</CardTitle>
            <CardDescription>جميع المعدات والأدوات المتوفرة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipmentItems.map((item, index) => (
                <ItemCard key={`equipment-${item.id}-${index}`} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {inventory.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أصناف في المخزون</h3>
            <p className="text-gray-600 mb-4">ابدأ بإضافة أصناف جديدة للمخزون</p>
            <Button onClick={() => {/* Add item logic */}}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة صنف جديد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};