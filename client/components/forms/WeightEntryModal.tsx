import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar as CalendarIcon, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { Animal } from '@shared/types';
import { addAnimalWeight } from '@/lib/weights-service';
import { validateWeightEntry } from '@/lib/weights';

interface WeightRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  selectedAnimalId?: string;
  onSuccess?: () => void;
}

interface WeightFormData {
  animalId: string;
  date: Date;
  weightKg: number;
  notes: string;
}

export function WeightRecordModal({
  isOpen,
  onClose,
  animals,
  selectedAnimalId,
  onSuccess
}: WeightRecordModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState<WeightFormData>({
    animalId: selectedAnimalId || '',
    date: new Date(),
    weightKg: 0,
    notes: ''
  });

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        animalId: selectedAnimalId || '',
        date: new Date(),
        weightKg: 0,
        notes: ''
      });
      setErrors([]);
    }
  }, [isOpen, selectedAnimalId]);

  const selectedAnimal = animals.find(a => a.id === formData.animalId);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setErrors([]);

      // Validate form data
      const validationErrors = validateWeightEntry(
        formData.date.toISOString().split('T')[0],
        formData.weightKg
      );

      if (!formData.animalId) {
        validationErrors.push('يرجى اختيار حيوان');
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Add weight entry
      await addAnimalWeight(
        formData.animalId,
        formData.date.toISOString().split('T')[0],
        formData.weightKg
      );

      toast({
        title: 'نجح',
        description: `تم تسجيل وزن ${formData.weightKg} كجم للحيوان ${selectedAnimal?.earTagId} بنجاح`,
      });

      onSuccess?.();
      onClose();

    } catch (error) {
      console.error('Error adding weight:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الوزن';
      setErrors([errorMessage]);
      
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      animalId: selectedAnimalId || '',
      date: new Date(),
      weightKg: 0,
      notes: ''
    });
    setErrors([]);
    onClose();
  };

  // Get weight difference if animal has previous weights
  const getWeightDifference = () => {
    if (!selectedAnimal?.weightHistory || selectedAnimal.weightHistory.length === 0) {
      return null;
    }

    const lastWeight = selectedAnimal.weightHistory[selectedAnimal.weightHistory.length - 1];
    const difference = formData.weightKg - lastWeight.weightKg;
    
    return {
      lastWeight: lastWeight.weightKg,
      lastDate: lastWeight.date,
      difference,
      isPositive: difference > 0
    };
  };

  const weightDiff = getWeightDifference();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="p-2 bg-green-100 rounded-lg">
              <Scale className="h-6 w-6 text-green-600" />
            </div>
            تسجيل وزن جديد
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Error Alert */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Animal Selection */}
          <div className="space-y-3">
            <Label htmlFor="animal" className="text-base font-semibold text-gray-700">
              الحيوان *
            </Label>
            <Select 
              value={formData.animalId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, animalId: value }))}
              disabled={!!selectedAnimalId}
            >
              <SelectTrigger className="h-12 bg-white border-2 border-gray-200 hover:border-green-400 focus:border-green-500 transition-colors">
                <SelectValue placeholder="اختر حيوان لتسجيل وزنه" className="text-gray-500" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {animals.map(animal => (
                  <SelectItem key={animal.id} value={animal.id} className="py-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1">
                        <span className="font-bold text-lg text-gray-800">{animal.earTagId}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              animal.category === 'male' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              animal.category === 'female' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                              'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {animal.category === 'male' ? 'ذكر' : 
                             animal.category === 'female' ? 'أنثى' : 'صغير'}
                          </Badge>
                          {animal.weight && (
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                              آخر وزن: {animal.weight.toFixed(1)} كجم
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected Animal Info */}
            {selectedAnimal && (
              <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم الأذن:</span>
                  <span className="font-medium">{selectedAnimal.earTagId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">النوع:</span>
                  <Badge variant="outline">{selectedAnimal.category}</Badge>
                </div>
                {selectedAnimal.weight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">آخر وزن مسجل:</span>
                    <span className="font-medium">{selectedAnimal.weight.toFixed(1)} كجم</span>
                  </div>
                )}
                {selectedAnimal.weightHistory && selectedAnimal.weightHistory.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد القياسات:</span>
                    <span className="font-medium">{selectedAnimal.weightHistory.length} قياس</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label htmlFor="date" className="text-base font-semibold text-gray-700">
              تاريخ القياس *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-16 justify-start text-right font-medium border-2 border-gray-200 hover:border-green-400 focus:border-green-500 transition-colors",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-3 h-5 w-5 text-green-600" />
                  {formData.date ? (
                    <div className="flex flex-col items-start">
                      <span className="text-lg font-bold text-gray-800">
                        {formData.date.getDate()} {[
                          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                        ][formData.date.getMonth()]} {formData.date.getFullYear()}
                      </span>
                      <span className="text-sm text-green-600">
                        {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][formData.date.getDay()]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">اختر تاريخ تسجيل الوزن</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-sm p-5 bg-white rounded-2xl shadow-2xl border-2 border-gray-100" align="start">
                <div className="space-y-4" dir="rtl">
                  {/* عنوان التقويم */}
                  <div className="text-center py-3 mb-4">
                    <h3 className="text-xl font-bold text-green-700 bg-gradient-to-r from-green-50 to-green-100 rounded-lg py-3 px-6 inline-block border-2 border-green-200 shadow-sm">
                      📅 اختر التاريخ
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">حدد اليوم والشهر والسنة لتسجيل الوزن</p>
                  </div>

                  {/* قوائم منسدلة للتاريخ */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    {/* قائمة الأيام */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-gray-700 text-center">اليوم</label>
                      <select
                        value={formData.date.getDate()}
                        onChange={(e) => {
                          const newDate = new Date(formData.date);
                          newDate.setDate(parseInt(e.target.value));
                          setFormData(prev => ({ ...prev, date: newDate }));
                        }}
                        className="px-3 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white text-center font-bold min-w-[80px] hover:border-green-400 focus:border-green-500 focus:outline-none transition-colors shadow-sm"
                      >
                        {Array.from({ length: new Date(formData.date.getFullYear(), formData.date.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* قائمة الشهور */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-gray-700 text-center">الشهر</label>
                      <select
                        value={formData.date.getMonth()}
                        onChange={(e) => {
                          const newDate = new Date(formData.date);
                          newDate.setMonth(parseInt(e.target.value));
                          // تعديل اليوم إذا كان غير متوفر في الشهر الجديد
                          const maxDay = new Date(newDate.getFullYear(), parseInt(e.target.value) + 1, 0).getDate();
                          if (newDate.getDate() > maxDay) {
                            newDate.setDate(maxDay);
                          }
                          setFormData(prev => ({ ...prev, date: newDate }));
                        }}
                        className="px-3 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white text-right font-bold min-w-[120px] hover:border-green-400 focus:border-green-500 focus:outline-none transition-colors shadow-sm"
                      >
                        {[
                          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                        ].map((month, index) => (
                          <option key={index} value={index}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* قائمة السنوات */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-gray-700 text-center">السنة</label>
                      <select
                        value={formData.date.getFullYear()}
                        onChange={(e) => {
                          const newDate = new Date(formData.date);
                          newDate.setFullYear(parseInt(e.target.value));
                          // تعديل اليوم إذا كان غير متوفر في السنة الجديدة (حالة السنة الكبيسة)
                          const maxDay = new Date(parseInt(e.target.value), newDate.getMonth() + 1, 0).getDate();
                          if (newDate.getDate() > maxDay) {
                            newDate.setDate(maxDay);
                          }
                          setFormData(prev => ({ ...prev, date: newDate }));
                        }}
                        className="px-3 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white text-center font-bold min-w-[90px] hover:border-green-400 focus:border-green-500 focus:outline-none transition-colors shadow-sm"
                      >
                        {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* عرض التاريخ المحدد */}
                  <div className="text-center py-4 mt-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <h4 className="text-lg font-bold text-green-800 mb-2">التاريخ المحدد</h4>
                    <p className="text-2xl font-bold text-green-700">
                      {formData.date.getDate()} {[
                        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                      ][formData.date.getMonth()]} {formData.date.getFullYear()}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][formData.date.getDay()]}
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Weight Input */}
          <div className="space-y-3">
            <Label htmlFor="weight" className="text-base font-semibold text-gray-700">
              الوزن (كجم) *
            </Label>
            <div className="relative">
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="1"
                max="200"
                value={formData.weightKg || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  weightKg: parseFloat(e.target.value) || 0 
                }))}
                placeholder="أدخل الوزن بالكيلوجرام"
                className="h-12 text-left text-lg font-medium border-2 border-gray-200 hover:border-green-400 focus:border-green-500 transition-colors pl-12"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                كجم
              </div>
            </div>
            
            {/* Weight Change Preview */}
            {weightDiff && formData.weightKg > 0 && (
              <div className={cn(
                "p-2 rounded text-sm",
                weightDiff.isPositive ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              )}>
                <div className="flex items-center gap-2">
                  {weightDiff.isPositive ? 
                    <CheckCircle2 className="h-4 w-4" /> : 
                    <AlertTriangle className="h-4 w-4" />
                  }
                  <span>
                    {weightDiff.isPositive ? 'زيادة' : 'نقص'} في الوزن: {' '}
                    <strong>
                      {weightDiff.difference > 0 ? '+' : ''}
                      {weightDiff.difference.toFixed(1)} كجم
                    </strong>
                  </span>
                </div>
                <div className="text-xs mt-1 text-muted-foreground">
                  آخر وزن: {weightDiff.lastWeight.toFixed(1)} كجم في {new Date(weightDiff.lastDate).toLocaleDateString('ar-SA')}
                </div>
              </div>
            )}
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="أي ملاحظات إضافية حول القياس..."
              maxLength={200}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.animalId || !formData.weightKg} 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الحفظ...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ الوزن
                </div>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              disabled={loading}
              className="flex-1 border-gray-300 hover:bg-gray-50 font-medium py-2.5"
              size="lg"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
