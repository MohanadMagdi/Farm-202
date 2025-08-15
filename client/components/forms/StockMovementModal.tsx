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
import { formatArabicNumber } from "@/lib/arabic-utils";
import { db, InventoryItem, Barn } from "@/lib/firebase-mock";

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  inventoryItem?: InventoryItem;
  mode: "in" | "out";
}

export default function StockMovementModal({
  isOpen,
  onClose,
  onSave,
  inventoryItem,
  mode,
}: StockMovementModalProps) {
  const [formData, setFormData] = useState({
    quantity: "",
    reason: "",
    customReason: "",
    barnId: "",
    requestedBy: "مدير المخزن",
    cost: "",
    notes: "",
  });

  const [barns, setBarns] = useState<Barn[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBarns();
      resetForm();
    }
  }, [isOpen]);

  const loadBarns = async () => {
    try {
      const snapshot = await db.collection("barns").get();
      setBarns(snapshot.docs.map((doc) => doc.data() as Barn));
    } catch (error) {
      console.error("Error loading barns:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      quantity: "",
      reason: "",
      customReason: "",
      barnId: "",
      requestedBy: "مدير المخزن",
      cost: "",
      notes: "",
    });
  };

  const getReasonOptions = () => {
    if (mode === "in") {
      return [
        { value: "purchase", label: "شراء جديد" },
        { value: "return_from_barn", label: "ع��ئد من الحظيرة" },
        { value: "transfer_in", label: "تحويل وارد" },
        { value: "manual_adjustment_in", label: "تعديل يدوي (زيادة)" },
        { value: "other", label: "أخرى..." },
      ];
    } else {
      return [
        { value: "issue_to_barn", label: "صرف للحظيرة" },
        { value: "sale", label: "بيع" },
        { value: "wastage", label: "فاقد/تالف" },
        { value: "transfer_out", label: "تحويل صادر" },
        { value: "manual_adjustment_out", label: "تعديل يدوي (نقص)" },
        { value: "other", label: "أخرى..." },
      ];
    }
  };

  const handleSave = async () => {
    if (!inventoryItem) return;

    setLoading(true);
    try {
      const finalReason = formData.reason === "other" ? formData.customReason : formData.reason;
      
      await db.collection("stockMovements").add({
        direction: mode,
        inventoryItemId: inventoryItem.id,
        qty: parseFloat(formData.quantity),
        unit: inventoryItem.unit,
        reason: finalReason,
        barnId: formData.barnId || undefined,
        requestedBy: formData.requestedBy,
        createdAt: new Date(),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        notes: formData.notes || undefined,
      });

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving stock movement:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentStock = inventoryItem ? db.getCurrentStock(inventoryItem.id) : 0;
  const newStock = formData.quantity 
    ? currentStock + (mode === "in" ? 1 : -1) * parseFloat(formData.quantity)
    : currentStock;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "in" ? "إضافة للمخزون" : "صرف من المخزون"}
          </DialogTitle>
          <DialogDescription>
            {inventoryItem ? `${inventoryItem.name} - المخزون الحالي: ${formatArabicNumber(currentStock)} ${inventoryItem.unit}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">
              الكمية ({inventoryItem?.unit}) *
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              placeholder="مثال: 50"
            />
            {formData.quantity && (
              <p className="text-xs text-muted-foreground mt-1">
                المخزون بعد العملية: {formatArabicNumber(newStock)} {inventoryItem?.unit}
                {newStock < 0 && <span className="text-red-600"> (مخزون سالب!)</span>}
              </p>
            )}
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

          {/* Barn Selection (for barn-related movements) */}
          {(formData.reason === "issue_to_barn" || formData.reason === "return_from_barn") && (
            <div>
              <Label htmlFor="barn">الحظيرة</Label>
              <Select
                value={formData.barnId}
                onValueChange={(value) =>
                  setFormData({ ...formData, barnId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحظيرة" />
                </SelectTrigger>
                <SelectContent>
                  {barns.map((barn) => (
                    <SelectItem key={barn.id} value={barn.id}>
                      {barn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cost (for purchases/sales) */}
          {(formData.reason === "purchase" || formData.reason === "sale") && (
            <div>
              <Label htmlFor="cost">
                {formData.reason === "purchase" ? "التكلفة الإجمالية" : "سعر البيع الإجمالي"} (جنيه)
              </Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
                placeholder="0.00"
              />
              {formData.cost && formData.quantity && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.reason === "purchase" ? "التكلفة" : "السعر"} للوحدة: {" "}
                  {(parseFloat(formData.cost) / parseFloat(formData.quantity)).toFixed(2)} جنيه
                </p>
              )}
            </div>
          )}

          {/* Requested By */}
          <div>
            <Label htmlFor="requestedBy">المسؤول *</Label>
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
              placeholder="أي ملاحظات إضافية..."
              rows={2}
            />
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
              !formData.quantity ||
              !formData.reason ||
              (formData.reason === "other" && !formData.customReason) ||
              (mode === "out" && newStock < 0)
            }
          >
            {loading
              ? "جاري الحفظ..."
              : mode === "in"
                ? "إضافة للمخزون"
                : "صرف من المخزون"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
