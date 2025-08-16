import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Activity, AlertTriangle, BarChart3, PieChart, LineChart, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Area,
  AreaChart
} from "recharts";
import { toast } from "@/hooks/use-toast";
import {
  getAnalyticsDashboardData,
  getMortalityAnalytics,
  getGrowthAnalytics,
  generateGrowthCurve,
  GROWTH_BENCHMARKS,
  type AnalyticsDashboardData,
  type GrowthCurveData,
  type MortalityAnalytics,
  type GrowthAnalytics
} from "@/lib/advanced-analytics";
import { dataService } from "@/lib/data-service";
import { formatArabicDate } from "@/lib/arabic-utils";

// Chart colors
const CHART_COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  success: '#22c55e'
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#06b6d4', '#8b5cf6'];

export default function AdvancedAnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [selectedAnimalGrowth, setSelectedAnimalGrowth] = useState<GrowthCurveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getAnalyticsDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات التحليلات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnimalGrowth = async (animalId: string) => {
    try {
      const animal = await dataService.animals.getById(animalId);
      if (animal) {
        const growthData = await generateGrowthCurve(animal);
        setSelectedAnimalGrowth(growthData);
      }
    } catch (error) {
      console.error('Error loading animal growth data:', error);
      toast({
        title: "خطأ في تحميل بيانات النمو",
        description: "حدث خطأ أثناء تحميل بيانات نمو الحيوان",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">لا توجد بيانات متاحة للتحليل</p>
        <Button onClick={loadDashboardData} className="mt-4">
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const { mortalityAnalytics, growthAnalytics, healthMetrics } = dashboardData;

  // Prepare chart data
  const mortalityByMonthData = mortalityAnalytics.deathsByMonth.map(item => ({
    month: item.month.split(' ')[1], // Get month name only
    deaths: item.count,
    rate: item.rate
  }));

  const growthTrendsData = growthAnalytics.growthTrends.map(item => ({
    month: item.month.split(' ')[1],
    adg: item.averageADG,
    benchmark: GROWTH_BENCHMARKS.male.expectedADG, // Use male benchmark as reference
    count: item.count
  }));

  const mortalityCauseData = Object.entries(mortalityAnalytics.deathsByCause).map(([cause, count]) => ({
    name: getCauseLabel(cause),
    value: count,
    percentage: ((count / mortalityAnalytics.totalDeaths) * 100).toFixed(1)
  }));

  const weightDistributionData = growthAnalytics.weightDistribution.map(item => ({
    range: item.range,
    count: item.count,
    percentage: item.percentage
  }));

  function getCauseLabel(cause: string): string {
    const labels: Record<string, string> = {
      illness: 'مرض',
      accident: 'حادث',
      birth_complications: 'مضاعفات ولادة',
      old_age: 'كبر السن',
      unknown: 'غير معروف',
      other: 'أخرى'
    };
    return labels[cause] || cause;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">التحليلات المتقدمة</h1>
          <p className="text-muted-foreground">
            تحليل النمو والوفيات ومؤشرات الأداء
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          تحديث البيانات
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النمو اليومي</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {growthAnalytics.averageADG}
            </div>
            <p className="text-xs text-muted-foreground">
              جرام/يوم • {growthAnalytics.totalAnimalsTracked} حيوان
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الوفيات</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {mortalityAnalytics.mortalityRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {mortalityAnalytics.totalDeaths} حالة وفاة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الخسائر المالية</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mortalityAnalytics.totalFinancialLoss.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              {mortalityAnalytics.preventableDeaths} حالة قابلة للمنع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحيوانات السليمة</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {healthMetrics.healthyCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {healthMetrics.sickCount} مريض • {healthMetrics.isolatedCount} معزول
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="growth">تحليل النمو</TabsTrigger>
          <TabsTrigger value="mortality">تحليل الوفيات</TabsTrigger>
          <TabsTrigger value="performance">الأداء الفردي</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Growth Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاهات النمو الشهرية</CardTitle>
                <CardDescription>معدل النمو اليومي مقارنة بالمعيار</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={growthTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} جرام/يوم`, 
                        name === 'adg' ? 'معدل النمو الفعلي' : 'المعيار'
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="adg" 
                      stroke={CHART_COLORS.primary} 
                      strokeWidth={2}
                      name="معدل النمو الفعلي"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke={CHART_COLORS.warning} 
                      strokeDasharray="5 5"
                      name="المعيار المطلوب"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Mortality Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>اتجاهات الوفيات الشهرية</CardTitle>
                <CardDescription>عدد الوفيات ومعدلها الشهري</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={mortalityByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'deaths' ? `${value} حالة` : `${value}%`,
                        name === 'deaths' ? 'عدد الوفيات' : 'معدل الوفيات'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="deaths" fill={CHART_COLORS.danger} name="عدد الوفيات" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Weight Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع الأوزان</CardTitle>
                <CardDescription>توزيع الحيوانات حسب فئات الوزن</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={weightDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} حيوان`, 'العدد']} />
                    <Bar dataKey="count" fill={CHART_COLORS.info} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>أفضل أداء في النمو</CardTitle>
                <CardDescription>الحيوانات ذات أعلى معدل نمو يومي</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {growthAnalytics.topPerformers.map((performer, index) => (
                    <div key={performer.animalId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{performer.earTagId}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {performer.adg} جرام/يوم
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadAnimalGrowth(performer.animalId)}
                        >
                          عرض منحنى النمو
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mortality" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Mortality Causes Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>أسباب الوفيات</CardTitle>
                <CardDescription>توزيع أسباب الوفيات</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={mortalityCauseData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {mortalityCauseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Factors */}
            <Card>
              <CardHeader>
                <CardTitle>عوامل الخطر</CardTitle>
                <CardDescription>العوامل الأكثر تأثيراً في الوفيات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mortalityAnalytics.riskFactors.map((factor, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{factor.factor}</span>
                        <span className="text-muted-foreground">
                          {factor.impact.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={factor.impact} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {factor.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mortality Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الوفيات التفصيلية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {mortalityAnalytics.totalDeaths}
                  </div>
                  <div className="text-sm text-red-600">إجمالي الوفيات</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {mortalityAnalytics.preventableDeaths}
                  </div>
                  <div className="text-sm text-orange-600">وفيات قابلة للمنع</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {mortalityAnalytics.averageAgeAtDeath.toFixed(1)}
                  </div>
                  <div className="text-sm text-blue-600">متوسط العمر عند الوفاة (شهر)</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {mortalityAnalytics.totalFinancialLoss.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-600">الخسائر المالية (ج.م)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Individual Animal Growth Chart */}
          {selectedAnimalGrowth && (
            <Card>
              <CardHeader>
                <CardTitle>منحنى النمو - {selectedAnimalGrowth.earTagId}</CardTitle>
                <CardDescription>
                  تطور الوزن ومعدل النمو اليومي • 
                  كفاءة النمو: {selectedAnimalGrowth.growthEfficiency.toFixed(1)}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsLineChart data={selectedAnimalGrowth.dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="ageInDays" 
                      formatter={(value) => `${Math.floor(value/30)}م`}
                    />
                    <YAxis yAxisId="weight" orientation="left" />
                    <YAxis yAxisId="adg" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'weight' ? `${value} كيلو` : `${value} جرام/يوم`,
                        name === 'weight' ? 'الوزن' : 'معدل النمو اليومي'
                      ]}
                      labelFormatter={(value) => `العمر: ${Math.floor(Number(value)/30)} شهر`}
                    />
                    <Legend />
                    <Line 
                      yAxisId="weight"
                      type="monotone" 
                      dataKey="weight" 
                      stroke={CHART_COLORS.primary} 
                      strokeWidth={2}
                      name="الوزن (كيلو)"
                    />
                    <Line 
                      yAxisId="adg"
                      type="monotone" 
                      dataKey="adg" 
                      stroke={CHART_COLORS.secondary} 
                      strokeWidth={2}
                      name="معدل النمو اليومي (جرام)"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Poor Performers */}
          <Card>
            <CardHeader>
              <CardTitle>الحيوانات التي تحتاج متابعة</CardTitle>
              <CardDescription>الحيوانات ذات أقل معدل نمو يومي</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الأذن</TableHead>
                    <TableHead>معدل النمو اليومي</TableHead>
                    <TableHead>مقارنة بالمعيار</TableHead>
                    <TableHead>الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {growthAnalytics.poorPerformers.map((performer) => {
                    const benchmark = GROWTH_BENCHMARKS.male.expectedADG;
                    const efficiency = (performer.adg / benchmark) * 100;
                    
                    return (
                      <TableRow key={performer.animalId}>
                        <TableCell className="font-medium">
                          {performer.earTagId}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-red-600">
                            {performer.adg} جرام/يوم
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={efficiency < 60 ? "destructive" : "secondary"}>
                            {efficiency.toFixed(0)}% من المعيار
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadAnimalGrowth(performer.animalId)}
                          >
                            تحليل مفصل
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
