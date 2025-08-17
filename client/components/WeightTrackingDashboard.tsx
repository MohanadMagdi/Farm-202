import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertTriangle,
  Calendar,
  Target,
  BarChart3,
  LineChart
} from 'lucide-react';
import { dataService } from '@/lib/data-service';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Animal } from '@shared/types';
import { 
  getAllAnimalsWithWeights,
  getWeightStatistics
} from '@/lib/weights-service';
import { type AnimalWeightReport } from '@/lib/weights';

interface WeightTrend {
  earTagId: string;
  category: string;
  barnId: string;
  currentWeight: number;
  previousWeight: number;
  trend: 'up' | 'down' | 'stable';
  adg: number;
  daysTracked: number;
}

interface BarnSummary {
  barnId: string;
  barnName: string;
  totalAnimals: number;
  trackedAnimals: number;
  averageWeight: number;
  averageADG: number;
  bestPerformer: string | null;
  poorPerformer: string | null;
}

export function WeightTrackingDashboard() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [reports, setReports] = useState<AnimalWeightReport[]>([]);
  const [weightTrends, setWeightTrends] = useState<WeightTrend[]>([]);
  const [barnSummaries, setBarnSummaries] = useState<BarnSummary[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statisticsData, reportsData, barnsData] = await Promise.all([
        getWeightStatistics(),
        getAllAnimalsWithWeights(),
        dataService.barns.getAll()
      ]);

      setStatistics(statisticsData);
      setReports(reportsData);

      // Process weight trends
      const trends = processWeightTrends(reportsData);
      setWeightTrends(trends);

      // Process barn summaries
      const summaries = processBarnSummaries(reportsData, barnsData);
      setBarnSummaries(summaries);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل بيانات لوحة المعلومات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const processWeightTrends = (reports: AnimalWeightReport[]): WeightTrend[] => {
    const daysBack = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return reports
      .filter(report => report.intervals.length > 0)
      .map(report => {
        const lastInterval = report.intervals[report.intervals.length - 1];
        const currentWeight = lastInterval.w2;
        const previousWeight = lastInterval.w1;
        const adg = report.overallADG || 0;

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (currentWeight > previousWeight) trend = 'up';
        else if (currentWeight < previousWeight) trend = 'down';

        return {
          earTagId: report.earTagId,
          category: report.category,
          barnId: report.barnId,
          currentWeight,
          previousWeight,
          trend,
          adg,
          daysTracked: report.intervals.reduce((sum, interval) => sum + interval.deltaD, 0)
        };
      })
      .sort((a, b) => b.adg - a.adg);
  };

  const processBarnSummaries = (reports: AnimalWeightReport[], barns: any[]): BarnSummary[] => {
    const barnGroups = reports.reduce((acc, report) => {
      const barnId = report.barnId;
      if (!acc[barnId]) {
        acc[barnId] = [];
      }
      acc[barnId].push(report);
      return acc;
    }, {} as Record<string, AnimalWeightReport[]>);

    return Object.entries(barnGroups).map(([barnId, barnReports]) => {
      const barn = barns.find(b => b.id === barnId);
      const totalAnimals = barn?.capacity || 0;
      const trackedAnimals = barnReports.length;

      const weights = barnReports.map(r => r.lastWeight || 0).filter(w => w > 0);
      const adgs = barnReports.map(r => r.overallADG || 0).filter(a => a > 0);

      const averageWeight = weights.length > 0 
        ? weights.reduce((sum, w) => sum + w, 0) / weights.length 
        : 0;

      const averageADG = adgs.length > 0 
        ? adgs.reduce((sum, a) => sum + a, 0) / adgs.length 
        : 0;

      const bestPerformer = barnReports.length > 0 
        ? barnReports.sort((a, b) => (b.overallADG || 0) - (a.overallADG || 0))[0]?.earTagId || null
        : null;

      const poorPerformer = barnReports.length > 0 
        ? barnReports.sort((a, b) => (a.overallADG || 0) - (b.overallADG || 0))[0]?.earTagId || null
        : null;

      return {
        barnId,
        barnName: barn?.name || `حظيرة ${barnId}`,
        totalAnimals,
        trackedAnimals,
        averageWeight,
        averageADG,
        bestPerformer,
        poorPerformer
      };
    });
  };

  const getPerformanceColor = (adg: number) => {
    if (adg >= 0.3) return 'text-green-600 bg-green-50';
    if (adg >= 0.1) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Scale className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري تحميل بيانات الأوزان...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">لوحة تتبع الأوزان</h2>
        </div>
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map(period => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period} يوم
            </Button>
          ))}
        </div>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الحيوانات</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalAnimals}</div>
              <Progress 
                value={(statistics.trackedAnimals / statistics.totalAnimals) * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {statistics.trackedAnimals} مُتتبع ({statistics.trackingPercentage.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط الزيادة الإجمالي</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.averageWeightGain.toFixed(1)} كجم
              </div>
              <p className="text-xs text-muted-foreground">
                منذ بداية التتبع
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط ADG العام</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics.averageADG.toFixed(3)} كجم/يوم
              </div>
              <p className="text-xs text-muted-foreground">
                الزيادة اليومية المتوسطة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">فترة التتبع</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {selectedPeriod} يوم
              </div>
              <p className="text-xs text-muted-foreground">
                الفترة الحالية المعروضة
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trends">اتجاهات الأوزان</TabsTrigger>
          <TabsTrigger value="barns">ملخص الحظائر</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          {/* Performance Alerts */}
          {weightTrends.some(t => t.adg < 0.05) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                يوجد {weightTrends.filter(t => t.adg < 0.05).length} حيوان يحتاج إلى انتباه بسبب ضعف الأداء في زيادة الوزن.
              </AlertDescription>
            </Alert>
          )}

          {/* Weight Trends Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                اتجاهات الأوزان - آخر {selectedPeriod} يوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weightTrends.map(trend => (
                  <Card key={trend.earTagId} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{trend.earTagId}</span>
                          {getTrendIcon(trend.trend)}
                        </div>
                        <Badge variant="outline">{trend.category}</Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الوزن الحالي:</span>
                          <span className="font-medium">{trend.currentWeight.toFixed(1)} كجم</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ADG:</span>
                          <span className={cn(
                            "font-medium px-2 py-1 rounded text-xs",
                            getPerformanceColor(trend.adg)
                          )}>
                            {trend.adg.toFixed(3)} كجم/يوم
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">أيام التتبع:</span>
                          <span className="font-medium">{trend.daysTracked} يوم</span>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">التغيير:</span>
                            <span className={cn(
                              "font-bold",
                              trend.currentWeight > trend.previousWeight ? "text-green-600" : 
                              trend.currentWeight < trend.previousWeight ? "text-red-600" : "text-gray-600"
                            )}>
                              {trend.currentWeight > trend.previousWeight ? '+' : ''}
                              {(trend.currentWeight - trend.previousWeight).toFixed(1)} كجم
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {weightTrends.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد بيانات أوزان للفترة المحددة</p>
                  <p className="text-sm">ابدأ بإضافة قياسات الوزن للحيوانات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                ملخص أداء الحظائر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {barnSummaries.map(summary => (
                  <Card key={summary.barnId} className="border">
                    <CardHeader>
                      <CardTitle className="text-lg">{summary.barnName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {summary.trackedAnimals}
                          </div>
                          <p className="text-xs text-muted-foreground">مُتتبع</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">
                            {summary.totalAnimals}
                          </div>
                          <p className="text-xs text-muted-foreground">الإجمالي</p>
                        </div>
                      </div>
                      
                      <Progress 
                        value={(summary.trackedAnimals / summary.totalAnimals) * 100} 
                        className="h-2"
                      />
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">متوسط الوزن:</span>
                          <span className="font-medium">
                            {summary.averageWeight.toFixed(1)} كجم
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">متوسط ADG:</span>
                          <span className={cn(
                            "font-medium px-2 py-1 rounded text-xs",
                            getPerformanceColor(summary.averageADG)
                          )}>
                            {summary.averageADG.toFixed(3)} كجم/يوم
                          </span>
                        </div>
                      </div>
                      
                      {summary.bestPerformer && (
                        <div className="pt-2 border-t space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">أفضل أداء:</span>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              {summary.bestPerformer}
                            </Badge>
                          </div>
                          {summary.poorPerformer && summary.poorPerformer !== summary.bestPerformer && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">يحتاج انتباه:</span>
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                {summary.poorPerformer}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {barnSummaries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد بيانات للحظائر</p>
                  <p className="text-sm">ابدأ بتسجيل الحيوانات في الحظائر</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
