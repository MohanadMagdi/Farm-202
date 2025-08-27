// Male Lifecycle Card Component
// عرض معلومات دورة حياة الذكر في المزرعة

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  TrendingUp, 
  Scale, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Clock,
  Edit,
  Trash2
} from "lucide-react";
import { formatArabicDate } from "@/lib/arabic-utils";
import { farmHelpers } from "@/lib/data-service";
import { maleManagementService } from "@/lib/male-management-service";
import type { Animal } from "@shared/types";

interface MaleLifecycleCardProps {
  animal: Animal;
  onSaleReady?: (animal: Animal) => void;
  showProfitAnalysis?: boolean;
  currentMarketPrice?: number;
  onEdit?: (animal: Animal) => void;
  onWeightRecord?: (animal: Animal) => void;
  onDelete?: (animal: Animal) => void;
}

export default function MaleLifecycleCard({ 
  animal, 
  onSaleReady,
  showProfitAnalysis = true,
  currentMarketPrice = 0,
  onEdit,
  onWeightRecord,
  onDelete
}: MaleLifecycleCardProps) {
  // Get cycle information
  const cycleInfo = maleManagementService.getFarmCycleInfo(animal);
  const saleValidation = maleManagementService.validateSale(animal);
  const formattedInfo = maleManagementService.formatCycleInfo(cycleInfo);
  const businessRules = maleManagementService.getBusinessRules();

  // Calculate progress percentages
  const weightProgress = Math.min((animal.weight / businessRules.maxSaleWeight) * 100, 100);
  const timeProgress = Math.min((cycleInfo.timeInFarm / businessRules.farmCycleDuration.max) * 100, 100);

  // Get profit analysis if requested
  const profitAnalysis = showProfitAnalysis ? 
    maleManagementService.calculateExpectedProfit(animal, currentMarketPrice) : null;

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            دورة حياة الذكر - {animal.earTagId}
          </CardTitle>
          <Badge 
            variant={cycleInfo.isReadyForSale ? "default" : "secondary"}
            className={formattedInfo.statusColor}
          >
            {formattedInfo.statusLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-muted-foreground">العمر الحالي</div>
            <div className="text-lg font-bold">{animal.ageMonths} شهر</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-muted-foreground">فترة التربية</div>
            <div className="text-lg font-bold">{formattedInfo.timeInFarmLabel}</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-muted-foreground">الوزن الحالي</div>
            <div className="text-lg font-bold">{farmHelpers.formatWeight(animal.weight)}</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-sm text-muted-foreground">زيادة الوزن</div>
            <div className="text-lg font-bold">{formattedInfo.weightGainLabel}</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1" dir="rtl">
              <span>تقدم الوزن</span>
              <span>{animal.weight} / {businessRules.maxSaleWeight} كج</span>
            </div>
            <Progress value={weightProgress} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1" dir="rtl">
              <span>مدة التربية</span>
              <span>{formattedInfo.timeInFarmLabel} / {businessRules.farmCycleDuration.max} شهر</span>
            </div>
            <Progress value={timeProgress} className="h-2" />
          </div>
        </div>

        {/* Expected Sale Date */}
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg" dir="rtl">
          <Calendar className="h-4 w-4 text-yellow-600" />
          <div className="text-right">
            <div className="font-medium">تاريخ البيع المتوقع</div>
            <div className="text-sm text-muted-foreground">
              {formatArabicDate(cycleInfo.expectedSaleDate)}
            </div>
          </div>
        </div>

        {/* Profit Analysis */}
        {profitAnalysis && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                تحليل الربحية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">إجمالي التكلفة</div>
                  <div className="font-bold text-red-600">
                    {farmHelpers.formatCurrency(profitAnalysis.totalCost)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">الإيراد المتوقع</div>
                  <div className="font-bold text-green-600">
                    {farmHelpers.formatCurrency(profitAnalysis.expectedRevenue)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">الربح المتوقع</div>
                  <div className={`font-bold ${profitAnalysis.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {farmHelpers.formatCurrency(profitAnalysis.profit)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">هامش الربح</div>
                  <div className={`font-bold ${profitAnalysis.profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitAnalysis.profitMargin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Messages */}
        {saleValidation.errors.length > 0 && (
          <Alert variant="destructive" dir="rtl">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-right">
                {saleValidation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {saleValidation.warnings.length > 0 && (
          <Alert dir="rtl">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-right">
                {saleValidation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Sale Ready Notification */}
        {cycleInfo.isReadyForSale && saleValidation.errors.length === 0 && (
          <Alert className="border-green-200 bg-green-50" dir="rtl">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <span>الذكر جاهز للبيع! الوزن والعمر مناسبان.</span>
                {onSaleReady && (
                  <Button 
                    size="sm" 
                    onClick={() => onSaleReady(animal)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    تحضير للبيع
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Business Rules Reference */}
        <div className="text-xs text-muted-foreground pt-2 border-t" dir="rtl">
          <div className="flex items-center gap-4 text-right">
            <span>قواعد العمل:</span>
            <span>وزن الشراء: {businessRules.minPurchaseWeight}+ كج</span>
            <span>وزن البيع: {businessRules.maxSaleWeight} كج حد أقصى</span>
            <span>مدة التربية: {businessRules.farmCycleDuration.min}-{businessRules.farmCycleDuration.max} شهور</span>
          </div>
        </div>

        {/* Action Buttons */}
        {(onEdit || onWeightRecord || onDelete) && (
          <div className="flex items-center gap-2 pt-3 border-t" dir="rtl">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(animal)}
                className="text-blue-600 hover:text-blue-700"
              >
                تعديل
              </Button>
            )}
            {onWeightRecord && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWeightRecord(animal)}
                className="text-green-600 hover:text-green-700"
              >
                تسجيل وزن
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(animal)}
                className="text-red-600 hover:text-red-700"
              >
                حذف
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
