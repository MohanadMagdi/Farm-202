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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatArabicDate } from "@/lib/arabic-utils";
import { dataService, farmHelpers } from "@/lib/data-service";
import type { Animal, WeightRecord } from "@shared/types";
import { toast } from "@/hooks/use-toast";

interface WeightRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  preselectedAnimalId?: string;
}

export default function WeightRecordModal({
  isOpen,
  onClose,
  onSave,
  preselectedAnimalId,
}: WeightRecordModalProps) {
  const [formData, setFormData] = useState({
    animalId: preselectedAnimalId || "",
    newWeight: "",
    recordDate: new Date().toISOString().split("T")[0],
    recordedBy: "مشرف المزرعة",
    notes: "",
  });

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAnimals();
      if (preselectedAnimalId) {
        setFormData((prev) => ({ ...prev, animalId: preselectedAnimalId }));
      }
    }
  }, [isOpen, preselectedAnimalId]);

  useEffect(() => {
    if (formData.animalId) {
      const animal = animals.find((a) => a.id === formData.animalId);
      setSelectedAnimal(animal || null);
    } else {
      setSelectedAnimal(null);
    }
  }, [formData.animalId, animals]);

  const loadAnimals = async () => {
    try {
      const animalsData = await dataService.animals.getAll();
      setAnimals(animalsData);
    } catch (error) {
      console.error("Error loading animals:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      animalId: preselectedAnimalId || "",
      newWeight: "",
      recordDate: new Date().toISOString().split("T")[0],
      recordedBy: "مشرف المزرعة",
      notes: "",
    });
    setSelectedAnimal(null);
  };

  const calculateWeightGain = () => {
    if (!selectedAnimal || !formData.newWeight) return 0;
    return parseFloat(formData.newWeight) - selectedAnimal.weight;
  };

  const calculateNewADG = () => {
    if (!selectedAnimal || !formData.newWeight) return 0;

    const birthDate = selectedAnimal.birthDate || selectedAnimal.purchaseDate;
    const daysSinceBirth = Math.floor(
      (new Date(formData.recordDate).getTime() - birthDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceBirth <= 0) return 0;

    const estimatedBirthWeight = 3.5; // kg for sheep
    const totalGain = parseFloat(formData.newWeight) - estimatedBirthWeight;
    return totalGain / daysSinceBirth;
  };

  const handleSave = async () => {
    if (!selectedAnimal || !formData.newWeight) return;

    setLoading(true);
    try {
      const newWeight = parseFloat(formData.newWeight);
      const weightGain = newWeight - selectedAnimal.weight;
      const newADG = calculateNewADG();

      // Update animal weight
      await dataService.animals.update(selectedAnimal.id, {
        weight: newWeight,
        updatedAt: new Date(),
        updatedBy: formData.recordedBy,
      });

      // Create a weight record
      const weightRecord: Omit<WeightRecord, 'id'> = {
        animalId: selectedAnimal.id,
        weight: newWeight,
        date: new Date(formData.recordDate),
        recordedBy: formData.recordedBy,
        notes: formData.notes || undefined,
      };

      await dataService.weightRecords.create(weightRecord);

      // Also create a health record entry for tracking
      const healthRecord = {
        animalId: selectedAnimal.id,
        type: "checkup" as const,
        description: `تسجيل وزن: ${newWeight} كيلو`,
        cost: 0,
        date: new Date(formData.recordDate),
        recordedBy: formData.recordedBy,
        notes: `زيادة في الوزن: ${weightGain > 0 ? "+" : ""}${weightGain.toFixed(1)} كيلو. معدل النمو: ${newADG.toFixed(2)} كيلو/يوم${formData.notes ? `. ${formData.notes}` : ""}`,
      };

      await dataService.healthRecords.create(healthRecord);

      toast({
        title: "تم تسجيل الوزن بنجاح",
        description: `تم تسجيل وزن ${newWeight} كيلو ل��حيوان ${selectedAnimal.earTagId}`,
      });

      onSave();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error saving weight record:", error);
      toast({
        title: "خطأ في تسجيل الوزن",
        description: "حدث خطأ أثناء تسجيل الوزن الجديد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const weightGain = calculateWeightGain();
  const newADG = calculateNewADG();
  const currentADG = selectedAnimal ? farmHelpers.calculateADG(selectedAnimal) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل وزن جديد</DialogTitle>
          <DialogDescription>
            تسجيل وزن حديث للحيوان وحساب معدل النمو
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Animal Selection */}
          <div>
            <Label htmlFor="animal">الحيوان *</Label>
            <Select
              value={formData.animalId}
              onValueChange={(value) =>
                setFormData({ ...formData, animalId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحيوان" />
              </SelectTrigger>
              <SelectContent>
                {animals.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.earTagId} - {farmHelpers.formatWeight(animal.weight)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Animal Info */}
          {selectedAnimal && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">معلومات الحيوان الحالية</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">الوزن الحالي:</span>
                  <span className="font-medium mr-1">
                    {farmHelpers.formatWeight(selectedAnimal.weight)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">العمر:</span>
                  <span className="font-medium mr-1">
                    {Math.floor(
                      (new Date().getTime() - (selectedAnimal.birthDate || selectedAnimal.purchaseDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} يوم
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">معدل النمو:</span>
                  <span className="font-medium mr-1">
                    {currentADG.toFixed(2)} كيلو/يوم
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">الحظيرة:</span>
                  <span className="font-medium mr-1">
                    {selectedAnimal.barnId}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* New Weight */}
          <div>
            <Label htmlFor="newWeight">الوزن الجديد (كيلو) *</Label>
            <Input
              id="newWeight"
              type="number"
              step="0.1"
              value={formData.newWeight}
              onChange={(e) =>
                setFormData({ ...formData, newWeight: e.target.value })
              }
              placeholder="65.5"
            />
          </div>

          {/* Weight Analysis */}
          {selectedAnimal && formData.newWeight && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">تحليل الوزن الجديد</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    التغيير في الوزن:
                  </span>
                  <span
                    className={`font-medium mr-1 ${weightGain >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {weightGain > 0 ? "+" : ""}
                    {weightGain.toFixed(1)} كيلو
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    معدل النمو الجديد:
                  </span>
                  <span className="font-medium mr-1">
                    {newADG.toFixed(2)} كيلو/يوم
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">
                    حالة النمو:
                  </span>
                  <span className={`font-medium mr-1 ${
                    newADG > currentADG ? "text-green-600" : 
                    newADG < currentADG ? "text-red-600" : "text-yellow-600"
                  }`}>
                    {newADG > currentADG ? "تحسن في النمو" : 
                     newADG < currentADG ? "تراجع في النمو" : "نمو مستقر"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <Label htmlFor="recordDate">تاريخ القياس *</Label>
            <Input
              id="recordDate"
              type="date"
              value={formData.recordDate}
              onChange={(e) =>
                setFormData({ ...formData, recordDate: e.target.value })
              }
            />
          </div>

          {/* Recorded By */}
          <div>
            <Label htmlFor="recordedBy">المسجل بواسطة *</Label>
            <Input
              id="recordedBy"
              value={formData.recordedBy}
              onChange={(e) =>
                setFormData({ ...formData, recordedBy: e.target.value })
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
              placeholder="أي ملاحظات إضافية حول القياس..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              resetForm();
            }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.animalId || !formData.newWeight}
          >
            {loading ? "جاري الحفظ..." : "تسجيل الوزن"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
