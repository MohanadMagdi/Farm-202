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
import {
  formatEGP,
  formatArabicNumber,
  formatArabicDate,
  inventoryCategories,
  feedTypes,
} from "@/lib/arabic-utils";
import { db, InventoryItem, StockMovement } from "@/lib/firebase-mock";
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
  direction: "in" | "out";
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
    supplier: "مزرعة الوادي الأخضر",
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
    supplier: "تجار الأعلاف ال��تحدة",
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
    supplier: "شركة الأعلاف المصرية",
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
    supplier: "صيدلية المزرعة البيطرية",
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
    supplier: "معدات المزارع الحديثة",
  },
];

const mockStockMovements: StockMovement[] = [
  {
    id: "1",
    inventoryItemId: "1",
    direction: "out",
    quantity: 50,
    unit: "كيلو",
    reason: "صرف ��لحظيرة الرئيسية",
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
    cost: 2100,
  },
];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [stockModalMode, setStockModalMode] = useState<"in" | "out">("in");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inventorySnapshot, movementsSnapshot] = await Promise.all([
        db.collection("inventory").get(),
        db.collection("stockMovements").get(),
      ]);

      setInventoryItems(
        inventorySnapshot.docs.map((doc) => doc.data() as InventoryItem),
      );
      setStockMovements(
        movementsSnapshot.docs.map((doc) => doc.data() as StockMovement),
      );
    } catch (error) {
      console.error("Error loading inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setModalMode("add");
    setShowInventoryModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setModalMode("edit");
    setShowInventoryModal(true);
  };

  const handleStockMovement = (item: InventoryItem, direction: "in" | "out") => {
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

  const requestSupply = (item: InventoryItem) => {
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
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredItems = inventoryItems
    .filter(
      (item) =>
        item.name.includes(searchTerm) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.supplier && item.supplier.includes(searchTerm)),
    )
    .filter(
      (item) => categoryFilter === "all" || item.category === categoryFilter,
    )
    .filter((item) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return item.active;
      if (statusFilter === "low_stock")
        return item.currentStock <= item.minLevel;
      if (statusFilter === "out_of_stock") return item.currentStock === 0;
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

  const lowStockItems = inventoryItems.filter(
    (item) => db.getCurrentStock(item.id) <= item.minLevel,
  );
  const totalValue = inventoryItems.reduce(
    (sum, item) => sum + db.getCurrentStock(item.id) * item.pricePerUnitEGP,
    0,
  );
  const totalItems = inventoryItems.filter((item) => item.active).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">إدارة ��لمخزون</h1>
          <p className="text-muted-foreground">
            إدارة مخزون ال��علاف والأدوية والمعدات
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الأصناف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(totalItems)}
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
              {formatEGP(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              القيمة الإجمالية الحا��ية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              تنب��هات المخزون
            </CardTitle>
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
            <CardTitle className="text-sm font-medium">
              الحر��ة الشهرية
            </CardTitle>
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
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-white rounded"
                >
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-sm text-muted-foreground">
                      المخزون الحالي: {formatArabicNumber(db.getCurrentStock(item.id))}{" "}
                      {item.unit}
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      الحد الأدنى: {formatArabicNumber(item.minLevel)}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => requestSupply(item)}>
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

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    <SelectItem value="feed">أعلاف</SelectItem>
                    <SelectItem value="medicine">أدوية</SelectItem>
                    <SelectItem value="medical_supply">
                      مستلزمات طبية
                    </SelectItem>
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
                      <TableHead className="text-right w-1/6">اسم الصنف</TableHead>
                      <TableHead className="text-right w-1/12">الفئة</TableHead>
                      <TableHead className="text-right w-1/8">
                        المخزون الحالي
                      </TableHead>
                      <TableHead className="text-right w-1/12">الحد الأدنى</TableHead>
                      <TableHead className="text-right w-1/8">سعر الوحدة</TableHead>
                      <TableHead className="text-right w-1/12">الحالة</TableHead>
                      <TableHead className="text-right w-1/8">آخر توريد</TableHead>
                      <TableHead className="text-right w-1/6">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => {
                      const currentStock = db.getCurrentStock(item.id);
                      const stockBadge = getStockBadge(
                        currentStock,
                        item.minLevel,
                      );

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.sku}
                              </div>
                              {item.concentratePct && (
                                <Badge
                                  variant="outline"
                                  className="text-xs mt-1"
                                >
                                  {formatArabicNumber(item.concentratePct)}% بروتين
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
                            <div
                              className={getStockStatusColor(
                                currentStock,
                                item.minLevel,
                              )}
                            >
                              <span className="font-medium">
                                {formatArabicNumber(currentStock)}
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
                            {formatEGP(item.pricePerUnitEGP)} / {item.unit}
                          </TableCell>
                          <TableCell>
                            <Badge className={stockBadge.color}>
                              {stockBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.timestamps?.updatedAt
                              ? formatArabicDate(item.timestamps.updatedAt)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
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
                    {stockMovements.map((movement) => {
                      const item = inventoryItems.find(
                        (i) => i.id === movement.inventoryItemId,
                      );

                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="text-right">
                            {formatArabicDate(movement.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">{item?.name || "غير معروف"}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                movement.direction === "in"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                movement.direction === "in"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {movement.direction === "in" ? "وارد" : "صادر"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatArabicNumber(movement.quantity)}{" "}
                            {movement.unit}
                          </TableCell>
                          <TableCell className="text-right">{movement.reason}</TableCell>
                          <TableCell className="text-right">{movement.requestedBy}</TableCell>
                          <TableCell className="text-right">
                            {movement.cost ? formatEGP(movement.cost) : "-"}
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
        inventoryItem={selectedItem}
        mode={modalMode}
      />

      <StockMovementModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        onSave={handleModalSave}
        inventoryItem={selectedItem || undefined}
        mode={stockModalMode}
      />
    </div>
  );
}
