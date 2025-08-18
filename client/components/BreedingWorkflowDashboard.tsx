import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Baby,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { formatArabicDate } from "@/lib/arabic-utils";
import {
  getWeaningCandidates,
  getBreedingWorkflowStats,
  performWeaningTransfer,
  performAutomaticWeaningCheck,
  WEANING_CONFIG,
  type WeaningCandidate,
  type BreedingWorkflowStats,
} from "@/lib/breeding-workflow";

export default function BreedingWorkflowDashboard() {
  const [candidates, setCandidates] = useState<WeaningCandidate[]>([]);
  const [stats, setStats] = useState<BreedingWorkflowStats>({
    totalNewborns: 0,
    readyForWeaning: 0,
    weaningThisWeek: 0,
    weaningThisMonth: 0,
    overdue: 0,
    averageWeaningAge: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] =
    useState<WeaningCandidate | null>(null);
  const [showWeaningModal, setShowWeaningModal] = useState(false);
  const [weaningNotes, setWeaningNotes] = useState("");
  const [processingWeaning, setProcessingWeaning] = useState(false);
  const [autoScanResults, setAutoScanResults] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [candidatesData, statsData] = await Promise.all([
        getWeaningCandidates(),
        getBreedingWorkflowStats(),
      ]);

      setCandidates(candidatesData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading breeding workflow data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات سير العمل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWeaningTransfer = async () => {
    if (!selectedCandidate) return;

    try {
      setProcessingWeaning(true);

      const result = await performWeaningTransfer(selectedCandidate.id, {
        notes: weaningNotes || undefined,
        recordedBy: "user", // This should come from auth context
      });

      if (result.success) {
        toast({
          title: "تم الفطام بنجاح",
          description: result.message,
        });

        // Refresh data
        await loadData();

        // Close modal
        setShowWeaningModal(false);
        setSelectedCandidate(null);
        setWeaningNotes("");
      } else {
        toast({
          title: "فشل في الفطام",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error performing weaning:", error);
      toast({
        title: "خطأ في الفطام",
        description: "حدث خطأ أثناء عملية الفطام",
        variant: "destructive",
      });
    } finally {
      setProcessingWeaning(false);
    }
  };

  const handleAutoScan = async () => {
    try {
      const results = await performAutomaticWeaningCheck();
      setAutoScanResults(results.notifications);

      if (results.autoTransferred > 0) {
        toast({
          title: "تم الفطام التلقائي",
          description: `تم فطام ${results.autoTransferred} من الحيوانات تلقائياً`,
        });
        await loadData();
      } else if (results.readyForWeaning > 0) {
        toast({
          title: "فحص مكتمل",
          description: `تم العثور على ${results.readyForWeaning} حيوان جاهز للفطام`,
        });
      } else {
        toast({
          title: "لا توجد حيوانات جاهزة",
          description: "لا توجد حيوانات جاهزة للفطام حالياً",
        });
      }
    } catch (error) {
      console.error("Error in auto scan:", error);
      toast({
        title: "خطأ في الفحص التلقائي",
        description: "حدث خطأ أثناء الفحص التلقائي",
        variant: "destructive",
      });
    }
  };

  const openWeaningModal = (candidate: WeaningCandidate) => {
    setSelectedCandidate(candidate);
    setWeaningNotes("");
    setShowWeaningModal(true);
  };

  const getStatusBadge = (candidate: WeaningCandidate) => {
    if (candidate.isReadyForWeaning) {
      if (candidate.currentAge >= WEANING_CONFIG.MAX_WEANING_AGE_MONTHS) {
        return <Badge variant="destructive">متأخر جداً</Badge>;
      } else if (
        candidate.currentAge >= WEANING_CONFIG.STANDARD_WEANING_AGE_MONTHS
      ) {
        return <Badge variant="default">جاهز</Badge>;
      } else {
        return <Badge variant="secondary">قريب</Badge>;
      }
    } else {
      return <Badge variant="outline">غير جاهز</Badge>;
    }
  };

  const getUrgencyColor = (candidate: WeaningCandidate) => {
    if (candidate.currentAge >= WEANING_CONFIG.MAX_WEANING_AGE_MONTHS) {
      return "border-r-red-500 bg-red-50";
    } else if (candidate.isReadyForWeaning) {
      return "border-r-yellow-500 bg-yellow-50";
    } else {
      return "border-r-gray-300 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المواليد
            </CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNewborns}</div>
            <p className="text-xs text-muted-foreground">
              متوسط العمر: {stats.averageWeaningAge} شهر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">جاهز للفطام</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.readyForWeaning}
            </div>
            <p className="text-xs text-muted-foreground">متاح للنقل فوراً</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هذا الأسبوع</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.weaningThisWeek}
            </div>
            <p className="text-xs text-muted-foreground">موعد فطام متوقع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متأخر</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
            <p className="text-xs text-muted-foreground">تجاوز موعد الفطام</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">سير عمل التربية والفطام</h2>
          <p className="text-muted-foreground">
            إدارة فطام المواليد ونقلها للفئات المناسبة
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            تحديث البيانات
          </Button>
          <Button onClick={handleAutoScan}>
            <Zap className="h-4 w-4 mr-2" />
            فحص تلقائي
          </Button>
        </div>
      </div>

      {/* Auto Scan Results */}
      {autoScanResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نتائج الفحص التلقائي</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {autoScanResults.map((result, index) => (
                <li key={index} className="text-sm">
                  • {result}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Weaning Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle>مرشحات الفطام</CardTitle>
          <CardDescription>
            المواليد المؤهلة للفطام ونقلها للفئات المناسبة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مواليد حالياً
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الأذن</TableHead>
                  <TableHead>الأم</TableHead>
                  <TableHead>العمر</TableHead>
                  <TableHead>الوزن</TableHead>
                  <TableHead>موعد الفطام المتوقع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الفئة الجديدة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    className={`border-r-4 ${getUrgencyColor(candidate)}`}
                  >
                    <TableCell className="font-medium">
                      {candidate.earTagId}
                    </TableCell>
                    <TableCell>
                      {candidate.motherEarTagId || "غير محدد"}
                    </TableCell>
                    <TableCell>{candidate.currentAge} شهر</TableCell>
                    <TableCell>{candidate.currentWeight} كيلو</TableCell>
                    <TableCell>
                      {formatArabicDate(candidate.estimatedWeaningDate)}
                    </TableCell>
                    <TableCell>{getStatusBadge(candidate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {candidate.newCategory === "male" ? "ذكر" : "أنثى"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {candidate.isReadyForWeaning ? (
                        <Button
                          size="sm"
                          onClick={() => openWeaningModal(candidate)}
                        >
                          فطام
                        </Button>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {candidate.reasonsNotReady[0]}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Weaning Modal */}
      <Dialog open={showWeaningModal} onOpenChange={setShowWeaningModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد الفطام</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من فطام {selectedCandidate?.earTagId} ونقله إلى فئة{" "}
              {selectedCandidate?.newCategory === "male" ? "الذكور" : "الإناث"}؟
            </DialogDescription>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">العمر الحالي:</span>{" "}
                  {selectedCandidate.currentAge} شهر
                </div>
                <div>
                  <span className="font-medium">الوزن:</span>{" "}
                  {selectedCandidate.currentWeight} كيلو
                </div>
                <div>
                  <span className="font-medium">الأم:</span>{" "}
                  {selectedCandidate.motherEarTagId || "غير محدد"}
                </div>
                <div>
                  <span className="font-medium">تاريخ الميلاد:</span>{" "}
                  {formatArabicDate(selectedCandidate.birthDate)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  ملاحظات (اختيارية)
                </label>
                <Textarea
                  value={weaningNotes}
                  onChange={(e) => setWeaningNotes(e.target.value)}
                  placeholder="أضف أي ملاحظات حول عملية الفطام..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWeaningModal(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleWeaningTransfer}
              disabled={processingWeaning}
            >
              {processingWeaning ? "جاري الفطام..." : "تأكيد الفطام"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
