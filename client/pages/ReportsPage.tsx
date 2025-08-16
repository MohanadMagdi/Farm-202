import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  formatEGP,
  formatWeight,
  formatArabicNumber,
  formatArabicDate,
} from "@/lib/arabic-utils";
import AdvancedAnalyticsDashboard from "@/components/AdvancedAnalyticsDashboard";
import {
  db,
  Animal,
  InventoryItem,
  StockMovement,
  FeedingRecord,
} from "@/lib/firebase-mock";
import { toast } from "@/hooks/use-toast";
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  CircleDot,
  Package,
  Utensils,
  DollarSign,
  Scale,
  Eye,
  Filter,
} from "lucide-react";

interface ReportData {
  animals: Animal[];
  inventoryItems: InventoryItem[];
  stockMovements: StockMovement[];
  feedingRecords: FeedingRecord[];
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    animals: [],
    inventoryItems: [],
    stockMovements: [],
    feedingRecords: [],
  });
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState("month");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const exportPDF = () => {
    toast({
      title: "تصدير PDF",
      description: "سيتم تنفيذ التصدير قريباً",
    });
  };

  const exportExcel = () => {
    toast({
      title: "تصدير Excel",
      description: "سيتم تن��يذ التصدير قريباً",
    });
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      const [
        animalsSnapshot,
        inventorySnapshot,
        movementsSnapshot,
        feedingSnapshot,
      ] = await Promise.all([
        db.collection("animals").get(),
        db.collection("inventory").get(),
        db.collection("stockMovements").get(),
        db.collection("feedingRecords").get(),
      ]);

      setReportData({
        animals: animalsSnapshot.docs.map((doc) => doc.data() as Animal),
        inventoryItems: inventorySnapshot.docs.map(
          (doc) => doc.data() as InventoryItem,
        ),
        stockMovements: movementsSnapshot.docs.map(
          (doc) => doc.data() as StockMovement,
        ),
        feedingRecords: feedingSnapshot.docs.map(
          (doc) => doc.data() as FeedingRecord,
        ),
      });
    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setLoading(false);
    }
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

  // Calculate key metrics
  const { animals, inventoryItems, stockMovements, feedingRecords } =
    reportData;

  const activeAnimals = animals.filter((a) => a); // All animals are considered active
  const totalAnimalsValue = activeAnimals.reduce(
    (sum, animal) => sum + (animal.currentPrice || animal.purchasePrice || 0),
    0,
  );
  const totalInventoryValue = inventoryItems.reduce((sum, item) => {
    const currentStock = db.getCurrentStock(item.id);
    return sum + currentStock * item.pricePerUnitEGP;
  }, 0);

  // Monthly growth calculation
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const recentAnimals = animals.filter(
    (a) => a && a.createdAt && a.createdAt > lastMonth,
  );
  const monthlyGrowthRate =
    activeAnimals.length > 0
      ? (recentAnimals.length / activeAnimals.length) * 100
      : 0;

  // Feeding costs this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const monthlyFeedingRecords = feedingRecords.filter(
    (r) => r && r.date && r.date > thisMonth,
  );
  const monthlyFeedingCost = monthlyFeedingRecords.reduce((sum, record) => {
    const item = inventoryItems.find((i) => i.id === record.feedType);
    return sum + (record.quantityIssued || 0) * (item?.unitPrice || 0);
  }, 0);

  // Weight gain analysis
  const averageWeightGain =
    activeAnimals.length > 0
      ? activeAnimals.reduce(
          (sum, animal) => sum + animal.metrics.totalGainKg,
          0,
        ) / activeAnimals.length
      : 0;

  // Stock movements analysis
  const stockOutMovements = stockMovements.filter((m) => m && m.type === "out");
  const stockInMovements = stockMovements.filter((m) => m && m.type === "in");

  // Animals performance data (simplified since complex metrics aren't available)
  const animalPerformanceData = activeAnimals.map((animal) => ({
    ...animal,
    profitability: animal.weight * 50 - animal.purchasePrice, // Estimated at 50 EGP/kg
    feedEfficiency: 0, // Would need feeding records to calculate
  }));

  const topPerformers = animalPerformanceData
    .sort((a, b) => b.weight - a.weight) // Sort by weight as proxy for performance
    .slice(0, 5);

  // Inventory turnover
  const inventoryTurnover = inventoryItems.map((item) => {
    const outMovements = stockOutMovements.filter(
      (m) => m.itemId === item.id,
    );
    const totalOut = outMovements.reduce((sum, m) => sum + m.quantity, 0);
    const currentStock = item.currentStock || 0;
    const turnoverRate = currentStock > 0 ? totalOut / currentStock : 0;

    return {
      ...item,
      currentStock,
      totalOut,
      turnoverRate,
      value: currentStock * (item.unitPrice || 0),
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">
            التقارير والتحليلات
          </h1>
          <p className="text-muted-foreground">
            تقارير شاملة عن أداء المزرعة والإحصائيات
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">أسبوعي</SelectItem>
              <SelectItem value="month">شهري</SelectItem>
              <SelectItem value="quarter">ربع سنوي</SelectItem>
              <SelectItem value="year">سنوي</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <FileText className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              قيمة المزرعة الإجمالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatEGP(totalAnimalsValue + totalInventoryValue)}
            </div>
            <div className="flex items-center space-x-1 space-x-reverse text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+{monthlyGrowthRate.toFixed(1)}% هذا الشهر</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              تكلفة التغذية الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatEGP(monthlyFeedingCost)}
            </div>
            <p className="text-xs text-muted-foreground">للشهر الحالي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              متوسط زيادة الوزن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatWeight(averageWeightGain)}
            </div>
            <p className="text-xs text-muted-foreground">للحيوان الواحد</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              معدل النمو الشهري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {monthlyGrowthRate.toFixed(1)}%
            </div>
            <div className="flex items-center space-x-1 space-x-reverse text-xs text-muted-foreground">
              <CircleDot className="h-3 w-3 text-green-500" />
              <span>{formatArabicNumber(recentAnimals.length)} حيوان جديد</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="animals" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-5" dir="rtl">
          <TabsTrigger value="animals">تقرير الحيوانات</TabsTrigger>
          <TabsTrigger value="inventory">تقرير المخزون</TabsTrigger>
          <TabsTrigger value="feeding">تقرير التغذية</TabsTrigger>
          <TabsTrigger value="financial">التقرير المالي</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات المتقدمة</TabsTrigger>
        </TabsList>

        <TabsContent value="animals" className="space-y-4" dir="rtl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Animals Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <CircleDot className="h-5 w-5 text-farm-600" />
                  <span>إحصائيات الحيوانات</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>إ��مالي الحيوانات النشطة</span>
                  <span className="font-semibold">
                    {formatArabicNumber(activeAnimals.length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>الذكور</span>
                  <span className="font-semibold">
                    {formatArabicNumber(
                      activeAnimals.filter((a) => a && a.category === "male").length,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>الإناث</span>
                  <span className="font-semibold">
                    {formatArabicNumber(
                      activeAnimals.filter((a) => a && a.category === "female").length,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>الصغار</span>
                  <span className="font-semibold">
                    {formatArabicNumber(
                      activeAnimals.filter((a) => a && a.category === "newborn").length,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>متوسط الوزن</span>
                  <span className="font-semibold">
                    {formatWeight(
                      activeAnimals.reduce(
                        (sum, a) => sum + a.currentWeightKg,
                        0,
                      ) / Math.max(1, activeAnimals.length),
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>متوسط معدل ��لنمو اليومي</span>
                  <span className="font-semibold">
                    {(
                      activeAnimals.reduce((sum, a) => sum + a.metrics.adg, 0) /
                      Math.max(1, activeAnimals.length)
                    ).toFixed(2)}{" "}
                    كيلو/يوم
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="h-5 w-5 text-farm-600" />
                  <span>أفضل الحيوانات أداء��</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((animal, index) => (
                    <div
                      key={animal.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{animal.tagId}</div>
                          <div className="text-sm text-muted-foreground">
                            معدل النمو: {animal.metrics.adg.toFixed(2)} كيلو/يوم
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">
                          {formatWeight(animal.currentWeightKg)}
                        </div>
                        <div className="text-sm text-green-600">
                          +{formatWeight(animal.metrics.totalGainKg)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Animals Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل أداء الحيوانات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الأذن</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">العمر (��يام)</TableHead>
                      <TableHead className="text-right">الوزن الحالي</TableHead>
                      <TableHead className="text-right">إجمالي النمو</TableHead>
                      <TableHead className="text-right">
                        معدل النمو اليومي
                      </TableHead>
                      <TableHead className="text-right">
                        كفاءة التغذية
                      </TableHead>
                      <TableHead className="text-right">
                        الربحية المتوقعة
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {animalPerformanceData.slice(0, 10).map((animal) => {
                      const ageInDays = Math.floor(
                        (new Date().getTime() - animal.birthDate.getTime()) /
                          (1000 * 60 * 60 * 24),
                      );

                      return (
                        <TableRow key={animal.id}>
                          <TableCell className="font-medium text-right">
                            {animal.tagId}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">
                              {animal.type === "male"
                                ? "ذكر"
                                : animal.type === "female"
                                  ? "أنثى"
                                  : "صغير"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatArabicNumber(ageInDays)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatWeight(animal.currentWeightKg)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatWeight(animal.metrics.totalGainKg)}
                          </TableCell>
                          <TableCell className="text-right">
                            {animal.metrics.adg.toFixed(2)} كيلو/يوم
                          </TableCell>
                          <TableCell className="text-right">
                            {animal.feedEfficiency.toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={
                              animal.profitability > 0
                                ? "text-green-600 text-right"
                                : "text-red-600 text-right"
                            }
                          >
                            {formatEGP(animal.profitability)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4" dir="rtl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Package className="h-5 w-5 text-farm-600" />
                <span>تحليل المخزو��</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">��سم الصنف</TableHead>
                      <TableHead className="text-right">
                        المخزون الحالي
                      </TableHead>
                      <TableHead className="text-right">
                        إجمالي الاستهلاك
                      </TableHead>
                      <TableHead className="text-right">معدل الدوران</TableHead>
                      <TableHead className="text-right">
                        القيمة الحالية
                      </TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryTurnover.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-right">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatArabicNumber(item.currentStock)} {item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatArabicNumber(item.totalOut)} {item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.turnoverRate.toFixed(2)}x
                        </TableCell>
                        <TableCell className="text-right">
                          {formatEGP(item.value)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={
                              item.currentStock <= item.minLevel
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {item.currentStock <= item.minLevel
                              ? "منخفض"
                              : "طبيعي"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feeding" className="space-y-4" dir="rtl">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Utensils className="h-5 w-5 text-farm-600" />
                  <span>إحصائيات التغذية</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>إجمالي الوجبات المسجلة</span>
                  <span className="font-semibold">
                    {formatArabicNumber(feedingRecords.length)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>إجمالي العلف المستهلك</span>
                  <span className="font-semibold">
                    {formatWeight(
                      feedingRecords.reduce((sum, r) => sum + r.qtyKg, 0),
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>متوسط الاستهلاك اليومي</span>
                  <span className="font-semibold">
                    {formatWeight(
                      feedingRecords.reduce((sum, r) => sum + r.qtyKg, 0) / 30,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>تكلفة التغذية الشهرية</span>
                  <span className="font-semibold">
                    {formatEGP(monthlyFeedingCost)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>كفاءة ��لتحوي�� الغذائي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAnimals.slice(0, 5).map((animal) => (
                    <div
                      key={animal.id}
                      className="flex items-center justify-between"
                    >
                      <span className="font-medium">{animal.tagId}</span>
                      <div className="text-left">
                        <div className="text-sm font-semibold">
                          {animal.metrics.feedConsumedKg > 0
                            ? (
                                animal.metrics.totalGainKg /
                                animal.metrics.feedConsumedKg
                              ).toFixed(2)
                            : "0.00"}{" "}
                          كيلو نمو/كيلو ��لف
                        </div>
                        <div className="text-xs text-muted-foreground">
                          إجمالي العل��:{" "}
                          {formatWeight(animal.metrics.feedConsumedKg)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4" dir="rtl">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <DollarSign className="h-5 w-5 text-farm-600" />
                  <span>الملخص المالي</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>قيمة الحيوانات</span>
                  <span className="font-semibold">
                    {formatEGP(totalAnimalsValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>قيمة المخزون</span>
                  <span className="font-semibold">
                    {formatEGP(totalInventoryValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>تكلفة التغذية الشهرية</span>
                  <span className="font-semibold text-red-600">
                    -{formatEGP(monthlyFeedingCost)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>صافي قيمة المزرعة</span>
                  <span className="text-green-600">
                    {formatEGP(
                      totalAnimalsValue +
                        totalInventoryValue -
                        monthlyFeedingCost,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>العائد على الاستثمار المتوقع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {(
                        ((totalAnimalsValue * 1.2 - totalAnimalsValue) /
                          totalAnimalsValue) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <p className="text-sm text-muted-foreground">
                      العائد السنوي المتوقع
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>الاستثمار الحالي:</span>
                      <span>{formatEGP(totalAnimalsValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>القيمة المتوقعة:</span>
                      <span>{formatEGP(totalAnimalsValue * 1.2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الربح المتوقع:</span>
                      <span className="text-green-600">
                        {formatEGP(totalAnimalsValue * 0.2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4" dir="rtl">
          <AdvancedAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
