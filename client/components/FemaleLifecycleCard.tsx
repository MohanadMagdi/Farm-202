// Female Lifecycle Card Component
// عرض معلومات دورة حياة الأنثى في المزرعة

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  TrendingUp, 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Baby,
  Clock
} from "lucide-react";
import { formatArabicDate } from "@/lib/arabic-utils";
import { farmHelpers } from "@/lib/data-service";
import { femaleManagementService } from "@/lib/female-management-service";
import type { Animal } from "@shared/types";

interface FemaleLifecycleCardProps {
  animal: Animal;
  onBreedingReady?: (animal: Animal) => void;
  showProductivityAnalysis?: boolean;
  avgOffspringValue?: number;
}

export default function FemaleLifecycleCard({ 
  animal, 
  onBreedingReady,
  showProductivityAnalysis = true,
  avgOffspringValue = 5000
}: FemaleLifecycleCardProps) {
  // Get breeding information
  const breedingInfo = femaleManagementService.getFemaleBreedingInfo(animal);
  const birthPrediction = femaleManagementService.predictNextBirth(animal);
  const formattedInfo = femaleManagementService.formatBreedingInfo(breedingInfo);
  const businessRules = femaleManagementService.getBusinessRules();

  // Calculate progress percentages
  const ageProgress = Math.min((breedingInfo.ageInMonths / (businessRules.maxLifespanYears * 12)) * 100, 100);
  const productiveAgeProgress = breedingInfo.isProductiveAge ? 
    Math.min(((breedingInfo.ageInMonths - businessRules.optimalBreedingAgeMonths.min) / 
    (businessRules.optimalBreedingAgeMonths.max - businessRules.optimalBreedingAgeMonths.min)) * 100, 100) : 0;

  // Get productivity analysis if requested
  const productivityAnalysis = showProductivityAnalysis ? 
    femaleManagementService.calculateProductivityAnalysis(animal, avgOffspringValue) : null;

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            دورة حياة الأنثى - {animal.earTagId}
          </CardTitle>
          <Badge 
            variant={breedingInfo.pregnancyStatus === 'pregnant' ? "default" : "secondary"}
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
            <div className="text-lg font-bold">{formattedInfo.ageLabel}</div>
          </div>
          
          <div className="text-center p-3 bg-pink-50 rounded-lg">
            <div className="text-sm text-muted-foreground">حالة التكاثر</div>
            <div className="text-lg font-bold">{formattedInfo.productivityLabel}</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-muted-foreground">الوزن الحالي</div>
            <div className="text-lg font-bold">{farmHelpers.formatWeight(animal.weight)}</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-muted-foreground">النسل المتوقع</div>
            <div className="text-lg font-bold">{breedingInfo.totalExpectedOffspring}</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1" dir="rtl">
              <span>تقدم العمر</span>
              <span>{Math.floor(breedingInfo.ageInMonths / 12)} / {businessRules.maxLifespanYears} سنوات</span>
            </div>
            <Progress value={ageProgress} className="h-2" />
          </div>

          {breedingInfo.isProductiveAge && (
            <div>
              <div className="flex justify-between text-sm mb-1" dir="rtl">
                <span>فترة الإنتاج</span>
                <span>{Math.floor(breedingInfo.ageInMonths / 12)} / {Math.floor(businessRules.optimalBreedingAgeMonths.max / 12)} سنوات</span>
              </div>
              <Progress value={productiveAgeProgress} className="h-2" />
            </div>
          )}
        </div>

        {/* Birth Prediction */}
        {birthPrediction && (
          <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg" dir="rtl">
            <Baby className="h-4 w-4 text-pink-600" />
            <div className="text-right">
              <div className="font-medium">
                {animal.isPregnant ? "الولادة المتوقعة" : "الولادة القادمة المحتملة"}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatArabicDate(birthPrediction.nextBirthDate)} - 
                متوقع {birthPrediction.expectedOffspringCount} من النسل
              </div>
            </div>
          </div>
        )}

        {/* Productivity Analysis */}
        {productivityAnalysis && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                تحليل الإنتاجية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">القيمة الحالية</div>
                  <div className="font-bold text-blue-600">
                    {farmHelpers.formatCurrency(productivityAnalysis.currentValue)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">قيمة الإنتاج المتوقعة</div>
                  <div className="font-bold text-green-600">
                    {farmHelpers.formatCurrency(productivityAnalysis.lifetimeProductionValue)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">الإنتاج الشهري</div>
                  <div className="font-bold text-green-600">
                    {farmHelpers.formatCurrency(productivityAnalysis.monthlyProductionRate)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">كفاءة التكاثر</div>
                  <div className={`font-bold ${productivityAnalysis.breedingEfficiency > 80 ? 'text-green-600' : 
                    productivityAnalysis.breedingEfficiency > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {productivityAnalysis.breedingEfficiency.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {productivityAnalysis.recommendedAction && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                  <strong>التوصية:</strong> {productivityAnalysis.recommendedAction}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status-based Alerts */}
        {breedingInfo.pregnancyStatus === 'pregnant' && birthPrediction && (
          <Alert className="border-pink-200 bg-pink-50" dir="rtl">
            <Baby className="h-4 w-4 text-pink-600" />
            <AlertDescription className="text-pink-800">
              الأنثى حامل! الولادة متوقعة في {formatArabicDate(birthPrediction.nextBirthDate)}
            </AlertDescription>
          </Alert>
        )}

        {breedingInfo.pregnancyStatus === 'ready' && breedingInfo.isProductiveAge && (
          <Alert className="border-green-200 bg-green-50" dir="rtl">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <span>الأنثى جاهزة للتلقيح! في سن التكاثر المثلى.</span>
                {onBreedingReady && (
                  <Button 
                    size="sm" 
                    onClick={() => onBreedingReady(animal)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    تسجيل تلقيح
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {breedingInfo.pregnancyStatus === 'too_old' && (
          <Alert className="border-orange-200 bg-orange-50" dir="rtl">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              الأنثى تجاوزت سن التكاثر المثلى. يُنصح بالنظر في البيع أو التقاعد.
            </AlertDescription>
          </Alert>
        )}

        {breedingInfo.pregnancyStatus === 'too_young' && (
          <Alert dir="rtl">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              الأنثى لا تزال صغيرة السن للتكاثر. السن المناسب للتلقيح: {Math.floor(businessRules.optimalBreedingAgeMonths.min / 12)} سنوات.
            </AlertDescription>
          </Alert>
        )}

        {/* Business Rules Reference */}
        <div className="text-xs text-muted-foreground pt-2 border-t" dir="rtl">
          <div className="flex flex-wrap items-center gap-4 text-right">
            <span>قواعد التكاثر:</span>
            <span>دورة الولادة: {businessRules.birthCycleMonths} شهور</span>
            <span>مدة الحمل: {businessRules.pregnancyDurationMonths} شهور</span>
            <span>النسل: {businessRules.minOffspringPerBirth}-{businessRules.maxOffspringPerBirth} في الولادة</span>
            <span>العمر الإنتاجي: {Math.floor(businessRules.optimalBreedingAgeMonths.min / 12)}-{Math.floor(businessRules.optimalBreedingAgeMonths.max / 12)} سنوات</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
