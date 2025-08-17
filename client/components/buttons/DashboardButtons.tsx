import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { dataService } from "@/lib/data-service";
import type { Animal, Barn, WarehouseItem, FeedingRecord } from "@shared/types";
import {
  Plus,
  TrendingUp,
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  BarChart3,
  Users,
  Building,
  Package,
  Heart,
  Scale,
  Zap,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Settings,
  HelpCircle,
  Star,
  Bookmark,
  Search,
  Filter,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Maximize,
  Minimize,
  ExternalLink,
  Share,
  Copy,
  Save,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";

interface DashboardButtonsProps {
  onActionComplete?: () => void;
}

export default function DashboardButtons({ onActionComplete }: DashboardButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAnimals: 0,
    totalBarns: 0,
    totalItems: 0,
    recentFeedings: 0,
    alertsCount: 0,
    healthyAnimals: 0,
    sickAnimals: 0,
  });
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [animals, barns, items, feedings] = await Promise.all([
        dataService.animals.getAll(),
        dataService.barns.getAll(),
        dataService.warehouseItems.getAll(),
        dataService.feedingRecords.getAll(),
      ]);

      const healthyAnimals = animals.filter(a => 
        ["سليم", "سليمة", "healthy"].includes(a.healthStatus)
      ).length;

      setStats({
        totalAnimals: animals.length,
        totalBarns: barns.length,
        totalItems: items.length,
        recentFeedings: feedings.filter(f => {
          const feedingDate = new Date(f.date);
          const today = new Date();
          const diffDays = Math.ceil((today.getTime() - feedingDate.getTime()) / (1000 * 3600 * 24));
          return diffDays <= 7;
        }).length,
        alertsCount: animals.filter(a => a.isIsolated || a.healthStatus === "مريض").length,
        healthyAnimals,
        sickAnimals: animals.length - healthyAnimals,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const quickActionButtons = [
    {
      title: "إضافة حيوان جديد",
      description: "تسجيل حيوان جديد في النظام",
      icon: Plus,
      color: "bg-green-600 hover:bg-green-700",
      path: "/animals?action=add",
      shortcut: "Ctrl+N",
    },
    {
      title: "تسجيل وزن",
      description: "تسجيل وزن جديد لحيوان",
      icon: Scale,
      color: "bg-blue-600 hover:bg-blue-700",
      path: "/animals?action=weight",
      shortcut: "Ctrl+W",
    },
    {
      title: "تسجيل علاج",
      description: "تسجيل علاج أو فحص طبي",
      icon: Heart,
      color: "bg-red-600 hover:bg-red-700",
      path: "/animals?action=treatment",
      shortcut: "Ctrl+T",
    },
    {
      title: "صرف علف",
      description: "صرف علف للحظائر",
      icon: Package,
      color: "bg-orange-600 hover:bg-orange-700",
      path: "/feeding?action=add",
      shortcut: "Ctrl+F",
    },
    {
      title: "تقرير يومي",
      description: "إنشاء تقرير للحالة اليومية",
      icon: FileText,
      color: "bg-purple-600 hover:bg-purple-700",
      path: "/reports?type=daily",
      shortcut: "Ctrl+R",
    },
    {
      title: "إدارة الحظائر",
      description: "عرض وإدارة الحظائر",
      icon: Building,
      color: "bg-indigo-600 hover:bg-indigo-700",
      path: "/barns",
      shortcut: "Ctrl+B",
    },
  ];

  const analyticsButtons = [
    {
      title: "تحليل الأداء",
      value: "95%",
      icon: TrendingUp,
      color: "text-green-600",
      change: "+5%",
      description: "مقارنة بالشهر الماضي",
    },
    {
      title: "معدل النمو",
      value: "0.3 كيلو/يوم",
      icon: Activity,
      color: "text-blue-600",
      change: "+0.1",
      description: "متوسط الزيادة اليومية",
    },
    {
      title: "كفاءة التغذية",
      value: "4.2:1",
      icon: Target,
      color: "text-orange-600",
      change: "ثابت",
      description: "نسبة العلف للنمو",
    },
    {
      title: "الحالة الصحية",
      value: `${((stats.healthyAnimals / stats.totalAnimals) * 100).toFixed(1)}%`,
      icon: Heart,
      color: "text-red-600",
      change: "+2%",
      description: "نسبة الحيوانات السليمة",
    },
  ];

  const handleQuickAction = async (path: string) => {
    setLoading(true);
    try {
      // Navigate to the specified path
      window.open(path, '_self');
      onActionComplete?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تنفيذ الإجراء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    setLoading(true);
    await loadStats();
    setLoading(false);
    toast({
      title: "تم التحديث",
      description: "تم تحديث الإحصائيات بنجاح",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with main actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-farm-800">لوحة التحكم</h2>
          <p className="text-muted-foreground">
            نظرة عامة على حالة المزرعة والإجراءات السريعة
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStats}
            disabled={loading}
            title="تحديث الإحصائيات"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatsDialog(true)}
            title="عرض الإحصائيات المفصلة"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={() => setShowQuickActions(true)}
          >
            <Zap className="h-4 w-4 ml-2" />
            إجراءات سريعة
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الحيوانات</p>
                <p className="text-2xl font-bold">{stats.totalAnimals}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                سليم: {stats.healthyAnimals}
              </Badge>
              {stats.sickAnimals > 0 && (
                <Badge variant="destructive" className="text-xs">
                  مريض: {stats.sickAnimals}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد الحظائر</p>
                <p className="text-2xl font-bold">{stats.totalBarns}</p>
              </div>
              <Building className="h-8 w-8 text-orange-600" />
            </div>
            <Link to="/barns">
              <Button size="sm" variant="outline" className="w-full mt-2">
                <Eye className="h-3 w-3 ml-1" />
                عرض الحظائر
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">أصناف المخزون</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <Link to="/inventory">
              <Button size="sm" variant="outline" className="w-full mt-2">
                <Eye className="h-3 w-3 ml-1" />
                عرض المخزون
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">التنبيهات</p>
                <p className="text-2xl font-bold">{stats.alertsCount}</p>
              </div>
              <Bell className={`h-8 w-8 ${stats.alertsCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            {stats.alertsCount > 0 && (
              <Button size="sm" variant="outline" className="w-full mt-2 text-red-600">
                <AlertTriangle className="h-3 w-3 ml-1" />
                عرض التنبيهات
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            مؤشرات الأداء
          </CardTitle>
          <CardDescription>
            مقاييس مهمة لمتابعة أداء المزرعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {analyticsButtons.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    <span className="text-sm font-medium">{metric.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {metric.change}
                  </Badge>
                </div>
                <div>
                  <p className="text-xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            الإجراءات السريعة
          </CardTitle>
          <CardDescription>
            الإجراءات الأكثر استخداماً في إدارة المزرعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActionButtons.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className={`h-auto p-4 justify-start text-right hover:scale-[1.02] transition-transform`}
                onClick={() => handleQuickAction(action.path)}
                disabled={loading}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`p-2 rounded-lg text-white ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="text-right flex-1">
                    <h3 className="font-medium text-sm">{action.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                    {action.shortcut && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {action.shortcut}
                      </Badge>
                    )}
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            النشاط الأخير
          </CardTitle>
          <CardDescription>
            آخر الإجراءات المتم تنفيذها في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm">تم إضافة حيوان جديد (M-205)</p>
                <p className="text-xs text-muted-foreground">منذ ساعتين</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50">
              <Scale className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm">تم تسجيل وزن للحيوان F-120 (52.3 كيلو)</p>
                <p className="text-xs text-muted-foreground">منذ 4 ساعات</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2 rounded-lg bg-orange-50">
              <Package className="h-4 w-4 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm">تم صرف علف للحظيرة الأولى (50 كيلو)</p>
                <p className="text-xs text-muted-foreground">منذ 6 ساعات</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Link to="/reports?type=activity">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 ml-2" />
                عرض جميع الأنشطة
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إحصائيات مفصلة</DialogTitle>
            <DialogDescription>
              تفاصيل شاملة عن حالة المزرعة الحالية
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">توزيع الحيوانات</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>الحيوانات السليمة</span>
                    <span>{stats.healthyAnimals}</span>
                  </div>
                  <Progress value={(stats.healthyAnimals / stats.totalAnimals) * 100} className="h-2" />
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">النشاط الأسبوعي</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>وجبات التغذية</span>
                    <span>{stats.recentFeedings}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowStatsDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
