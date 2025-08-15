import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { formatEGP, formatWeight, formatArabicNumber, animalTypes } from "@/lib/arabic-utils";
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
  Calendar
} from "lucide-react";

// Mock data - in real app this would come from Firebase/API
const mockData = {
  totalAnimals: 247,
  males: 89,
  females: 134,
  newborns: 24,
  totalValue: 850000,
  monthlyGrowth: 5.2,
  averageWeight: 65.5,
  barns: {
    total: 8,
    occupied: 6,
    capacity: 300,
    current: 247
  },
  alerts: [
    {
      id: 1,
      type: "warning",
      title: "مخزون العلف منخفض",
      description: "مخزون الدريس أقل من المستوى المطلوب (50 كيلو متبقي)",
      priority: "high"
    },
    {
      id: 2,
      type: "info", 
      title: "موعد التطعيم",
      description: "15 حيوان يحتاج تطعيم خلال الأسبوع القادم",
      priority: "medium"
    },
    {
      id: 3,
      type: "success",
      title: "ولادة جديدة",
      description: "ولد صغير جديد في الحظيرة رقم 3 اليوم",
      priority: "low"
    }
  ],
  recentActivity: [
    { id: 1, action: "إضافة حيوان جديد", animal: "خروف رقم 248", time: "منذ ساعتين" },
    { id: 2, action: "تسجيل وزن", animal: "نعجة رقم 156", weight: "72.5 كيلو", time: "منذ 4 ساعات" },
    { id: 3, action: "نقل إلى حظيرة", animal: "خروف رقم 201", barn: "الحظيرة 2", time: "أمس" },
    { id: 4, action: "صرف علف", amount: "120 كيلو دريس", barn: "الحظيرة 1", time: "أمس" }
  ]
};

export default function Index() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">لوحة تحكم المزرعة</h1>
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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-farm-700">التنبيهات العاجلة</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockData.alerts.map((alert) => (
            <Alert 
              key={alert.id} 
              className={`${
                alert.priority === 'high' ? 'border-destructive' :
                alert.priority === 'medium' ? 'border-yellow-500' :
                'border-green-500'
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Animals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحيوانات</CardTitle>
            <CircleDot className="h-4 w-4 text-farm-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(mockData.totalAnimals)}
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+{formatArabicNumber(mockData.monthlyGrowth)}% هذا الشهر</span>
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
              {formatEGP(mockData.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              متوسط السعر: {formatEGP(Math.round(mockData.totalValue / mockData.totalAnimals))} للحيوان
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
              {formatWeight(mockData.averageWeight)}
            </div>
            <p className="text-xs text-muted-foreground">
              للحيوانات البالغة
            </p>
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
              {Math.round((mockData.barns.current / mockData.barns.capacity) * 100)}%
            </div>
            <Progress 
              value={(mockData.barns.current / mockData.barns.capacity) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formatArabicNumber(mockData.barns.current)} من {formatArabicNumber(mockData.barns.capacity)}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span>{animalTypes.male}</span>
              </div>
              <div className="text-left">
                <span className="font-semibold">{formatArabicNumber(mockData.males)}</span>
                <span className="text-sm text-muted-foreground mr-1">
                  ({Math.round((mockData.males / mockData.totalAnimals) * 100)}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="h-3 w-3 rounded-full bg-pink-500"></div>
                <span>{animalTypes.female}</span>
              </div>
              <div className="text-left">
                <span className="font-semibold">{formatArabicNumber(mockData.females)}</span>
                <span className="text-sm text-muted-foreground mr-1">
                  ({Math.round((mockData.females / mockData.totalAnimals) * 100)}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span>{animalTypes.newborn}</span>
              </div>
              <div className="text-left">
                <span className="font-semibold">{formatArabicNumber(mockData.newborns)}</span>
                <span className="text-sm text-muted-foreground mr-1">
                  ({Math.round((mockData.newborns / mockData.totalAnimals) * 100)}%)
                </span>
              </div>
            </div>
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
              {mockData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 space-x-reverse">
                  <div className="h-2 w-2 rounded-full bg-farm-500 mt-2"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.animal && `${activity.animal} - `}
                      {activity.weight && `${activity.weight} - `}
                      {activity.barn && `${activity.barn} - `}
                      {activity.amount && `${activity.amount} - `}
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
            <Button className="h-auto flex-col space-y-2 p-4" variant="outline">
              <CircleDot className="h-6 w-6" />
              <span>إضافة حيوان جديد</span>
            </Button>
            <Button className="h-auto flex-col space-y-2 p-4" variant="outline">
              <Scale className="h-6 w-6" />
              <span>تسجيل وزن</span>
            </Button>
            <Button className="h-auto flex-col space-y-2 p-4" variant="outline">
              <Package className="h-6 w-6" />
              <span>صرف علف</span>
            </Button>
            <Button className="h-auto flex-col space-y-2 p-4" variant="outline">
              <Heart className="h-6 w-6" />
              <span>تسجيل علاج</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
