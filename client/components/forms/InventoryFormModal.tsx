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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEGP, inventoryCategories } from "@/lib/arabic-utils";
import { db, InventoryItem } from "@/lib/firebase-mock";

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  inventoryItem?: InventoryItem | null;
  mode: "add" | "edit";
}

export default function InventoryFormModal({
  isOpen,
  onClose,
  onSave,
  inventoryItem,
  mode,
}: InventoryFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "feed" as keyof typeof inventoryCategories,
    unit: "كيلو",
    pricePerUnitEGP: "",
    minLevel: "",
    currentStock: "",
    concentratePct: "",
    supplier: "",
    notes: "",
    active: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && inventoryItem) {
        setFormData({
          name: inventoryItem.name,
          sku: inventoryItem.sku,
          category: inventoryItem.category,
          unit: inventoryItem.unit,
          pricePerUnitEGP: inventoryItem.pricePerUnitEGP.toString(),
          minLevel: inventoryItem.minLevel.toString(),
          currentStock: db.getCurrentStock(inventoryItem.id).toString(),
          concentratePct: inventoryItem.concentratePct?.toString() || "",
          supplier: inventoryItem.supplier || "",
          notes: inventoryItem.notes || "",
          active: inventoryItem.active,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, inventoryItem]);

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "feed",
      unit: "كيلو",
      pricePerUnitEGP: "",
      minLevel: "",
      currentStock: "",
      concentratePct: "",
      supplier: "",
      notes: "",
      active: true,
    });
  };

  const generateSKU = () => {
    const categoryPrefix = {
      feed: "FEED",
      medicine: "MED",
      medical_supply: "MED-SUP",
      equipment: "EQP",
      maintenance: "MAINT",
    };

    const prefix = categoryPrefix[formData.category];
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const inventoryData: Partial<InventoryItem> = {
        name: formData.name,
        sku: formData.sku || generateSKU(),
        category: formData.category,
        unit: formData.unit,
        pricePerUnitEGP: parseFloat(formData.pricePerUnitEGP),
        minLevel: parseInt(formData.minLevel),
        supplier: formData.supplier || undefined,
        notes: formData.notes || undefined,
        active: formData.active,
      };

      if (formData.concentratePct) {
        inventoryData.concentratePct = parseFloat(formData.concentratePct);
      }

      if (mode === "edit" && inventoryItem) {
        await db.collection("inventory").doc(inventoryItem.id).update(inventoryData);
        
        // Update stock if changed
        const currentStock = db.getCurrentStock(inventoryItem.id);
        const newStock = parseInt(formData.currentStock);
        if (currentStock !== newStock) {
          const difference = newStock - currentStock;
          await db.collection("stockMovements").add({
            direction: difference > 0 ? "in" : "out" as const,
            inventoryItemId: inventoryItem.id,
            qty: Math.abs(difference),
            unit: formData.unit,
            reason: difference > 0 ? "manual_adjustment_in" : "manual_adjustment_out" as const,
            requestedBy: "مدير المخزن",
            createdAt: new Date(),
          });
        }
      } else {
        const docRef = await db.collection("inventory").add(inventoryData);
        
        // Add initial stock if specified
        if (formData.currentStock && parseInt(formData.currentStock) > 0) {
          await db.collection("stockMovements").add({
            direction: "in" as const,
            inventoryItemId: docRef.id,
            qty: parseInt(formData.currentStock),
            unit: formData.unit,
            reason: "initial_stock" as const,
            requestedBy: "مدير المخزن",
            createdAt: new Date(),
          });
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving inventory item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "إضافة صنف جديد" : "تعديل بيانات الصنف"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "إدخال بيانات صنف جديد في المخزون"
              : "تعديل البيانات الأساسية للصنف"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="category">الفئة *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: keyof typeof inventoryCategories) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feed">أعلاف</SelectItem>
                  <SelectItem value="medicine">أدوية</SelectItem>
                  <SelectItem value="medical_supply">مستلزمات طبية</SelectItem>
                  <SelectItem value="equipment">معدات</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sku">رقم الصنف (SKU)</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                placeholder="سيتم إنشاؤه تلقائياً"
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
                  <SelectItem value="قرص">قرص</SelectItem>
                  <SelectItem value="علبة">علبة</SelectItem>
                  <SelectItem value="قطعة">قطعة</SelectItem>
                  <SelectItem value="لتر">لتر</SelectItem>
                  <SelectItem value="متر">متر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pricePerUnit">سعر الوحدة (جنيه) *</Label>
              <Input
                id="pricePerUnit"
                type="number"
                step="0.01"
                value={formData.pricePerUnitEGP}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerUnitEGP: e.target.value })
                }
                placeholder="8.50"
              />
            </div>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentStock">المخزون الحالي</Label>
              <Input
                id="currentStock"
                type="number"
                value={formData.currentStock}
                onChange={(e) =>
                  setFormData({ ...formData, currentStock: e.target.value })
                }
                placeholder="1200"
              />
            </div>
            <div>
              <Label htmlFor="minLevel">الحد الأدنى *</Label>
              <Input
                id="minLevel"
                type="number"
                value={formData.minLevel}
                onChange={(e) =>
                  setFormData({ ...formData, minLevel: e.target.value })
                }
                placeholder="500"
              />
            </div>
          </div>

          {/* Feed Specific */}
          {formData.category === "feed" && (
            <div>
              <Label htmlFor="concentrate">نسبة البروتين (%)</Label>
              <Input
                id="concentrate"
                type="number"
                step="0.1"
                value={formData.concentratePct}
                onChange={(e) =>
                  setFormData({ ...formData, concentratePct: e.target.value })
                }
                placeholder="16"
              />
            </div>
          )}

          {/* Supplier Information */}
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

          {/* Notes */}
          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="أي ملاحظات إضافية..."
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData({ ...formData, active: e.target.checked })
              }
              className="rounded"
            />
            <Label htmlFor="active">صنف نشط</Label>
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
              !formData.pricePerUnitEGP ||
              !formData.minLevel
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
