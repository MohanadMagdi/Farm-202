import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatArabicNumber } from "@/lib/arabic-utils";
import { dataService, farmHelpers } from "@/lib/data-service";
import type {
  WarehouseItem,
  WarehouseType,
  StockMovement,
} from "@shared/types";
import { toast } from "@/hooks/use-toast";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Download,
  FileText,
  Clock,
  Beaker,
  PillBottle,
  Stethoscope,
  Wrench,
  Settings,
  Activity,
  RotateCw,
  Scale,
  Utensils,
  Heart,
  Shield,
  Syringe,
  Droplets,
  Wheat,
  Leaf,
  CircleDot,
  Building2,
  DollarSign,
  Users,
} from "lucide-react";

const warehouseTypes: Record<
  WarehouseType,
  { label: string; icon: any; color: string }
> = {
  chemicals: {
    label: "المواد الكيميائية والأعلاف",
    icon: Beaker,
    color: "text-blue-600",
  },
  medicines: {
    label: "الأدوية والتحصينات",
    icon: PillBottle,
    color: "text-green-600",
  },
  medical_supplies: {
    label: "المستلزمات الطبية",
    icon: Stethoscope,
    color: "text-pink-600",
  },
  equipment: {
    label: "المعدات والأجهزة",
    icon: Settings,
    color: "text-purple-600",
  },
  maintenance: {
    label: "الصيانة والإصلاح",
    icon: Wrench,
    color: "text-orange-600",
  },
};

export default function InventoryPage() {
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockCount: 0,
    expiredCount: 0,
    expiringCount: 0,
    recentMovements: [] as StockMovement[],
  });

  // App navigation items based on the diagram
  const entryItems = [
    {
      name: "تسجيل دخول القيم",
      description: "تسجيل قيم الحيوانات (ذكور وإناث)",
      icon: Scale,
      color: "bg-blue-500",
      subItems: [
        {
          name: "ذكور",
          icon: CircleDot,
          color: "bg-blue-400",
          fields: ["رقم", "الوزن", "رقم السير"]
        },
        {
          name: "إناث",
          icon: Heart,
          color: "bg-pink-400",
          fields: ["وراث", "رقم", "الوزن", "رقم السير"]
        }
      ]
    },
    {
      name: "تسجيل دخول التغذية",
      description: "تسجيل أنواع الأعلاف والمواد المالئة",
      icon: Utensils,
      color: "bg-green-500",
      subItems: [
        {
          name: "علف مركز",
          icon: Wheat,
          color: "bg-yellow-400",
          fields: ["%14", "%16", "%21", "الكيلو"]
        },
        {
          name: "مادة مالئة",
          icon: Leaf,
          color: "bg-green-400",
          fields: ["دريسي", "تبن", "الكيلو"]
        }
      ]
    },
    {
      name: "تسجيل دخول الأدوية",
      description: "تسجيل التحصينات والعلاجات",
      icon: PillBottle,
      color: "bg-purple-500",
      subItems: [
        {
          name: "تحصينات",
          icon: Shield,
          color: "bg-blue-400",
          fields: ["الاسم", "الكمية"]
        },
        {
          name: "علاجات",
          icon: Syringe,
          color: "bg-red-400",
          fields: ["معلومات"]
        }
      ]
    }
  ];

  const dispenseItems = [
    {
      name: "صرف تغذية",
      description: "صرف الأعلاف والمواد المالئة",
      icon: Utensils,
      color: "bg-orange-500",
      subItems: [
        {
          name: "علف مركز",
          icon: Wheat,
          color: "bg-yellow-400",
          methods: ["الصرف بالعنبر", "والكمية بالكيلو"]
        },
        {
          name: "مادة مالئة",
          icon: Leaf,
          color: "bg-green-400",
          methods: ["الصرف بالعديد", "والكمية بالكيلو"]
        }
      ]
    },
    {
      name: "صرف الأدوية",
      description: "صرف التحصينات والعلاجات",
      icon: PillBottle,
      color: "bg-red-500",
      subItems: [
        {
          name: "تحصينات",
          icon: Shield,
          color: "bg-blue-400",
          methods: ["يظهر أسماء المدخلات", "والكمية بالعلم", "مثل 100مل = اسم", "الصرف بالغزير"]
        },
        {
          name: "علاجات",
          icon: Syringe,
          color: "bg-red-400",
          methods: ["الصرف بالرأسم"]
        }
      ]
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, movementsData] = await Promise.all([
        dataService.warehouseItems.getAll(),
        dataService.stockMovements.getAll(),
      ]);

      setWarehouseItems(itemsData);
      setStockMovements(movementsData);

      // Calculate analytics
      const warehouseAnalytics = await farmHelpers.getWarehouseAnalytics();
      setAnalytics((prev) => ({
        ...prev,
        ...warehouseAnalytics,
      }));
    } catch (error) {
      console.error("Error loading warehouse data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات المخزون",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEntryAction = (itemName: string) => {
    toast({
      title: "تسجيل دخول",
      description: `تم فتح صفحة ${itemName}`,
    });
  };

  const handleDispenseAction = (itemName: string) => {
    toast({
      title: "تسجيل صرف",
      description: `تم فتح صفحة ${itemName}`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">إدارة المخزون</h1>
          <p className="text-muted-foreground">
            نظام إدارة المخزون - تسجيل الدخول والصرف
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Badge variant="outline" className="text-farm-600">
            آخر تحديث: اليوم {formatArabicNumber(14)}:{formatArabicNumber(30)}
          </Badge>
        </div>
      </div>

      {/* Entry Registration Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-farm-700">تسجيل الدخول</h2>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {entryItems.map((item) => (
            <Card key={item.name} className="h-full hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${item.color} flex items-center justify-center`}>
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-farm-800 mb-2">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {item.description}
                </p>
                
                {/* Sub-items */}
                <div className="space-y-2">
                  {item.subItems.map((subItem) => (
                    <div key={subItem.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className={`w-6 h-6 rounded-full ${subItem.color} flex items-center justify-center`}>
                          <subItem.icon className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-medium">{subItem.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {subItem.fields ? subItem.fields.join(", ") : subItem.methods?.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={() => handleEntryAction(item.name)}
                >
                  فتح
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dispense Registration Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-farm-700">تسجيل الصرف</h2>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {dispenseItems.map((item) => (
            <Card key={item.name} className="h-full hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${item.color} flex items-center justify-center`}>
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-farm-800 mb-2">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {item.description}
                </p>
                
                {/* Sub-items */}
                <div className="space-y-2">
                  {item.subItems.map((subItem) => (
                    <div key={subItem.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className={`w-6 h-6 rounded-full ${subItem.color} flex items-center justify-center`}>
                          <subItem.icon className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-medium">{subItem.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {subItem.methods?.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={() => handleDispenseAction(item.name)}
                >
                  فتح
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-farm-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(analytics.totalItems)}
            </div>
            <p className="text-sm text-muted-foreground">إجمالي الأصناف</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-farm-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-farm-800">
              {farmHelpers.formatCurrency(analytics.totalValue)}
            </div>
            <p className="text-sm text-muted-foreground">قيمة المخزون</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-farm-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(stockMovements.length)}
            </div>
            <p className="text-sm text-muted-foreground">حركات المخزون</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-farm-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(analytics.lowStockCount)}
            </div>
            <p className="text-sm text-muted-foreground">تنبيهات المخزون</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}