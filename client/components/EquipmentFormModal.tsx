import React, { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import { dataService } from "@/lib/data-service";
import type { BarnEquipment } from "@/../../shared/types";

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  barnId: string;
  equipment?: BarnEquipment;
}

export function EquipmentFormModal({
  isOpen,
  onClose,
  onSave,
  barnId,
  equipment,
}: EquipmentFormModalProps) {
  const [formData, setFormData] = useState<Omit<BarnEquipment, "id" | "createdAt" | "updatedAt">>({
    barnId,
    name: "",
    type: "feeder",
    quantity: 1,
    status: "working",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const isEditMode = !!equipment;

  useEffect(() => {
    if (equipment) {
      setFormData({
        barnId: equipment.barnId,
        name: equipment.name,
        type: equipment.type,
        quantity: equipment.quantity,
        status: equipment.status,
        maintenanceDate: equipment.maintenanceDate,
        notes: equipment.notes || "",
      });
    } else {
      // Reset form for new equipment
      setFormData({
        barnId,
        name: "",
        type: "feeder",
        quantity: 1,
        status: "working",
        notes: "",
      });
    }
  }, [equipment, barnId]);

  const handleSave = async () => {
    try {
      setLoading(true);

      const equipmentData: Omit<BarnEquipment, "id" | "createdAt" | "updatedAt"> = {
        ...formData,
        quantity: Number(formData.quantity),
      };

      if (isEditMode && equipment) {
        await dataService.barnEquipment.update(equipment.id, equipmentData);
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث بيانات المعدة ${formData.name}`,
        });
      } else {
        await dataService.barnEquipment.create({
          ...equipmentData,
          createdAt: new Date(),
        } as any);
        toast({
          title: "تمت الإضافة بنجاح",
          description: `تم إضافة المعدة ${formData.name} بنجاح`,
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving equipment:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ بيانات المعدة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "تعديل معدة" : "إضافة معدة جديدة"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "تعديل بيانات المعدة الحالية"
              : "أدخل بيانات المعدة الجديدة"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="equipmentName">اسم المعدة</Label>
            <Input
              id="equipmentName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="مثال: معلف آلي رقم 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipmentType">نوع المعدة</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as any })
                }
              >
                <SelectTrigger id="equipmentType">
                  <SelectValue placeholder="اختر نوع المعدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feeder">معلف</SelectItem>
                  <SelectItem value="waterer">سقاية</SelectItem>
                  <SelectItem value="scale">ميزان</SelectItem>
                  <SelectItem value="heater">مدفأة</SelectItem>
                  <SelectItem value="ventilator">مروحة</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">العدد</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">الحالة</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">تعمل</SelectItem>
                  <SelectItem value="maintenance">قيد الصيانة</SelectItem>
                  <SelectItem value="broken">معطلة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maintenanceDate">تاريخ آخر صيانة</Label>
              <Input
                id="maintenanceDate"
                type="date"
                value={
                  formData.maintenanceDate
                    ? new Date(formData.maintenanceDate)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maintenanceDate: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="أي ملاحظات إضافية عن المعدة..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.name}
          >
            {loading ? "جاري الحفظ..." : isEditMode ? "حفظ التغييرات" : "إضافة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
