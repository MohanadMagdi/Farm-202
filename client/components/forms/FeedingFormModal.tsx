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
import { formatArabicDate, formatWeight } from "@/lib/arabic-utils";
import {
  db,
  FeedingRecord,
  Barn,
  InventoryItem,
  Animal,
} from "@/lib/firebase-mock";

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
    animalId: "",
    time: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    feedItemId: "",
    qtyKg: "",
    recordedBy: "مشرف الحظيرة",
  });

  const [barns, setBarns] = useState<Barn[]>([]);
  const [feedItems, setFeedItems] = useState<InventoryItem[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSelectData();
      if (mode === "edit" && feedingRecord) {
        setFormData({
          barnId: feedingRecord.barnId,
          animalId: feedingRecord.animalId || "",
          time: feedingRecord.time.toISOString().slice(0, 16),
          feedItemId: feedingRecord.feedItemId,
          qtyKg: feedingRecord.qtyKg.toString(),
          recordedBy: feedingRecord.recordedBy,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, feedingRecord, preselectedBarnId]);

  const loadSelectData = async () => {
    try {
      const [barnsSnapshot, inventorySnapshot, animalsSnapshot] =
        await Promise.all([
          db.collection("barns").get(),
          db.collection("inventory").where("category", "==", "feed").get(),
          db.collection("animals").where("status", "==", "active").get(),
        ]);

      setBarns(barnsSnapshot.docs.map((doc) => doc.data() as Barn));
      setFeedItems(
        inventorySnapshot.docs.map((doc) => doc.data() as InventoryItem),
      );
      setAnimals(animalsSnapshot.docs.map((doc) => doc.data() as Animal));
    } catch (error) {
      console.error("Error loading select data:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      barnId: preselectedBarnId || "",
      animalId: "",
      time: new Date().toISOString().slice(0, 16),
      feedItemId: "",
      qtyKg: "",
      recordedBy: "مشرف الحظيرة",
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const feedingData: Partial<FeedingRecord> = {
        barnId: formData.barnId,
        animalId: formData.animalId || undefined,
        time: new Date(formData.time),
        feedItemId: formData.feedItemId,
        qtyKg: parseFloat(formData.qtyKg),
        recordedBy: formData.recordedBy,
      };

      if (mode === "edit" && feedingRecord) {
        await db
          .collection("feedingRecords")
          .doc(feedingRecord.id)
          .update(feedingData);
      } else {
        await db.collection("feedingRecords").add(feedingData);

        // Create stock movement for feed consumption
        await db.collection("stockMovements").add({
          direction: "out" as const,
          inventoryItemId: formData.feedItemId,
          qty: parseFloat(formData.qtyKg),
          unit: "كيلو",
          reason: "issue_to_barn" as const,
          barnId: formData.barnId,
          requestedBy: formData.recordedBy,
          createdAt: new Date(formData.time),
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving feeding record:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedBarnAnimals = animals.filter(
    (animal) => animal.barnId === formData.barnId,
  );
  const selectedFeedItem = feedItems.find(
    (item) => item.id === formData.feedItemId,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "تسجيل وجبة تغذية" : "تعديل تسجيل التغذية"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "تسجيل وجبة تغذية جديدة للحظيرة أو الحيوان"
              : "تعديل بيانات تسجيل التغذية"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Barn Selection */}
          <div>
            <Label htmlFor="barn">الحظيرة *</Label>
            <Select
              value={formData.barnId}
              onValueChange={(value) =>
                setFormData({ ...formData, barnId: value, animalId: "" })
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

          {/* Animal Selection (Optional) */}
          <div>
            <Label htmlFor="animal">الحيوان (اختياري)</Label>
            <Select
              value={formData.animalId}
              onValueChange={(value) =>
                setFormData({ ...formData, animalId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر حيوان محدد أو اتركه فارغاً للحظيرة كاملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">تغذية الحظيرة كاملة</SelectItem>
                {selectedBarnAnimals.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.tagId} - {formatWeight(animal.currentWeightKg)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time */}
          <div>
            <Label htmlFor="time">وقت التغذية *</Label>
            <Input
              id="time"
              type="datetime-local"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            />
          </div>

          {/* Feed Item */}
          <div>
            <Label htmlFor="feedItem">نوع العلف *</Label>
            <Select
              value={formData.feedItemId}
              onValueChange={(value) =>
                setFormData({ ...formData, feedItemId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع العلف" />
              </SelectTrigger>
              <SelectContent>
                {feedItems.map((item) => {
                  const currentStock = db.getCurrentStock(item.id);
                  return (
                    <SelectItem
                      key={item.id}
                      value={item.id}
                      disabled={currentStock <= 0}
                    >
                      {item.name} - متوفر: {currentStock} {item.unit}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">
              الكمية ({selectedFeedItem?.unit || "كيلو"}) *
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.1"
              value={formData.qtyKg}
              onChange={(e) =>
                setFormData({ ...formData, qtyKg: e.target.value })
              }
              placeholder="مثال: 2.5"
            />
            {selectedFeedItem && (
              <p className="text-xs text-muted-foreground mt-1">
                المتوفر: {db.getCurrentStock(selectedFeedItem.id)}{" "}
                {selectedFeedItem.unit}
              </p>
            )}
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
              !formData.feedItemId ||
              !formData.qtyKg
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
