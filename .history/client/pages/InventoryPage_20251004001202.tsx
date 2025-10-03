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
            {/* إحصائيات خاصة بالمستودع إذا كان تبويب منفصل */}
            {activeTab !== "all" && (
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const config = warehouseTypes[activeTab as keyof typeof warehouseTypes];
                      return (
                        <>
                          <config.icon className={`h-6 w-6 ${config.color}`} />
                          {config.label}
                        </>
                      );
                    })()}
                  </CardTitle>
                  <CardDescription>
                    إدارة مخزون {warehouseTypes[activeTab as keyof typeof warehouseTypes]?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    {(() => {
                      const typeItems = warehouseItems.filter((item) => item.type === activeTab);
                      const totalValue = typeItems.reduce(
                        (sum, item) => sum + item.currentStock * item.unitPrice,
                        0,
                      );
                      const lowStockCount = typeItems.filter(
                        (item) => item.currentStock <= item.minStockLevel,
                      ).length;
                      const expiredCount = typeItems.filter(
                        (item) => item.hasExpiry && item.expiryDate && item.expiryDate < new Date(),
                      ).length;

                      return (
                        <>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-2xl font-bold text-farm-800">{typeItems.length}</div>
                              <p className="text-sm text-muted-foreground">إجمالي الأصناف</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-2xl font-bold text-farm-800">
                                {farmHelpers.formatCurrency(totalValue)}
                              </div>
                              <p className="text-sm text-muted-foreground">القيمة الإجمالية</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
                              <p className="text-sm text-muted-foreground">مخزون منخفض</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
                              <p className="text-sm text-muted-foreground">منتهي الصلاحية</p>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  البحث والتصفية - {activeTab === "all" ? "جميع المستودعات" : warehouseTypes[activeTab as keyof typeof warehouseTypes]?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:space-x-reverse">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث باسم الصنف أو الفئة أو المورد..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>

                  {activeTab === "all" && (
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue placeholder="نوع المستودع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المستودعات</SelectItem>
                        {Object.entries(warehouseTypes).map(([type, config]) => (
                          <SelectItem key={type} value={type}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="حالة المخزون" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="low_stock">مخزون منخفض</SelectItem>
                      <SelectItem value="out_of_stock">نفد المخزون</SelectItem>
                      <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                      <SelectItem value="expiring">ينتهي قريباً</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={handleAddItem} className="whitespace-nowrap">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة صنف جديد
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>
                  قائمة {activeTab === "all" ? "جميع الأصناف" : `أصناف ${warehouseTypes[activeTab as keyof typeof warehouseTypes]?.label}`}
                </CardTitle>
                <CardDescription>
                  إجمالي {(() => {
                    let items = warehouseItems;
                    
                    // فلترة حسب نوع المستودع
                    if (activeTab !== "all") {
                      items = items.filter((item) => item.type === activeTab);
                    }
                    
                    // فلترة حسب البحث
                    items = items.filter(
                      (item) =>
                        item.name.includes(searchTerm) ||
                        item.category.includes(searchTerm) ||
                        (item.supplier && item.supplier.includes(searchTerm)),
                    );
                    
                    // فلترة حسب نوع المستودع (للتبويب الشامل)
                    if (activeTab === "all") {
                      items = items.filter((item) => typeFilter === "all" || item.type === typeFilter);
                    }
                    
                    // فلترة حسب الحالة
                    items = items.filter((item) => {
                      if (statusFilter === "all") return true;
                      if (statusFilter === "active") return item.isActive;
                      if (statusFilter === "low_stock") return item.currentStock <= item.minStockLevel;
                      if (statusFilter === "out_of_stock") return item.currentStock === 0;
                      if (statusFilter === "expired")
                        return (
                          item.hasExpiry &&
                          item.remainingDays !== undefined &&
                          item.remainingDays < 0
                        );
                      if (statusFilter === "expiring") {
                        return (
                          item.hasExpiry &&
                          item.remainingDays !== undefined &&
                          item.remainingDays >= 0 &&
                          item.remainingDays <= 7
                        );
                      }
                      return true;
                    });
                    
                    return items.length;
                  })()} صنف
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table dir="rtl">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم الصنف</TableHead>
                        {activeTab === "all" && <TableHead className="text-right">المستودع</TableHead>}
                        <TableHead className="text-right">المخزون الحالي</TableHead>
                        <TableHead className="text-right">الحد الأدنى</TableHead>
                        <TableHead className="text-right">سعر الوحدة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">انتهاء الصلاحية</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        let displayItems = warehouseItems;
                        
                        // فلترة حسب نوع المستودع
                        if (activeTab !== "all") {
                          displayItems = displayItems.filter((item) => item.type === activeTab);
                        }
                        
                        // تطبيق باقي الفلاتر
                        displayItems = displayItems
                          .filter(
                            (item) =>
                              item.name.includes(searchTerm) ||
                              item.category.includes(searchTerm) ||
                              (item.supplier && item.supplier.includes(searchTerm)),
                          )
                          .filter((item) => activeTab === "all" ? (typeFilter === "all" || item.type === typeFilter) : true)
                          .filter((item) => {
                            if (statusFilter === "all") return true;
                            if (statusFilter === "active") return item.isActive;
                            if (statusFilter === "low_stock") return item.currentStock <= item.minStockLevel;
                            if (statusFilter === "out_of_stock") return item.currentStock === 0;
                            if (statusFilter === "expired")
                              return (
                                item.hasExpiry &&
                                item.remainingDays !== undefined &&
                                item.remainingDays < 0
                              );
                            if (statusFilter === "expiring") {
                              return (
                                item.hasExpiry &&
                                item.remainingDays !== undefined &&
                                item.remainingDays >= 0 &&
                                item.remainingDays <= 7
                              );
                            }
                            return true;
                          });

                        return displayItems.length > 0 ? displayItems.map((item) => {
                          const stockBadge = getStockBadge(
                            item.currentStock,
                            item.minStockLevel,
                          );
                          const expiryBadge = getExpiryBadge(item);
                          const warehouseConfig = warehouseTypes[item.type];

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.category}
                                  </div>
                                </div>
                              </TableCell>
                              {activeTab === "all" && (
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="flex items-center w-fit"
                                  >
                                    <warehouseConfig.icon
                                      className={`h-3 w-3 ml-1 ${warehouseConfig.color}`}
                                    />
                                    {warehouseConfig.label}
                                  </Badge>
                                </TableCell>
                              )}
                              <TableCell>
                                <div
                                  className={getStockStatusColor(
                                    item.currentStock,
                                    item.minStockLevel,
                                  )}
                                >
                                  <span className="font-medium">
                                    {item.currentStock}
                                  </span>
                                  <span className="text-sm text-muted-foreground mr-1">
                                    {item.unit}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.minStockLevel} {item.unit}
                              </TableCell>
                              <TableCell>
                                {farmHelpers.formatCurrency(item.unitPrice)} /{" "}
                                {item.unit}
                              </TableCell>
                              <TableCell>
                                <Badge className={stockBadge.color}>
                                  {stockBadge.text}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {expiryBadge ? (
                                  <Badge className={expiryBadge.color}>
                                    {expiryBadge.text}
                                  </Badge>
                                ) : item.hasExpiry ? (
                                  <span className="text-sm text-muted-foreground">
                                    {item.expiryDate
                                      ? formatArabicDate(item.expiryDate)
                                      : "غير محدد"}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    لا ينتهي
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditItem(item)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStockMovement(item, "in")}
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStockMovement(item, "out")}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    title="صرف من المخزون"
                                  >
                                    <ShoppingCart className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteItem(item)}
                                    className={`h-8 w-8 p-0 ${
                                      item.currentStock > 0 
                                        ? "opacity-50 cursor-not-allowed" 
                                        : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                    }`}
                                    title={
                                      item.currentStock > 0 
                                        ? `لا يمكن حذف الصنف لوجود مخزون (${item.currentStock} ${item.unit})` 
                                        : "حذف الصنف نهائياً"
                                    }
                                    disabled={item.currentStock > 0}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }) : (
                          <TableRow>
                            <TableCell colSpan={activeTab === "all" ? 8 : 7} className="text-center py-8">
                              لا توجد نتائج مطابقة للبحث
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="movements" className="space-y-4" dir="rtl">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">البحث والتصفية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:space-x-reverse">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث باسم الصنف أو الفئة أو المورد..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="نوع المستودع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستودعات</SelectItem>
                    {Object.entries(warehouseTypes).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="حالة المخزون" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="low_stock">مخزون منخفض</SelectItem>
                    <SelectItem value="out_of_stock">نفد المخزون</SelectItem>
                    <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                    <SelectItem value="expiring">ينتهي قريباً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة الأصناف</CardTitle>
              <CardDescription>
                إجمالي {filteredItems.length} صنف
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم الصنف</TableHead>
                      <TableHead className="text-right">المستودع</TableHead>
                      <TableHead className="text-right">
                        المخزون الحالي
                      </TableHead>
                      <TableHead className="text-right">الحد الأدنى</TableHead>
                      <TableHead className="text-right">سعر الوحدة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">
                        انتهاء الصلاحية
                      </TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const stockBadge = getStockBadge(
                        item.currentStock,
                        item.minStockLevel,
                      );
                      const expiryBadge = getExpiryBadge(item);
                      const warehouseConfig = warehouseTypes[item.type];

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.category}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="flex items-center w-fit"
                            >
                              <warehouseConfig.icon
                                className={`h-3 w-3 ml-1 ${warehouseConfig.color}`}
                              />
                              {warehouseConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div
                              className={getStockStatusColor(
                                item.currentStock,
                                item.minStockLevel,
                              )}
                            >
                              <span className="font-medium">
                                {item.currentStock}
                              </span>
                              <span className="text-sm text-muted-foreground mr-1">
                                {item.unit}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.minStockLevel} {item.unit}
                          </TableCell>
                          <TableCell>
                            {farmHelpers.formatCurrency(item.unitPrice)} /{" "}
                            {item.unit}
                          </TableCell>
                          <TableCell>
                            <Badge className={stockBadge.color}>
                              {stockBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {expiryBadge ? (
                              <Badge className={expiryBadge.color}>
                                {expiryBadge.text}
                              </Badge>
                            ) : item.hasExpiry ? (
                              <span className="text-sm text-muted-foreground">
                                {item.expiryDate
                                  ? formatArabicDate(item.expiryDate)
                                  : "غير محدد"}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                لا ينتهي
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditItem(item)}
                                className="h-8 w-8 p-0"
                                title="تعديل الصنف"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStockMovement(item, "in")}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                title="إضافة للمخزون"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStockMovement(item, "out")}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="صرف من المخزون"
                              >
                                <ShoppingCart className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem(item)}
                                className={`h-8 w-8 p-0 ${
                                  item.currentStock > 0 
                                    ? "opacity-50 cursor-not-allowed" 
                                    : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                }`}
                                title={
                                  item.currentStock > 0 
                                    ? `لا يمكن حذف الصنف لوجود مخزون (${item.currentStock} ${item.unit})` 
                                    : "حذف الصنف نهائياً"
                                }
                                disabled={item.currentStock > 0}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          لا توجد نتائج مطابقة للبحث
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4" dir="rtl">
          {/* ملخص الفترة الحالية */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                ملخص حركات اليوم
              </CardTitle>
              <CardDescription>
                إحصائيات حركات المخزون لليوم الحالي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayMovements = stockMovements.filter(m => {
                    const movementDate = new Date(m.date);
                    movementDate.setHours(0, 0, 0, 0);
                    return movementDate.getTime() === today.getTime();
                  });
                  const todayIn = todayMovements.filter(m => m.type === "in");
                  const todayOut = todayMovements.filter(m => m.type === "out");
                  const todayValue = todayMovements.reduce((sum, m) => sum + (m.totalCost || 0), 0);

                  return (
                    <>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{todayIn.length}</div>
                        <p className="text-sm text-green-700">حركات إضافة اليوم</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{todayOut.length}</div>
                        <p className="text-sm text-red-700">حركات صرف اليوم</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {farmHelpers.formatCurrency(todayValue)}
                        </div>
                        <p className="text-sm text-blue-700">قيمة حركات اليوم</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* إحصائيات حركة المخزون الإجمالية */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {stockMovements.filter((m) => m.type === "in").length}
                    </div>
                    <p className="text-sm text-muted-foreground">إجمالي حركات الإضافة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {stockMovements.filter((m) => m.type === "out").length}
                    </div>
                    <p className="text-sm text-muted-foreground">إجمالي حركات الصرف</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RotateCw className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {stockMovements.filter((m) => m.type === "transfer").length}
                    </div>
                    <p className="text-sm text-muted-foreground">إجمالي حركات النقل</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Clock className="h-5 w-5 text-farm-500" />
                  <div>
                    <div className="text-2xl font-bold text-farm-600">
                      {farmHelpers.formatCurrency(
                        stockMovements.reduce((sum, m) => sum + (m.totalCost || 0), 0)
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">إجمالي قيمة الحركات</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* فلاتر حركة المخزون المتقدمة */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">فلترة وتصدير حركات المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* صف البحث والفلاتر الأساسية */}
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:space-x-reverse">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث باسم الصنف أو المسؤول أو السبب..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="نوع الحركة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحركات</SelectItem>
                      <SelectItem value="in">حركات إضافة</SelectItem>
                      <SelectItem value="out">حركات صرف</SelectItem>
                      <SelectItem value="transfer">حركات نقل</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="نوع المستودع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المستودعات</SelectItem>
                      {Object.entries(warehouseTypes).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* صف الفلاتر المتقدمة والتصدير */}
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:space-x-reverse items-end">
                  <div className="flex-1 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">من تاريخ</label>
                      <Input
                        type="date"
                        className="w-full"
                        placeholder="من تاريخ"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">إلى تاريخ</label>
                      <Input
                        type="date"
                        className="w-full"
                        placeholder="إلى تاريخ"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="whitespace-nowrap">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير Excel
                    </Button>
                    <Button variant="outline" className="whitespace-nowrap">
                      <FileText className="h-4 w-4 ml-2" />
                      تصدير PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* جدول حركات المخزون المفصل */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                سجل حركات المخزون التفصيلي
              </CardTitle>
              <CardDescription>
                عرض شامل لجميع حركات الإضافة والصرف والنقل مع جميع التفاصيل والإحصائيات
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* عداد النتائج */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  عرض {(() => {
                    let filteredMovements = stockMovements;
                    
                    if (searchTerm) {
                      filteredMovements = filteredMovements.filter((movement) => {
                        const item = warehouseItems.find((i) => i.id === movement.itemId);
                        return (
                          item?.name.includes(searchTerm) ||
                          movement.reason.includes(searchTerm) ||
                          movement.recordedBy.includes(searchTerm) ||
                          movement.notes?.includes(searchTerm)
                        );
                      });
                    }
                    
                    if (typeFilter !== "all") {
                      filteredMovements = filteredMovements.filter((m) => m.type === typeFilter);
                    }
                    
                    if (statusFilter !== "all") {
                      filteredMovements = filteredMovements.filter((movement) => {
                        const item = warehouseItems.find((i) => i.id === movement.itemId);
                        return item?.type === statusFilter;
                      });
                    }
                    
                    return filteredMovements.length;
                  })()} من أصل {stockMovements.length} حركة مخزون
                </p>
              </div>

              <div className="rounded-md border">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right font-semibold">التاريخ والوقت</TableHead>
                      <TableHead className="text-right font-semibold">تفاصيل الصنف</TableHead>
                      <TableHead className="text-right font-semibold">نوع الحركة</TableHead>
                      <TableHead className="text-right font-semibold">الكمية والوحدة</TableHead>
                      <TableHead className="text-right font-semibold">المخزون الحالي</TableHead>
                      <TableHead className="text-right font-semibold">السعر والتكلفة</TableHead>
                      <TableHead className="text-right font-semibold">السبب والملاحظات</TableHead>
                      <TableHead className="text-right font-semibold">المسؤول</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // فلترة حركات المخزون
                      let filteredMovements = stockMovements;
                      
                      // فلترة حسب البحث
                      if (searchTerm) {
                        filteredMovements = filteredMovements.filter((movement) => {
                          const item = warehouseItems.find((i) => i.id === movement.itemId);
                          return (
                            item?.name.includes(searchTerm) ||
                            movement.reason.includes(searchTerm) ||
                            movement.recordedBy.includes(searchTerm) ||
                            movement.notes?.includes(searchTerm)
                          );
                        });
                      }
                      
                      // فلترة حسب نوع الحركة
                      if (typeFilter !== "all") {
                        filteredMovements = filteredMovements.filter((m) => m.type === typeFilter);
                      }
                      
                      // فلترة حسب نوع المستودع
                      if (statusFilter !== "all") {
                        filteredMovements = filteredMovements.filter((movement) => {
                          const item = warehouseItems.find((i) => i.id === movement.itemId);
                          return item?.type === statusFilter;
                        });
                      }
                      
                      return filteredMovements.length > 0 ? filteredMovements.map((movement) => {
                        const item = warehouseItems.find((i) => i.id === movement.itemId);
                        const warehouseConfig = item ? warehouseTypes[item.type] : null;

                        return (
                          <TableRow key={movement.id}>
                            <TableCell className="text-right">
                              <div>
                                <div className="font-medium">
                                  {formatArabicDate(movement.date)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {movement.date.toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <div className="font-medium">{item?.name || "غير معروف"}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item?.category}
                                </div>
                                {warehouseConfig && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    <warehouseConfig.icon 
                                      className={`h-3 w-3 ml-1 ${warehouseConfig.color}`} 
                                    />
                                    {warehouseConfig.label}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                className={
                                  movement.type === "in"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : movement.type === "out"
                                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                }
                              >
                                {movement.type === "in" ? (
                                  <>
                                    <TrendingUp className="h-3 w-3 ml-1" />
                                    وارد
                                  </>
                                ) : movement.type === "out" ? (
                                  <>
                                    <TrendingDown className="h-3 w-3 ml-1" />
                                    صادر
                                  </>
                                ) : (
                                  <>
                                    <RotateCw className="h-3 w-3 ml-1" />
                                    نقل
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <span 
                                  className={`font-bold ${
                                    movement.type === "in" ? "text-green-600" : "text-red-600"
                                  }`}
                                >
                                  {movement.type === "in" ? "+" : "-"}{movement.quantity}
                                </span>
                                <span className="text-sm text-muted-foreground mr-1">
                                  {item?.unit || ""}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-sm">
                                <div>المخزون الحالي: {item?.currentStock || 0} {item?.unit}</div>
                                <div className="text-xs text-muted-foreground">
                                  {movement.type === "in" ? "بعد الإضافة" : "بعد الصرف"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <div className="font-medium">
                                  {farmHelpers.formatCurrency(movement.totalCost || 0)}
                                </div>
                                {movement.unitPrice && (
                                  <div className="text-sm text-muted-foreground">
                                    {farmHelpers.formatCurrency(movement.unitPrice)} / {item?.unit}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <div className="font-medium text-sm">
                                  {movement.reason}
                                </div>
                                {movement.notes && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {movement.notes}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-sm">
                                {movement.recordedBy}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-8 w-8 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                لا توجد حركات مخزون مطابقة للبحث
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <InventoryFormModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        onSave={handleModalSave}
        warehouseItem={selectedItem}
        mode={modalMode}
      />

      <StockMovementModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        onSave={handleModalSave}
        warehouseItem={selectedItem || undefined}
        mode={stockModalMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              تأكيد حذف الصنف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من حذف الصنف <strong>"{selectedItem?.name}"</strong>؟
              <br />
              <br />
              <div className="bg-red-50 p-3 rounded-md mt-3 border-r-4 border-red-500">
                <strong className="text-red-800">تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه وسيتم حذف:
                <ul className="list-disc list-inside mt-2 text-red-700 space-y-1">
                  <li>بيانات الصنف بالكامل</li>
                  <li>تاريخ جميع حركات المخزون</li>
                  <li>جميع السجلات والتقارير المرتبطة</li>
                </ul>
              </div>
              <br />
              للمتابعة، اكتب <strong>"حذف"</strong> للتأكيد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItem}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
