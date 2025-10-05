import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatEGP,
  formatWeight,
  formatArabicNumber,
  animalTypes,
} from "@/lib/arabic-utils";
import { dataService } from "@/lib/data-service";
import { CanvasExportButton } from "@/components/buttons/CanvasExportButton";
import { useAuth } from "@/lib/auth-context";
import { WeightTrackingDashboard } from "@/components/WeightTrackingDashboard";
import FeedingEfficiencyDashboard from "@/components/FeedingEfficiencyDashboard";
import { BarnAnimalsList } from "@/components/BarnAnimalsList";
import { EnhancedWeightTrackingTable } from "@/components/EnhancedWeightTrackingTable";
import type { Animal, Barn, WarehouseItem, StockMovement, FeedingRecord } from "@/../../shared/types";
import {
  CircleDot,
  TrendingUp,
  TrendingDown,
  Building2,
  Package,
  AlertTriangle,
  Baby,
  Users,
  Heart,
  Scale,
  DollarSign,
  Calendar,
  Home,
  Utensils,
  FileText,
  UserCheck,
  Database,
  Plus,
  Eye,
  BarChart3,
  Settings,
} from "lucide-react";

export default function Index() {
  const { hasPermission } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // App navigation items
  const appItems = [
    {
      name: "لوحة التحكم",
      href: "/",
      icon: Home,
      permission: "dashboard",
      color: "bg-blue-500",
      description: "نظرة عامة على المزرعة"
    },
    {
      name: "الحيوانات",
      href: "/animals",
      icon: CircleDot,
      permission: "animals",
      color: "bg-green-500",
      description: "إدارة الحيوانات"
    },
    {
      name: "الحظائر",
      href: "/barns",
      icon: Building2,
      permission: "barns",
      color: "bg-orange-500",
      description: "إدارة الحظائر"
    },
    {
      name: "التغذية",
      href: "/feeding",
      icon: Utensils,
      permission: "feeding",
      color: "bg-yellow-500",
      description: "إدارة التغذية"
    },
    {
      name: "المخزون",
      href: "/inventory",
      icon: Package,
      permission: "inventory",
      color: "bg-purple-500",
      description: "إدارة المخزون"
    },
    {
      name: "تقارير الأوزان",
      href: "/reports/weights",
      icon: Scale,
      permission: "reports",
      color: "bg-indigo-500",
      description: "تقارير الأوزان"
    },
    {
      name: "التقارير",
      href: "/reports",
      icon: FileText,
      permission: "reports",
      color: "bg-pink-500",
      description: "التقارير العامة"
    },
    {
      name: "المستخدمين",
      href: "/users",
      icon: UserCheck,
      permission: "users",
      color: "bg-red-500",
      description: "إدارة المستخدمين"
    },
  ];

  // Filter items based on permissions
  const filteredAppItems = appItems.filter(
    (item) => hasPermission("all") || hasPermission(item.permission)
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [animalsData, barnsData, warehouseData, stockData, feedingData] =
        await Promise.all([
          dataService.animals.getAll(),
          dataService.barns.getAll(),
          dataService.warehouseItems.getAll(),
          dataService.stockMovements.getAll(),
          dataService.feedingRecords.getAll(),
        ]);

      setAnimals(animalsData);
      setBarns(barnsData);
      setWarehouseItems(warehouseData);
      setStockMovements(stockData);
      setFeedingRecords(feedingData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
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

  // Calculate real data from actual service - no need to filter by status as all animals should be active by default
  const activeAnimals = animals;
  const totalAnimals = activeAnimals.length;
  const males = activeAnimals.filter((a) => a.category === "male").length;
  const females = activeAnimals.filter((a) => a.category === "female").length;
  const newborns = activeAnimals.filter((a) => a.category === "newborn").length;

  const totalValue = activeAnimals.reduce(
    (sum, animal) => sum + (animal.purchasePrice || 0),
    0,
  );
  
  // Calculate average weight from weight history
  const averageWeight =
    totalAnimals > 0
      ? activeAnimals.reduce((sum, animal) => {
          const latestWeight = animal.weightHistory && animal.weightHistory.length > 0 
            ? animal.weightHistory[animal.weightHistory.length - 1].weightKg 
            : animal.weight || 0;
          return sum + latestWeight;
        }, 0) / totalAnimals
      : 0;

  const totalCapacity = barns.reduce((sum, barn) => sum + barn.capacity, 0);
  const currentOccupancy = totalAnimals;

  // Generate alerts based on real data
  const lowStockItems = warehouseItems.filter((item) => 
    item.currentStock <= item.minStockLevel
  );

  // Calculate recent activity from actual data
  const recentStockMovements = stockMovements
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const recentFeedingRecords = feedingRecords
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2);

  // Calculate monthly growth based on recent animals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthStart = new Date(currentYear, currentMonth, 1);
  
  const animalsThisMonth = activeAnimals.filter(animal => 
    animal.createdAt && new Date(animal.createdAt) >= monthStart
  ).length;
  
  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthEnd = new Date(currentYear, currentMonth, 0);
  const animalsLastMonth = activeAnimals.filter(animal => {
    if (!animal.createdAt) return false;
    const createdDate = new Date(animal.createdAt);
    return createdDate >= lastMonthStart && createdDate <= lastMonthEnd;
  }).length;
  
  const monthlyGrowth = animalsLastMonth > 0 
    ? ((animalsThisMonth - animalsLastMonth) / animalsLastMonth) * 100 
    : 0;

  const alerts = [
    ...lowStockItems.map((item) => ({
      id: `stock_${item.id}`,
      type: "warning" as const,
      title: "مخزون منخفض",
      description: `مخزون ${item.name} أقل من المستوى المطلوب (${item.currentStock} ${item.unit})`,
      priority: "high" as const,
    })),
    ...(newborns > 0
      ? [
          {
            id: "newborns",
            type: "success" as const,
            title: "مواليد جديدة",
            description: `${newborns} من الصغار في المزرعة`,
            priority: "low" as const,
          },
        ]
      : []),
    // Add alerts for animals needing attention
    ...(() => {
      const currentDate = new Date();
      const animalsNeedingAttention = activeAnimals.filter(animal => {
        // Check for isolation status
        if (animal.isIsolated) return true;
        
        // Check for pregnant animals near due date
        if (animal.isPregnant && animal.expectedBirthDate) {
          const daysUntilBirth = Math.floor(
            (new Date(animal.expectedBirthDate).getTime() - currentDate.getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          return daysUntilBirth <= 7 && daysUntilBirth >= 0;
        }
        
        return false;
      });
      
      return animalsNeedingAttention.length > 0 ? [{
        id: "health_check",
        type: "warning" as const,
        title: "حيوانات تحتاج رعاية",
        description: `${animalsNeedingAttention.length} حيوان يحتاج رعاية خاصة`,
        priority: "medium" as const,
      }] : [];
    })(),
  ];

  const recentActivity = [
    ...recentStockMovements.map((movement, index) => {
      const item = warehouseItems.find(i => i.id === movement.itemId);
      return {
        id: `stock_${index}`,
        action: movement.type === "in" ? "إضافة للمخزون" : "صرف من المخزون",
        animal: null,
        weight: null,
        barn: null,
        time: getRelativeTime(movement.date),
      };
    }),
    ...recentFeedingRecords.map((record, index) => {
      const barn = barns.find(b => b.id === record.barnId);
      return {
        id: `feeding_${index}`,
        action: "تسجيل تغذية",
        animal: null, // FeedingRecord doesn't have specific animal, it's for barn
        weight: null,
        barn: barn?.name || "حظيرة غير معروفة",
        time: getRelativeTime(record.date),
      };
    }),
    // Add recent weight records from weight history
    ...activeAnimals
      .filter(animal => animal.weightHistory && animal.weightHistory.length > 0)
      .map((animal, index) => {
        const latestWeight = animal.weightHistory![animal.weightHistory!.length - 1];
        const barn = barns.find(b => b.id === animal.barnId);
        return {
          id: `weight_${index}`,
          action: "تسجيل وزن",
          animal: animal.earTagId,
          weight: `${formatWeight(latestWeight.weightKg)}`,
          barn: barn?.name || "حظيرة غير معروفة",
          time: getRelativeTime(latestWeight.date),
        };
      })
      .slice(0, 2)
  ].slice(0, 5); // Show only the 5 most recent activities

  // Helper function to get relative time
  function getRelativeTime(date: Date | string): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "منذ دقائق";
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    if (diffInHours < 48) return "أمس";
    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} أيام`;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">
            مزرعة الأغنام - لوحة الإدارة الشاملة
          </h1>
          <p className="text-muted-foreground">
            نظام إدارة المزرعة - جميع الأدوات في مكان واحد
          </p>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Badge variant="outline" className="text-farm-600">
            آخر تحديث: اليوم {formatArabicNumber(14)}:{formatArabicNumber(30)}
          </Badge>
          <CanvasExportButton />
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="animals">الحيوانات</TabsTrigger>
          <TabsTrigger value="barns">الحظائر</TabsTrigger>
          <TabsTrigger value="feeding">التغذية</TabsTrigger>
          <TabsTrigger value="inventory">المخزون</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* App Grid */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredAppItems.map((item) => (
              <Link key={item.name} to={item.href} className="block">
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${item.color} flex items-center justify-center`}>
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-farm-800 mb-2">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <CircleDot className="h-8 w-8 text-farm-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-farm-800">
                  {formatArabicNumber(totalAnimals)}
                </div>
                <p className="text-sm text-muted-foreground">إجمالي الحيوانات</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Building2 className="h-8 w-8 text-farm-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-farm-800">
                  {formatArabicNumber(barns.length)}
                </div>
                <p className="text-sm text-muted-foreground">عدد الحظائر</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 text-farm-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-farm-800">
                  {formatArabicNumber(warehouseItems.length)}
                </div>
                <p className="text-sm text-muted-foreground">عناصر المخزون</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-farm-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-farm-800">
                  {formatEGP(totalValue)}
                </div>
                <p className="text-sm text-muted-foreground">قيمة المزرعة</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-farm-700">
                التنبيهات العاجلة
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {alerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    className={`${
                      alert.priority === "high"
                        ? "border-destructive"
                        : alert.priority === "medium"
                          ? "border-yellow-500"
                          : "border-green-500"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription className="mt-2">
                      {alert.description}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="animals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-farm-800">إدارة الحيوانات</h2>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/animals">
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفصيلي
                </Link>
              </Button>
              <Button asChild>
                <Link to="/animals">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة حيوان
                </Link>
              </Button>
            </div>
          </div>

          {/* Animal Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <CircleDot className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatArabicNumber(males)}</div>
                <p className="text-sm text-muted-foreground">ذكور</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatArabicNumber(females)}</div>
                <p className="text-sm text-muted-foreground">إناث</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Baby className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatArabicNumber(newborns)}</div>
                <p className="text-sm text-muted-foreground">مواليد</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Scale className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatWeight(averageWeight)}</div>
                <p className="text-sm text-muted-foreground">متوسط الوزن</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Animals */}
          <Card>
            <CardHeader>
              <CardTitle>الحيوانات الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              <BarnAnimalsList limit={10} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-farm-800">إدارة الحظائر</h2>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/barns">
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفصيلي
                </Link>
              </Button>
              <Button asChild>
                <Link to="/barns">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة حظيرة
                </Link>
              </Button>
            </div>
          </div>

          {/* Barn Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Building2 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatArabicNumber(barns.length)}</div>
                <p className="text-sm text-muted-foreground">إجمالي الحظائر</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatArabicNumber(totalCapacity)}</div>
                <p className="text-sm text-muted-foreground">السعة الإجمالية</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatArabicNumber(currentOccupancy)}</div>
                <p className="text-sm text-muted-foreground">الإشغال الحالي</p>
              </CardContent>
            </Card>
          </div>

          {/* Barn Occupancy */}
          <Card>
            <CardHeader>
              <CardTitle>إشغال الحظائر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {barns.map((barn) => {
                  const occupancyRate = (barn.capacity > 0) ? (barn.capacity / totalCapacity) * 100 : 0;
                  return (
                    <div key={barn.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{barn.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {barn.capacity}/{totalCapacity} ({occupancyRate.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={occupancyRate} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feeding" className="space-y-6">
          <FeedingEfficiencyDashboard />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-farm-800">إدارة المخزون</h2>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/inventory">
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفصيلي
                </Link>
              </Button>
              <Button asChild>
                <Link to="/inventory">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة عنصر
                </Link>
              </Button>
            </div>
          </div>

          {/* Inventory Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatArabicNumber(warehouseItems.length)}</div>
                <p className="text-sm text-muted-foreground">عناصر المخزون</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatArabicNumber(lowStockItems.length)}</div>
                <p className="text-sm text-muted-foreground">مخزون منخفض</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatArabicNumber(stockMovements.length)}</div>
                <p className="text-sm text-muted-foreground">حركات المخزون</p>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">تنبيهات المخزون المنخفض</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="destructive">
                        {item.currentStock} {item.unit} متبقي
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Stock Movements */}
          <Card>
            <CardHeader>
              <CardTitle>آخر حركات المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentStockMovements.slice(0, 5).map((movement, index) => {
                  const item = warehouseItems.find(i => i.id === movement.itemId);
                  return (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <span className="font-medium">{item?.name || 'عنصر غير معروف'}</span>
                        <p className="text-sm text-muted-foreground">
                          {movement.type === 'in' ? 'إضافة' : 'صرف'} - {movement.quantity} {item?.unit}
                        </p>
                      </div>
                      <Badge variant={movement.type === 'in' ? 'default' : 'secondary'}>
                        {getRelativeTime(movement.date)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-farm-800">التقارير والتحليلات</h2>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/reports">
                  <FileText className="h-4 w-4 ml-2" />
                  تقارير مفصلة
                </Link>
              </Button>
              <Button asChild>
                <Link to="/reports/weights">
                  <BarChart3 className="h-4 w-4 ml-2" />
                  تقارير الأوزان
                </Link>
              </Button>
            </div>
          </div>

          <WeightTrackingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
