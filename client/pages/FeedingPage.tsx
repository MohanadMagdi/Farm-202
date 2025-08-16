import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { formatArabicDate } from "@/lib/arabic-utils";
import { dataService, farmHelpers } from "@/lib/data-service";
import type { 
  FeedingRecord, 
  FeedingSchedule, 
  Barn, 
  WarehouseItem, 
  Animal,
  FeedingAnalytics 
} from "@shared/types";
import FeedingFormModal from "@/components/forms/FeedingFormModal";
import FeedingEfficiencyDashboard from "@/components/FeedingEfficiencyDashboard";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Clock,
  Utensils,
  Calendar,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Download,
  Edit,
  Trash2,
  Eye,
  Calculator,
  TrendingUp,
  Target,
  Activity,
} from "lucide-react";

export default function FeedingPage() {
  const [feedingSchedules, setFeedingSchedules] = useState<FeedingSchedule[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalScheduledFeeding: 0,
    totalActualFeeding: 0,
    completionRate: 0,
    feedCost: 0,
    avgFeedPerAnimal: 0,
    avgFeedingEfficiency: 0,
    barnAnalytics: [] as any[],
    feedTypeUsage: [] as any[],
  });

  // Modal states
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [selectedFeedingRecord, setSelectedFeedingRecord] = useState<FeedingRecord | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [preselectedBarnId, setPreselectedBarnId] = useState<string>();

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [
        schedulesData,
        recordsData,
        warehouseData,
        barnsData,
        animalsData,
      ] = await Promise.all([
        dataService.feedingSchedules.getAll(),
        dataService.feedingRecords.getAll(),
        dataService.warehouseItems.getByType("chemicals"), // Feed items are in chemicals warehouse
        dataService.barns.getAll(),
        dataService.animals.getAll(),
      ]);

      setFeedingSchedules(schedulesData);
      setFeedingRecords(recordsData);
      setWarehouseItems(warehouseData.filter(item => item.category.includes("علف") || item.category.includes("أعلاف")));
      setBarns(barnsData);
      setAnimals(animalsData);

      calculateAnalytics(recordsData, barnsData, animalsData, warehouseData);
    } catch (error) {
      console.error("Error loading feeding data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات التغذية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (
    records: FeedingRecord[],
    barnsData: Barn[],
    animalsData: Animal[],
    warehouseData: WarehouseItem[]
  ) => {
    const selectedDateObj = new Date(selectedDate);
    
    // Filter records for selected date
    const todayRecords = records.filter(record => 
      record.date.toDateString() === selectedDateObj.toDateString()
    );

    const totalActualFeeding = todayRecords.reduce((sum, record) => sum + record.quantityIssued, 0);
    const totalAnimalsCount = todayRecords.reduce((sum, record) => sum + record.animalsCount, 0);
    const feedCost = todayRecords.reduce((sum, record) => {
      const feedItem = warehouseData.find(item => item.name === record.feedType);
      return sum + (record.quantityIssued * (feedItem?.unitPrice || 0));
    }, 0);

    const avgFeedPerAnimal = totalAnimalsCount > 0 ? totalActualFeeding / totalAnimalsCount : 0;
    const avgFeedingEfficiency = todayRecords.length > 0 
      ? todayRecords.reduce((sum, record) => sum + (record.feedingEfficiency || 0), 0) / todayRecords.length 
      : 0;

    // Calculate barn-specific analytics
    const barnAnalytics = barnsData.map(barn => {
      const barnRecords = todayRecords.filter(record => record.barnId === barn.id);
      const barnAnimals = animalsData.filter(animal => animal.barnId === barn.id);
      const feedIssued = barnRecords.reduce((sum, record) => sum + record.quantityIssued, 0);
      const avgDailyGain = barnAnimals.length > 0 
        ? barnAnimals.reduce((sum, animal) => sum + farmHelpers.calculateADG(animal), 0) / barnAnimals.length 
        : 0;
      const efficiency = feedIssued > 0 && avgDailyGain > 0 
        ? farmHelpers.calculateFeedingEfficiency(feedIssued / barnAnimals.length, avgDailyGain) 
        : 0;

      return {
        barnId: barn.id,
        barnName: barn.name,
        feedIssued,
        animalsCount: barnAnimals.length,
        feedPerAnimal: barnAnimals.length > 0 ? feedIssued / barnAnimals.length : 0,
        efficiency,
        avgDailyGain,
      };
    });

    // Calculate feed type usage
    const feedTypeUsage = warehouseData.map(item => {
      const consumed = todayRecords
        .filter(record => record.feedType === item.name)
        .reduce((sum, record) => sum + record.quantityIssued, 0);
      const cost = consumed * item.unitPrice;
      
      return {
        feedType: item.name,
        consumed,
        cost,
        unit: item.unit,
        recordsCount: todayRecords.filter(record => record.feedType === item.name).length,
      };
    }).filter(item => item.consumed > 0);

    setAnalytics({
      totalScheduledFeeding: 0, // TODO: Calculate from schedules
      totalActualFeeding,
      completionRate: 0, // TODO: Calculate from schedules vs records
      feedCost,
      avgFeedPerAnimal,
      avgFeedingEfficiency,
      barnAnalytics,
      feedTypeUsage,
    });
  };

  const handleAddFeeding = (barnId?: string) => {
    setSelectedFeedingRecord(null);
    setModalMode("add");
    setPreselectedBarnId(barnId);
    setShowFeedingModal(true);
  };

  const handleEditFeeding = (record: FeedingRecord) => {
    setSelectedFeedingRecord(record);
    setModalMode("edit");
    setPreselectedBarnId(undefined);
    setShowFeedingModal(true);
  };

  const handleDeleteFeeding = async (record: FeedingRecord) => {
    if (window.confirm(`هل أنت متأكد من حذف تسجيل التغذية؟`)) {
      try {
        await dataService.feedingRecords.delete(record.id);
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف تسجيل التغذية بنجاح",
        });
        loadData();
      } catch (error) {
        console.error("Error deleting feeding record:", error);
        toast({
          title: "خطأ في الحذف",
          description: "حدث خطأ أثناء حذف تسجيل التغذية",
          variant: "destructive",
        });
      }
    }
  };

  const handleModalSave = () => {
    loadData();
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم حفظ بيانات التغذية بنجاح",
    });
  };

  const exportReport = () => {
    toast({
      title: "تصدير التقرير",
      description: "سيتم تنفيذ التصدير قريباً",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter data for selected date
  const selectedDateObj = new Date(selectedDate);
  const todayRecords = feedingRecords.filter(record => 
    record.date.toDateString() === selectedDateObj.toDateString()
  );

  const todaySchedules = feedingSchedules.filter(schedule => 
    schedule.isActive
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">إدارة التغذية</h1>
          <p className="text-muted-foreground">
            جداول التغذية وتسجيل الوجبات اليومية وحساب كفاءة التغذية
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 ml-2" />
            تصدير تقرير
          </Button>
          <Button onClick={() => handleAddFeeding()}>
            <Plus className="h-4 w-4 ml-2" />
            تسجيل تغذية
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Utensils className="h-4 w-4 ml-1" />
              إجمالي التغذية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {farmHelpers.formatWeight(analytics.totalActualFeeding)}
            </div>
            <p className="text-xs text-muted-foreground">
              لتاريخ {formatArabicDate(selectedDateObj)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calculator className="h-4 w-4 ml-1" />
              تكلفة التغذية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {farmHelpers.formatCurrency(analytics.feedCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              التكلفة اليومية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 ml-1" />
              متوسط العلف للحيوان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {farmHelpers.formatWeight(analytics.avgFeedPerAnimal)}
            </div>
            <p className="text-xs text-muted-foreground">
              كيلو/حيوان/يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 ml-1" />
              كفاءة التغذية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {analytics.avgFeedingEfficiency.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              معامل التحويل الغذائي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 ml-1" />
              الوجبات المسجلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {todayRecords.length}
            </div>
            <p className="text-xs text-muted-foreground">
              وجبة اليوم
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feeding Efficiency Analysis by Barn */}
      {analytics.barnAnalytics.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse text-blue-800">
              <Activity className="h-5 w-5" />
              <span>تحليل كفاءة التغذية حسب الحظيرة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analytics.barnAnalytics
                .filter(barn => barn.feedIssued > 0)
                .map((barn) => (
                <div key={barn.barnId} className="p-4 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{barn.barnName}</h4>
                    <Badge variant="outline">{barn.animalsCount} حيوان</Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>العلف المصروف:</span>
                      <span className="font-semibold">{farmHelpers.formatWeight(barn.feedIssued)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>العلف/حيوان:</span>
                      <span className="font-semibold">{farmHelpers.formatWeight(barn.feedPerAnimal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>متوسط النمو:</span>
                      <span className="font-semibold">{barn.avgDailyGain.toFixed(2)} كيلو/يوم</span>
                    </div>
                    <div className="flex justify-between">
                      <span>كفاءة التغذية:</span>
                      <span className={`font-semibold ${
                        barn.efficiency <= 3 ? 'text-green-600' :
                        barn.efficiency <= 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {barn.efficiency.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">تقييم الكفاءة:</span>
                      <Badge className={
                        barn.efficiency <= 3 ? 'bg-green-100 text-green-800' :
                        barn.efficiency <= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }>
                        {barn.efficiency <= 3 ? 'ممتاز' :
                         barn.efficiency <= 5 ? 'جيد' : 'يحتاج تحسين'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="records" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-3" dir="rtl">
          <TabsTrigger value="records">سجلات التغذية</TabsTrigger>
          <TabsTrigger value="schedules">جداول التغذية</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات والكفاءة</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4" dir="rtl">
          <Card>
            <CardHeader>
              <CardTitle>سجلات التغذية المنجزة</CardTitle>
              <CardDescription>
                الوجبات المسجلة لتاريخ {formatArabicDate(selectedDateObj)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الوقت</TableHead>
                      <TableHead className="text-right">الحظيرة</TableHead>
                      <TableHead className="text-right">نوع العلف</TableHead>
                      <TableHead className="text-right">الكمية المصروفة</TableHead>
                      <TableHead className="text-right">عدد الحيوانات</TableHead>
                      <TableHead className="text-right">العلف/حيوان</TableHead>
                      <TableHead className="text-right">كفاءة التغذية</TableHead>
                      <TableHead className="text-right">المسجل بواسطة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayRecords.map((record) => {
                      const barn = barns.find((b) => b.id === record.barnId);

                      return (
                        <TableRow key={record.id}>
                          <TableCell className="text-right">
                            {record.time}
                          </TableCell>
                          <TableCell className="text-right">
                            {barn?.name || record.barnId}
                          </TableCell>
                          <TableCell className="text-right">
                            {record.feedType}
                          </TableCell>
                          <TableCell className="text-right">
                            {farmHelpers.formatWeight(record.quantityIssued)}
                          </TableCell>
                          <TableCell className="text-right">
                            {record.animalsCount}
                          </TableCell>
                          <TableCell className="text-right">
                            {farmHelpers.formatWeight(record.feedPerAnimal)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={
                              (record.feedingEfficiency || 0) <= 3 ? 'bg-green-100 text-green-800' :
                              (record.feedingEfficiency || 0) <= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }>
                              {record.feedingEfficiency?.toFixed(1) || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {record.recordedBy}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditFeeding(record)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteFeeding(record)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {todayRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          لم يتم تسجيل أي وجبات لهذا التاريخ
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4" dir="rtl">
          <Card>
            <CardHeader>
              <CardTitle>جداول التغذية النشطة</CardTitle>
              <CardDescription>
                الجداول المعتمدة لتغذية الحيوانات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الحظيرة</TableHead>
                      <TableHead className="text-right">نوع العلف</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">عدد الوجبات</TableHead>
                      <TableHead className="text-right">المواعيد</TableHead>
                      <TableHead className="text-right">حالة النشاط</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaySchedules.map((schedule) => {
                      const barn = barns.find((b) => b.id === schedule.barnId);

                      return (
                        <TableRow key={schedule.id}>
                          <TableCell className="text-right">
                            {barn?.name || schedule.barnId}
                          </TableCell>
                          <TableCell className="text-right">
                            {schedule.feedType}
                          </TableCell>
                          <TableCell className="text-right">
                            {farmHelpers.formatWeight(schedule.quantity)}
                          </TableCell>
                          <TableCell className="text-right">
                            {schedule.timesPerDay}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap gap-1 justify-end">
                              {schedule.scheduledTime.split(',').map((time, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {time.trim()}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={
                              schedule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }>
                              {schedule.isActive ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddFeeding(schedule.barnId)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              >
                                <Utensils className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {todaySchedules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          لا توجد جداول ��غذية نشطة
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4" dir="rtl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Feed Type Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <BarChart3 className="h-5 w-5 text-farm-600" />
                  <span>ا��تهلاك العلف حسب النوع</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.feedTypeUsage.map((item) => (
                    <div key={item.feedType} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.feedType}</span>
                        <div className="text-left">
                          <div className="font-semibold">
                            {farmHelpers.formatWeight(item.consumed)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {farmHelpers.formatCurrency(item.cost)}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.recordsCount} وجبة</span>
                        <span>{(item.consumed / analytics.totalActualFeeding * 100).toFixed(1)}% من الإجمالي</span>
                      </div>
                      <Progress 
                        value={item.consumed / analytics.totalActualFeeding * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                  
                  {analytics.feedTypeUsage.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      لا توجد بيانات استهلاك لهذا التاريخ
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feeding Efficiency Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Target className="h-5 w-5 text-farm-600" />
                  <span>معايير كفاءة التغذية</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-800">ممتاز</span>
                      <Badge className="bg-green-100 text-green-800">أقل من 3</Badge>
                    </div>
                    <p className="text-sm text-green-700">
                      كفاءة عالية في تحويل العلف إلى نمو
                    </p>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-yellow-800">جيد</span>
                      <Badge className="bg-yellow-100 text-yellow-800">3 - 5</Badge>
                    </div>
                    <p className="text-sm text-yellow-700">
                      كفاءة مقبولة، ��مكن تحسينها
                    </p>
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-red-800">يحتاج تحسين</span>
                      <Badge className="bg-red-100 text-red-800">أكثر من 5</Badge>
                    </div>
                    <p className="text-sm text-red-700">
                      كفاءة منخفضة، مراجعة نوعية العلف والصحة
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">المعادلات المستخدمة:</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• العلف لكل حيوان = إجمالي العلف ÷ عدد الحيوانات</p>
                      <p>• كفاءة التغذية = العلف لكل حيوان ÷ معدل النمو اليومي</p>
                      <p>• معدل النمو اليومي = (الوزن الحالي - وزن الميلاد) ÷ العمر بالأيام</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Feeding Modal */}
      <FeedingFormModal
        isOpen={showFeedingModal}
        onClose={() => setShowFeedingModal(false)}
        onSave={handleModalSave}
        feedingRecord={selectedFeedingRecord}
        mode={modalMode}
        preselectedBarnId={preselectedBarnId}
      />
    </div>
  );
}
