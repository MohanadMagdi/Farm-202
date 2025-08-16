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
import { formatArabicDate } from "@/lib/arabic-utils";
import { dataService, farmHelpers } from "@/lib/data-service";
import type { FeedingRecord, Barn, WarehouseItem, Animal } from "@shared/types";
import { toast } from "@/hooks/use-toast";
import { Calculator, AlertTriangle, TrendingUp, Users, Scale } from "lucide-react";

interface FeedingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  feedingRecord?: FeedingRecord | null;
  mode: "add" | "edit";
  preselectedBarnId?: string;
}

export default function FeedingFormModal({
  isOpen,
  onClose,
  onSave,
  feedingRecord,
  mode,
  preselectedBarnId,
}: FeedingFormModalProps) {
  const [formData, setFormData] = useState({
    barnId: preselectedBarnId || "",
    scheduleId: "",
    feedType: "",
    quantityIssued: "",
    time: new Date().toTimeString().slice(0, 5), // HH:MM format
    date: new Date().toISOString().split("T")[0],
    recordedBy: "مشرف الحظيرة",
    notes: "",
  });

  const [barns, setBarns] = useState<Barn[]>([]);
  const [feedItems, setFeedItems] = useState<WarehouseItem[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [barnAnimals, setBarnAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculated values
  const [calculations, setCalculations] = useState({
    animalsCount: 0,
    feedPerAnimal: 0,
    avgDailyGain: 0,
    feedingEfficiency: 0,
    estimatedCost: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadSelectData();
      if (mode === "edit" && feedingRecord) {
        populateFormData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, feedingRecord, preselectedBarnId]);

  useEffect(() => {
    if (formData.barnId) {
      loadBarnAnimals();
    }
  }, [formData.barnId]);

  useEffect(() => {
    calculateMetrics();
  }, [formData.quantityIssued, barnAnimals, formData.feedType]);

  const loadSelectData = async () => {
    try {
      const [barnsData, warehouseData, animalsData] = await Promise.all([
        dataService.barns.getAll(),
        dataService.warehouseItems.getByType("chemicals"), // Feed items
        dataService.animals.getAll(),
      ]);

      setBarns(barnsData.filter(barn => barn.isActive));
      setFeedItems(warehouseData.filter(item => 
        item.category.includes("علف") || item.category.includes("أعلاف") || item.isActive
      ));
      setAnimals(animalsData);
    } catch (error) {
      console.error("Error loading select data:", error);
    }
  };

  const loadBarnAnimals = async () => {
    try {
      const barnAnimalsData = await dataService.animals.getByBarn(formData.barnId);
      setBarnAnimals(barnAnimalsData);
    } catch (error) {
      console.error("Error loading barn animals:", error);
    }
  };

  const populateFormData = () => {
    if (!feedingRecord) return;
    
    setFormData({
      barnId: feedingRecord.barnId,
      scheduleId: feedingRecord.scheduleId || "",
      feedType: feedingRecord.feedType,
      quantityIssued: feedingRecord.quantityIssued.toString(),
      time: feedingRecord.time,
      date: feedingRecord.date.toISOString().split("T")[0],
      recordedBy: feedingRecord.recordedBy,
      notes: feedingRecord.notes || "",
    });
  };

  const resetForm = () => {
    setFormData({
      barnId: preselectedBarnId || "",
      scheduleId: "",
      feedType: "",
      quantityIssued: "",
      time: new Date().toTimeString().slice(0, 5),
      date: new Date().toISOString().split("T")[0],
      recordedBy: "مشرف الحظيرة",
      notes: "",
    });
    setBarnAnimals([]);
  };

  const calculateMetrics = () => {
    const quantity = parseFloat(formData.quantityIssued) || 0;
    const animalsCount = barnAnimals.length;
    const feedPerAnimal = animalsCount > 0 ? quantity / animalsCount : 0;
    
    // Calculate average daily gain for animals in this barn
    const avgDailyGain = animalsCount > 0 
      ? barnAnimals.reduce((sum, animal) => sum + farmHelpers.calculateADG(animal), 0) / animalsCount 
      : 0;

    // Calculate feeding efficiency (Feed Conversion Ratio)
    const feedingEfficiency = avgDailyGain > 0 
      ? farmHelpers.calculateFeedingEfficiency(feedPerAnimal, avgDailyGain)
      : 0;

    // Calculate estimated cost
    const selectedFeedItem = feedItems.find(item => item.name === formData.feedType);
    const estimatedCost = selectedFeedItem ? quantity * selectedFeedItem.unitPrice : 0;

    setCalculations({
      animalsCount,
      feedPerAnimal,
      avgDailyGain,
      feedingEfficiency,
      estimatedCost,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const feedingData: Omit<FeedingRecord, 'id'> = {
        barnId: formData.barnId,
        scheduleId: formData.scheduleId || undefined,
        feedType: formData.feedType,
        quantityIssued: parseFloat(formData.quantityIssued),
        animalsCount: calculations.animalsCount,
        feedPerAnimal: calculations.feedPerAnimal,
        avgDailyGain: calculations.avgDailyGain,
        feedingEfficiency: calculations.feedingEfficiency,
        date: new Date(formData.date),
        time: formData.time,
        recordedBy: formData.recordedBy,
        notes: formData.notes || undefined,
      };

      if (mode === "edit" && feedingRecord) {
        await dataService.feedingRecords.update(feedingRecord.id, feedingData);
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث تسجيل التغذية بنجاح",
        });
      } else {
        await dataService.feedingRecords.create(feedingData);
        
        // Create stock movement for feed consumption
        const selectedFeedItem = feedItems.find(item => item.name === formData.feedType);
        if (selectedFeedItem) {
          const stockMovement = {
            itemId: selectedFeedItem.id,
            type: "out" as const,
            quantity: parseFloat(formData.quantityIssued),
            unitPrice: selectedFeedItem.unitPrice,
            totalCost: parseFloat(formData.quantityIssued) * selectedFeedItem.unitPrice,
            date: new Date(formData.date),
            reason: "صرف للتغذية",
            recordedBy: formData.recordedBy,
            notes: `تغذية الحظيرة ${barns.find(b => b.id === formData.barnId)?.name} - ${formData.time}`,
          };

          await dataService.stockMovements.create(stockMovement);

          // Update warehouse item stock
          await dataService.warehouseItems.update(selectedFeedItem.id, {
            currentStock: selectedFeedItem.currentStock - parseFloat(formData.quantityIssued),
            updatedAt: new Date(),
          });
        }

        toast({
          title: "تم التسجيل بنجاح",
          description: "تم تسجيل وجبة التغذية بنجاح",
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving feeding record:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ تسجيل التغذية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedBarn = barns.find(barn => barn.id === formData.barnId);
  const selectedFeedItem = feedItems.find(item => item.name === formData.feedType);
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency <= 3) return "text-green-600";
    if (efficiency <= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency <= 3) return { text: "ممتاز", color: "bg-green-100 text-green-800" };
    if (efficiency <= 5) return { text: "جيد", color: "bg-yellow-100 text-yellow-800" };
    return { text: "يحتاج تحسين", color: "bg-red-100 text-red-800" };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "تسجيل وجبة تغذية" : "تعديل تسجيل التغذية"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "تسجيل وجبة تغذية جديدة مع حساب كفاءة التغذية"
              : "تعديل بيانات تسجيل التغذية"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">بيانات التغذية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barn">الحظيرة *</Label>
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
                    {barns.map((barn) => {
                      const barnAnimalsCount = animals.filter(a => a.barnId === barn.id).length;
                      return (
                        <SelectItem key={barn.id} value={barn.id}>
                          {barn.name} ({barnAnimalsCount} حيوان)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedBarn && (
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3 ml-1" />
                    <span>{calculations.animalsCount} حيوان في الحظيرة</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="feedType">نوع العلف *</Label>
                <Select
                  value={formData.feedType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, feedType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع العلف" />
                  </SelectTrigger>
                  <SelectContent>
                    {feedItems.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.name}
                        disabled={item.currentStock <= 0}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span>{item.name}</span>
                          <Badge variant="outline" className="mr-2">
                            متوفر: {item.currentStock} {item.unit}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFeedItem && selectedFeedItem.currentStock <= selectedFeedItem.minStockLevel && (
                  <div className="flex items-center mt-1 text-sm text-yellow-600">
                    <AlertTriangle className="h-3 w-3 ml-1" />
                    <span>مخزون منخفض</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantityIssued">
                  الكمي�� المصروفة ({selectedFeedItem?.unit || "كيلو"}) *
                </Label>
                <Input
                  id="quantityIssued"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.quantityIssued}
                  onChange={(e) =>
                    setFormData({ ...formData, quantityIssued: e.target.value })
                  }
                  placeholder="مثال: 25.5"
                />
                {selectedFeedItem && parseFloat(formData.quantityIssued) > selectedFeedItem.currentStock && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertTriangle className="h-3 w-3 ml-1" />
                    <span>الكمية أكبر من المتوفر</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="date">التاريخ *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="time">الوقت *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Calculations Display */}
          {parseFloat(formData.quantityIssued) > 0 && calculations.animalsCount > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Calculator className="h-5 w-5 ml-2" />
                حسابات كفاءة التغذية
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-blue-800">العلف لكل حيوان</div>
                    <Scale className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {farmHelpers.formatWeight(calculations.feedPerAnimal)}
                  </div>
                  <div className="text-xs text-blue-700">
                    {farmHelpers.formatWeight(parseFloat(formData.quantityIssued))} ÷ {calculations.animalsCount}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-green-800">متوسط النمو اليومي</div>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {calculations.avgDailyGain.toFixed(2)} كيلو
                  </div>
                  <div className="text-xs text-green-700">
                    لكل حيوان في اليوم
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-purple-800">معامل التحويل الغذائي</div>
                    <Calculator className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className={`text-2xl font-bold ${getEfficiencyColor(calculations.feedingEfficiency)}`}>
                    {calculations.feedingEfficiency.toFixed(1)}
                  </div>
                  <div className="text-xs text-purple-700">
                    كيلو علف / كيلو نمو
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-orange-800">تكلفة التغذية</div>
                    <span className="text-xs">EGP</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {farmHelpers.formatCurrency(calculations.estimatedCost)}
                  </div>
                  <div className="text-xs text-orange-700">
                    {selectedFeedItem?.unitPrice && farmHelpers.formatCurrency(selectedFeedItem.unitPrice)}/{selectedFeedItem?.unit}
                  </div>
                </div>
              </div>

              {/* Efficiency Assessment */}
              {calculations.feedingEfficiency > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">تقييم كفاءة التغذية</div>
                    <Badge className={getEfficiencyBadge(calculations.feedingEfficiency).color}>
                      {getEfficiencyBadge(calculations.feedingEfficiency).text}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {calculations.feedingEfficiency <= 3 && 
                      "كفاءة ممتازة في تحويل العلف إلى نمو. استمر على هذا النهج."}
                    {calculations.feedingEfficiency > 3 && calculations.feedingEfficiency <= 5 && 
                      "كفاءة جيدة ولكن يمكن تحسينها من خلال تحسين نوعية العلف أو مراجعة الصحة العامة."}
                    {calculations.feedingEfficiency > 5 && 
                      "كفاءة منخفضة. يُنصح بمراجعة نوعية العلف والحالة الصحية للحيوانات."}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">معلومات إضافية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recordedBy">المسج�� بواسطة *</Label>
                <Input
                  id="recordedBy"
                  value={formData.recordedBy}
                  onChange={(e) =>
                    setFormData({ ...formData, recordedBy: e.target.value })
                  }
                  placeholder="اسم المسؤول"
                />
              </div>

              <div>
                <Label htmlFor="scheduleId">رقم الجدولة (اختياري)</Label>
                <Input
                  id="scheduleId"
                  value={formData.scheduleId}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduleId: e.target.value })
                  }
                  placeholder="رقم جدول التغذية إن وجد"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="أي ملاحظات إضافية حول وجبة التغذية..."
                rows={3}
              />
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
              !formData.barnId ||
              !formData.feedType ||
              !formData.quantityIssued ||
              (selectedFeedItem && parseFloat(formData.quantityIssued) > selectedFeedItem.currentStock)
            }
          >
            {loading
              ? "جاري الحفظ..."
              : mode === "add"
                ? "تسجيل الوجبة"
                : "حفظ التعديلات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
