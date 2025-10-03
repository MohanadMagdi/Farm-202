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
import {
  formatEGP,
  formatWeight,
  formatArabicNumber,
  animalTypes,
} from "@/lib/arabic-utils";
import { dataService } from "@/lib/data-service";
import { CanvasExportButton } from "@/components/buttons/CanvasExportButton";
import { useAuth } from "@/lib/auth-context";
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
            مزرعة الأغنام
          </h1>
          <p className="text-muted-foreground">
            نظام إدارة المزرعة - اختر القسم المطلوب
          </p>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Badge variant="outline" className="text-farm-600">
            آخر تحديث: اليوم {formatArabicNumber(14)}:{formatArabicNumber(30)}
          </Badge>
        </div>
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Animals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الحيوانات
            </CardTitle>
            <CircleDot className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(totalAnimals)}
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+{formatArabicNumber(monthlyGrowth)}% هذا الشهر</span>
            </div>
          </CardContent>
        </Card>

        {/* Farm Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المزرعة</CardTitle>
            <DollarSign className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatEGP(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              متوسط السعر:{" "}
              {totalAnimals > 0
                ? formatEGP(Math.round(totalValue / totalAnimals))
                : formatEGP(0)}{" "}
              للحيوان
            </p>
          </CardContent>
        </Card>

        {/* Average Weight */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الوزن</CardTitle>
            <Scale className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatWeight(averageWeight)}
            </div>
            <p className="text-xs text-muted-foreground">للحيوانات البالغة</p>
          </CardContent>
        </Card>

        {/* Barn Occupancy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إشغال الحظائر</CardTitle>
            <Building2 className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {totalCapacity > 0
                ? Math.round((currentOccupancy / totalCapacity) * 100)
                : 0}
              %
            </div>
            <Progress
              value={
                totalCapacity > 0 ? (currentOccupancy / totalCapacity) * 100 : 0
              }
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formatArabicNumber(currentOccupancy)} من{" "}
              {formatArabicNumber(totalCapacity)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Animal Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Users className="h-5 w-5 text-farm-600" />
              <span>توزيع الحيوانات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/animals/males" className="block">
              <div className="flex items-center justify-between p-2 rounded hover:bg-accent transition-colors">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span>{animalTypes.male}</span>
                </div>
                <div className="text-left">
                  <span className="font-semibold">
                    {formatArabicNumber(males)}
                  </span>
                  <span className="text-sm text-muted-foreground mr-1">
                    (
                    {totalAnimals > 0
                      ? Math.round((males / totalAnimals) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </Link>

            <Link to="/animals/females" className="block">
              <div className="flex items-center justify-between p-2 rounded hover:bg-accent transition-colors">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="h-3 w-3 rounded-full bg-pink-500"></div>
                  <span>{animalTypes.female}</span>
                </div>
                <div className="text-left">
                  <span className="font-semibold">
                    {formatArabicNumber(females)}
                  </span>
                  <span className="text-sm text-muted-foreground mr-1">
                    (
                    {totalAnimals > 0
                      ? Math.round((females / totalAnimals) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </Link>

            <Link to="/animals/newborns" className="block">
              <div className="flex items-center justify-between p-2 rounded hover:bg-accent transition-colors">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span>{animalTypes.newborn}</span>
                </div>
                <div className="text-left">
                  <span className="font-semibold">
                    {formatArabicNumber(newborns)}
                  </span>
                  <span className="text-sm text-muted-foreground mr-1">
                    (
                    {totalAnimals > 0
                      ? Math.round((newborns / totalAnimals) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Calendar className="h-5 w-5 text-farm-600" />
              <span>النشاط الأخير</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 space-x-reverse"
                >
                  <div className="h-2 w-2 rounded-full bg-farm-500 mt-2"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.animal && `${activity.animal} - `}
                      {activity.weight && `${activity.weight} - `}
                      {activity.barn && `${activity.barn} - `}
                      <span className="text-xs">{activity.time}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
          <CardDescription>
            الإجراءات الأكثر استخداماً في إدارة المزرعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/animals">
              <Button
                className="h-auto flex-col space-y-2 p-4 w-full"
                variant="outline"
              >
                <CircleDot className="h-6 w-6" />
                <span>إضافة حيوان جديد</span>
              </Button>
            </Link>
            <Link to="/animals">
              <Button
                className="h-auto flex-col space-y-2 p-4 w-full"
                variant="outline"
              >
                <Scale className="h-6 w-6" />
                <span>تسجيل وزن</span>
              </Button>
            </Link>
            <Link to="/inventory">
              <Button
                className="h-auto flex-col space-y-2 p-4 w-full"
                variant="outline"
              >
                <Package className="h-6 w-6" />
                <span>صرف علف</span>
              </Button>
            </Link>
            <Link to="/animals">
              <Button
                className="h-auto flex-col space-y-2 p-4 w-full"
                variant="outline"
              >
                <Heart className="h-6 w-6" />
                <span>تسجيل علاج</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
