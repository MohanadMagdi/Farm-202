import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import {
  Home,
  Users,
  Building,
  Package,
  Activity,
  FileText,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Bell,
  HelpCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  Star,
  Bookmark,
  Calendar,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Copy,
  Share,
  Download,
  Upload,
  Edit,
  Trash2,
  Archive,
  MoreHorizontal,
} from "lucide-react";

interface NavigationButtonsProps {
  onActionComplete?: () => void;
}

export default function NavigationButtons({ onActionComplete }: NavigationButtonsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Main navigation items
  const mainNavigation = [
    { path: "/", label: "الرئيسية", icon: Home, color: "text-blue-600" },
    { path: "/animals", label: "الحيوانات", icon: Users, color: "text-green-600" },
    { path: "/barns", label: "الحظائر", icon: Building, color: "text-orange-600" },
    { path: "/inventory", label: "المخزون", icon: Package, color: "text-purple-600" },
    { path: "/feeding", label: "التغذية", icon: Activity, color: "text-red-600" },
    { path: "/reports", label: "التقارير", icon: FileText, color: "text-indigo-600" },
  ];

  // Quick action buttons
  const quickActions = [
    {
      label: "إضافة حيوان",
      icon: Plus,
      color: "bg-green-600 hover:bg-green-700",
      action: () => navigate("/animals?action=add"),
    },
    {
      label: "تسجيل وزن",
      icon: Activity,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => navigate("/animals?action=weight"),
    },
    {
      label: "صرف علف",
      icon: Package,
      color: "bg-orange-600 hover:bg-orange-700",
      action: () => navigate("/feeding?action=add"),
    },
    {
      label: "تقرير سريع",
      icon: FileText,
      color: "bg-purple-600 hover:bg-purple-700",
      action: () => navigate("/reports?type=daily"),
    },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // Global search functionality
      const [animals, barns, items] = await Promise.all([
        dataService.animals.getAll(),
        dataService.barns.getAll(),
        dataService.warehouseItems.getAll(),
      ]);

      // Search in all entities
      const searchResults = [
        ...animals.filter(a => 
          a.earTagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.healthStatus.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(a => ({ type: 'animal', data: a, path: '/animals' })),
        
        ...barns.filter(b => 
          b.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(b => ({ type: 'barn', data: b, path: '/barns' })),
        
        ...items.filter(i => 
          i.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(i => ({ type: 'item', data: i, path: '/inventory' })),
      ];

      if (searchResults.length > 0) {
        toast({
          title: "نتائج البحث",
          description: `تم العثور على ${searchResults.length} نتيجة`,
        });
        
        // Navigate to first result or show results page
        if (searchResults.length === 1) {
          navigate(searchResults[0].path);
        } else {
          // Could navigate to a search results page
          toast({
            title: "عدة نتائج",
            description: "تم العثور على عدة نتائج مطابقة",
          });
        }
      } else {
        toast({
          title: "لا توجد نتائج",
          description: "لم يتم العثور على نتائج مطابقة",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Refresh current page data
      window.location.reload();
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث البيانات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="space-y-4">
      {/* Main Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Menu className="h-5 w-5" />
            التنقل الرئيسي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "outline"}
                  className={`justify-start h-auto p-3 ${
                    isActive ? "bg-primary" : "hover:bg-accent"
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className={`h-5 w-5 ml-2 ${
                    isActive ? "text-primary-foreground" : item.color
                  }`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <Badge variant="secondary" className="mr-auto">
                      نشط
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              
              return (
                <Button
                  key={index}
                  className={`h-auto flex-col space-y-2 p-4 text-white ${action.color}`}
                  onClick={action.action}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            شريط الأدوات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Input
                  placeholder="البحث في النظام..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pr-10"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute left-1 top-1 h-8 w-8 p-0"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Toolbar Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              title="تحديث البيانات"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              title="البحث المتقدم"
            >
              <Filter className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(true)}
              title="المساعدة"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>خيارات إضافية</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 ml-2" />
                  الإعدادات
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => {}}>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير البيانات
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => {}}>
                  <Upload className="h-4 w-4 ml-2" />
                  استيراد البيانات
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => {}}>
                  <Bookmark className="h-4 w-4 ml-2" />
                  المفضلة
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => {}}>
                  <Calendar className="h-4 w-4 ml-2" />
                  التقويم
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => {}}>
                  <BarChart3 className="h-4 w-4 ml-2" />
                  الإحصائيات
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>النظام متصل</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>آخر تحديث: الآن</span>
              </div>

              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>مستخدم نشط</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                الصفحة الحالية: {location.pathname}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مساعدة النظام</DialogTitle>
            <DialogDescription>
              دليل سريع للاستخدام والتنقل في النظام
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">التنقل الأساسي</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• استخدم القائمة الرئيسية للتنقل بين الأقسام</li>
                <li>• استخدم البحث السريع للعثور على البيانات</li>
                <li>• استخدم الإجراءات السريعة للمهام الشائعة</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">اختصارات لوحة المفاتيح</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Ctrl+S: حفظ سريع</li>
                <li>• Ctrl+F: البحث</li>
                <li>• F5: تحديث الصفحة</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowHelp(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
