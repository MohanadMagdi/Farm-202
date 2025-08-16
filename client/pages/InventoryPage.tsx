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
import { exportInventoryReport } from "@/lib/export-utils";
import type { WarehouseItem, WarehouseType, StockMovement } from "@shared/types";
import InventoryFormModal from "@/components/forms/InventoryFormModal";
import StockMovementModal from "@/components/forms/StockMovementModal";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Download,
  Eye,
  Edit,
  ShoppingCart,
  FileText,
  Clock,
  Warehouse,
  Beaker,
  PillBottle,
  Stethoscope,
  Wrench,
  Settings,
} from "lucide-react";

const warehouseTypes: Record<WarehouseType, { label: string; icon: any; color: string }> = {
  chemicals: { label: "المواد الكيميائية والأعلاف", icon: Beaker, color: "text-blue-600" },
  medicines: { label: "الأدوية والمحسنات", icon: PillBottle, color: "text-green-600" },
  medical_supplies: { label: "المستلزمات الطبية", icon: Stethoscope, color: "text-pink-600" },
  equipment: { label: "المعدات والأجهزة", icon: Settings, color: "text-purple-600" },
  maintenance: { label: "الصيانة والإصلاح", icon: Wrench, color: "text-orange-600" },
};

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  // Modal states
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [stockModalMode, setStockModalMode] = useState<"in" | "out">("in");

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
      
      // Update expiry days
      await dataService.warehouseItems.updateRemainingDays();
      
      // Calculate analytics
      const warehouseAnalytics = await farmHelpers.getWarehouseAnalytics();
      setAnalytics(warehouseAnalytics);
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

  const handleAddItem = () => {
    setSelectedItem(null);
    setModalMode("add");
    setShowInventoryModal(true);
  };

  const handleEditItem = (item: WarehouseItem) => {
    setSelectedItem(item);
    setModalMode("edit");
    setShowInventoryModal(true);
  };

  const handleStockMovement = (
    item: WarehouseItem,
    direction: "in" | "out"
  ) => {
    setSelectedItem(item);
    setStockModalMode(direction);
    setShowStockModal(true);
  };

  const handleModalSave = () => {
    loadData();
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم حفظ البيانات بنجاح",
    });
  };

  const exportReport = () => {
    toast({
      title: "تصدير التقرير",
      description: "سيتم تنفيذ التصدير قريباً",
    });
  };

  const createDispatchOrder = () => {
    toast({
      title: "إذن صرف",
      description: "سيتم إنشاء إذن الصرف قريباً",
    });
  };

  const requestSupply = (item: WarehouseItem) => {
    toast({
      title: "طلب توريد",
      description: `تم إرسال طلب توريد للصنف: ${item.name}`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredItems = warehouseItems
    .filter(
      (item) =>
        item.name.includes(searchTerm) ||
        item.category.includes(searchTerm) ||
        (item.supplier && item.supplier.includes(searchTerm))
    )
    .filter((item) => typeFilter === "all" || item.type === typeFilter)
    .filter((item) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return item.isActive;
      if (statusFilter === "low_stock")
        return item.currentStock <= item.minStockLevel;
      if (statusFilter === "out_of_stock") return item.currentStock === 0;
      if (statusFilter === "expired")
        return item.hasExpiry && item.expiryDate && item.expiryDate < new Date();
      if (statusFilter === "expiring") {
        if (!item.hasExpiry || !item.expiryDate) return false;
        const daysUntilExpiry = Math.ceil(
          (item.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
      }
      return true;
    });

  const getStockStatusColor = (current: number, min: number) => {
    if (current === 0) return "text-red-600";
    if (current <= min) return "text-yellow-600";
    return "text-green-600";
  };

  const getStockBadge = (current: number, min: number) => {
    if (current === 0)
      return { text: "نفد المخزون", color: "bg-red-100 text-red-800" };
    if (current <= min)
      return { text: "مخزون منخفض", color: "bg-yellow-100 text-yellow-800" };
    return { text: "متوفر", color: "bg-green-100 text-green-800" };
  };

  const getExpiryBadge = (item: WarehouseItem) => {
    if (!item.hasExpiry || !item.expiryDate) return null;
    
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return { text: "منتهي الصلاحية", color: "bg-red-100 text-red-800" };
    } else if (daysUntilExpiry <= 7) {
      return { text: `ينتهي خلال ${daysUntilExpiry} أيام`, color: "bg-orange-100 text-orange-800" };
    } else if (daysUntilExpiry <= 30) {
      return { text: `ينتهي خلال ${daysUntilExpiry} يوم`, color: "bg-yellow-100 text-yellow-800" };
    }
    
    return null;
  };

  const lowStockItems = warehouseItems.filter(
    (item) => item.currentStock <= item.minStockLevel
  );

  const expiredItems = warehouseItems.filter(
    (item) => item.hasExpiry && item.expiryDate && item.expiryDate < new Date()
  );

  const expiringItems = warehouseItems.filter((item) => {
    if (!item.hasExpiry || !item.expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (item.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">إدارة المستودعات</h1>
          <p className="text-muted-foreground">
            إدارة المستودعات الخمسة: الكيماويات، الأدوية، المستلزمات الطبية، المعدات، الصيانة
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 ml-2" />
            تصدير تقرير
          </Button>
          <Button variant="outline" size="sm" onClick={createDispatchOrder}>
            <FileText className="h-4 w-4 ml-2" />
            إذن صرف
          </Button>
          <Button onClick={handleAddItem}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة صنف جديد
          </Button>
        </div>
      </div>

      {/* Warehouse Type Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(warehouseTypes).map(([type, config]) => {
          const typeItems = warehouseItems.filter(item => item.type === type);
          const totalValue = typeItems.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
          const lowStockCount = typeItems.filter(item => item.currentStock <= item.minStockLevel).length;
          
          return (
            <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTypeFilter(type)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <config.icon className={`h-4 w-4 ml-2 ${config.color}`} />
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-farm-800">
                  {typeItems.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {farmHelpers.formatCurrency(totalValue)}
                </div>
                {lowStockCount > 0 && (
                  <div className="flex items-center text-xs text-yellow-600 mt-1">
                    <AlertTriangle className="h-3 w-3 ml-1" />
                    {lowStockCount} منخفض
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {analytics.totalItems}
            </div>
            <p className="text-xs text-muted-foreground">صنف نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {farmHelpers.formatCurrency(analytics.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">القيمة الإجمالية الحالية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">تنبيهات المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 space-x-reverse">
              {lowStockItems.length > 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {analytics.lowStockCount}
                    </div>
                    <p className="text-xs text-muted-foreground">صنف مخزون منخفض</p>
                  </div>
                </>
              ) : (
                <>
                  <Package className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <p className="text-xs text-muted-foreground">لا توجد تنبيهات</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">انتهاء الصلاحية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>منتهية:</span>
                <span className="font-semibold text-red-600">{analytics.expiredCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>تنتهي قريباً:</span>
                <span className="font-semibold text-orange-600">{analytics.expiringCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الحركة الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {stockMovements.length}
            </div>
            <div className="flex items-center space-x-1 space-x-reverse text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>حركة نشطة</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for Low Stock & Expiry */}
      {(lowStockItems.length > 0 || expiredItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          {lowStockItems.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>مخزون منخفض</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {lowStockItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-muted-foreground">
                          {item.currentStock} {item.unit}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => requestSupply(item)}>
                          طلب توريد
                        </Button>
                      </div>
                    </div>
                  ))}
                  {lowStockItems.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">
                      و {lowStockItems.length - 5} أصناف أخرى
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {expiredItems.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-red-800">
                  <Clock className="h-5 w-5" />
                  <span>منتهية الصلاحية</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {expiredItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-red-600 text-xs">
                        انتهت منذ {Math.abs(Math.ceil((item.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} يوم
                      </span>
                    </div>
                  ))}
                  {expiredItems.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">
                      و {expiredItems.length - 5} أصناف أخرى
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {expiringItems.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-orange-800">
                  <Clock className="h-5 w-5" />
                  <span>تنتهي قريباً</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {expiringItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-orange-600 text-xs">
                        {Math.ceil((item.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} أيام
                      </span>
                    </div>
                  ))}
                  {expiringItems.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">
                      و {expiringItems.length - 5} أصناف أخرى
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="items" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-2" dir="rtl">
          <TabsTrigger value="items">الأصناف</TabsTrigger>
          <TabsTrigger value="movements">حركة المخزون</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4" dir="rtl">
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
              <CardDescription>إجمالي {filteredItems.length} صنف</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم الصنف</TableHead>
                      <TableHead className="text-right">المستودع</TableHead>
                      <TableHead className="text-right">المخزون الحالي</TableHead>
                      <TableHead className="text-right">الحد الأدنى</TableHead>
                      <TableHead className="text-right">سعر الوحدة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">انتهاء الصلاحية</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const stockBadge = getStockBadge(item.currentStock, item.minStockLevel);
                      const expiryBadge = getExpiryBadge(item);
                      const warehouseConfig = warehouseTypes[item.type];

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">{item.category}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="flex items-center w-fit">
                              <warehouseConfig.icon className={`h-3 w-3 ml-1 ${warehouseConfig.color}`} />
                              {warehouseConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className={getStockStatusColor(item.currentStock, item.minStockLevel)}>
                              <span className="font-medium">{item.currentStock}</span>
                              <span className="text-sm text-muted-foreground mr-1">{item.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.minStockLevel} {item.unit}
                          </TableCell>
                          <TableCell>
                            {farmHelpers.formatCurrency(item.unitPrice)} / {item.unit}
                          </TableCell>
                          <TableCell>
                            <Badge className={stockBadge.color}>{stockBadge.text}</Badge>
                          </TableCell>
                          <TableCell>
                            {expiryBadge ? (
                              <Badge className={expiryBadge.color}>{expiryBadge.text}</Badge>
                            ) : item.hasExpiry ? (
                              <span className="text-sm text-muted-foreground">
                                {item.expiryDate ? formatArabicDate(item.expiryDate) : "غير محدد"}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">لا ينتهي</span>
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
                              >
                                <ShoppingCart className="h-3 w-3" />
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
          <Card>
            <CardHeader>
              <CardTitle>حركة المخزون</CardTitle>
              <CardDescription>سجل بحركات الداخل والخارج للمخزون</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الصنف</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">السبب</TableHead>
                      <TableHead className="text-right">المسؤول</TableHead>
                      <TableHead className="text-right">التكلفة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement) => {
                      const item = warehouseItems.find((i) => i.id === movement.itemId);

                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="text-right">
                            {formatArabicDate(movement.date)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item?.name || "غير معروف"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={movement.type === "in" ? "default" : "secondary"}
                              className={
                                movement.type === "in"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {movement.type === "in" ? "وارد" : "صادر"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {movement.quantity} {item?.unit || ""}
                          </TableCell>
                          <TableCell className="text-right">{movement.reason}</TableCell>
                          <TableCell className="text-right">{movement.recordedBy}</TableCell>
                          <TableCell className="text-right">
                            {farmHelpers.formatCurrency(movement.totalCost)}
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
    </div>
  );
}
