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
import { Badge } from "@/components/ui/badge";
import { dataService, farmHelpers } from "@/lib/data-service";
import type { WarehouseItem, Barn, StockMovement } from "@shared/types";
import { toast } from "@/hooks/use-toast";
import {
  Upload,
  Download,
  AlertTriangle,
  Calculator,
  FileText,
  Camera,
} from "lucide-react";

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  warehouseItem?: WarehouseItem;
  mode: "in" | "out";
}

export default function StockMovementModal({
  isOpen,
  onClose,
  onSave,
  warehouseItem,
  mode,
}: StockMovementModalProps) {
  const [formData, setFormData] = useState({
    quantity: "",
    unitPrice: "",
    reason: "",
    customReason: "",
    toWarehouse: "",
    fromWarehouse: "",
    billNumber: "",
    receiptNumber: "",
    requestedBy: "مدير المخزن",
    notes: "",
  });

  const [barns, setBarns] = useState<Barn[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBarns();
      resetForm();

      // Pre-fill unit price if available
      if (warehouseItem) {
        setFormData((prev) => ({
          ...prev,
          unitPrice: warehouseItem.unitPrice.toString(),
        }));
      }
    }
  }, [isOpen, warehouseItem]);

  const loadBarns = async () => {
    try {
      const barnsData = await dataService.barns.getAll();
      setBarns(barnsData.filter((barn) => barn.isActive));
    } catch (error) {
      console.error("Error loading barns:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      quantity: "",
      unitPrice: warehouseItem?.unitPrice.toString() || "",
      reason: "",
      customReason: "",
      toWarehouse: "",
      fromWarehouse: "",
      billNumber: "",
      receiptNumber: "",
      requestedBy: "مدير المخزن",
      notes: "",
    });
  };

  const getReasonOptions = () => {
    if (mode === "in") {
      return [
        { value: "شراء جديد", label: "شراء جديد" },
        { value: "استلام شحنة", label: "استلام شحنة" },
        { value: "عائد من الحظيرة", label: "عائد من الحظيرة" },
        { value: "تحويل وارد", label: "تحويل وارد" },
        { value: "تعديل يدوي (زيادة)", label: "تعديل يدوي (زيادة)" },
        { value: "رصيد افتتاحي", label: "رصيد افتتاحي" },
        { value: "إرجاع من العزل", label: "إرجاع من العزل" },
        { value: "other", label: "أخرى..." },
      ];
    } else {
      return [
        { value: "صرف للحظيرة", label: "صرف للحظيرة" },
        { value: "صرف للتغذية", label: "صرف ��لتغذية" },
        { value: "صرف للعلاج", label: "صرف للعلاج" },
        { value: "بيع", label: "بيع" },
        { value: "فاقد/تالف", label: "فاقد/تالف" },
        { value: "منتهي الصلاحية", label: "منتهي الصلاحية" },
        { value: "تحويل صادر", label: "تحويل صادر" },
        { value: "تعديل يدوي (نقص)", label: "تعديل يدوي (نقص)" },
        { value: "عزل للمراجعة", label: "عزل للمراجعة" },
        { value: "other", label: "أخرى..." },
      ];
    }
  };

  const handleSave = async () => {
    if (!warehouseItem) return;

    setLoading(true);
    try {
      const finalReason =
        formData.reason === "other" ? formData.customReason : formData.reason;
      const quantity = parseFloat(formData.quantity);
      const unitPrice = parseFloat(formData.unitPrice);
      const totalCost = quantity * unitPrice;

      // Create stock movement record
      const stockMovement: Omit<StockMovement, "id"> = {
        itemId: warehouseItem.id,
        type: mode,
        quantity,
        unitPrice,
        totalCost,
        toWarehouse: formData.toWarehouse || undefined,
        fromWarehouse: formData.fromWarehouse || undefined,
        billNumber: formData.billNumber || undefined,
        receiptNumber: formData.receiptNumber || undefined,
        date: new Date(),
        reason: finalReason,
        recordedBy: formData.requestedBy,
        notes: formData.notes || undefined,
      };

      await dataService.stockMovements.create(stockMovement);

      // Update warehouse item stock
      const newStock =
        mode === "in"
          ? warehouseItem.currentStock + quantity
          : warehouseItem.currentStock - quantity;

      await dataService.warehouseItems.update(warehouseItem.id, {
        currentStock: Math.max(0, newStock), // Prevent negative stock
        updatedAt: new Date(),
      });

      toast({
        title: "تم تسجيل الحركة بنجاح",
        description: `تم ${mode === "in" ? "إضافة" : "صرف"} ${quantity} ${warehouseItem.unit} ${mode === "in" ? "إلى" : "من"} المخزون`,
      });

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving stock movement:", error);
      toast({
        title: "خطأ في تسجيل الحركة",
        description: "حدث خطأ أثناء تسجيل حركة المخزون",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentStock = warehouseItem?.currentStock || 0;
  const quantity = parseFloat(formData.quantity) || 0;
  const newStock =
    mode === "in" ? currentStock + quantity : currentStock - quantity;
  const totalCost = quantity * (parseFloat(formData.unitPrice) || 0);

  const isValidMovement = () => {
    if (mode === "out" && quantity > currentStock) {
      return false; // Can't sell more than available
    }
    return quantity > 0 && formData.reason && formData.requestedBy;
  };

  const getStockStatusColor = (stock: number) => {
    if (!warehouseItem) return "text-gray-600";

    if (stock <= 0) return "text-red-600";
    if (stock <= warehouseItem.minStockLevel) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {mode === "in" ? (
              <Upload className="h-5 w-5 ml-2 text-green-600" />
            ) : (
              <Download className="h-5 w-5 ml-2 text-red-600" />
            )}
            {mode === "in" ? "إضافة للمخزون" : "صرف من المخزون"}
          </DialogTitle>
          <DialogDescription>
            {warehouseItem?.name} - تفاصيل المنتج
          </DialogDescription>
          {warehouseItem && (
            <div className="space-y-2 -mt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{warehouseItem.name}</span>
                <Badge variant="outline">{warehouseItem.category}</Badge>
              </div>
              <div className="text-sm flex items-center gap-2">
                <span>
                  المخزون الحالي:
                  <span
                    className={`font-bold mr-1 ${getStockStatusColor(currentStock)}`}
                  >
                    {currentStock} {warehouseItem.unit}
                  </span>
                </span>
                {currentStock <= warehouseItem.minStockLevel && (
                  <Badge variant="destructive">أقل من الحد الأدنى</Badge>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Quantity and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">الكمية ({warehouseItem?.unit}) *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                placeholder="مثال: 50"
              />
              {quantity > 0 && warehouseItem && (
                <div className="text-xs mt-1 space-y-1">
                  <p className={getStockStatusColor(newStock)}>
                    المخزون بعد العملية:{" "}
                    <span className="font-bold">{newStock}</span>{" "}
                    {warehouseItem.unit}
                  </p>
                  {mode === "out" && newStock < 0 && (
                    <div className="flex items-center text-red-600">
                      <AlertTriangle className="h-3 w-3 ml-1" />
                      <span>الكمية المطلوبة أكبر من المخزون المتاح!</span>
                    </div>
                  )}
                  {mode === "out" &&
                    newStock >= 0 &&
                    newStock <= warehouseItem.minStockLevel && (
                      <div className="flex items-center text-yellow-600">
                        <AlertTriangle className="h-3 w-3 ml-1" />
                        <span>س��صبح المخزون أقل من الحد الأدنى</span>
                      </div>
                    )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="unitPrice">سعر الوحدة (جنيه) *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: e.target.value })
                }
                placeholder="0.00"
              />
              {totalCost > 0 && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Calculator className="h-3 w-3 ml-1" />
                  <span>
                    إجمالي التكلفة: {farmHelpers.formatCurrency(totalCost)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">السبب *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) =>
                setFormData({ ...formData, reason: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر السبب" />
              </SelectTrigger>
              <SelectContent>
                {getReasonOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason */}
          {formData.reason === "other" && (
            <div>
              <Label htmlFor="customReason">السبب المخصص *</Label>
              <Input
                id="customReason"
                value={formData.customReason}
                onChange={(e) =>
                  setFormData({ ...formData, customReason: e.target.value })
                }
                placeholder="أدخل السبب..."
              />
            </div>
          )}

          {/* Document Information */}
          {(formData.reason === "شراء جديد" ||
            formData.reason === "استلام شحنة" ||
            formData.reason === "بيع") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <Label htmlFor="billNumber">رقم الفاتورة</Label>
                <div className="flex space-x-2 space-x-reverse">
                  <Input
                    id="billNumber"
                    value={formData.billNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, billNumber: e.target.value })
                    }
                    placeholder="INV-2024-001"
                  />
                  <Button variant="outline" size="sm" type="button">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="receiptNumber">رقم الإيصال</Label>
                <div className="flex space-x-2 space-x-reverse">
                  <Input
                    id="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        receiptNumber: e.target.value,
                      })
                    }
                    placeholder="REC-2024-001"
                  />
                  <Button variant="outline" size="sm" type="button">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Warehouse Transfer */}
          {(formData.reason === "تحويل وارد" ||
            formData.reason === "تحويل صادر") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
              {formData.reason === "تحويل وارد" && (
                <div>
                  <Label htmlFor="fromWarehouse">من المستودع</Label>
                  <Input
                    id="fromWarehouse"
                    value={formData.fromWarehouse}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fromWarehouse: e.target.value,
                      })
                    }
                    placeholder="اسم المستودع المُرسِل"
                  />
                </div>
              )}

              {formData.reason === "تحويل صادر" && (
                <div>
                  <Label htmlFor="toWarehouse">إلى المستودع</Label>
                  <Input
                    id="toWarehouse"
                    value={formData.toWarehouse}
                    onChange={(e) =>
                      setFormData({ ...formData, toWarehouse: e.target.value })
                    }
                    placeholder="اسم المستودع المُستقبِل"
                  />
                </div>
              )}
            </div>
          )}

          {/* Requested By */}
          <div>
            <Label htmlFor="requestedBy">المس��ول *</Label>
            <Input
              id="requestedBy"
              value={formData.requestedBy}
              onChange={(e) =>
                setFormData({ ...formData, requestedBy: e.target.value })
              }
              placeholder="اسم المسؤول"
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
              placeholder="أي ملاحظات إضافية حول العملية..."
              rows={3}
            />
          </div>

          {/* Summary */}
          {quantity > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">ملخص العملية</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  النوع:{" "}
                  <span className="font-medium">
                    {mode === "in" ? "إضافة" : "صرف"}
                  </span>
                </div>
                <div>
                  الكمية:{" "}
                  <span className="font-medium">
                    {quantity} {warehouseItem?.unit}
                  </span>
                </div>
                <div>
                  سعر الوحدة:{" "}
                  <span className="font-medium">
                    {farmHelpers.formatCurrency(
                      parseFloat(formData.unitPrice) || 0,
                    )}
                  </span>
                </div>
                <div>
                  إجمالي التكلفة:{" "}
                  <span className="font-medium">
                    {farmHelpers.formatCurrency(totalCost)}
                  </span>
                </div>
                <div>
                  المخزون الحالي:{" "}
                  <span className="font-medium">
                    {currentStock} {warehouseItem?.unit}
                  </span>
                </div>
                <div>
                  المخزون الجديد:{" "}
                  <span
                    className={`font-medium ${getStockStatusColor(newStock)}`}
                  >
                    {newStock} {warehouseItem?.unit}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !isValidMovement()}
            className={
              mode === "in"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {loading
              ? "جاري الحفظ..."
              : mode === "in"
                ? "تأكيد الإضافة"
                : "تأكيد الصرف"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
