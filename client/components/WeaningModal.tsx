import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Calendar, Scale, Home, AlertTriangle } from 'lucide-react';
import type { Animal, Barn } from '@shared/types';
import { newbornManagementService } from '../lib/newborn-management-service';
import { newbornCostCenterService } from '../lib/newborn-cost-center-service';

interface WeaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  newborn: Animal;
  mother?: Animal;
  availableBarns: Barn[];
  onConfirmWeaning: (newbornId: string, newBarnId: string, weaningDate: Date) => void;
}

export function WeaningModal({
  isOpen,
  onClose,
  newborn,
  mother,
  availableBarns,
  onConfirmWeaning
}: WeaningModalProps) {
  const [selectedBarnId, setSelectedBarnId] = useState('');
  const [weaningDate, setWeaningDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<string[]>([]);

  const status = newbornManagementService.getNewbornStatus(newborn, mother);
  const financials = newbornManagementService.calculateNewbornFinancials(newborn, mother);
  const info = newbornManagementService.formatNewbornInfo(status);

  // Filter barns suitable for weaned newborns
  const suitableBarns = availableBarns.filter(barn => {
    const recommendedType = status.barnAssignment.recommendedBarnType;
    return barn.type === recommendedType || barn.type === 'mixed';
  });

  const validateWeaning = (): boolean => {
    const newErrors: string[] = [];
    
    // Check if newborn is ready for weaning
    if (!status.readyForWeaning) {
      newErrors.push('المولود غير جاهز للفطام بعد');
    }
    
    // Check barn selection
    if (!selectedBarnId) {
      newErrors.push('يجب اختيار حظيرة للمولود بعد الفطام');
    }
    
    // Check weaning date
    const selectedDate = new Date(weaningDate);
    const today = new Date();
    if (selectedDate > today) {
      newErrors.push('تاريخ الفطام لا يمكن أن يكون في المستقبل');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleConfirm = () => {
    if (validateWeaning()) {
      onConfirmWeaning(newborn.id, selectedBarnId, new Date(weaningDate));
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            فطام المولود {newborn.earTagId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">الحالة الحالية</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">العمر</p>
                <p className="font-medium">{info.ageLabel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الوزن</p>
                <p className="font-medium">{newborn.weight} كجم</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الحالة</p>
                <Badge className={info.statusColor}>{info.statusLabel}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">توقيت الفطام</p>
                <Badge className={info.weaningCategoryColor}>{info.weaningCategoryLabel}</Badge>
              </div>
            </div>
          </div>

          {/* Mother Information */}
          {mother && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Home className="h-4 w-4" />
                معلومات الأم
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ترقيم الأم</p>
                  <p className="font-medium">{mother.earTagId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحظيرة الحالية</p>
                  <p className="font-medium">{mother.barnId}</p>
                </div>
              </div>
            </div>
          )}

          {/* Financial Impact */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4" />
              التأثير المالي للفطام
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">تكلفة الإنتاج</p>
                <p className="font-medium">{financials.productionCost.toFixed(2)} جنيه</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">القيمة الحالية</p>
                <p className="font-medium">{financials.currentValue.toFixed(2)} جنيه</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مركز التكلفة الحالي</p>
                <p className="font-medium">
                  {financials.revenueAllocation === 'mother' && 'الأم'}
                  {financials.revenueAllocation === 'females' && 'الإناث العام'}
                  {financials.revenueAllocation === 'general_revenue' && 'الإيرادات العامة'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مركز التكلفة بعد الفطام</p>
                <p className="font-medium">الإناث العام</p>
              </div>
            </div>
          </div>

          {/* Weaning Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="weaningDate">تاريخ الفطام</Label>
              <Input
                id="weaningDate"
                type="date"
                value={weaningDate}
                onChange={(e) => setWeaningDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="barnSelect">الحظيرة الجديدة للمولود</Label>
              <select
                id="barnSelect"
                value={selectedBarnId}
                onChange={(e) => setSelectedBarnId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">اختر حظيرة...</option>
                {suitableBarns.map(barn => (
                  <option key={barn.id} value={barn.id}>
                    {barn.name} ({barn.type === 'male' ? 'ذكور' : barn.type === 'female' ? 'إناث' : 'مختلط'})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                نوع الحظيرة المناسبة: {status.barnAssignment.recommendedBarnType === 'male' ? 'ذكور' : 'إناث'}
              </p>
            </div>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>أخطاء في عملية الفطام</AlertTitle>
              <AlertDescription>
                <ul className="space-y-1 mt-2">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Criteria */}
          {status.readyForWeaning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>شروط الفطام</AlertTitle>
              <AlertDescription>
                <p className="font-medium">شروط الفطام مستوفاة:</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>✅ العمر: {status.ageDays} يوم (الحد الأدنى: 60 يوم)</li>
                  <li>✅ الوزن: {newborn.weight} كجم (الحد الأدنى: 15 كجم)</li>
                  <li>✅ الحالة الصحية: {status.healthStatus === 'healthy' ? 'سليم' : 'يحتاج متابعة'}</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!status.readyForWeaning}
          >
            تأكيد الفطام
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
