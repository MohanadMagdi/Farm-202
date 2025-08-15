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
import { db, Animal, Barn, InventoryItem } from "@/lib/firebase-mock";
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
} from "lucide-react";

export default function Index() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [animalsSnapshot, barnsSnapshot, inventorySnapshot] =
        await Promise.all([
          db.collection("animals").get(),
          db.collection("barns").get(),
          db.collection("inventory").get(),
        ]);

      setAnimals(animalsSnapshot.docs.map((doc) => doc.data() as Animal));
      setBarns(barnsSnapshot.docs.map((doc) => doc.data() as Barn));
      setInventoryItems(
        inventorySnapshot.docs.map((doc) => doc.data() as InventoryItem),
      );
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

  // Calculate real data from Firebase mock
  const activeAnimals = animals.filter((a) => a.status === "active");
  const totalAnimals = activeAnimals.length;
  const males = activeAnimals.filter((a) => a.type === "male").length;
  const females = activeAnimals.filter((a) => a.type === "female").length;
  const newborns = activeAnimals.filter((a) => a.type === "newborn").length;

  const totalValue = activeAnimals.reduce(
    (sum, animal) => sum + (animal.purchase?.priceEGP || 0),
    0,
  );
  const averageWeight =
    totalAnimals > 0
      ? activeAnimals.reduce((sum, animal) => sum + animal.currentWeightKg, 0) /
        totalAnimals
      : 0;

  const totalCapacity = barns.reduce((sum, barn) => sum + barn.capacity, 0);
  const currentOccupancy = totalAnimals;

  // Generate alerts based on real data
  const lowStockItems = inventoryItems.filter((item) => {
    const currentStock = db.getCurrentStock(item.id);
    return currentStock <= item.minLevel;
  });

  const alerts = [
    ...lowStockItems.map((item) => ({
      id: `stock_${item.id}`,
      type: "warning" as const,
      title: "مخزون منخفض",
      description: `مخزون ${item.name} أقل من المستوى المطلوب`,
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
  ];

  const recentActivity = [
    {
      id: 1,
      action: "إضافة حيوان جديد",
      animal: activeAnimals[0]?.tagId || "غير محدد",
      time: "منذ ساعتين",
    },
    {
      id: 2,
      action: "تسجيل وزن",
      animal: activeAnimals[1]?.tagId || "غير محدد",
      weight: `${activeAnimals[1]?.currentWeightKg || 0} كيلو`,
      time: "منذ 4 ساعات",
    },
    {
      id: 3,
      action: "نقل إلى حظيرة",
      animal: activeAnimals[2]?.tagId || "غير محدد",
      barn: activeAnimals[2]?.barnId || "غير محدد",
      time: "أمس",
    },
  ];

  const monthlyGrowth = 5.2; // Mock calculation

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">
            لوحة تحكم المزرعة
          </h1>
          <p className="text-muted-foreground">
            نظرة عامة على حالة المزرعة والحيوانات
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
