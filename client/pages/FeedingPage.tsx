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
  formatArabicNumber,
  formatWeight,
  formatArabicDate,
} from "@/lib/arabic-utils";
import {
  db,
  FeedingSchedule,
  FeedingRecord,
  InventoryItem,
  Barn,
} from "@/lib/firebase-mock";
import FeedingFormModal from "@/components/forms/FeedingFormModal";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Clock,
  Utensils,
  Calendar,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Download,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

export default function FeedingPage() {
  const [feedingSchedules, setFeedingSchedules] = useState<FeedingSchedule[]>(
    [],
  );
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Modal states
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [selectedFeedingRecord, setSelectedFeedingRecord] = useState<FeedingRecord | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [preselectedBarnId, setPreselectedBarnId] = useState<string>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        schedulesSnapshot,
        recordsSnapshot,
        inventorySnapshot,
        barnsSnapshot,
      ] = await Promise.all([
        db.collection("feedingSchedules").get(),
        db.collection("feedingRecords").get(),
        db.collection("inventory").where("category", "==", "feed").get(),
        db.collection("barns").get(),
      ]);

      setFeedingSchedules(
        schedulesSnapshot.docs.map((doc) => doc.data() as FeedingSchedule),
      );
      setFeedingRecords(
        recordsSnapshot.docs.map((doc) => doc.data() as FeedingRecord),
      );
      setInventoryItems(
        inventorySnapshot.docs.map((doc) => doc.data() as InventoryItem),
      );
      setBarns(barnsSnapshot.docs.map((doc) => doc.data() as Barn));
    } catch (error) {
      console.error("Error loading feeding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeeding = (barnId?: string) => {
    setSelectedFeedingRecord(null);
    setModalMode("add");
    setPreselectedBarnId(barnId);
    setShowFeedingModal(true);
  };

  const handleEditFeeding = (record: FeedingRecord) => {
    setSelectedFeedingRecord(record);
    setModalMode("edit");
    setPreselectedBarnId(undefined);
    setShowFeedingModal(true);
  };

  const handleModalSave = () => {
    loadData();
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم حفظ بيانات التغذية بنجاح",
    });
  };

  const exportReport = () => {
    toast({
      title: "تصدير التقرير",
      description: "سيتم تنفيذ التصدير قريباً",
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

  // Calculate feeding statistics
  const todaySchedules = feedingSchedules.filter(
    (schedule) =>
      schedule.date.toDateString() === new Date(selectedDate).toDateString(),
  );

  const todayRecords = feedingRecords.filter(
    (record) =>
      record.time.toDateString() === new Date(selectedDate).toDateString(),
  );

  const totalScheduledFeeding = todaySchedules.reduce(
    (sum, schedule) =>
      sum +
      schedule.entries.reduce(
        (entrySum, entry) => entrySum + entry.qtyKgBarnTotal,
        0,
      ),
    0,
  );

  const totalActualFeeding = todayRecords.reduce(
    (sum, record) => sum + record.qtyKg,
    0,
  );

  const completionRate =
    totalScheduledFeeding > 0
      ? Math.round((totalActualFeeding / totalScheduledFeeding) * 100)
      : 0;

  const pendingFeedings =
    todaySchedules.reduce((sum, schedule) => sum + schedule.entries.length, 0) -
    todayRecords.length;

  // Mock upcoming feeding times
  const upcomingFeedings = [
    {
      time: "07:00",
      barn: "الحظيرة الرئيسية - ذكور",
      feed: "دريس البرسيم",
      qty: 25,
    },
    {
      time: "13:00",
      barn: "حظيرة الإناث الرئيسية",
      feed: "تبن القمح",
      qty: 20,
    },
    { time: "18:00", barn: "حظيرة الصغار", feed: "علف مركز 16%", qty: 15 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">إدارة التغذية</h1>
          <p className="text-muted-foreground">
            جداول التغذية وتسجيل ��لوجبات اليومية
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 ml-2" />
            تصدير تقرير
          </Button>
          <Button onClick={() => handleAddFeeding()}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة جدول تغذية
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي التغذية المجدولة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatWeight(totalScheduledFeeding)}
            </div>
            <p className="text-xs text-muted-foreground">
              لتاريخ {new Date(selectedDate).toLocaleDateString("ar-EG")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              التغذية المنجزة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatWeight(totalActualFeeding)}
            </div>
            <div className="flex items-center space-x-1 space-x-reverse text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>{completionRate}% مكتمل</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              الوجبات المتبقية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatArabicNumber(Math.max(0, pendingFeedings))}
            </div>
            <div className="flex items-center space-x-1 space-x-reverse text-xs text-muted-foreground">
              <Clock className="h-3 w-3 text-yellow-500" />
              <span>وجبة متبقية</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              معدل الاستهلاك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatWeight(
                totalActualFeeding / Math.max(1, todayRecords.length),
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              متوسط للوجبة الواحدة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Feedings Alert */}
      {upcomingFeedings.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse text-blue-800">
              <Clock className="h-5 w-5" />
              <span>مواعيد التغذية القادمة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {upcomingFeedings.map((feeding, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded"
                >
                  <div>
                    <div className="font-medium">{feeding.time}</div>
                    <div className="text-sm text-muted-foreground">
                      {feeding.barn}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {feeding.feed} - {formatWeight(feeding.qty)}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAddFeeding()}>تسجيل</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="schedules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedules">جداول التغذية</TabsTrigger>
          <TabsTrigger value="records">سجلات التغذية</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>جداول التغذية اليومية</CardTitle>
              <CardDescription>
                الجدا��ل المخططة لتاريخ{" "}
                {formatArabicDate(new Date(selectedDate))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الحظيرة</TableHead>
                      <TableHead className="text-right">عدد الوجبات</TableHead>
                      <TableHead className="text-right">المواعيد</TableHead>
                      <TableHead className="text-right">
                        إجمالي الكمية
                      </TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaySchedules.map((schedule) => {
                      const barn = barns.find((b) => b.id === schedule.barnId);
                      const totalQty = schedule.entries.reduce(
                        (sum, entry) => sum + entry.qtyKgBarnTotal,
                        0,
                      );
                      const recordedFeedings = todayRecords.filter(
                        (r) => r.barnId === schedule.barnId,
                      ).length;
                      const completed =
                        recordedFeedings >= schedule.entries.length;

                      return (
                        <TableRow key={schedule.id}>
                          <TableCell className="text-right">{barn?.name || schedule.barnId}</TableCell>
                          <TableCell className="text-right">
                            {formatArabicNumber(schedule.sessionsPerDay)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {schedule.entries.map((entry, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {entry.time}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatWeight(totalQty)}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              className={
                                completed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {completed ? "مكتمل" : "قيد التنفيذ"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddFeeding(schedule.barnId)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              >
                                <Utensils className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {todaySchedules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          لا توجد جداول تغذية لهذا التاريخ
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجلات التغذية المنجزة</CardTitle>
              <CardDescription>
                الوجبات المسجلة لتاريخ{" "}
                {formatArabicDate(new Date(selectedDate))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الوقت</TableHead>
                      <TableHead className="text-right">الحظيرة</TableHead>
                      <TableHead className="text-right">نوع العلف</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">
                        المسجل بواسطة
                      </TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayRecords.map((record) => {
                      const barn = barns.find((b) => b.id === record.barnId);
                      const feedItem = inventoryItems.find(
                        (i) => i.id === record.feedItemId,
                      );

                      return (
                        <TableRow key={record.id}>
                          <TableCell className="text-right">
                            {record.time.toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="text-right">{barn?.name || record.barnId}</TableCell>
                          <TableCell className="text-right">{feedItem?.name || "غير معروف"}</TableCell>
                          <TableCell className="text-right">{formatWeight(record.qtyKg)}</TableCell>
                          <TableCell className="text-right">{record.recordedBy}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditFeeding(record)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {todayRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          لم يتم تسجيل أي وجبات لهذا التاريخ
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <BarChart3 className="h-5 w-5 text-farm-600" />
                  <span>استهلاك العلف حسب النوع</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryItems.map((item) => {
                    const consumed = todayRecords
                      .filter((r) => r.feedItemId === item.id)
                      .reduce((sum, r) => sum + r.qtyKg, 0);

                    if (consumed === 0) return null;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between"
                      >
                        <span className="font-medium">{item.name}</span>
                        <div className="text-left">
                          <div className="font-semibold">
                            {formatWeight(consumed)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatArabicNumber(
                              todayRecords.filter(
                                (r) => r.feedItemId === item.id,
                              ).length,
                            )}{" "}
                            وجب��
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Calendar className="h-5 w-5 text-farm-600" />
                  <span>معدل التغذية الأس����وعي</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-farm-800">
                      {formatWeight(totalActualFeeding * 7)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      متوسط الاستهلاك الأسبوعي المتوقع
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>اليوم</span>
                      <span>{formatWeight(totalActualFeeding)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>أمس</span>
                      <span>{formatWeight(totalActualFeeding * 0.9)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>منذ يومين</span>
                      <span>{formatWeight(totalActualFeeding * 1.1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Feeding Modal */}
      <FeedingFormModal
        isOpen={showFeedingModal}
        onClose={() => setShowFeedingModal(false)}
        onSave={handleModalSave}
        feedingRecord={selectedFeedingRecord}
        mode={modalMode}
        preselectedBarnId={preselectedBarnId}
      />
    </div>
  );
}
