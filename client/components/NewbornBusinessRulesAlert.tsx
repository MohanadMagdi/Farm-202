import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Info, Clock, DollarSign, Home } from 'lucide-react';
import { newbornManagementService } from '../lib/newborn-management-service';

export function NewbornBusinessRulesAlert() {
  const rules = newbornManagementService.getBusinessRules();

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">قواعد إدارة المواليد (الإنتاج الداخلي)</AlertTitle>
      <AlertDescription className="text-blue-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          {/* Weaning Rules */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">قواعد الفطام</span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">المثالي</Badge>
                <span>{rules.weaningAge.optimal.min}-{rules.weaningAge.optimal.max} يوم</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">الحد الأدنى</Badge>
                <span>{rules.weaningAge.min} يوم</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">الحد الأقصى</Badge>
                <span>{rules.weaningAge.max} يوم</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">الوزن</Badge>
                <span>{rules.minWeaningWeight}+ كجم</span>
              </div>
            </div>
          </div>

          {/* Housing Rules */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="font-medium">قواعد الحظائر</span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <Badge className="bg-yellow-100 text-yellow-800 text-xs">قاعدة أساسية</Badge>
                <p className="mt-1">المواليد تبقى مع الأم في نفس الحظيرة حتى الفطام</p>
              </div>
              <div className="mt-2">
                <Badge className="bg-green-100 text-green-800 text-xs">بعد الفطام</Badge>
                <p className="mt-1">نقل للحظائر المناسبة حسب الجنس</p>
              </div>
            </div>
          </div>

          {/* Cost Center Rules */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">مراكز التكلفة</span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <Badge className="bg-blue-100 text-blue-800 text-xs">قبل الفطام</Badge>
                <p className="mt-1">
                  {rules.costAllocation.beforeWeaning === 'mother' && 'مركز تكلفة الأم'}
                  {rules.costAllocation.beforeWeaning === 'females' && 'مركز الإناث العام'}
                  {rules.costAllocation.beforeWeaning === 'general_revenue' && 'الإيرادات العامة'}
                </p>
              </div>
              <div className="mt-2">
                <Badge className="bg-purple-100 text-purple-800 text-xs">بعد الفطام</Badge>
                <p className="mt-1">
                  {rules.costAllocation.afterWeaning === 'mother' && 'مركز تكلفة الأم'}
                  {rules.costAllocation.afterWeaning === 'females' && 'مركز الإناث العام'}
                  {rules.costAllocation.afterWeaning === 'general_revenue' && 'الإيرادات العامة'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm">
          <p className="font-medium text-blue-800">📌 نصائح مهمة:</p>
          <ul className="mt-2 space-y-1 text-blue-700">
            <li>• الفطام المبكر (قبل 60 يوم) قد يؤثر على صحة المولود</li>
            <li>• الفطام المتأخر (بعد 84 يوم) قد يزيد من التكاليف</li>
            <li>• تأكد من وزن المولود قبل الفطام (15+ كجم)</li>
            <li>• سيتم تحويل مركز التكلفة تلقائياً عند الفطام</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}
