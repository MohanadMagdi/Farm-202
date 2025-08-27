import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  ArrowRight,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Factory,
  Target
} from 'lucide-react';
import { automaticWeaningTransferService } from '../lib/automatic-weaning-transfer-service';
import { newbornManagementService } from '../lib/newborn-management-service';
import type { Animal } from '@shared/types';
import { toast } from '../hooks/use-toast';

interface AutomaticTransferDashboardProps {
  animals: Animal[];
  onRefresh: () => void;
}

export function AutomaticTransferDashboard({ 
  animals, 
  onRefresh 
}: AutomaticTransferDashboardProps) {
  const [pendingTransfers, setPendingTransfers] = useState<{
    pendingCount: number;
    overdueCount: number;
    readyAnimals: Animal[];
    recommendedAction: string;
  } | null>(null);

  const [transferInProgress, setTransferInProgress] = useState(false);
  const [lastTransferResult, setLastTransferResult] = useState<any>(null);

  useEffect(() => {
    checkPendingTransfers();
  }, [animals]);

  const checkPendingTransfers = async () => {
    try {
      const result = await automaticWeaningTransferService.checkForPendingTransfers();
      setPendingTransfers(result);
    } catch (error) {
      console.error('Error checking pending transfers:', error);
    }
  };

  const executeAutomaticTransfer = async () => {
    setTransferInProgress(true);
    try {
      const result = await automaticWeaningTransferService.runAutomaticTransfer();
      setLastTransferResult(result);
      
      if (result.totalTransferred > 0) {
        toast({
          title: "نقل تلقائي ناجح",
          description: `تم نقل ${result.totalTransferred} مولود بنجاح إلى فئاتهم الجديدة`,
        });
        onRefresh(); // تحديث البيانات
      } else if (result.errors.length > 0) {
        toast({
          title: "خطأ في النقل التلقائي",
          description: result.errors.join(', '),
          variant: "destructive"
        });
      } else {
        toast({
          title: "لا توجد مواليد للنقل",
          description: "جميع المواليد في أماكنها الصحيحة",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في النقل",
        description: "حدث خطأ أثناء النقل التلقائي",
        variant: "destructive"
      });
    } finally {
      setTransferInProgress(false);
    }
  };

  const previewTransfer = async () => {
    if (!pendingTransfers?.readyAnimals) return;
    
    try {
      const animalIds = pendingTransfers.readyAnimals.map(a => a.id);
      const preview = await automaticWeaningTransferService.previewTransfer(animalIds);
      
      console.log('Transfer Preview:', preview);
      
      toast({
        title: "معاينة النقل",
        description: `سيتم نقل ${preview.summary.maleTransfers} ذكور و ${preview.summary.femaleTransfers} إناث`,
      });
    } catch (error) {
      console.error('Error previewing transfer:', error);
    }
  };

  // حساب إحصائيات سريعة
  const transferStats = {
    readyMales: pendingTransfers?.readyAnimals.filter(a => a.sex === 'male').length || 0,
    readyFemales: pendingTransfers?.readyAnimals.filter(a => a.sex === 'female').length || 0,
    overdueAnimals: pendingTransfers?.overdueCount || 0,
    totalReady: pendingTransfers?.pendingCount || 0
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 ml-1 text-blue-600" />
              جاهز للنقل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {transferStats.totalReady}
            </div>
            <p className="text-xs text-muted-foreground">
              مولود مفطوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 ml-1 text-green-600" />
              الذكور → صفحة الذكور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transferStats.readyMales}
            </div>
            <p className="text-xs text-muted-foreground">
              إنتاج داخلي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 ml-1 text-pink-600" />
              الإناث → صفحة الإناث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
              {transferStats.readyFemales}
            </div>
            <p className="text-xs text-muted-foreground">
              إنتاج داخلي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 ml-1 text-red-600" />
              متأخر عن الفطام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {transferStats.overdueAnimals}
            </div>
            <p className="text-xs text-muted-foreground">
              يحتاج نقل فوري
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Section */}
      {pendingTransfers && pendingTransfers.pendingCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RotateCcw className="h-5 w-5 ml-2 text-blue-600" />
              النقل التلقائي للمواليد المفطومة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recommendation Alert */}
              <Alert className={pendingTransfers.overdueCount > 0 ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}>
                <AlertTriangle className={`h-4 w-4 ${pendingTransfers.overdueCount > 0 ? 'text-red-600' : 'text-blue-600'}`} />
                <AlertDescription className={pendingTransfers.overdueCount > 0 ? 'text-red-800' : 'text-blue-800'}>
                  {pendingTransfers.recommendedAction}
                </AlertDescription>
              </Alert>

              {/* Transfer Preview */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-blue-600 ml-1" />
                    <span className="font-medium">الذكور</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {transferStats.readyMales} → صفحة الذكور
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    فئة: إنتاج داخلي
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-pink-600 ml-1" />
                    <span className="font-medium">الإناث</span>
                  </div>
                  <Badge className="bg-pink-100 text-pink-800">
                    {transferStats.readyFemales} → صفحة الإناث
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    فئة: إنتاج داخلي
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={executeAutomaticTransfer}
                  disabled={transferInProgress}
                  className="flex-1"
                >
                  {transferInProgress ? (
                    <>
                      <RotateCcw className="h-4 w-4 ml-1 animate-spin" />
                      جاري النقل...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 ml-1" />
                      تنفيذ النقل التلقائي
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  onClick={previewTransfer}
                  disabled={transferInProgress}
                >
                  معاينة النقل
                </Button>

                <Button 
                  variant="outline" 
                  onClick={checkPendingTransfers}
                  disabled={transferInProgress}
                >
                  <RotateCcw className="h-4 w-4 ml-1" />
                  تحديث
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Animals Ready for Transfer */}
      {pendingTransfers && pendingTransfers.readyAnimals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المواليد الجاهزة للنقل ({pendingTransfers.readyAnimals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTransfers.readyAnimals.slice(0, 10).map(animal => {
                const ageDays = newbornManagementService.calculateAgeDays(animal);
                const isOverdue = ageDays > 75;
                const targetCategory = animal.sex === 'male' ? 'ذكور' : 'إناث';
                
                return (
                  <div 
                    key={animal.id}
                    className={`p-3 border rounded-lg ${isOverdue ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={isOverdue ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                          {animal.earTagId}
                        </Badge>
                        
                        <div className="text-sm">
                          <p className="font-medium">
                            {animal.sex === 'male' ? '♂️ ذكر' : '♀️ أنثى'} - {animal.weight} كجم
                          </p>
                          <p className="text-muted-foreground">
                            العمر: {ageDays} يوم ({Math.floor(ageDays / 7)} أسبوع)
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className={animal.sex === 'male' ? "bg-green-100 text-green-800" : "bg-pink-100 text-pink-800"}>
                            <Factory className="h-3 w-3 ml-1" />
                            {targetCategory} (إنتاج داخلي)
                          </Badge>
                        </div>
                        
                        {isOverdue && (
                          <p className="text-xs text-red-600 mt-1">
                            ⚠️ متأخر عن الفطام المثالي
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {pendingTransfers.readyAnimals.length > 10 && (
                <div className="text-center py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    عرض 10 من أصل {pendingTransfers.readyAnimals.length} مولود جاهز للنقل
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Results */}
      {lastTransferResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 ml-2 text-green-600" />
              نتائج آخر نقل تلقائي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Success Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-green-700">إجمالي المنقولين</p>
                  <p className="text-xl font-bold text-green-800">
                    {lastTransferResult.totalTransferred}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-700">الذكور</p>
                  <p className="text-xl font-bold text-green-800">
                    {lastTransferResult.transferResults.filter((r: any) => r.success && r.newCategory === 'male').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-700">الإناث</p>
                  <p className="text-xl font-bold text-green-800">
                    {lastTransferResult.transferResults.filter((r: any) => r.success && r.newCategory === 'female').length}
                  </p>
                </div>
              </div>

              {/* Transfer Details */}
              {lastTransferResult.transferResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">تفاصيل النقل:</h4>
                  {lastTransferResult.transferResults.slice(0, 5).map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        {result.transferredAnimal?.earTagId || 'حيوان غير معروف'}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">مولود</Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge className={result.newCategory === 'male' ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"}>
                          {result.newCategory === 'male' ? 'ذكور' : 'إناث'} (إنتاج داخلي)
                        </Badge>
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Errors */}
              {lastTransferResult.errors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    أخطاء في النقل: {lastTransferResult.errors.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 ml-2 text-purple-600" />
            قواعد النقل التلقائي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">♂️ قواعد نقل الذكور</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• بعد الفطام (60-75 يوم) ينقل إلى صفحة الذكور</li>
                  <li>• يصبح فئة "إنتاج داخلي"</li>
                  <li>• ينقل لحظائر الذكور المتاحة</li>
                  <li>• يتم اختيار الحظيرة الأقل ازدحاماً</li>
                </ul>
              </div>

              <div className="p-4 border border-pink-200 rounded-lg">
                <h4 className="font-medium text-pink-800 mb-2">♀️ قواعد نقل الإناث</h4>
                <ul className="text-sm text-pink-700 space-y-1">
                  <li>• بعد الفطام (60-75 يوم) تنقل إلى صفحة الإناث</li>
                  <li>• تصبح فئة "إنتاج داخلي"</li>
                  <li>• تنقل لحظائر الإناث المتاحة</li>
                  <li>• تدخل برنامج التكاثر مستقبلاً</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">💡 مميزات النقل التلقائي</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• توفير الوقت والجهد في إدارة المواليد</li>
                <li>• ضمان النقل في الوقت المناسب (60-75 يوم)</li>
                <li>• تصنيف تلقائي كإنتاج داخلي لتتبع الأداء</li>
                <li>• اختيار أفضل الحظائر المتاحة تلقائياً</li>
                <li>• حفظ سجل كامل لعمليات النقل</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {pendingTransfers && pendingTransfers.pendingCount === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">
              جميع المواليد في أماكنها الصحيحة
            </h3>
            <p className="text-green-700 mb-4">
              لا توجد مواليد تحتاج نقل تلقائي حالياً
            </p>
            <Button variant="outline" onClick={checkPendingTransfers}>
              <RotateCcw className="h-4 w-4 ml-1" />
              فحص مرة أخرى
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
