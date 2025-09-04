/**
 * مكون إعدادات البيانات
 * يسمح بالتبديل بين البيانات الوهمية والحقيقية
 * Data Settings Component - Switch between mock and real data
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Settings, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import dataService from "@/lib/data-service-unified";
import { toast } from "@/hooks/use-toast";

const DataSourceControl: React.FC = () => {
  const [environment, setEnvironment] = useState(dataService.getCurrentEnvironment());
  const [isLoading, setIsLoading] = useState(false);
  const [dataStats, setDataStats] = useState({
    animals: 0,
    barns: 0,
    warehouseItems: 0,
    feedingRecords: 0,
    weightRecords: 0
  });

  useEffect(() => {
    loadDataStats();
  }, []);

  const loadDataStats = async () => {
    try {
      setIsLoading(true);
      const [animals, barns, items, feeding, weights] = await Promise.all([
        dataService.getAnimals(),
        dataService.getBarns(),
        dataService.getWarehouseItems(),
        dataService.getFeedingRecords(),
        dataService.getWeightRecords()
      ]);

      setDataStats({
        animals: animals.length,
        barns: barns.length,
        warehouseItems: items.length,
        feedingRecords: feeding.length,
        weightRecords: weights.length
      });
    } catch (error) {
      console.error("خطأ في تحميل إحصائيات البيانات:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل إحصائيات البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    try {
      setIsLoading(true);
      await dataService.syncAllData();
      await loadDataStats();
      
      toast({
        title: "تم بنجاح",
        description: "تمت مزامنة البيانات بنجاح",
        variant: "default"
      });
    } catch (error) {
      console.error("خطأ في المزامنة:", error);
      toast({
        title: "خطأ",
        description: "فشل في مزامنة البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setEnvironment(dataService.getCurrentEnvironment());
    await loadDataStats();
  };

  return (
    <div className="space-y-6">
      {/* معلومات البيئة الحالية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            حالة البيانات الحالية
          </CardTitle>
          <CardDescription>
            معلومات مصدر البيانات والبيئة الحالية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>مصدر البيانات:</span>
            <Badge variant={environment.isDevelopment ? "secondary" : "default"}>
              {environment.dataSource}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>البيئة:</span>
            <Badge variant={environment.isDevelopment ? "outline" : "destructive"}>
              {environment.environment}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* تحذير البيانات الوهمية */}
      {environment.isDevelopment && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>وضع التطوير:</strong> يتم استخدام البيانات الوهمية حالياً. 
            التغييرات لن تُحفظ بشكل دائم وستختفي عند إعادة تحميل الصفحة.
          </AlertDescription>
        </Alert>
      )}

      {/* إحصائيات البيانات */}
      <Card>
        <CardHeader>
          <CardTitle>إحصائيات البيانات</CardTitle>
          <CardDescription>
            عدد السجلات في قاعدة البيانات الحالية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between">
              <span>الحيوانات:</span>
              <Badge variant="outline">{dataStats.animals}</Badge>
            </div>
            <div className="flex justify-between">
              <span>الحظائر:</span>
              <Badge variant="outline">{dataStats.barns}</Badge>
            </div>
            <div className="flex justify-between">
              <span>عناصر المخزن:</span>
              <Badge variant="outline">{dataStats.warehouseItems}</Badge>
            </div>
            <div className="flex justify-between">
              <span>سجلات التغذية:</span>
              <Badge variant="outline">{dataStats.feedingRecords}</Badge>
            </div>
            <div className="flex justify-between">
              <span>سجلات الأوزان:</span>
              <Badge variant="outline">{dataStats.weightRecords}</Badge>
            </div>
            <div className="flex justify-between">
              <span>المجموع:</span>
              <Badge variant="default">
                {Object.values(dataStats).reduce((sum, count) => sum + count, 0)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            أدوات إدارة البيانات
          </CardTitle>
          <CardDescription>
            عمليات المزامنة وإدارة البيانات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleSyncData}
              disabled={isLoading}
              variant="default"
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              مزامنة البيانات
            </Button>
            
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {environment.isDevelopment && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>ملاحظة للمطور:</strong>
              </p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• لتبديل إلى البيانات الحقيقية، غير VITE_USE_MOCK_DATA إلى false في ملف .env</li>
                <li>• تأكد من إعداد Firebase قبل التبديل للوضع الحقيقي</li>
                <li>• البيانات الوهمية تساعد في التطوير والاختبار بأمان</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* حالة الاتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            حالة الاتصال
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="text-sm">
              متصل - {environment.dataSource}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSourceControl;
