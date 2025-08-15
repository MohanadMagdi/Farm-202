import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dataService } from "@/lib/data-service";
import type { WarehouseItem, WarehouseType } from "@shared/types";
import { toast } from "@/hooks/use-toast";
import { 
  Beaker, 
  PillBottle, 
  Stethoscope, 
  Settings, 
  Wrench,
  Calendar,
  AlertTriangle 
} from "lucide-react";

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  warehouseItem?: WarehouseItem | null;
  mode: "add" | "edit";
}

const warehouseTypes: Record<WarehouseType, { label: string; icon: any; color: string }> = {
  chemicals: { label: "المواد الكيميائية والأعلاف", icon: Beaker, color: "text-blue-600" },
  medicines: { label: "الأدوية والمحسنات", icon: PillBottle, color: "text-green-600" },
  medical_supplies: { label: "المستلزمات الطبية", icon: Stethoscope, color: "text-pink-600" },
  equipment: { label: "المعدات والأجهزة", icon: Settings, color: "text-purple-600" },
  maintenance: { label: "الصيانة والإصلاح", icon: Wrench, color: "text-orange-600" },
};

export default function InventoryFormModal({
  isOpen,
  onClose,
  onSave,
  warehouseItem,
  mode,
}: InventoryFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "chemicals" as WarehouseType,
    category: "",
    unit: "كيلو",
    unitPrice: "",
    currentStock: "",
    minStockLevel: "",
    maxStockLevel: "",
    hasExpiry: false,
    expiryDate: "",
    originalExpiryDays: "",
    location: "",
    supplier: "",
    description: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && warehouseItem) {
        setFormData({
          name: warehouseItem.name,
          type: warehouseItem.type,
          category: warehouseItem.category,
          unit: warehouseItem.unit,
          unitPrice: warehouseItem.unitPrice.toString(),
          currentStock: warehouseItem.currentStock.toString(),
          minStockLevel: warehouseItem.minStockLevel.toString(),
          maxStockLevel: warehouseItem.maxStockLevel.toString(),
          hasExpiry: warehouseItem.hasExpiry,
          expiryDate: warehouseItem.expiryDate?.toISOString().split("T")[0] || "",
          originalExpiryDays: warehouseItem.originalExpiryDays?.toString() || "",
          location: warehouseItem.location || "",
          supplier: warehouseItem.supplier || "",
          description: warehouseItem.description || "",
          isActive: warehouseItem.isActive,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, warehouseItem]);

  const resetForm = () => {
    setFormData({
      name: "",
      type: "chemicals",
      category: "",
      unit: "كيلو",
      unitPrice: "",
      currentStock: "",
      minStockLevel: "",
      maxStockLevel: "",
      hasExpiry: false,
      expiryDate: "",
      originalExpiryDays: "",
      location: "",
      supplier: "",
      description: "",
      isActive: true,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const warehouseData: Omit<WarehouseItem, 'id'> = {
        name: formData.name,
        type: formData.type,
        category: formData.category,
        unit: formData.unit,
        unitPrice: parseFloat(formData.unitPrice),
        currentStock: parseFloat(formData.currentStock) || 0,
        minStockLevel: parseFloat(formData.minStockLevel),
        maxStockLevel: parseFloat(formData.maxStockLevel),
        hasExpiry: formData.hasExpiry,
        location: formData.location || undefined,
        supplier: formData.supplier || undefined,
        description: formData.description || undefined,
        isActive: formData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add expiry data if applicable
      if (formData.hasExpiry) {
        if (formData.expiryDate) {
          warehouseData.expiryDate = new Date(formData.expiryDate);
        }
        if (formData.originalExpiryDays) {
          warehouseData.originalExpiryDays = parseInt(formData.originalExpiryDays);
          
          // Calculate remaining days if expiry date is set
          if (warehouseData.expiryDate) {
            const diffTime = warehouseData.expiryDate.getTime() - new Date().getTime();
            warehouseData.remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          }
        }
      }

      if (mode === "edit" && warehouseItem) {
        await dataService.warehouseItems.update(warehouseItem.id, warehouseData);
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث بيانات الصنف ${formData.name}`,
        });
      } else {
        await dataService.warehouseItems.create(warehouseData);
        toast({
          title: "تم الإضافة بنجاح",
          description: `تم إضافة الصنف ${formData.name} بنجاح`,
        });

        // Create initial stock movement if current stock > 0
        if (parseFloat(formData.currentStock) > 0) {
          const stockMovement = {
            itemId: "", // Will be set after creation
            type: "in" as const,
            quantity: parseFloat(formData.currentStock),
            unitPrice: parseFloat(formData.unitPrice),
            totalCost: parseFloat(formData.currentStock) * parseFloat(formData.unitPrice),
            date: new Date(),
            reason: "رصيد افتتاحي",
            recordedBy: "مدير المخزن",
            notes: "إضافة رصيد افتتاحي للصنف الجديد"
          };
          
          // Note: In a real implementation, we'd get the item ID after creation
          // await dataService.stockMovements.create(stockMovement);
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving warehouse item:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ بيانات الصنف",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateExpiryDate = () => {
    if (formData.originalExpiryDays) {
      const days = parseInt(formData.originalExpiryDays);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      setFormData({
        ...formData,
        expiryDate: futureDate.toISOString().split("T")[0]
      });
    }
  };

  const warehouseConfig = warehouseTypes[formData.type];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <warehouseConfig.icon className={`h-5 w-5 ml-2 ${warehouseConfig.color}`} />
            {mode === "add" ? "إضافة صنف جديد" : "تعديل بيانات الصنف"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "إدخال بيانات صنف جديد في المستودع"
              : "تعديل البيانات الأساسية للصنف"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم الصنف *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="مثال: دريس البرسيم"
                />
              </div>
              
              <div>
                <Label htmlFor="type">نوع المستودع *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: WarehouseType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(warehouseTypes).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center">
                          <config.icon className={`h-4 w-4 ml-2 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">الفئة *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="مثال: أعلاف خضراء"
                />
              </div>
              
              <div>
                <Label htmlFor="unit">وحدة القياس *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="كيلو">كيلو</SelectItem>
                    <SelectItem value="طن">طن</SelectItem>
                    <SelectItem value="لتر">لتر</SelectItem>
                    <SelectItem value="قطعة">قطعة</SelectItem>
                    <SelectItem value="علبة">علبة</SelectItem>
                    <SelectItem value="قارورة">قارورة</SelectItem>
                    <SelectItem value="أمبولة">أمبولة</SelectItem>
                    <SelectItem value="قرص">قرص</SelectItem>
                    <SelectItem value="كبسولة">كبسولة</SelectItem>
                    <SelectItem value="متر">متر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unitPrice">سعر الوحدة (جنيه) *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: e.target.value })
                  }
                  placeholder="8.50"
                />
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">معلومات المخزون</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentStock">المخزون الحالي</Label>
                <Input
                  id="currentStock"
                  type="number"
                  step="0.01"
                  value={formData.currentStock}
                  onChange={(e) =>
                    setFormData({ ...formData, currentStock: e.target.value })
                  }
                  placeholder="1200"
                />
              </div>
              
              <div>
                <Label htmlFor="minStockLevel">الحد الأدنى *</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  step="0.01"
                  value={formData.minStockLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, minStockLevel: e.target.value })
                  }
                  placeholder="500"
                />
              </div>

              <div>
                <Label htmlFor="maxStockLevel">الحد الأقصى *</Label>
                <Input
                  id="maxStockLevel"
                  type="number"
                  step="0.01"
                  value={formData.maxStockLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, maxStockLevel: e.target.value })
                  }
                  placeholder="2000"
                />
              </div>
            </div>
          </div>

          {/* Expiry Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasExpiry"
                checked={formData.hasExpiry}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasExpiry: checked as boolean })
                }
              />
              <Label htmlFor="hasExpiry" className="flex items-center">
                <Calendar className="h-4 w-4 ml-1" />
                هذا الصنف له تاريخ انتهاء صلاحية
              </Label>
            </div>

            {formData.hasExpiry && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-yellow-50 rounded-lg">
                <div>
                  <Label htmlFor="originalExpiryDays">مدة الصلاحية (أيام)</Label>
                  <div className="flex space-x-2 space-x-reverse">
                    <Input
                      id="originalExpiryDays"
                      type="number"
                      value={formData.originalExpiryDays}
                      onChange={(e) =>
                        setFormData({ ...formData, originalExpiryDays: e.target.value })
                      }
                      placeholder="365"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={calculateExpiryDate}
                      disabled={!formData.originalExpiryDays}
                    >
                      احسب
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="expiryDate">تاريخ انتهاء الصلاحية</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center">
                  {formData.expiryDate && (
                    <div className="p-2 bg-white rounded border">
                      <div className="text-sm font-medium">أيام متبقية:</div>
                      <div className="text-lg font-bold text-orange-600">
                        {Math.ceil(
                          (new Date(formData.expiryDate).getTime() - new Date().getTime()) / 
                          (1000 * 60 * 60 * 24)
                        )} يوم
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Location and Supplier */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">معلومات إضافية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">الموقع في المستودع</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="الرف الثالث - المنطقة A"
                />
              </div>

              <div>
                <Label htmlFor="supplier">المورد</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  placeholder="اسم المورد أو الشركة"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="وصف تفصيلي للصنف..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive">صنف نشط</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              loading ||
              !formData.name ||
              !formData.category ||
              !formData.unitPrice ||
              !formData.minStockLevel ||
              !formData.maxStockLevel
            }
          >
            {loading
              ? "جاري الحفظ..."
              : mode === "add"
                ? "إضافة الصنف"
                : "حفظ التعديلات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
