import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatEGP, formatArabicNumber, formatArabicDate, inventoryCategories, feedTypes } from "@/lib/arabic-utils";
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
  FileText
} from "lucide-react";

interface InventoryItem {
  id: string;
  category: keyof typeof inventoryCategories;
  name: string;
  sku: string;
  unit: string;
  concentratePct?: number;
  pricePerUnit: number;
  minLevel: number;
  currentStock: number;
  notes?: string;
  active: boolean;
  lastRestocked?: Date;
  supplier?: string;
}

interface StockMovement {
  id: string;
  inventoryItemId: string;
  direction: 'in' | 'out';
  quantity: number;
  unit: string;
  reason: string;
  barnId?: string;
  requestedBy: string;
  createdAt: Date;
  cost?: number;
}

// Mock data
const mockInventoryItems: InventoryItem[] = [
  {
    id: "1",
    category: "feed",
    name: "دريس البرسيم",
    sku: "FEED-HAY-001",
    unit: "كيلو",
    pricePerUnit: 8.5,
    minLevel: 500,
    currentStock: 1200,
    active: true,
    lastRestocked: new Date("2024-01-15"),
    supplier: "مزرعة الوادي الأخضر"
  },
  {
    id: "2", 
    category: "feed",
    name: "تبن القمح",
    sku: "FEED-STRAW-001",
    unit: "كيلو",
    pricePerUnit: 4.2,
    minLevel: 300,
    currentStock: 150,
    active: true,
    lastRestocked: new Date("2024-01-10"),
    supplier: "تجار الأعلاف ال��تحدة"
  },
  {
    id: "3",
    category: "feed", 
    name: "علف مركز 16%",
    sku: "FEED-CONC-16",
    unit: "كيلو",
    concentratePct: 16,
    pricePerUnit: 12.8,
    minLevel: 200,
    currentStock: 450,
    active: true,
    lastRestocked: new Date("2024-01-12"),
    supplier: "شركة الأعلاف المصرية"
  },
  {
    id: "4",
    category: "medicine",
    name: "مضاد حيوي - أموكسيسيلين",
    sku: "MED-AMX-500",
    unit: "قرص",
    pricePerUnit: 2.5,
    minLevel: 50,
    currentStock: 120,
    active: true,
    lastRestocked: new Date("2024-01-08"),
    supplier: "صيدلية المزرعة البيطرية"
  },
  {
    id: "5",
    category: "equipment",
    name: "ميزان إلكتروني",
    sku: "EQP-SCALE-001",
    unit: "قطعة",
    pricePerUnit: 850,
    minLevel: 1,
    currentStock: 3,
    active: true,
    lastRestocked: new Date("2023-12-20"),
    supplier: "معدات المزارع الحديثة"
  }
];

const mockStockMovements: StockMovement[] = [
  {
    id: "1",
    inventoryItemId: "1",
    direction: "out",
    quantity: 50,
    unit: "كيلو",
    reason: "صرف للحظيرة الرئيسية",
    barnId: "B001",
    requestedBy: "أحمد محمد",
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "2",
    inventoryItemId: "2", 
    direction: "in",
    quantity: 500,
    unit: "كيلو",
    reason: "استلام شحنة جديدة",
    requestedBy: "مدير المخزن",
    createdAt: new Date("2024-01-15"),
    cost: 2100
  },
];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredItems = mockInventoryItems
    .filter(item => 
      item.name.includes(searchTerm) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier && item.supplier.includes(searchTerm))
    )
    .filter(item => categoryFilter === "all" || item.category === categoryFilter)
    .filter(item => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return item.active;
      if (statusFilter === "low_stock") return item.currentStock <= item.minLevel;
      if (statusFilter === "out_of_stock") return item.currentStock === 0;
      return true;
    });

  const getStockStatusColor = (current: number, min: number) => {
    if (current === 0) return "text-red-600";
    if (current <= min) return "text-yellow-600";
    return "text-green-600";
  };

  const getStockBadge = (current: number, min: number) => {
    if (current === 0) return { text: "نفد المخزون", color: "bg-red-100 text-red-800" };
    if (current <= min) return { text: "مخزون منخفض", color: "bg-yellow-100 text-yellow-800" };
    return { text: "متوفر", color: "bg-green-100 text-green-800" };
  };

  const lowStockItems = mockInventoryItems.filter(item => item.currentStock <= item.minLevel);
  const totalValue = mockInventoryItems.reduce((sum, item) => sum + (item.currentStock * item.pricePerUnit), 0);
  const totalItems = mockInventoryItems.filter(item => item.active).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">إدارة المخزون</h1>
          <p className="text-muted-foreground">
            إدارة مخزون الأعلاف والأدوية والمعدات
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير تقرير
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 ml-2" />
            إذن صرف
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة صنف جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(totalItems)}
            </div>
            <p className="text-xs text-muted-foreground">
              صنف نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatEGP(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              القيمة الإجمالية الحالية
            </p>
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
                      {formatArabicNumber(lowStockItems.length)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      صنف مخزون منخفض
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Package className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <p className="text-xs text-muted-foreground">
                      لا توجد تنبيهات
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الحركة الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(mockStockMovements.length)}
            </div>
            <div className="flex items-center space-x-1 space-x-reverse text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>+12% من الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for Low Stock */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>تنبيهات المخزون المنخفض</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-sm text-muted-foreground">
                      المخزون الحالي: {formatArabicNumber(item.currentStock)} {item.unit}
                    </span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      الحد الأدنى: {formatArabicNumber(item.minLevel)}
                    </Badge>
                    <Button size="sm" variant="outline">
                      طلب توريد
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">الأصناف</TabsTrigger>
          <TabsTrigger value="movements">حركة المخزون</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items" className="space-y-4">
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
                      placeholder="البحث باسم الصنف أو رقم SKU أو المورد..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    <SelectItem value="feed">أعلاف</SelectItem>
                    <SelectItem value="medicine">أدوية</SelectItem>
                    <SelectItem value="medical_supply">مستلزمات طبية</SelectItem>
                    <SelectItem value="equipment">معدات</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم الصنف</TableHead>
                      <TableHead className="text-right">الفئة</TableHead>
                      <TableHead className="text-right">المخزون الحالي</TableHead>
                      <TableHead className="text-right">الحد الأدنى</TableHead>
                      <TableHead className="text-right">سعر الوحدة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">آخر توريد</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const stockBadge = getStockBadge(item.currentStock, item.minLevel);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">{item.sku}</div>
                              {item.concentratePct && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {item.concentratePct}% بروتين
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {inventoryCategories[item.category]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className={getStockStatusColor(item.currentStock, item.minLevel)}>
                              <span className="font-medium">
                                {formatArabicNumber(item.currentStock)}
                              </span>
                              <span className="text-sm text-muted-foreground mr-1">
                                {item.unit}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatArabicNumber(item.minLevel)} {item.unit}
                          </TableCell>
                          <TableCell>
                            {formatEGP(item.pricePerUnit)} / {item.unit}
                          </TableCell>
                          <TableCell>
                            <Badge className={stockBadge.color}>
                              {stockBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.lastRestocked ? formatArabicDate(item.lastRestocked) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
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

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>حركة المخزون</CardTitle>
              <CardDescription>
                سجل بحركات الداخل والخارج للمخزون
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
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
                    {mockStockMovements.map((movement) => {
                      const item = mockInventoryItems.find(i => i.id === movement.inventoryItemId);
                      
                      return (
                        <TableRow key={movement.id}>
                          <TableCell>{formatArabicDate(movement.createdAt)}</TableCell>
                          <TableCell>{item?.name || 'غير معروف'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={movement.direction === 'in' ? 'default' : 'secondary'}
                              className={movement.direction === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            >
                              {movement.direction === 'in' ? 'وارد' : 'صادر'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatArabicNumber(movement.quantity)} {movement.unit}
                          </TableCell>
                          <TableCell>{movement.reason}</TableCell>
                          <TableCell>{movement.requestedBy}</TableCell>
                          <TableCell>
                            {movement.cost ? formatEGP(movement.cost) : '-'}
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
    </div>
  );
}
