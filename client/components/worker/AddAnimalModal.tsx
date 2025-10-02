import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Animal, Barn } from '@shared/types';
import { Loader2 } from 'lucide-react';

interface AddAnimalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (animalData: Omit<Animal, 'id'>) => Promise<void>;
  barns: Barn[];
}

export const AddAnimalModal: React.FC<AddAnimalModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  barns
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    earTagId: '',
    category: 'male' as 'male' | 'female' | 'newborn',
    sex: 'male' as 'male' | 'female',
    weight: '',
    ageMonths: '',
    supplier: '',
    purchasePrice: '',
    barnId: '',
    healthStatus: 'جيد',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.earTagId || !formData.weight || !formData.ageMonths || !formData.barnId) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const animalData: Omit<Animal, 'id'> = {
        earTagId: formData.earTagId,
        category: formData.category,
        sex: formData.sex,
        weight: parseFloat(formData.weight),
        ageMonths: parseInt(formData.ageMonths),
        supplier: formData.supplier || undefined,
        purchaseDate: new Date(),
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        pricingMethod: 'manual',
        barnId: formData.barnId,
        healthStatus: formData.healthStatus,
        isIsolated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'worker',
        updatedBy: 'worker'
      };

      // Auto-set sex based on category
      if (formData.category === 'male') {
        animalData.sex = 'male';
      } else if (formData.category === 'female') {
        animalData.sex = 'female';
      }

      await onSuccess(animalData);
      
      // Reset form
      setFormData({
        earTagId: '',
        category: 'male',
        sex: 'male',
        weight: '',
        ageMonths: '',
        supplier: '',
        purchasePrice: '',
        barnId: '',
        healthStatus: 'جيد',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding animal:', error);
      alert('حدث خطأ أثناء إضافة الحيوان');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category: category as 'male' | 'female' | 'newborn',
      sex: category === 'female' ? 'female' : 'male'
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة حيوان جديد</DialogTitle>
          <DialogDescription>
            أدخل بيانات الحيوان الجديد
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ear Tag ID */}
          <div className="space-y-2">
            <Label htmlFor="earTagId">رقم الأذن *</Label>
            <Input
              id="earTagId"
              value={formData.earTagId}
              onChange={(e) => setFormData(prev => ({ ...prev, earTagId: e.target.value }))}
              placeholder="أدخل رقم الأذن"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>الفئة *</Label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">ذكر</SelectItem>
                <SelectItem value="female">أنثى</SelectItem>
                <SelectItem value="newborn">مولود</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight">الوزن (كجم) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
              placeholder="أدخل الوزن"
              required
            />
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="ageMonths">العمر (بالأشهر) *</Label>
            <Input
              id="ageMonths"
              type="number"
              min="0"
              value={formData.ageMonths}
              onChange={(e) => setFormData(prev => ({ ...prev, ageMonths: e.target.value }))}
              placeholder="أدخل العمر بالأشهر"
              required
            />
          </div>

          {/* Barn */}
          <div className="space-y-2">
            <Label>الحظيرة *</Label>
            <Select value={formData.barnId} onValueChange={(value) => setFormData(prev => ({ ...prev, barnId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحظيرة" />
              </SelectTrigger>
              <SelectContent>
                {barns.map(barn => (
                  <SelectItem key={barn.id} value={barn.id}>
                    {barn.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier">المورد</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              placeholder="اسم المورد (اختياري)"
            />
          </div>

          {/* Purchase Price */}
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">سعر الشراء (ج.م)</Label>
            <Input
              id="purchasePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.purchasePrice}
              onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
              placeholder="سعر الشراء (اختياري)"
            />
          </div>

          {/* Health Status */}
          <div className="space-y-2">
            <Label htmlFor="healthStatus">الحالة الصحية</Label>
            <Input
              id="healthStatus"
              value={formData.healthStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, healthStatus: e.target.value }))}
              placeholder="الحالة الصحية"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إضافة الحيوان
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};