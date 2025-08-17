import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { dataService } from "@/lib/data-service";
import {
  Plus,
  Scale,
  Package,
  Heart,
  Bell,
  FileText,
  Users,
  Truck,
  Calculator,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Map,
  Settings,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Archive,
  Trash2,
  Edit,
  Eye,
  Share,
  Print,
  Save,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  Info,
  HelpCircle,
  Star,
  Bookmark,
} from "lucide-react";

interface QuickActionButtonsProps {
  onActionComplete?: () => void;
}

export default function QuickActionButtons({ onActionComplete }: QuickActionButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);
  const [showFeedDialog, setShowFeedDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleQuickWeight = async (weightData: any) => {
    setLoading(true);
    try {
      // Implementation for quick weight recording
      await dataService.weightRecords.create(weightData);
      toast({
        title: "تم تسجيل الوزن",
        description: "تم تسجيل الوزن بنجاح",
      });
      setShowWeightDialog(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الوزن",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTreatment = async (treatmentData: any) => {
    setLoading(true);
    try {
      // Implementation for quick treatment recording
      await dataService.medicalRecords.create(treatmentData);
      toast({
        title: "تم تسجيل العلاج",
        description: "تم تسجيل العلاج بنجاح",
      });
      setShowTreatmentDialog(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل العلاج",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFeed = async (feedData: any) => {
    setLoading(true);
    try {
      // Implementation for quick feed dispensing
      await dataService.feedingRecords.create(feedData);
      toast({
        title: "تم صرف العلف",
        description: "تم صرف العلف بنجاح",
      });
      setShowFeedDialog(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء صرف العلف",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    setLoading(true);
    try {
      // Implementation for quick report generation
      const reportData = await dataService.reports.generate(reportType);
      toast({
        title: "تم إنشاء التقرير",
        description: "تم إنشاء التقرير بنجاح",
      });
      setShowReportDialog(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            إجراءات سريعة
          </CardTitle>
          <CardDescription>
            الإجراءات الأكثر استخداماً في إدارة المزرعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Quick Weight Recording */}
            <Button
              className="h-auto flex-col space-y-2 p-4 w-full hover:scale-105 transition-transform"
              variant="outline"
              onClick={() => setShowWeightDialog(true)}
            >
              <Scale className="h-8 w-8 text-green-600" />
              <span className="font-medium">تسجيل وزن سريع</span>
              <span className="text-xs text-muted-foreground">تسجيل وزن جديد</span>
            </Button>

            {/* Quick Treatment */}
            <Button
              className="h-auto flex-col space-y-2 p-4 w-full hover:scale-105 transition-transform"
              variant="outline"
              onClick={() => setShowTreatmentDialog(true)}
            >
              <Heart className="h-8 w-8 text-red-600" />
              <span className="font-medium">علاج سريع</span>
              <span className="text-xs text-muted-foreground">تسجيل علاج طارئ</span>
            </Button>

            {/* Quick Feed Dispensing */}
            <Button
              className="h-auto flex-col space-y-2 p-4 w-full hover:scale-105 transition-transform"
              variant="outline"
              onClick={() => setShowFeedDialog(true)}
            >
              <Package className="h-8 w-8 text-blue-600" />
              <span className="font-medium">صرف علف</span>
              <span className="text-xs text-muted-foreground">صرف علف للحظائر</span>
            </Button>

            {/* Quick Report */}
            <Button
              className="h-auto flex-col space-y-2 p-4 w-full hover:scale-105 transition-transform"
              variant="outline"
              onClick={() => setShowReportDialog(true)}
            >
              <FileText className="h-8 w-8 text-purple-600" />
              <span className="font-medium">تقرير سريع</span>
              <span className="text-xs text-muted-foreground">إنشاء تقرير فوري</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-secondary" />
            أدوات إضافية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {/* Data Export */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto p-3 hover:bg-green-50"
            >
              <Download className="h-5 w-5 text-green-600 mb-1" />
              <span className="text-xs">تصدير</span>
            </Button>

            {/* Data Import */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto p-3 hover:bg-blue-50"
            >
              <Upload className="h-5 w-5 text-blue-600 mb-1" />
              <span className="text-xs">استيراد</span>
            </Button>

            {/* Search */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto p-3 hover:bg-orange-50"
            >
              <Search className="h-5 w-5 text-orange-600 mb-1" />
              <span className="text-xs">بحث</span>
            </Button>

            {/* Filter */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto p-3 hover:bg-purple-50"
            >
              <Filter className="h-5 w-5 text-purple-600 mb-1" />
              <span className="text-xs">تصفية</span>
            </Button>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto p-3 hover:bg-indigo-50"
            >
              <RefreshCw className="h-5 w-5 text-indigo-600 mb-1" />
              <span className="text-xs">تحديث</span>
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto p-3 hover:bg-gray-50"
            >
              <Settings className="h-5 w-5 text-gray-600 mb-1" />
              <span className="text-xs">إعدادات</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Weight Dialog */}
      <Dialog open={showWeightDialog} onOpenChange={setShowWeightDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل وزن سريع</DialogTitle>
            <DialogDescription>
              تسجيل وزن جديد لحيوان محدد
            </DialogDescription>
          </DialogHeader>
          {/* Dialog content implementation */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWeightDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={() => handleQuickWeight({})} disabled={loading}>
              {loading ? "جاري التسجيل..." : "تسجيل الوزن"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Treatment Dialog */}
      <Dialog open={showTreatmentDialog} onOpenChange={setShowTreatmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل علاج سريع</DialogTitle>
            <DialogDescription>
              تسجيل علاج طارئ لحيوان محدد
            </DialogDescription>
          </DialogHeader>
          {/* Dialog content implementation */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTreatmentDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={() => handleQuickTreatment({})} disabled={loading}>
              {loading ? "جاري التسجيل..." : "تسجيل العلاج"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Feed Dialog */}
      <Dialog open={showFeedDialog} onOpenChange={setShowFeedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>صرف علف سريع</DialogTitle>
            <DialogDescription>
              صرف علف للحظائر المحددة
            </DialogDescription>
          </DialogHeader>
          {/* Dialog content implementation */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={() => handleQuickFeed({})} disabled={loading}>
              {loading ? "جاري الصرف..." : "صرف العلف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء تقرير سريع</DialogTitle>
            <DialogDescription>
              إنشاء تقرير فوري للحالة الحالية
            </DialogDescription>
          </DialogHeader>
          {/* Dialog content implementation */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={() => handleGenerateReport("daily")} disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء التقرير"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
