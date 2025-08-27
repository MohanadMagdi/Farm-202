import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  Factory, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Calendar,
  Award,
  Target
} from 'lucide-react';
import type { Animal } from '@shared/types';
import { newbornManagementService } from '../lib/newborn-management-service';

interface InternalProductionFilterProps {
  animals: Animal[];
  mothers: Animal[];
  onAnimalSelect: (animal: Animal) => void;
}

export function InternalProductionFilter({ 
  animals, 
  mothers, 
  onAnimalSelect 
}: InternalProductionFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'internal' | 'purchased'>('all');

  // Get internal production data
  const productionData = newbornManagementService.getInternalProduction(animals);
  const analytics = newbornManagementService.calculateNewbornAnalytics(animals);

  // Filter animals based on selection
  const getFilteredAnimals = () => {
    switch (selectedFilter) {
      case 'internal':
        return productionData.internallyBorn;
      case 'purchased':
        return productionData.purchased;
      default:
        return animals;
    }
  };

  const filteredAnimals = getFilteredAnimals();

  // Calculate weaned animals by gender
  const weanedMales = productionData.internallyBorn.filter(animal => 
    newbornManagementService.isWeaned(animal) && animal.sex === 'male'
  );
  
  const weanedFemales = productionData.internallyBorn.filter(animal => 
    newbornManagementService.isWeaned(animal) && animal.sex === 'female'
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Production Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Factory className="h-4 w-4 ml-1 text-green-600" />
              الإنتاج الداخلي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {productionData.internallyBorn.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {productionData.analytics.internalPercentage.toFixed(1)}% من إجمالي القطيع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShoppingCart className="h-4 w-4 ml-1 text-blue-600" />
              المشتريات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {productionData.purchased.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {(100 - productionData.analytics.internalPercentage).toFixed(1)}% من إجمالي القطيع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Award className="h-4 w-4 ml-1 text-purple-600" />
              معدل نجاح الفطام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {productionData.analytics.weaningSuccessRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              متوسط عمر الفطام: {productionData.analytics.averageWeaningAge} يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 ml-1 text-orange-600" />
              الهدف المثالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              60-75
            </div>
            <p className="text-xs text-muted-foreground">
              يوم (8-11 أسبوع)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">جميع الحيوانات ({animals.length})</TabsTrigger>
          <TabsTrigger value="internal">الإنتاج الداخلي ({productionData.internallyBorn.length})</TabsTrigger>
          <TabsTrigger value="purchased">المشتريات ({productionData.purchased.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إجمالي القطيع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Production Ratio */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">نسبة الإنتاج الداخلي</span>
                    <span className="text-sm text-muted-foreground">
                      {productionData.analytics.internalPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={productionData.analytics.internalPercentage} />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>المواليد (داخلي):</span>
                    <span className="font-medium">{productionData.internallyBorn.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المشتريات (خارجي):</span>
                    <span className="font-medium">{productionData.purchased.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="internal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Factory className="h-5 w-5 ml-2 text-green-600" />
                الإنتاج الداخلي (المواليد)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Internal Production Analytics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">إجمالي المواليد</p>
                    <p className="text-xl font-bold text-green-600">
                      {productionData.internallyBorn.length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">معدل النجاح</p>
                    <p className="text-xl font-bold text-green-600">
                      {productionData.analytics.weaningSuccessRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">متوسط الفطام</p>
                    <p className="text-xl font-bold text-green-600">
                      {productionData.analytics.averageWeaningAge} يوم
                    </p>
                  </div>
                </div>

                {/* Gender Distribution */}
                <div className="space-y-3">
                  <h4 className="font-medium">توزيع المواليد المفطومة حسب الجنس</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span>الذكور المفطومة</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {weanedMales.length}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        سيتم تحويلهم لحظائر الذكور
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span>الإناث المفطومة</span>
                        <Badge className="bg-pink-100 text-pink-800">
                          {weanedFemales.length}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        سيتم تحويلهم لحظائر الإناث
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">توصيات لتحسين الإنتاج الداخلي</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {productionData.analytics.weaningSuccessRate < 80 && (
                      <li>• تحسين رعاية الأمهات لزيادة معدل نجاح الفطام</li>
                    )}
                    {productionData.analytics.averageWeaningAge > 75 && (
                      <li>• مراجعة برنامج الفطام لتقليل متوسط العمر</li>
                    )}
                    {productionData.analytics.internalPercentage < 60 && (
                      <li>• زيادة الاعتماد على الإنتاج الداخلي لتقليل التكاليف</li>
                    )}
                    <li>• متابعة دورية لأوزان المواليد لضمان النمو الصحي</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchased" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 ml-2 text-blue-600" />
                المشتريات الخارجية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Purchase Analytics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">إجمالي المشتريات</p>
                    <p className="text-xl font-bold text-blue-600">
                      {productionData.purchased.length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">نسبة الاعتماد</p>
                    <p className="text-xl font-bold text-blue-600">
                      {(100 - productionData.analytics.internalPercentage).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">متوسط العمر</p>
                    <p className="text-xl font-bold text-blue-600">
                      {productionData.purchased.length > 0 
                        ? (productionData.purchased.reduce((sum, animal) => sum + (animal.ageMonths || 0), 0) / productionData.purchased.length).toFixed(1)
                        : 0
                      } شهر
                    </p>
                  </div>
                </div>

                {/* Purchase vs Internal Comparison */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">مقارنة الإنتاج الداخلي vs المشتريات</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-blue-700">مميزات الإنتاج الداخلي:</p>
                      <ul className="mt-1 space-y-1 text-blue-600">
                        <li>• تكلفة أقل (تغذية ورعاية فقط)</li>
                        <li>• معرفة التاريخ الصحي كاملاً</li>
                        <li>• تحكم في برنامج التغذية والرعاية</li>
                        <li>• ضمان جودة التربية</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-blue-700">تحديات المشتريات:</p>
                      <ul className="mt-1 space-y-1 text-blue-600">
                        <li>• تكلفة شراء أعلى</li>
                        <li>• مخاطر صحية محتملة</li>
                        <li>• عدم معرفة تاريخ التغذية</li>
                        <li>• فترة تأقلم مطلوبة</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">توصيات لتطوير الإنتاج</h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {productionData.analytics.internalPercentage < 70 && (
                      <li>• زيادة عدد الإناث المنتجة لتحسين الاكتفاء الذاتي</li>
                    )}
                    {productionData.analytics.weaningSuccessRate < 85 && (
                      <li>• تحسين برامج رعاية الأمهات والمواليد</li>
                    )}
                    {productionData.analytics.averageWeaningAge > 75 && (
                      <li>• تطوير برنامج الفطام لتحسين الكفاءة</li>
                    )}
                    <li>• المتابعة الدورية لأداء الأمهات وجودة الإنتاج</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed List */}
      <Card>
        <CardHeader>
          <CardTitle>
            قائمة مفصلة - {selectedFilter === 'internal' ? 'الإنتاج الداخلي' : selectedFilter === 'purchased' ? 'المشتريات' : 'جميع الحيوانات'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAnimals.slice(0, 10).map(animal => {
              const isInternal = !!animal.birthDate;
              const mother = isInternal ? mothers.find(m => m.id === animal.motherId) : undefined;
              const status = isInternal ? newbornManagementService.getNewbornStatus(animal, mother) : null;
              const info = status ? newbornManagementService.formatNewbornInfo(status) : null;

              return (
                <div 
                  key={animal.id} 
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => onAnimalSelect(animal)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={isInternal ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                        {isInternal ? (
                          <Factory className="h-3 w-3 ml-1" />
                        ) : (
                          <ShoppingCart className="h-3 w-3 ml-1" />
                        )}
                        {animal.earTagId}
                      </Badge>
                      
                      <div className="text-sm">
                        <p className="font-medium">
                          {animal.sex === 'male' ? '♂️ ذكر' : '♀️ أنثى'} - {animal.weight} كجم
                        </p>
                        {isInternal && info ? (
                          <p className="text-muted-foreground">
                            {info.ageLabel} - {info.statusLabel}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">
                            {animal.ageMonths ? `${animal.ageMonths} شهر` : 'عمر غير محدد'} - مشترى
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {isInternal && status && (
                        <Badge className={info!.weaningCategoryColor}>
                          {info!.weaningCategoryLabel}
                        </Badge>
                      )}
                      {!isInternal && (
                        <Badge variant="outline">
                          مشترى {animal.purchaseDate ? new Date(animal.purchaseDate).getFullYear() : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Mother info for internal production */}
                  {isInternal && mother && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      الأم: {mother.earTagId} - الحظيرة: {mother.barnId}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredAnimals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد حيوانات في هذه الفئة
              </div>
            )}

            {filteredAnimals.length > 10 && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  عرض 10 من أصل {filteredAnimals.length} حيوان
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
