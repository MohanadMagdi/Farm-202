import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { formatArabicDate } from "@/lib/arabic-utils";
import dataService from "@/lib/data-service-unified";
import { farmHelpers } from "@/lib/data-service";
import BreedingWorkflowDashboard from "@/components/BreedingWorkflowDashboard";
import AnimalPerformanceDashboard from "@/components/PerformanceDashboard";
import { Input } from "@/components/ui/input";
import type { Animal, AnimalCategory, Barn } from "@shared/types";
import {
  CircleDot,
  TrendingUp,
  Heart,
  Scale,
  MapPin,
  Calendar,
  Activity,
  AlertTriangle,
  Users,
  Plus,
  Eye,
  BarChart3,
  Truck,
  Baby,
  Search,
} from "lucide-react";

export default function AnimalsOverviewPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [analytics, setAnalytics] = useState({
    totalAnimals: 0,
    maleCount: 0,
    femaleCount: 0,
    newbornCount: 0,
    healthyCount: 0,
    sickCount: 0,
    pregnantCount: 0,
    isolatedCount: 0,
    totalValue: 0,
    averageWeight: 0,
    averageADG: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    try {
      const [animalsData, barnsData] = await Promise.all([
        dataService.getAnimals(),
        dataService.getBarns(),
      ]);
      setAnimals(animalsData);
      setBarns(barnsData);
      calculateAnalytics(animalsData);
    } catch (error) {
      console.error("Error loading animals:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (animalsData: Animal[]) => {
    const totalAnimals = animalsData.length;
    const maleCount = animalsData.filter((a) => a.category === "male").length;
    const femaleCount = animalsData.filter(
      (a) => a.category === "female",
    ).length;
    const newbornCount = animalsData.filter(
      (a) => a.category === "newborn",
    ).length;

    const healthyStatuses = ["سليم", "سليمة", "healthy"];
    const healthyCount = animalsData.filter((a) =>
      healthyStatuses.includes(a.healthStatus),
    ).length;
    const sickCount = totalAnimals - healthyCount;

    const pregnantCount = animalsData.filter((a) => a.isPregnant).length;
    const isolatedCount = animalsData.filter((a) => a.isIsolated).length;

    const totalValue = animalsData.reduce(
      (sum, animal) => sum + (animal.currentPrice || animal.purchasePrice || 0),
      0,
    );

    const averageWeight =
      totalAnimals > 0
        ? animalsData.reduce((sum, animal) => sum + animal.weight, 0) /
          totalAnimals
        : 0;

    const averageADG =
      totalAnimals > 0
        ? animalsData.reduce(
            (sum, animal) => sum + farmHelpers.calculateADG(animal),
            0,
          ) / totalAnimals
        : 0;

    setAnalytics({
      totalAnimals,
      maleCount,
      femaleCount,
      newbornCount,
      healthyCount,
      sickCount,
      pregnantCount,
      isolatedCount,
      totalValue,
      averageWeight,
      averageADG,
    });
  };

  // Filter animals based on search query
  const filteredAnimals = animals.filter(animal =>
    animal.earTagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    animal.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (animal.supplier && animal.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  // Helper function to get barn name by barnId
  const getBarnName = (barnId: string) => {
    const barn = barns.find(b => b.id === barnId);
    return barn ? barn.name : barnId; // Fallback to barnId if not found
  };

  // Animals by barn (filtered)
  const animalsByBarn = filteredAnimals.reduce(
    (acc, animal) => {
      if (!acc[animal.barnId]) {
        acc[animal.barnId] = [];
      }
      acc[animal.barnId].push(animal);
      return acc;
    },
    {} as Record<string, Animal[]>,
  );

  // Recent activities (mock data based on filtered animals)
  const recentActivities = [
    {
      id: "1",
      type: "birth",
      animal: filteredAnimals.find((a) => a.category === "newborn"),
      message: "ولادة جديدة",
      time: "منذ ساعتين",
      icon: Baby,
      color: "text-green-600",
    },
    {
      id: "2",
      type: "weight",
      animal: filteredAnimals.find((a) => a.category === "male"),
      message: "تسجيل وزن جديد",
      time: "منذ 4 ساعات",
      icon: Scale,
      color: "text-blue-600",
    },
    {
      id: "3",
      type: "health",
      animal: filteredAnimals.find((a) => a.category === "female"),
      message: "فحص صحي",
      time: "أمس",
      icon: Heart,
      color: "text-pink-600",
    },
    {
      id: "4",
      type: "isolation",
      animal: filteredAnimals.find((a) => a.isIsolated),
      message: "نقل إلى العزل",
      time: "منذ يومين",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
  ].filter((activity) => activity.animal);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">
            نظرة عامة على الحيوانات
          </h1>
          <p className="text-muted-foreground">
            إحصائيات شاملة عن جميع الحيوانات في المزرعة
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>
            <BarChart3 className="h-4 w-4 ml-2" />
            تقرير مفصل
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الحيوانات
            </CardTitle>
            <CircleDot className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {analytics.totalAnimals}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>نمو مستقر</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              القيمة الإجمالية
            </CardTitle>
            <Scale className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {farmHelpers.formatCurrency(analytics.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              متوسط القيمة:{" "}
              {analytics.totalAnimals > 0
                ? farmHelpers.formatCurrency(
                    Math.round(analytics.totalValue / analytics.totalAnimals),
                  )
                : farmHelpers.formatCurrency(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الوزن</CardTitle>
            <Scale className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {farmHelpers.formatWeight(analytics.averageWeight)}
            </div>
            <p className="text-xs text-muted-foreground">
              معدل النمو: {analytics.averageADG.toFixed(2)} كيلو/يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحالة الصحية</CardTitle>
            <Heart className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.healthyCount}
            </div>
            <div className="flex items-center gap-2">
              {analytics.sickCount > 0 && (
                <>
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">
                    {analytics.sickCount} يحتاج رعاية
                  </span>
                </>
              )}
              {analytics.sickCount === 0 && (
                <span className="text-xs text-green-600">
                  جميع الحيوانات سليمة
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حالات خاصة</CardTitle>
            <Activity className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>حوامل:</span>
                <span className="font-semibold text-pink-600">
                  {analytics.pregnantCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>في العزل:</span>
                <span className="font-semibold text-orange-600">
                  {analytics.isolatedCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Animal Performance Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-farm-800 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-farm-600" />
              تحليلات أداء الحيوانات
            </h2>
            <p className="text-muted-foreground">
              مؤشرات الأداء والنمو لجميع فئات الحيوانات مع تحليل الحظائر والتكاليف
              {searchQuery && (
                <span className="text-farm-600 font-medium mr-2">
                  • {filteredAnimals.length} نتيجة للبحث "{searchQuery}"
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الحيوانات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 w-64"
              />
            </div>
            <Button variant="outline" onClick={() => navigate("/reports")}>
              <BarChart3 className="h-4 w-4 ml-2" />
              تقرير تفصيلي
            </Button>
          </div>
        </div>

        {/* Unified Performance Dashboard with All Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="males" className="w-full" dir="rtl">

              <TabsContent value="males" className="mt-4">
                <AnimalPerformanceDashboard animalType="male" />
              </TabsContent>

              <TabsContent value="females" className="mt-4">
                <AnimalPerformanceDashboard animalType="female" />
              </TabsContent>

              <TabsContent value="newborns" className="mt-4">
                <AnimalPerformanceDashboard animalType="newborn" />
              </TabsContent>

              <TabsContent value="all" className="mt-4">
                <AnimalPerformanceDashboard animalType="all" />
              </TabsContent>

              <TabsContent value="barns" className="mt-4">
                <AnimalPerformanceDashboard animalType="male" />
              </TabsContent>

              <TabsContent value="pricing" className="mt-4">
                <AnimalPerformanceDashboard animalType="male" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Search Results Notification */}
      {searchQuery && filteredAnimals.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              لا توجد نتائج للبحث
            </h3>
            <p className="text-yellow-700">
              لم يتم العثور على حيوانات تتطابق مع "{searchQuery}"
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setSearchQuery("")}
            >
              مسح البحث
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Animal Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-farm-600" />
              <span>توزيع الحيوانات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                <TabsTrigger value="males">الذكور</TabsTrigger>
                <TabsTrigger value="females">الإناث</TabsTrigger>
                <TabsTrigger value="newborns">الصغار</TabsTrigger>
                <TabsTrigger value="breeding">سير التربية</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <Link to="/animals/males" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <div>
                        <span className="font-medium">الذكور</span>
                        <p className="text-sm text-muted-foreground">
                          متوسط الوزن:{" "}
                          {filteredAnimals.filter((a) => a.category === "male").length > 0
                            ? farmHelpers.formatWeight(
                                filteredAnimals
                                  .filter((a) => a.category === "male")
                                  .reduce(
                                    (sum, animal) => sum + animal.weight,
                                    0,
                                  ) / filteredAnimals.filter((a) => a.category === "male").length,
                              )
                            : "0 كيلو"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {filteredAnimals.filter((a) => a.category === "male").length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {filteredAnimals.length > 0
                          ? Math.round(
                              (filteredAnimals.filter((a) => a.category === "male").length / filteredAnimals.length) *
                                100,
                            )
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                </Link>

                <Link to="/animals/females" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-pink-500"></div>
                      <div>
                        <span className="font-medium">الإناث</span>
                        <p className="text-sm text-muted-foreground">
                          متوسط الوزن:{" "}
                          {filteredAnimals.filter((a) => a.category === "female").length > 0
                            ? farmHelpers.formatWeight(
                                filteredAnimals
                                  .filter((a) => a.category === "female")
                                  .reduce(
                                    (sum, animal) => sum + animal.weight,
                                    0,
                                  ) / filteredAnimals.filter((a) => a.category === "female").length,
                              )
                            : "0 كيلو"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {filteredAnimals.filter((a) => a.category === "female").length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {filteredAnimals.length > 0
                          ? Math.round(
                              (filteredAnimals.filter((a) => a.category === "female").length / filteredAnimals.length) *
                                100,
                            )
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                </Link>

                <Link to="/animals/newborns" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div>
                        <span className="font-medium">الصغار</span>
                        <p className="text-sm text-muted-foreground">
                          متوسط الوزن:{" "}
                          {filteredAnimals.filter((a) => a.category === "newborn").length > 0
                            ? farmHelpers.formatWeight(
                                filteredAnimals
                                  .filter((a) => a.category === "newborn")
                                  .reduce(
                                    (sum, animal) => sum + animal.weight,
                                    0,
                                  ) / filteredAnimals.filter((a) => a.category === "newborn").length,
                              )
                            : "0 كيلو"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {filteredAnimals.filter((a) => a.category === "newborn").length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {filteredAnimals.length > 0
                          ? Math.round(
                              (filteredAnimals.filter((a) => a.category === "newborn").length /
                                filteredAnimals.length) *
                                100,
                            )
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                </Link>
              </TabsContent>

              <TabsContent value="males">
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {filteredAnimals.filter((a) => a.category === "male").length}
                  </div>
                  <p className="text-muted-foreground">إجمالي الذكور</p>
                  <Link to="/animals/males">
                    <Button className="mt-2">عرض جميع الذكور</Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="females">
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-600">
                      {filteredAnimals.filter((a) => a.category === "female").length}
                    </div>
                    <p className="text-muted-foreground">إجمالي الإناث</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>حوامل:</span>
                    <span className="font-semibold">
                      {filteredAnimals.filter((a) => a.category === "female" && a.isPregnant).length}
                    </span>
                  </div>
                  <Link to="/animals/females">
                    <Button className="w-full mt-2">عرض جميع الإناث</Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="newborns">
                <div className="text-center py-4">
                  <div className="text-3xl font-bold text-green-600">
                    {filteredAnimals.filter((a) => a.category === "newborn").length}
                  </div>
                  <p className="text-muted-foreground">إجمالي الصغار</p>
                  <Link to="/animals/newborns">
                    <Button className="mt-2">عرض جميع الصغار</Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="breeding" className="space-y-4">
                <BreedingWorkflowDashboard />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-farm-600" />
              <span>النشاط الأخير</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 ${activity.color}`}
                  >
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.animal?.earTagId} - {activity.time}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {recentActivities.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  لا توجد أنشطة حديثة
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Animals by Barn */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-farm-600" />
            <span>توزيع الحيوانات على الحظائر</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(animalsByBarn).map(([barnId, barnAnimals]) => (
              <div key={barnId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{getBarnName(barnId)}</h4>
                  <Badge variant="outline">{barnAnimals.length}</Badge>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>ذكور:</span>
                    <span>
                      {barnAnimals.filter((a) => a.category === "male").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>إناث:</span>
                    <span>
                      {
                        barnAnimals.filter((a) => a.category === "female")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>صغار:</span>
                    <span>
                      {
                        barnAnimals.filter((a) => a.category === "newborn")
                          .length
                      }
                    </span>
                  </div>
                </div>

                <Link to="/barns" className="block mt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    عرض الحظيرة
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Alerts */}
      {analytics.sickCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>تنبيهات صحية</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {animals
                .filter(
                  (a) => !["سليم", "سليمة", "healthy"].includes(a.healthStatus),
                )
                .map((animal) => (
                  <div
                    key={animal.id}
                    className="flex items-center justify-between p-2 bg-white rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{animal.earTagId}</span>
                      <Badge variant="outline">{animal.healthStatus}</Badge>
                      {animal.isIsolated && (
                        <Badge className="bg-orange-100 text-orange-800">
                          في العزل
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      عرض التفاصيل
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
