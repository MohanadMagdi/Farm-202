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
import { db, Animal, Barn } from "@/lib/firebase-mock";

interface AnimalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  animal?: Animal | null;
  mode: 'add' | 'edit';
}

export default function AnimalFormModal({ isOpen, onClose, onSave, animal, mode }: AnimalFormModalProps) {
  const [formData, setFormData] = useState({
    tagId: "",
    type: "male" as "male" | "female" | "newborn",
    birthDate: new Date().toISOString().split('T')[0],
    birthWeightKg: "",
    currentWeightKg: "",
    sex: "male" as "male" | "female",
    motherId: "",
    fatherId: "",
    purchaseDate: "",
    purchaseSupplier: "",
    purchasePriceEGP: "",
    healthStatus: "healthy" as "healthy" | "sick" | "under_treatment" | "quarantine",
    barnId: "",
    status: "active" as "active" | "sold" | "dead"
  });
  
  const [barns, setBarns] = useState<Barn[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSelectData();
      if (mode === 'edit' && animal) {
        setFormData({
          tagId: animal.tagId,
          type: animal.type,
          birthDate: animal.birthDate.toISOString().split('T')[0],
          birthWeightKg: animal.birthWeightKg.toString(),
          currentWeightKg: animal.currentWeightKg.toString(),
          sex: animal.sex,
          motherId: animal.motherId || "",
          fatherId: animal.fatherId || "",
          purchaseDate: animal.purchase?.date.toISOString().split('T')[0] || "",
          purchaseSupplier: animal.purchase?.supplier || "",
          purchasePriceEGP: animal.purchase?.priceEGP.toString() || "",
          healthStatus: animal.healthStatus,
          barnId: animal.barnId,
          status: animal.status
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, mode, animal]);

  const loadSelectData = async () => {
    try {
      const [barnsSnapshot, animalsSnapshot] = await Promise.all([
        db.collection('barns').get(),
        db.collection('animals').get()
      ]);
      
      setBarns(barnsSnapshot.docs.map(doc => doc.data() as Barn));
      setAnimals(animalsSnapshot.docs.map(doc => doc.data() as Animal));
    } catch (error) {
      console.error('Error loading select data:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      tagId: "",
      type: "male",
      birthDate: new Date().toISOString().split('T')[0],
      birthWeightKg: "",
      currentWeightKg: "",
      sex: "male",
      motherId: "",
      fatherId: "",
      purchaseDate: "",
      purchaseSupplier: "",
      purchasePriceEGP: "",
      healthStatus: "healthy",
      barnId: "",
      status: "active"
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const animalData: Partial<Animal> = {
        tagId: formData.tagId,
        type: formData.type,
        birthDate: new Date(formData.birthDate),
        birthWeightKg: parseFloat(formData.birthWeightKg),
        currentWeightKg: parseFloat(formData.currentWeightKg),
        sex: formData.sex,
        motherId: formData.motherId || undefined,
        fatherId: formData.fatherId || undefined,
        healthStatus: formData.healthStatus,
        barnId: formData.barnId,
        status: formData.status,
        metrics: {
          adg: 0.3, // Default ADG
          totalGainKg: parseFloat(formData.currentWeightKg) - parseFloat(formData.birthWeightKg),
          feedConsumedKg: 0
        }
      };

      if (formData.purchaseDate && formData.purchaseSupplier && formData.purchasePriceEGP) {
        animalData.purchase = {
          date: new Date(formData.purchaseDate),
          supplier: formData.purchaseSupplier,
          priceEGP: parseFloat(formData.purchasePriceEGP)
        };
      }

      if (mode === 'edit' && animal) {
        await db.collection('animals').doc(animal.id).update(animalData);
      } else {
        await db.collection('animals').add(animalData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving animal:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBarns = barns.filter(barn => 
    barn.type === formData.type || barn.type === 'mixed'
  );

  const potentialMothers = animals.filter(a => 
    a.type === 'female' && a.status === 'active' && a.id !== animal?.id
  );

  const potentialFathers = animals.filter(a => 
    a.type === 'male' && a.status === 'active' && a.id !== animal?.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'إضافة حيوان جديد' : 'تعديل بيانات الحيوان'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'إدخال بيانات الحيوان الجديد بالمزرعة'
              : 'تعديل البيانات الأساسية للحيوان'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tagId">رقم الأذن *</Label>
              <Input
                id="tagId"
                value={formData.tagId}
                onChange={(e) => setFormData({...formData, tagId: e.target.value})}
                placeholder="مثال: M001"
              />
            </div>
            <div>
              <Label htmlFor="type">نوع الحيوان *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "male" | "female" | "newborn") => 
                  setFormData({...formData, type: value, sex: value === 'newborn' ? formData.sex : value as "male" | "female"})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                  <SelectItem value="newborn">صغير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate">تار��خ الميلاد *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
              />
            </div>
            {formData.type === 'newborn' && (
              <div>
                <Label htmlFor="sex">الجنس *</Label>
                <Select
                  value={formData.sex}
                  onValueChange={(value: "male" | "female") => setFormData({...formData, sex: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Weight Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthWeight">وزن الميلاد (كيلو) *</Label>
              <Input
                id="birthWeight"
                type="number"
                step="0.1"
                value={formData.birthWeightKg}
                onChange={(e) => setFormData({...formData, birthWeightKg: e.target.value})}
                placeholder="3.5"
              />
            </div>
            <div>
              <Label htmlFor="currentWeight">الوزن الحالي (كيلو) *</Label>
              <Input
                id="currentWeight"
                type="number"
                step="0.1"
                value={formData.currentWeightKg}
                onChange={(e) => setFormData({...formData, currentWeightKg: e.target.value})}
                placeholder="65.5"
              />
            </div>
          </div>

          {/* Parent Information */}
          {formData.type !== 'male' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mother">الأم</Label>
                <Select
                  value={formData.motherId}
                  onValueChange={(value) => setFormData({...formData, motherId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون أم محددة</SelectItem>
                    {potentialMothers.map((mother) => (
                      <SelectItem key={mother.id} value={mother.id}>
                        {mother.tagId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="father">الأب</Label>
                <Select
                  value={formData.fatherId}
                  onValueChange={(value) => setFormData({...formData, fatherId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون أب محدد</SelectItem>
                    {potentialFathers.map((father) => (
                      <SelectItem key={father.id} value={father.id}>
                        {father.tagId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Purchase Information */}
          {formData.type !== 'newborn' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="purchaseDate">تاريخ الشراء</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="purchasePrice">سعر الشراء (جنيه)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={formData.purchasePriceEGP}
                    onChange={(e) => setFormData({...formData, purchasePriceEGP: e.target.value})}
                    placeholder="3500"
                  />
                </div>
                <div>
                  <Label htmlFor="healthStatus">الحالة الصحية *</Label>
                  <Select
                    value={formData.healthStatus}
                    onValueChange={(value: "healthy" | "sick" | "under_treatment" | "quarantine") => 
                      setFormData({...formData, healthStatus: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">سليم</SelectItem>
                      <SelectItem value="sick">مريض</SelectItem>
                      <SelectItem value="under_treatment">تحت العلاج</SelectItem>
                      <SelectItem value="quarantine">حجر صحي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="supplier">المورد</Label>
                <Input
                  id="supplier"
                  value={formData.purchaseSupplier}
                  onChange={(e) => setFormData({...formData, purchaseSupplier: e.target.value})}
                  placeholder="اسم المورد أو المزرعة"
                />
              </div>
            </>
          )}

          {/* Location and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="barn">الحظيرة *</Label>
              <Select
                value={formData.barnId}
                onValueChange={(value) => setFormData({...formData, barnId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحظيرة" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBarns.map((barn) => (
                    <SelectItem key={barn.id} value={barn.id}>
                      {barn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">حالة الحيوان *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "sold" | "dead") => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="sold">مُباع</SelectItem>
                  <SelectItem value="dead">نافق</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'جاري الحفظ...' : mode === 'add' ? 'إضافة الحيوان' : 'حفظ التعديلات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
