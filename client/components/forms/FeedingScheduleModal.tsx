import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { dataService } from "@/lib/data-service";
import { toast } from "@/hooks/use-toast";
import type { FeedingSchedule, Barn, WarehouseItem } from "@shared/types";
import { Plus, X } from "lucide-react";

interface FeedingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  schedule?: FeedingSchedule | null;
  mode: "add" | "edit";
}

export default function FeedingScheduleModal({
  isOpen,
  onClose,
  onSave,
  schedule,
  mode,
}: FeedingScheduleModalProps) {
  const [formData, setFormData] = useState({
    barnId: "",
    feedType: "",
    quantity: 0,
    timesPerDay: 1,
    scheduledTime: "08:00",
    isActive: true,
  });
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(["08:00"]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [feedItems, setFeedItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeInput, setTimeInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (schedule && mode === "edit") {
        setFormData({
          barnId: schedule.barnId,
          feedType: schedule.feedType,
          quantity: schedule.quantity,
          timesPerDay: schedule.timesPerDay,
          scheduledTime: schedule.scheduledTime,
          isActive: schedule.isActive,
        });
        setScheduledTimes(schedule.scheduledTime.split(",").map(t => t.trim()));
      } else {
        setFormData({
          barnId: "",
          feedType: "",
          quantity: 0,
          timesPerDay: 1,
          scheduledTime: "08:00",
          isActive: true,
        });
        setScheduledTimes(["08:00"]);
      }
    }
  }, [isOpen, schedule, mode]);

  const loadData = async () => {
    try {
      const [barnsData, warehouseData] = await Promise.all([
        dataService.barns.getAll(),
        dataService.warehouseItems.getByType("chemicals"),
      ]);
      
      setBarns(barnsData);
      setFeedItems(
        warehouseData.filter(
          item => item.category.includes("علف") || item.category.includes("أعلاف")
        )
      );
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الحظائر والأعلاف",
        variant: "destructive",
      });
    }
  };

  const handleAddTime = () => {
    if (timeInput && !scheduledTimes.includes(timeInput)) {
      const newTimes = [...scheduledTimes, timeInput].sort();
      setScheduledTimes(newTimes);
      setFormData(prev => ({
        ...prev,
        scheduledTime: newTimes.join(", "),
        timesPerDay: newTimes.length,
      }));
      setTimeInput("");
    }
  };

  const handleRemoveTime = (timeToRemove: string) => {
    const newTimes = scheduledTimes.filter(time => time !== timeToRemove);
    setScheduledTimes(newTimes);
    setFormData(prev => ({
      ...prev,
      scheduledTime: newTimes.join(", "),
      timesPerDay: newTimes.length,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.barnId || !formData.feedType || formData.quantity <= 0) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (scheduledTimes.length === 0) {
      toast({
        title: "مواعيد التغذية مطلوبة",
        description: "يجب إضافة موعد واحد على الأقل للتغذية",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const scheduleData = {
        ...formData,
        scheduledTime: scheduledTimes.join(", "),
        timesPerDay: scheduledTimes.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (mode === "edit" && schedule) {
        await dataService.feedingSchedules.update(schedule.id, scheduleData);
      } else {
        await dataService.feedingSchedules.create(scheduleData);
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: mode === "edit" ? "تم تحديث جدول التغذية بنجاح" : "تم إنشاء جدول التغذية بنجاح",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving feeding schedule:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ جدول التغذية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "تعديل جدول التغذية" : "إضافة جدول تغذية جديد"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" 
              ? "تعديل بيانات جدول التغذية المحدد" 
              : "أدخل بيانات جدول التغذية الجديد"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Barn Selection */}
          <div className="space-y-2">
            <Label htmlFor="barn">الحظيرة *</Label>
            <Select
              value={formData.barnId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, barnId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحظيرة" />
              </SelectTrigger>
              <SelectContent>
                {barns.map((barn) => (
                  <SelectItem key={barn.id} value={barn.id}>
                    {barn.name} ({barn.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feed Type */}
          <div className="space-y-2">
            <Label htmlFor="feedType">نوع العلف *</Label>
            <Select
              value={formData.feedType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, feedType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع العلف" />
              </SelectTrigger>
              <SelectContent>
                {feedItems.map((item) => (
                  <SelectItem key={item.id} value={item.name}>
                    {item.name} (متوفر: {item.currentStock} {item.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">الكمية (كجم) *</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.1"
              value={formData.quantity || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  quantity: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="أدخل الكمية"
            />
          </div>

          {/* Scheduled Times */}
          <div className="space-y-2">
            <Label>مواعيد التغذية *</Label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                placeholder="اختر الموعد"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddTime}
                size="sm"
                disabled={!timeInput}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {scheduledTimes.map((time, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {time}
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(time)}
                    className="ml-1 hover:bg-red-100 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              عدد الوجبات اليومية: {scheduledTimes.length}
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
            <Label htmlFor="isActive">جدول نشط</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : mode === "edit" ? "تحديث" : "حفظ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
