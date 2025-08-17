import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { dataService, farmHelpers } from "@/lib/data-service";
import type { Barn, Animal, BarnType, WeightRecord, FeedingRecord } from "@/../../shared/types";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Building2,
  Users,
  MapPin,
  Edit,
  Eye,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  Scale,
  Trash2,
  Home,
  Utensils,
} from "lucide-react";

import { BarnAnimalsList } from "@/components/BarnAnimalsList";
import { BarnFeedingData } from "@/components/BarnFeedingData";
import { BarnEfficiencyData } from "@/components/BarnEfficiencyData";
import { BarnEquipmentList } from "@/components/BarnEquipmentList";

const barnTypeLabels: Record<BarnType, string> = {
  male: "ذكور",
  female: "إناث",
  newborn: "صغار",
  mixed: "مختلط",
};

const barnTypeIcons: Record<BarnType, any> = {
  male: Users,
  female: Users,
  newborn: Home,
  mixed: Building2,
};

const barnTypeColors: Record<BarnType, string> = {
  male: "text-blue-600",
  female: "text-pink-600",
  newborn: "text-green-600",
  mixed: "text-purple-600",
};

interface BarnFormData {
  name: string;
  type: BarnType;
  capacity: string;
  location: string;
  description: string;
  isActive: boolean;
}

export default function BarnsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [barns, setBarns] = useState<Barn[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Analytics
  const [analytics, setAnalytics] = useState({
    totalBarns: 0,
    activeBarns: 0,
    totalCapacity: 0,
    totalOccupancy: 0,
    fullBarns: 0,
    nearFullBarns: 0,
    avgOccupancyRate: 0,
  });

  // Barn form modal
  const [showBarnModal, setShowBarnModal] = useState(false);
  const [selectedBarn, setSelectedBarn] = useState<Barn | null>(null);
  const [barnFormMode, setBarnFormMode] = useState<"add" | "edit">("add");
  const [barnFormData, setBarnFormData] = useState<BarnFormData>({
    name: "",
    type: "male",
    capacity: "",
    location: "",
    description: "",
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Animal transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    animalId: "",
    fromBarnId: "",
    toBarnId: "",
    reason: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [barnsData, animalsData, weightData, feedingData] = await Promise.all([
        dataService.barns.getAll(),
        dataService.animals.getAll(),
        dataService.weightRecords.getAll(),
        dataService.feedingRecords.getAll(),
      ]);

      setBarns(barnsData);
      setAnimals(animalsData);
      setWeightRecords(weightData);
      setFeedingRecords(feedingData);
      calculateAnalytics(barnsData, animalsData);
    } catch (error) {
      console.error("Error loading barn data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الحظائر",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (barnsData: Barn[], animalsData: Animal[]) => {
    const totalBarns = barnsData.length;
    const activeBarns = barnsData.filter(barn => barn.isActive).length;
    const totalCapacity = barnsData.reduce((sum, barn) => sum + barn.capacity, 0);
    
    // Calculate occupancy for each barn
    const barnOccupancy = barnsData.map(barn => {
      const occupancy = animalsData.filter(animal => animal.barnId === barn.id).length;
      return { ...barn, currentOccupancy: occupancy };
    });

    const totalOccupancy = barnOccupancy.reduce((sum, barn) => sum + barn.currentOccupancy, 0);
    const fullBarns = barnOccupancy.filter(barn => barn.currentOccupancy >= barn.capacity).length;
    const nearFullBarns = barnOccupancy.filter(barn => 
      barn.currentOccupancy / barn.capacity >= 0.8 && barn.currentOccupancy < barn.capacity
    ).length;
    const avgOccupancyRate = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

    setAnalytics({
      totalBarns,
      activeBarns,
      totalCapacity,
      totalOccupancy,
      fullBarns,
      nearFullBarns,
      avgOccupancyRate,
    });
  };

  const getBarnOccupancy = (barnId: string) => {
    return animals.filter(animal => animal.barnId === barnId).length;
  };

  const getBarnAnimals = (barnId: string) => {
    return animals.filter(animal => animal.barnId === barnId);
  };

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 100) return "text-red-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-green-600";
  };

  const getOccupancyBadge = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 100)
      return { text: "ممتلئة", color: "bg-red-100 text-red-800" };
    if (percentage >= 80)
      return { text: "شبه ممتلئة", color: "bg-yellow-100 text-yellow-800" };
    if (percentage === 0)
      return { text: "فارغة", color: "bg-gray-100 text-gray-800" };
    return { text: "متاحة", color: "bg-green-100 text-green-800" };
  };

  const handleAddBarn = () => {
    setBarnFormData({
      name: "",
      type: "male",
      capacity: "",
      location: "",
      description: "",
      isActive: true,
    });
    setBarnFormMode("add");
    setSelectedBarn(null);
    setShowBarnModal(true);
  };

  const handleEditBarn = (barn: Barn) => {
    setBarnFormData({
      name: barn.name,
      type: barn.type,
      capacity: barn.capacity.toString(),
      location: barn.location,
      description: barn.description || "",
      isActive: barn.isActive,
    });
    setBarnFormMode("edit");
    setSelectedBarn(barn);
    setShowBarnModal(true);
  };

  const handleViewBarn = (barn: Barn) => {
    setSelectedBarn(barn);
  };

  const handleSaveBarn = async () => {
    setFormLoading(true);
    try {
      const barnData: Omit<Barn, 'id'> = {
        name: barnFormData.name,
        type: barnFormData.type,
        capacity: parseInt(barnFormData.capacity),
        location: barnFormData.location,
        description: barnFormData.description || undefined,
        isActive: barnFormData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (barnFormMode === "edit" && selectedBarn) {
        await dataService.barns.update(selectedBarn.id, barnData);
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث بيانات الحظيرة ${barnFormData.name}`,
        });
      } else {
        await dataService.barns.create(barnData);
        toast({
          title: "تم الإضافة بنجاح",
          description: `تم إضافة الحظيرة ${barnFormData.name} بنجاح`,
        });
      }

      setShowBarnModal(false);
      loadData();
    } catch (error) {
      console.error("Error saving barn:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ بيانات الحظيرة",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBarn = async (barn: Barn) => {
    const occupancy = getBarnOccupancy(barn.id);
    
    if (occupancy > 0) {
      toast({
        title: "لا يمكن حذف الحظيرة",
        description: "يجب نقل جميع الحيوانات من الحظيرة قبل حذفها",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`هل أنت متأكد من حذف الحظيرة ${barn.name}؟`)) {
      try {
        await dataService.barns.delete(barn.id);
        toast({
          title: "تم الحذف بنجاح",
          description: `تم حذف الحظيرة ${barn.name} بنجاح`,
        });
        loadData();
      } catch (error) {
        console.error("Error deleting barn:", error);
        toast({
          title: "خطأ في الحذف",
          description: "حدث خطأ أثناء حذف الحظيرة",
          variant: "destructive",
        });
      }
    }
  };

  const openTransferModal = (barn: Barn) => {
    setTransferData({
      animalId: "",
      fromBarnId: barn.id,
      toBarnId: "",
      reason: "",
    });
    setShowTransferModal(true);
  };

  const handleTransferAnimal = async () => {
    try {
      const movement = {
        animalId: transferData.animalId,
        fromBarnId: transferData.fromBarnId,
        toBarnId: transferData.toBarnId,
        date: new Date(),
        reason: transferData.reason,
        recordedBy: "مدير المزرعة", // TODO: Get from auth context
      };

      await dataService.barnMovements.create(movement);

      // Update animal's barn
      await dataService.animals.update(transferData.animalId, {
        barnId: transferData.toBarnId,
        updatedAt: new Date(),
        updatedBy: "مدير المزرعة",
      });

      toast({
        title: "تم النقل بنجاح",
        description: "تم نقل الحيوان إلى الحظيرة الجديدة",
      });

      setShowTransferModal(false);
      loadData();
    } catch (error) {
      console.error("Error transferring animal:", error);
      toast({
        title: "خطأ في النقل",
        description: "حدث خطأ أثناء نقل الحيوان",
        variant: "destructive",
      });
    }
  };

  const filteredBarns = barns
    .filter(
      (barn) =>
        barn.name.includes(searchTerm) ||
        barn.location.includes(searchTerm) ||
        barn.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((barn) => typeFilter === "all" || barn.type === typeFilter)
    .filter((barn) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return barn.isActive;
      if (statusFilter === "inactive") return !barn.isActive;
      
      const occupancy = getBarnOccupancy(barn.id);
      if (statusFilter === "full") return occupancy >= barn.capacity;
      if (statusFilter === "near_full") return occupancy / barn.capacity >= 0.8;
      if (statusFilter === "empty") return occupancy === 0;
      
      return true;
    });

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

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">إدارة الحظائر</h1>
          <p className="text-muted-foreground">
            عرض وإدارة حظائر المزرعة ونقل الحيوانات
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowTransferModal(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            نقل الحيوانات
          </Button>
          <Button onClick={handleAddBarn}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة حظيرة جديدة
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحظائر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {analytics.totalBarns}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeBarns} حظيرة نشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">السعة الإجمالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {analytics.totalCapacity}
            </div>
            <p className="text-xs text-muted-foreground">حيوان كحد أقصى</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الإشغال الحالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {analytics.totalOccupancy}
            </div>
            <Progress value={analytics.avgOccupancyRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(analytics.avgOccupancyRate)}% من السعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">معدل الإشغال</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {Math.round(analytics.avgOccupancyRate)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span>كفاءة عالية</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">تنبيهات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {analytics.fullBarns > 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {analytics.fullBarns}
                    </div>
                    <p className="text-xs text-muted-foreground">حظيرة ممتلئة</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <p className="text-xs text-muted-foreground">لا توجد تنبيهات</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث باسم الحظيرة أو الموقع أو الرقم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="نوع الحظيرة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(barnTypeLabels).map(([type, label]) => (
                  <SelectItem key={type} value={type}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="حالة الإشغال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشطة</SelectItem>
                <SelectItem value="inactive">غير نشطة</SelectItem>
                <SelectItem value="empty">فارغة</SelectItem>
                <SelectItem value="near_full">شبه ممتلئة</SelectItem>
                <SelectItem value="full">ممتلئة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Barns Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBarns.map((barn) => {
          const occupancy = getBarnOccupancy(barn.id);
          const occupancyPercentage = (occupancy / barn.capacity) * 100;
          const occupancyBadge = getOccupancyBadge(occupancy, barn.capacity);
          const barnAnimals = getBarnAnimals(barn.id);
          const TypeIcon = barnTypeIcons[barn.type];

          return (
            <Card
              key={barn.id}
              className={`${!barn.isActive ? "opacity-60" : ""} hover:shadow-lg transition-shadow`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center">
                      <TypeIcon className={`h-5 w-5 mr-2 ${barnTypeColors[barn.type]}`} />
                      {barn.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{barn.location}</span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline" className={barnTypeColors[barn.type]}>
                      {barnTypeLabels[barn.type]}
                    </Badge>
                    <Badge className={occupancyBadge.color}>
                      {occupancyBadge.text}
                    </Badge>
                    {!barn.isActive && (
                      <Badge variant="secondary">غير نشطة</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Occupancy */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">الإشغال</span>
                    <span className={`text-sm font-bold ${getOccupancyColor(occupancy, barn.capacity)}`}>
                      {occupancy} / {barn.capacity}
                    </span>
                  </div>
                  <Progress value={occupancyPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(occupancyPercentage)}% مشغولة
                  </p>
                </div>

                {/* Analytics */}
                {barnAnimals.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-bold text-blue-600">
                        {farmHelpers.formatWeight(
                          barnAnimals.reduce((sum, animal) => sum + animal.weight, 0) / barnAnimals.length
                        )}
                      </div>
                      <div className="text-muted-foreground">متوسط الوزن</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-600">
                        {barnAnimals.filter(a => ["سليم", "سليمة", "healthy"].includes(a.healthStatus)).length}
                      </div>
                      <div className="text-muted-foreground">سليمة</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <div className="font-bold text-orange-600">
                        {barnAnimals.filter(a => a.isIsolated).length}
                      </div>
                      <div className="text-muted-foreground">في العزل</div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {barn.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {barn.description}
                    </p>
                  </div>
                )}

                {/* Animals List */}
                {barnAnimals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">الحيوانات:</p>
                    <div className="flex flex-wrap gap-1">
                      {barnAnimals.slice(0, 3).map((animal) => (
                        <Badge
                          key={animal.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {animal.earTagId}
                        </Badge>
                      ))}
                      {barnAnimals.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{barnAnimals.length - 3} أخرى
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewBarn(barn)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    عرض
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditBarn(barn)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    تعديل
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openTransferModal(barn)}
                    disabled={barnAnimals.length === 0}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    نقل
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(`/feeding?barn=${barn.id}`, '_blank')}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Utensils className="h-3 w-3 mr-1" />
                    التغذية
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBarns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد حظائر مطابقة للبحث</p>
          </CardContent>
        </Card>
      )}

      {/* Selected Barn Details Section */}
      {selectedBarn && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">تفاصيل الحظيرة - {selectedBarn.name}</CardTitle>
                <CardDescription>عرض بيانات الحظيرة وإحصائياتها والحيوانات المتواجدة بها</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBarn(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Basic Barn Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{selectedBarn.name}</CardTitle>
                      <Badge variant={selectedBarn.isActive ? "outline" : "destructive"}>
                        {selectedBarn.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                    <CardDescription>
                      <Badge variant="outline" className={barnTypeColors[selectedBarn.type]}>
                        {barnTypeLabels[selectedBarn.type]}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">السعة:</p>
                        <p className="font-medium">{selectedBarn.capacity} رأس</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">الموقع:</p>
                        <p className="font-medium">{selectedBarn.location}</p>
                      </div>
                    </div>

                    {selectedBarn.description && (
                      <div>
                        <p className="text-sm text-muted-foreground">الوصف:</p>
                        <p className="text-sm">{selectedBarn.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">إحصائيات الإشغال</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const barnAnimals = animals.filter(a => a.barnId === selectedBarn.id);
                      const occupancyRate = selectedBarn.capacity > 0 
                        ? Math.round((barnAnimals.length / selectedBarn.capacity) * 100) 
                        : 0;
                      const status = getOccupancyBadge(barnAnimals.length, selectedBarn.capacity);

                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">معدل الإشغال:</span>
                            <span className="font-medium">{occupancyRate}%</span>
                          </div>
                          <Progress value={occupancyRate} className="h-2" />
                          
                          <div className="flex justify-between">
                            <span className="text-sm">عدد الحيوانات:</span>
                            <span className="font-medium">{barnAnimals.length} / {selectedBarn.capacity}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">حالة الإشغال:</span>
                            <Badge className={status.color}>{status.text}</Badge>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">متوسط الوزن:</span>
                            <span className="font-medium">
                              {barnAnimals.length > 0 
                                ? (barnAnimals.reduce((sum, a) => sum + a.weight, 0) / barnAnimals.length).toFixed(1)
                                : 0} كج
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">تفاصيل الحيوانات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const barnAnimals = animals.filter(a => a.barnId === selectedBarn.id);
                      
                      // Count by category
                      const maleCount = barnAnimals.filter(a => a.category === "male").length;
                      const femaleCount = barnAnimals.filter(a => a.category === "female").length;
                      const newbornCount = barnAnimals.filter(a => a.category === "newborn").length;
                      
                      // Count by health status
                      const healthyCount = barnAnimals.filter(a => 
                        a.healthStatus === "سليم" || 
                        a.healthStatus === "سليمة" || 
                        a.healthStatus === "healthy"
                      ).length;
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">ذكور:</span>
                            <span className="font-medium text-blue-600">{maleCount}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">إناث:</span>
                            <span className="font-medium text-pink-600">{femaleCount}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">صغار:</span>
                            <span className="font-medium text-green-600">{newbornCount}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">حيوانات سليمة:</span>
                            <span className="font-medium text-green-600">{healthyCount}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for different sections */}
              <Tabs defaultValue="animals">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="equipment">المعدات</TabsTrigger>
                  <TabsTrigger value="efficiency">كفاءة التغذية</TabsTrigger>
                  <TabsTrigger value="feeding">التغذية</TabsTrigger>
                  <TabsTrigger value="animals">الحيوانات</TabsTrigger>
                </TabsList>
                
                <TabsContent value="equipment" className="pt-4">
                  <BarnEquipmentList 
                    barnId={selectedBarn.id}
                  />
                </TabsContent>
                
                <TabsContent value="efficiency" className="pt-4">
                  <BarnEfficiencyData 
                    feedEfficiencyRecords={[]} // TODO: Load from API when available
                    weightRecords={weightRecords.filter(record => 
                      animals.some(animal => animal.id === record.animalId && animal.barnId === selectedBarn.id)
                    )}
                    animals={animals.filter(animal => animal.barnId === selectedBarn.id)}
                  />
                </TabsContent>
                
                <TabsContent value="feeding" className="pt-4">
                  <BarnFeedingData 
                    barnId={selectedBarn.id}
                    feedConsumptionRecords={[]} // For now, we don't have this data
                    feedingRecords={feedingRecords.filter(record => record.barnId === selectedBarn.id)}
                    animalCount={animals.filter(animal => animal.barnId === selectedBarn.id).length}
                  />
                </TabsContent>
                
                <TabsContent value="animals" className="pt-4">
                  <BarnAnimalsList 
                    animals={animals.filter(animal => animal.barnId === selectedBarn.id)} 
                    weightRecords={weightRecords.filter(record => 
                      animals.some(animal => animal.id === record.animalId && animal.barnId === selectedBarn.id)
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barn Form Modal */}
      <Dialog open={showBarnModal} onOpenChange={setShowBarnModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {barnFormMode === "add" ? "إضافة حظيرة جديدة" : "تعديل بيانات الحظيرة"}
            </DialogTitle>
            <DialogDescription>
              {barnFormMode === "add"
                ? "إدخال بيانات الحظيرة الجديدة"
                : "تعديل البيانات الأساسية للحظيرة"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barnName">اسم الحظيرة *</Label>
                <Input
                  id="barnName"
                  value={barnFormData.name}
                  onChange={(e) =>
                    setBarnFormData({ ...barnFormData, name: e.target.value })
                  }
                  placeholder="مثال: الحظيرة الرئيسية - ذكور"
                />
              </div>

              <div>
                <Label htmlFor="barnType">نوع الحظيرة *</Label>
                <Select
                  value={barnFormData.type}
                  onValueChange={(value: BarnType) =>
                    setBarnFormData({ ...barnFormData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(barnTypeLabels).map(([type, label]) => (
                      <SelectItem key={type} value={type}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">السعة (عدد الحيوانات) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={barnFormData.capacity}
                  onChange={(e) =>
                    setBarnFormData({ ...barnFormData, capacity: e.target.value })
                  }
                  placeholder="50"
                />
              </div>

              <div>
                <Label htmlFor="location">الموقع *</Label>
                <Input
                  id="location"
                  value={barnFormData.location}
                  onChange={(e) =>
                    setBarnFormData({ ...barnFormData, location: e.target.value })
                  }
                  placeholder="الجانب الشرقي"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={barnFormData.description}
                onChange={(e) =>
                  setBarnFormData({ ...barnFormData, description: e.target.value })
                }
                placeholder="وصف الحظيرة والمرافق المتاحة..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={barnFormData.isActive}
                onCheckedChange={(checked) =>
                  setBarnFormData({ ...barnFormData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive">حظيرة نشطة</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBarnModal(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSaveBarn}
              disabled={
                formLoading ||
                !barnFormData.name ||
                !barnFormData.capacity ||
                !barnFormData.location
              }
            >
              {formLoading
                ? "جاري الحفظ..."
                : barnFormMode === "add"
                  ? "إضافة الحظيرة"
                  : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Animal Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>نقل حيوان بين الحظائر</DialogTitle>
            <DialogDescription>
              اختر الحيوان والحظيرة المقصودة للنقل
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="fromBarn">من الحظيرة</Label>
              <Select
                value={transferData.fromBarnId}
                onValueChange={(value) =>
                  setTransferData({ ...transferData, fromBarnId: value, animalId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحظيرة المصدر" />
                </SelectTrigger>
                <SelectContent>
                  {barns.filter(barn => getBarnOccupancy(barn.id) > 0).map((barn) => (
                    <SelectItem key={barn.id} value={barn.id}>
                      {barn.name} ({getBarnOccupancy(barn.id)} حيوان)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {transferData.fromBarnId && (
              <div>
                <Label htmlFor="animal">الحيوان</Label>
                <Select
                  value={transferData.animalId}
                  onValueChange={(value) =>
                    setTransferData({ ...transferData, animalId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحيوان" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBarnAnimals(transferData.fromBarnId).map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.earTagId} - {farmHelpers.formatWeight(animal.weight)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="toBarn">إلى الحظيرة</Label>
              <Select
                value={transferData.toBarnId}
                onValueChange={(value) =>
                  setTransferData({ ...transferData, toBarnId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحظيرة المقصودة" />
                </SelectTrigger>
                <SelectContent>
                  {barns
                    .filter(barn => barn.id !== transferData.fromBarnId && barn.isActive)
                    .map((barn) => {
                      const occupancy = getBarnOccupancy(barn.id);
                      const isFullOrNearFull = occupancy >= barn.capacity;
                      
                      return (
                        <SelectItem 
                          key={barn.id} 
                          value={barn.id}
                          disabled={isFullOrNearFull}
                        >
                          {barn.name} ({occupancy}/{barn.capacity})
                          {isFullOrNearFull && " - ممتلئة"}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">سبب النقل</Label>
              <Input
                id="reason"
                value={transferData.reason}
                onChange={(e) =>
                  setTransferData({ ...transferData, reason: e.target.value })
                }
                placeholder="مثال: نقل بعد الفطام"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferModal(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleTransferAnimal}
              disabled={
                !transferData.animalId ||
                !transferData.toBarnId ||
                !transferData.reason
              }
            >
              تأكيد النقل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
