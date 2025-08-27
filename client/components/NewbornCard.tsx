import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Calendar, Scale, Heart, AlertTriangle } from 'lucide-react';
import type { Animal } from '@shared/types';
import { newbornManagementService } from '../lib/newborn-management-service';

interface NewbornCardProps {
  newborn: Animal;
  mother?: Animal;
  onSelect?: () => void;
  onWeaningRequest?: () => void;
  showWeaningButton?: boolean;
}

export function NewbornCard({ 
  newborn, 
  mother, 
  onSelect, 
  onWeaningRequest,
  showWeaningButton = false 
}: NewbornCardProps) {
  const status = newbornManagementService.getNewbornStatus(newborn, mother);
  const financials = newbornManagementService.calculateNewbornFinancials(newborn, mother);
  const info = newbornManagementService.formatNewbornInfo(status);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {newborn.earTagId}
          </span>
          <Badge className={info.statusColor}>
            {info.statusLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Age and Weight Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">العمر</p>
            <p className="font-medium">{info.ageLabel}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">الوزن</p>
            <p className="font-medium">{newborn.weight} كجم</p>
          </div>
        </div>

        {/* Weaning Category Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">توقيت الفطام:</span>
          <Badge className={info.weaningCategoryColor}>
            {info.weaningCategoryLabel}
          </Badge>
        </div>

        {/* Weight Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">تقدم النمو</span>
            <span className="text-sm text-muted-foreground">{status.weightProgress.toFixed(1)}%</span>
          </div>
          <Progress value={status.weightProgress} />
        </div>
        
        {/* Health Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">الحالة الصحية</p>
            <p className="text-sm font-medium">
              {status.healthStatus === 'healthy' && '✅ سليم'}
              {status.healthStatus === 'underweight' && '⚠️ وزن منخفض'}
              {status.healthStatus === 'overweight' && '⚠️ وزن زائد'}
              {status.healthStatus === 'needs_attention' && '🔴 يحتاج متابعة'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">الجنس</p>
            <p className="text-sm font-medium">
              {newborn.sex === 'male' ? '♂️ ذكر' : '♀️ أنثى'}
            </p>
          </div>
        </div>

        {/* Mother Info */}
        {mother && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">معلومات الأم</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <p className="text-sm">الترقيم: {mother.earTagId}</p>
              <p className="text-sm">الحظيرة: {mother.barnId}</p>
            </div>
          </div>
        )}

        {/* Weaning Info */}
        <div>
          <p className="text-sm text-muted-foreground">{info.weaningLabel}</p>
          {(status.readyForWeaning && !status.isWeaned && (onWeaningRequest || showWeaningButton)) && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onWeaningRequest) onWeaningRequest();
              }}
              className="mt-2 w-full"
            >
              بدء عملية الفطام
            </Button>
          )}
        </div>

        {/* Financial Info */}
        <div className="p-3 border rounded-lg">
          <p className="text-sm font-medium mb-2">المعلومات المالية</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-muted-foreground">التكلفة</p>
              <p className="text-sm font-semibold">{financials.productionCost.toFixed(2)} جنيه</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">القيمة الحالية</p>
              <p className="text-sm font-semibold">{financials.currentValue.toFixed(2)} جنيه</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">تخصيص الإيرادات</p>
            <p className="text-xs">
              {financials.revenueAllocation === 'mother' && '📍 مركز تكلفة الأم'}
              {financials.revenueAllocation === 'females' && '📍 مركز الإناث العام'}
              {financials.revenueAllocation === 'general_revenue' && '📍 الإيرادات العامة'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
