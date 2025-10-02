import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { WarehouseItem } from '@shared/types';
import { AlertTriangle, Package } from 'lucide-react';

interface StockAlertProps {
  lowStockItems: WarehouseItem[];
}

export const StockAlert: React.FC<StockAlertProps> = ({ lowStockItems }) => {
  if (lowStockItems.length === 0) return null;

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">تنبيه: مخزون منخفض</AlertTitle>
      <AlertDescription className="text-red-700">
        <p className="mb-3">يوجد {lowStockItems.length} صنف بحاجة لإعادة تموين:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {lowStockItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-red-500" />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              <Badge variant="destructive" className="text-xs">
                {item.currentStock} {item.unit}
              </Badge>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};