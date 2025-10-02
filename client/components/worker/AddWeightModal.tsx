import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Animal, WeightRecord } from '@shared/types';
import { Loader2 } from 'lucide-react';

interface AddWeightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (weightData: Omit<WeightRecord, 'id'>) => Promise<void>;
  animals: Animal[];
}

export const AddWeightModal: React.FC<AddWeightModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  animals
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    animalId: '',
    weight: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    notes: ''
  });

  const activeAnimals = animals.filter(animal => !animal.isIsolated);
  const selectedAnimal = activeAnimals.find(animal => animal.id === formData.animalId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.animalId || !formData.weight || !formData.date) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    const weight = parseFloat(formData.weight);
    if (weight <= 0) {
      alert('الرجاء إدخال وزن صحيح');
      return;
    }

    setLoading(true);
    try {
      const weightData: Omit<WeightRecord, 'id'> = {
        animalId: formData.animalId,
        weight: weight,
        date: new Date(formData.date),
        notes: formData.notes || undefined,
        recordedBy: 'worker'
      };

      await onSuccess(weightData);
      
      // Reset form
      setFormData({
        animalId: '',
        weight: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (error) {
      console.error('Error adding weight record:', error);
      alert('حدث خطأ أثناء تسجيل الوزن');
    } finally {
      setLoading(false);
    }
  };

  const getWeightDifference = () => {
    if (!selectedAnimal || !formData.weight) return null;
    
    const newWeight = parseFloat(formData.weight);
    const currentWeight = selectedAnimal.weight;
    const difference = newWeight - currentWeight;
    
    return {
      difference,
      percentage: ((difference / currentWeight) * 100).toFixed(1)
    };
  };

  const weightDiff = getWeightDifference();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل وزن جديد</DialogTitle>
          <DialogDescription>
            سجل وزن جديد لأحد الحيوانات
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Animal Selection */}
          <div className="space-y-2">
            <Label>الحيوان *</Label>
            <Select value={formData.animalId} onValueChange={(value) => setFormData(prev => ({ ...prev, animalId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحيوان" />
              </SelectTrigger>
              <SelectContent>
                {activeAnimals.map(animal => (
                  <SelectItem key={animal.id} value={animal.id}>
                    #{animal.earTagId} - {animal.category === 'male' ? 'ذكر' : animal.category === 'female' ? 'أنثى' : 'مولود'} - {animal.weight} كجم
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Weight Info */}
          {selectedAnimal && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">الوزن الحالي: <span className="font-medium">{selectedAnimal.weight} كجم</span></p>
              <p className="text-sm text-gray-600">العمر: <span className="font-medium">{selectedAnimal.ageMonths} شهر</span></p>
            </div>
          )}

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight">الوزن الجديد (كجم) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
              placeholder="أدخل الوزن الجديد"
              required
            />
          </div>

          {/* Weight Difference */}
          {weightDiff && (
            <div className={`p-3 rounded-lg ${weightDiff.difference >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${weightDiff.difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {weightDiff.difference >= 0 ? 'زيادة في الوزن: +' : 'نقص في الوزن: '}
                {Math.abs(weightDiff.difference).toFixed(1)} كجم 
                ({weightDiff.difference >= 0 ? '+' : ''}{weightDiff.percentage}%)
              </p>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">تاريخ التسجيل *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="ملاحظات إضافية (اختياري)"
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
              تسجيل الوزن
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