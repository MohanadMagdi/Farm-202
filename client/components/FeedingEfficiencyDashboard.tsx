import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target,
  DollarSign,
  Scale,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Download
} from "lucide-react";
import { dataService } from "@/lib/data-service";
import {
  calculateFeedingEfficiencyMetrics,
  compareBarnEfficiency,
  generateFeedingTrends,
  formatEfficiencyMetrics,
  type FeedingEfficiencyMetrics,
  type BarnFeedingComparison,
  type FeedingTrends
} from "@/lib/feeding-analytics";
import { exportFeedingReport } from "@/lib/export-utils";
import { toast } from "@/hooks/use-toast";
import type { FeedingRecord, Animal, Barn, WarehouseItem, WeightRecord } from "@shared/types";

interface FeedingEfficiencyDashboardProps {
  className?: string;
}

export default function FeedingEfficiencyDashboard({ className }: FeedingEfficiencyDashboardProps) {
  const [metrics, setMetrics] = useState<FeedingEfficiencyMetrics | null>(null);
  const [barnComparisons, setBarnComparisons] = useState<BarnFeedingComparison[]>([]);
  const [trends, setTrends] = useState<FeedingTrends[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');

  useEffect(() => {
    loadEfficiencyData();
  }, [selectedPeriod]);

  const loadEfficiencyData = async () => {
    try {
      setLoading(true);
      
      const [feedingRecords, animals, barns, warehouseItems, weightRecords] = await Promise.all([
        dataService.feedingRecords.getAll(),
        dataService.animals.getAll(),
        dataService.barns.getAll(),
        dataService.warehouseItems.getAll(),
        dataService.weightRecords.getAll()
      ]);

      // Filter data by selected period
      const days = parseInt(selectedPeriod);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const filteredRecords = feedingRecords.filter(record => record.date >= cutoffDate);
      const filteredWeights = weightRecords.filter(record => record.date >= cutoffDate);

      // Calculate comprehensive metrics
      const calculatedMetrics = calculateFeedingEfficiencyMetrics(
        filteredRecords,
        animals,
        filteredWeights,
        warehouseItems
      );

      // Compare barn efficiency
      const barnComparison = compareBarnEfficiency(
        filteredRecords,
        barns,
        animals,
        filteredWeights
      );

      // Generate trends
      const trendsData = generateFeedingTrends(
        filteredRecords,
        animals,
        filteredWeights,
        Math.min(days, 30)
      );

      setMetrics(calculatedMetrics);
      setBarnComparisons(barnComparison);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading efficiency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'average': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEfficiencyBadge = (rating: string) => {
    switch (rating) {
      case 'excellent': return { color: 'bg-green-100 text-green-800', text: 'ممتاز' };
      case 'good': return { color: 'bg-blue-100 text-blue-800', text: 'جيد' };
      case 'average': return { color: 'bg-yellow-100 text-yellow-800', text: 'متوسط' };
      case 'poor': return { color: 'bg-orange-100 text-orange-800', text: 'ضعيف' };
      case 'critical': return { color: 'bg-red-100 text-red-800', text: 'حرج' };
      default: return { color: 'bg-gray-100 text-gray-800', text: 'غير محدد' };
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      setLoading(true);

      // Get feeding records data
      const feedingRecords = await dataService.feedingRecords.getAll();

      // Filter by selected period
      const days = parseInt(selectedPeriod);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const filteredRecords = feedingRecords.filter(record => record.date >= cutoffDate);

      await exportFeedingReport(filteredRecords, format);

      toast({
        title: "تم تصدير التقرير بنجاح",
        description: `تم تصدير تقرير كفاءة التغذية بصيغة ${format === 'pdf' ? 'PDF' : 'Excel'}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحليل بيانات التغذية...</p>
        </div>
      </div>
    );
  }

  const formattedMetrics = formatEfficiencyMetrics(metrics);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-farm-800">لوحة كفاءة التغذية</h2>
          <p className="text-muted-foreground">تحليل شامل لكفاءة التغذية والأداء</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 أيام</SelectItem>
              <SelectItem value="30">30 يوم</SelectItem>
              <SelectItem value="90">90 يوم</SelectItem>
              <SelectItem value="365">سنة كاملة</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">معدل تحويل العلف</p>
                <div className="text-2xl font-bold">{formattedMetrics.feedingEfficiencyFormatted}</div>
                <Badge className={getEfficiencyBadge(metrics.efficiencyRating).color}>
                  {getEfficiencyBadge(metrics.efficiencyRating).text}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">العلف لكل حيوان</p>
                <div className="text-2xl font-bold">{formattedMetrics.feedPerAnimalFormatted}</div>
                <p className="text-xs text-muted-foreground">من {metrics.animalsCount} حيوان</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">متوسط النمو اليومي</p>
                <div className="text-2xl font-bold">{formattedMetrics.avgDailyGainFormatted}</div>
                <p className="text-xs text-muted-foreground">كيلو/يوم</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">التكلفة لكل كيلو نمو</p>
                <div className="text-2xl font-bold">{formattedMetrics.costPerKgGainFormatted}</div>
                <p className="text-xs text-muted-foreground">جنيه</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Optimization Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 ml-2" />
              درجة التحسين
            </CardTitle>
            <CardDescription>
              مؤشر شامل للأداء والكفاءة (0-100)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{metrics.optimizationScore.toFixed(0)}/100</span>
                <Badge variant={metrics.optimizationScore >= 70 ? "default" : "destructive"}>
                  {metrics.optimizationScore >= 70 ? "أداء جيد" : "يحتاج تحسين"}
                </Badge>
              </div>
              
              <Progress value={metrics.optimizationScore} className="h-3" />
              
              <div className="text-sm text-muted-foreground">
                مقارنة بالمعايير الصناعية: 
                <span className={`font-semibold ml-1 ${metrics.benchmarkComparison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.benchmarkComparison >= 0 ? '+' : ''}{metrics.benchmarkComparison.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 ml-2" />
              تحليل التكاليف
            </CardTitle>
            <CardDescription>
              التكاليف الحالية والوفورات المحتملة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي تكلفة العلف</p>
                <p className="text-2xl font-bold">{formattedMetrics.totalFeedCostFormatted}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">الوفورات المحتملة (شهرياً)</p>
                <p className="text-xl font-semibold text-green-600">
                  {formattedMetrics.potentialSavingsFormatted}
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  التكلفة لكل حيوان: {(metrics.feedCostPerAnimal).toFixed(1)} جنيه/يوم
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed analysis */}
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">توصيات التحسين</TabsTrigger>
          <TabsTrigger value="barn-comparison">مقارنة الحظائر</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 ml-2" />
                توصيات تحسين الكفاءة
              </CardTitle>
              <CardDescription>
                اقتراحات مبنية على تحليل البيانات لتحسين كفاءة التغذية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 space-x-reverse">
                    {metrics.efficiencyRating === 'excellent' ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    )}
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barn-comparison">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة كفاءة الحظائر</CardTitle>
              <CardDescription>
                أداء كل حظيرة مقارنة بالمتوسط العام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الترتيب</TableHead>
                    <TableHead className="text-right">اسم الحظيرة</TableHead>
                    <TableHead className="text-right">عدد الحيوانات</TableHead>
                    <TableHead className="text-right">العلف/حيوان</TableHead>
                    <TableHead className="text-right">الكفاءة</TableHead>
                    <TableHead className="text-right">مقارنة بالمتوسط</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barnComparisons.map((barn) => (
                    <TableRow key={barn.barnId}>
                      <TableCell>
                        <Badge variant={barn.ranking <= 3 ? "default" : "secondary"}>
                          #{barn.ranking}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{barn.barnName}</TableCell>
                      <TableCell>{barn.animalsCount}</TableCell>
                      <TableCell>{barn.feedPerAnimal.toFixed(1)} كيلو</TableCell>
                      <TableCell>{barn.efficiency.toFixed(1)}</TableCell>
                      <TableCell>
                        <span className={barn.efficiencyVsAverage > 0 ? 'text-green-600' : 'text-red-600'}>
                          {barn.efficiencyVsAverage > 0 ? '+' : ''}{barn.efficiencyVsAverage.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>اتجاهات الأداء</CardTitle>
              <CardDescription>
                تطور مؤشرات الكفاءة خلال الفترة المحددة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  سيتم إضافة الرسوم البيانية للاتجاهات قريباً
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  البيانات متوفرة: {trends.length} نقطة بيانات
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
