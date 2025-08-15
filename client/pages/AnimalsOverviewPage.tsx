import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEGP, formatWeight, formatArabicNumber, animalTypes, healthStatus } from "@/lib/arabic-utils";
import { db, Animal } from "@/lib/firebase-mock";
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
  BarChart3
} from "lucide-react";

export default function AnimalsOverviewPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    try {
      const snapshot = await db.collection('animals').get();
      const animalsData = snapshot.docs.map(doc => doc.data() as Animal);
      setAnimals(animalsData);
    } catch (error) {
      console.error('Error loading animals:', error);
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
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalAnimals = animals.length;
  const maleCount = animals.filter(a => a.type === 'male' && a.status === 'active').length;
  const femaleCount = animals.filter(a => a.type === 'female' && a.status === 'active').length;
  const newbornCount = animals.filter(a => a.type === 'newborn' && a.status === 'active').length;
  
  const healthyCount = animals.filter(a => a.healthStatus === 'healthy' && a.status === 'active').length;
  const sickCount = animals.filter(a => a.healthStatus !== 'healthy' && a.status === 'active').length;
  
  const totalValue = animals
    .filter(a => a.status === 'active')
    .reduce((sum, animal) => sum + (animal.purchase?.priceEGP || 0), 0);
  
  const averageWeight = animals.filter(a => a.status === 'active').length > 0 
    ? animals
        .filter(a => a.status === 'active')
        .reduce((sum, animal) => sum + animal.currentWeightKg, 0) / animals.filter(a => a.status === 'active').length
    : 0;

  const averageADG = animals.filter(a => a.status === 'active').length > 0
    ? animals
        .filter(a => a.status === 'active')
        .reduce((sum, animal) => sum + animal.metrics.adg, 0) / animals.filter(a => a.status === 'active').length
    : 0;

  // Recent activities (mock data)
  const recentActivities = [
    {
      id: '1',
      type: 'birth',
      animal: animals.find(a => a.type === 'newborn'),
      message: 'ولادة جديدة',
      time: 'منذ ساعتين'
    },
    {
      id: '2',
      type: 'weight',
      animal: animals.find(a => a.type === 'male'),
      message: 'تسجيل وزن جديد',
      time: 'منذ 4 ساعات'
    },
    {
      id: '3',
      type: 'health',
      animal: animals.find(a => a.type === 'female'),
      message: 'فحص صحي',
      time: 'أمس'
    }
  ].filter(activity => activity.animal);

  // Animals by barn
  const animalsByBarn = animals
    .filter(a => a.status === 'active')
    .reduce((acc, animal) => {
      if (!acc[animal.barnId]) {
        acc[animal.barnId] = [];
      }
      acc[animal.barnId].push(animal);
      return acc;
    }, {} as Record<string, Animal[]>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">نظرة عامة على الحيوانات</h1>
          <p className="text-muted-foreground">
            إحصائيات شاملة عن جميع الحيوانات في المزرعة
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 ml-2" />
            تقرير مفصل
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة حيوان جديد
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحيوانات</CardTitle>
            <CircleDot className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(totalAnimals)}
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+{formatArabicNumber(5)}% هذا الشهر</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">القيمة الإجمالية</CardTitle>
            <Scale className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatEGP(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              متوسط القيمة: {totalAnimals > 0 ? formatEGP(Math.round(totalValue / totalAnimals)) : formatEGP(0)}
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
              {formatWeight(averageWeight)}
            </div>
            <p className="text-xs text-muted-foreground">
              معدل النمو: {averageADG.toFixed(2)} كيلو/يوم
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
              {formatArabicNumber(healthyCount)}
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              {sickCount > 0 && (
                <>
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">
                    {formatArabicNumber(sickCount)} يحتاج رعاية
                  </span>
                </>
              )}
              {sickCount === 0 && (
                <span className="text-xs text-green-600">جميع الحيوانات سليمة</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Animal Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Users className="h-5 w-5 text-farm-600" />
              <span>توزيع الحيوانات</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/animals/males" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <div>
                    <span className="font-medium">{animalTypes.male}</span>
                    <p className="text-sm text-muted-foreground">
                      متوسط الوزن: {maleCount > 0 ? formatWeight(
                        animals
                          .filter(a => a.type === 'male' && a.status === 'active')
                          .reduce((sum, animal) => sum + animal.currentWeightKg, 0) / maleCount
                      ) : '0 كيلو'}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-semibold">{formatArabicNumber(maleCount)}</div>
                  <div className="text-sm text-muted-foreground">
                    {totalAnimals > 0 ? Math.round((maleCount / totalAnimals) * 100) : 0}%
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/animals/females" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="h-3 w-3 rounded-full bg-pink-500"></div>
                  <div>
                    <span className="font-medium">{animalTypes.female}</span>
                    <p className="text-sm text-muted-foreground">
                      متوسط الوزن: {femaleCount > 0 ? formatWeight(
                        animals
                          .filter(a => a.type === 'female' && a.status === 'active')
                          .reduce((sum, animal) => sum + animal.currentWeightKg, 0) / femaleCount
                      ) : '0 كيلو'}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-semibold">{formatArabicNumber(femaleCount)}</div>
                  <div className="text-sm text-muted-foreground">
                    {totalAnimals > 0 ? Math.round((femaleCount / totalAnimals) * 100) : 0}%
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/animals/newborns" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div>
                    <span className="font-medium">{animalTypes.newborn}</span>
                    <p className="text-sm text-muted-foreground">
                      متوسط الوزن: {newbornCount > 0 ? formatWeight(
                        animals
                          .filter(a => a.type === 'newborn' && a.status === 'active')
                          .reduce((sum, animal) => sum + animal.currentWeightKg, 0) / newbornCount
                      ) : '0 كيلو'}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-lg font-semibold">{formatArabicNumber(newbornCount)}</div>
                  <div className="text-sm text-muted-foreground">
                    {totalAnimals > 0 ? Math.round((newbornCount / totalAnimals) * 100) : 0}%
                  </div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Activity className="h-5 w-5 text-farm-600" />
              <span>النشاط الأخير</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 space-x-reverse">
                  <div className="h-2 w-2 rounded-full bg-farm-500 mt-2"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.animal?.tagId} - {activity.time}
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
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <MapPin className="h-5 w-5 text-farm-600" />
            <span>توزيع الحيوانات على الحظائر</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(animalsByBarn).map(([barnId, barnAnimals]) => (
              <div key={barnId} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{barnId}</h4>
                  <Badge variant="outline">{formatArabicNumber(barnAnimals.length)}</Badge>
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>ذكور:</span>
                    <span>{formatArabicNumber(barnAnimals.filter(a => a.type === 'male').length)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>إناث:</span>
                    <span>{formatArabicNumber(barnAnimals.filter(a => a.type === 'female').length)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>صغار:</span>
                    <span>{formatArabicNumber(barnAnimals.filter(a => a.type === 'newborn').length)}</span>
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
      {sickCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>تنبيهات صحية</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {animals
                .filter(a => a.healthStatus !== 'healthy' && a.status === 'active')
                .map((animal) => (
                  <div key={animal.id} className="flex items-center justify-between p-2 bg-white rounded">
                    <div>
                      <span className="font-medium">{animal.tagId}</span>
                      <Badge className="mr-2" variant="outline">
                        {healthStatus[animal.healthStatus]}
                      </Badge>
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
