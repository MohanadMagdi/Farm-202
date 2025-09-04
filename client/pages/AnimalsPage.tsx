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
import { Alert, AlertDescription } from "@/components/ui/alert";
import AnimalFormModal from "@/components/forms/AnimalFormModal";
import WeightRecordModal from "@/components/forms/WeightRecordModal";
import MaleLifecycleCard from "@/components/MaleLifecycleCard";
import FemaleLifecycleCard from "@/components/FemaleLifecycleCard";
import AnimalPerformanceDashboard from "@/components/PerformanceDashboard";
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
import { formatArabicDate } from "@/lib/arabic-utils";
import dataService from "@/lib/data-service-unified";
import { farmHelpers } from "@/lib/data-service";
import { maleManagementService } from "@/lib/male-management-service";
import { femaleManagementService } from "@/lib/female-management-service";
import { exportAnimalsReport } from "@/lib/export-utils";
import type { Animal, AnimalCategory, Barn, WeightRecord, FeedingRecord } from "@shared/types";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Download,
  Edit,
  Trash2,
  Scale,
  MapPin,
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  Filter,
  Users,
  Baby,
  BarChart3,
} from "lucide-react";

interface AnimalsPageProps {
  animalType: AnimalCategory;
}

export default function AnimalsPage({ animalType }: AnimalsPageProps) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [feedingRecords, setFeedingRecords] = useState<FeedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productionTypeFilter, setProductionTypeFilter] = useState<string>("all"); // جديد: فلتر نوع الإنتاج
  const [currentTab, setCurrentTab] = useState("animals"); // جديد: إدارة التبويبات
  const [recentlyUpdatedAnimals, setRecentlyUpdatedAnimals] = useState<Set<string>>(new Set());
  const [showLifecycleCard, setShowLifecycleCard] = useState(false);
  
  // Helper function to check if animal is internal production (including newborns)
  const isInternalProduction = (animal: Animal) => {
    // المواليد دائماً إنتاج داخلي
    if (animal.category === "newborn") {
      return true;
    }
    // باقي الحيوانات حسب الخاصية internalProduction
    return animal.internalProduction;
  };

  // Helper function to check if animal is weaned from internal production
  const isWeanedFromInternalProduction = (animal: Animal) => {
    return (
      !animal.internalProduction && 
      animal.supplier === "مزرعة داخلية - مفطوم" &&
      animal.weaningDate
    );
  };

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalCount: 0,
    avgWeight: 0,
    healthyCount: 0,
    totalValue: 0,
    pregnantCount: 0,
    isolatedCount: 0,
    // إحصائيات نوع الإنتاج
    internalProductionCount: 0,
    purchasedCount: 0,
    internalProductionValue: 0,
    purchasedValue: 0,
    // Enhanced analytics for males
    readyForSale: 0,
    needingAttention: 0,
    averageAge: 0,
    expectedProfit: 0,
    // Enhanced analytics for females
    readyForBreeding: 0,
    breedingEfficiency: 0,
  });

  useEffect(() => {
    loadAnimals();
    loadBarns();
    loadWeightRecords();
    loadFeedingRecords();
  }, [animalType]);

  const loadAnimals = async () => {
    try {
      setLoading(true);
      let animalsData: Animal[] = [];
      
      if (animalType === "male" || animalType === "female") {
        // استرداد جميع الحيوانات ثم فلترتها حسب الجنس
        // هذا يتيح استرداد المواليد والذكور/الإناث والإنتاج الداخلي
        const allAnimals = await dataService.getAnimals();
        console.log(`تم استرداد ${allAnimals.length} حيوان من قاعدة البيانات`);
        
        // إحصاء الأنواع للتصحيح
        const maleCount = allAnimals.filter(a => a.sex === "male").length;
        const femaleCount = allAnimals.filter(a => a.sex === "female").length;
        const newbornCount = allAnimals.filter(a => a.category === "newborn").length;
        const newbornMaleCount = allAnimals.filter(a => a.category === "newborn" && a.sex === "male").length;
        const newbornFemaleCount = allAnimals.filter(a => a.category === "newborn" && a.sex === "female").length;
        
        console.log(`إجمالي الذكور: ${maleCount}, الإناث: ${femaleCount}, المواليد: ${newbornCount}`);
        console.log(`المواليد الذكور: ${newbornMaleCount}, المواليد الإناث: ${newbornFemaleCount}`);
        
        animalsData = allAnimals.filter(animal => {
          if (animalType === "male") {
            return animal.sex === "male";
          } else {
            return animal.sex === "female";
          }
        });
        
        console.log(`تم اختيار ${animalsData.length} حيوان ${animalType} للعرض`);
      } else {
        // بالنسبة للمواليد والفئات الأخرى، استخدم الطريقة العادية
        animalsData = await dataService.getAnimalsByCategory(animalType);
        console.log(`تم استرداد ${animalsData.length} حيوان من فئة ${animalType}`);
      }
      
      setAnimals(animalsData);
      calculateAnalytics(animalsData);
      
      // إظهار إشعار تأكيد إذا كان هناك مواليد من نفس الجنس
      if ((animalType === "male" || animalType === "female") && 
          animalsData.filter(a => a.category === "newborn").length > 0) {
        toast({
          title: "تم تحميل المواليد بنجاح",
          description: `تم عرض ${animalsData.filter(a => a.category === "newborn").length} مولود ${animalType === "male" ? "ذكر" : "أنثى"} في الجدول`,
        });
      }
    } catch (error) {
      console.error("Error loading animals:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الحيوانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBarns = async () => {
    try {
      const barnsData = await dataService.getBarns();
      setBarns(barnsData);
    } catch (error) {
      console.error("Error loading barns:", error);
    }
  };

  const loadWeightRecords = async () => {
    try {
      const weightRecordsData = await dataService.getWeightRecords();
      setWeightRecords(weightRecordsData);
    } catch (error) {
      console.error("Error loading weight records:", error);
    }
  };

  const loadFeedingRecords = async () => {
    try {
      const feedingRecordsData = await dataService.getFeedingRecords();
      setFeedingRecords(feedingRecordsData);
    } catch (error) {
      console.error("Error loading feeding records:", error);
    }
  };

  const calculateAnalytics = (animalsData: Animal[]) => {
    const totalCount = animalsData.length;
    const avgWeight =
      totalCount > 0
        ? animalsData.reduce((sum, animal) => sum + animal.weight, 0) /
          totalCount
        : 0;
    const healthyCount = animalsData.filter(
      (a) => a.healthStatus === "سليم" || a.healthStatus === "سليمة",
    ).length;
    const totalValue = animalsData.reduce(
      (sum, animal) => sum + (animal.currentPrice || animal.purchasePrice || 0),
      0,
    );
    const pregnantCount = animalsData.filter((a) => a.isPregnant).length;
    const isolatedCount = animalsData.filter((a) => a.isIsolated).length;
    
    // إحصائيات نوع الإنتاج - استخدام دالة isInternalProduction لضمان اعتبار المواليد إنتاج داخلي
    const internalProductionCount = animalsData.filter((a) => isInternalProduction(a)).length;
    const purchasedCount = animalsData.filter((a) => !isInternalProduction(a)).length;
    const internalProductionValue = animalsData
      .filter((a) => isInternalProduction(a))
      .reduce((sum, animal) => sum + (animal.currentPrice || animal.purchasePrice || 0), 0);
    const purchasedValue = animalsData
      .filter((a) => !isInternalProduction(a))
      .reduce((sum, animal) => sum + (animal.currentPrice || animal.purchasePrice || 0), 0);

    // Enhanced analytics for males
    let readyForSale = 0;
    let needingAttention = 0;
    let averageAge = 0;
    let expectedProfit = 0;

    // Enhanced analytics for females
    let readyForBreeding = 0;
    let femalesNeedingAttention = 0;
    let breedingEfficiency = 0;
    let productionValue = 0;

    if (animalType === "male") {
      const allMales = maleManagementService.getAllMales(animalsData);
      const newbornMales = maleManagementService.getNewbornMales(animalsData);
      
      readyForSale = maleManagementService.getMalesReadyForSale(animalsData).length;
      needingAttention = maleManagementService.getMalesNeedingAttention(animalsData).length;
      averageAge = totalCount > 0 ? 
        animalsData.reduce((sum, male) => sum + (male.ageMonths || 0), 0) / totalCount : 0;
      
      expectedProfit = animalsData.reduce((sum, male) => {
        const profit = maleManagementService.calculateExpectedProfit(male);
        return sum + profit.profit;
      }, 0);

      // إحصائيات إضافية للمواليد الذكور
      const newbornMalesCount = newbornMales.length;
      console.log(`المواليد الذكور في النظام: ${newbornMalesCount}`);
    } else if (animalType === "female") {
      const femaleAnalytics = femaleManagementService.calculateFemaleAnalytics(animalsData);
      readyForBreeding = femaleAnalytics.readyForBreeding;
      femalesNeedingAttention = femaleAnalytics.needingAttention;
      averageAge = femaleAnalytics.averageAge;
      breedingEfficiency = femaleAnalytics.breedingEfficiency;
      productionValue = femaleAnalytics.productionValue;
    } else {
      averageAge = totalCount > 0 ? 
        animalsData.reduce((sum, animal) => sum + (animal.ageMonths || 0), 0) / totalCount : 0;
    }

    setAnalytics({
      totalCount,
      avgWeight,
      healthyCount,
      totalValue,
      pregnantCount,
      isolatedCount,
      // إحصائيات نوع الإنتاج
      internalProductionCount,
      purchasedCount,
      internalProductionValue,
      purchasedValue,
      readyForSale,
      needingAttention: animalType === "male" ? needingAttention : femalesNeedingAttention,
      averageAge,
      expectedProfit: animalType === "male" ? expectedProfit : productionValue,
      // Female specific analytics
      readyForBreeding,
      breedingEfficiency,
    });
  };

  const getBarnName = (barnId: string): string => {
    const barn = barns.find(b => b.id === barnId);
    return barn ? barn.name : barnId;
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      // Filter animals based on current type - include all animals of same gender
      const filteredAnimals = animalType
        ? animals.filter((animal) => {
            // For males page: include all male animals (purchased, internal production, and newborns)
            if (animalType === "male") {
              return animal.sex === "male";
            }
            // For females page: include all female animals (purchased, internal production, and newborns)
            if (animalType === "female") {
              return animal.sex === "female";
            }
            // For newborns page: include only newborns (all genders)
            if (animalType === "newborn") {
              return animal.category === "newborn";
            }
            // For other categories, keep original logic
            return animal.category === animalType;
          })
        : animals;

      await exportAnimalsReport(filteredAnimals, "excel", animalType);

      toast({
        title: "تم تصدير التقرير بنجاح",
        description: `تم تصدير تقرير ${getAnimalTypeLabel(animalType)} بصيغة Excel`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsEditModalOpen(true);
    setShowLifecycleCard(false);
  };

  const handleWeightRecord = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsWeightModalOpen(true);
    setShowLifecycleCard(false);
  };

  const handleWeightSave = async () => {
    try {
      // إضافة الحيوان المحدد للقائمة المحدثة حديثاً
      if (selectedAnimal) {
        setRecentlyUpdatedAnimals(prev => new Set(prev).add(selectedAnimal.id));
        
        // إزالة المؤشر بعد 3 ثواني
        setTimeout(() => {
          setRecentlyUpdatedAnimals(prev => {
            const newSet = new Set(prev);
            newSet.delete(selectedAnimal.id);
            return newSet;
          });
        }, 3000);
      }

      // إعادة تحميل البيانات فوراً لإظهار الوزن الجديد
      await loadAnimals();
      toast({
        title: "تم تسجيل الوزن بنجاح",
        description: "تم تحديث وزن الحيوان في الجدول",
      });
    } catch (error) {
      console.error("Error reloading after weight update:", error);
      // لا نظهر خطأ لأن الوزن تم حفظه بالفعل، فقط التحديث فشل
      toast({
        title: "تم تسجيل الوزن",
        description: "قد تحتاج لتحديث الصفحة لرؤية التغييرات",
      });
    }
  };

  const handleSave = async () => {
    try {
      await loadAnimals(); // إعادة تحميل البيانات وتحديث الإحصائيات
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث بيانات الحيوان بنجاح",
      });
    } catch (error) {
      console.error("Error reloading animals data:", error);
      toast({
        title: "تم الحفظ مع تحذير",
        description: "تم حفظ البيانات لكن قد تحتاج لتحديث الصفحة",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (animal: Animal) => {
    if (window.confirm(`هل أنت متأكد من حذف الحيوان ${animal.earTagId}؟`)) {
      try {
        await dataService.deleteAnimal(animal.id);
        loadAnimals();
        setShowLifecycleCard(false);
        toast({
          title: "تم الحذف بنجاح",
          description: `تم حذف الحيوان ${animal.earTagId} بنجاح`,
        });
      } catch (error) {
        console.error("Error deleting animal:", error);
        toast({
          title: "خطأ في الحذف",
          description: "حدث خطأ أثناء حذف الحيوان",
          variant: "destructive",
        });
      }
    }
  };

  // يتم تطبيق هذه الفلترة بعد تحميل البيانات، وهي فلترة ثانوية
  const filteredAnimals = animals
    .filter((animal) => {
      // Filter by animal type/gender first - show all animals of the selected gender
      if (animalType === "male") {
        // Show all male animals: purchased males, internal production males, and newborn males
        // جميع الحيوانات الذكور، بغض النظر عن التصنيف (مشتراة، إنتاج داخلي، مواليد ذكور)
        return animal.sex === "male";
      }
      if (animalType === "female") {
        // Show all female animals: purchased females, internal production females, and newborn females
        // جميع الحيوانات الإناث، بغض النظر عن التصنيف (مشتراة، إنتاج داخلي، مواليد إناث)
        return animal.sex === "female";
      }
      if (animalType === "newborn") {
        // Show all newborns regardless of gender
        // جميع المواليد بغض النظر عن الجنس
        return animal.category === "newborn";
      }
      // If no type selected, show all
      return true;
    })
    .filter(
      (animal) =>
        animal.earTagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (animal.supplier && animal.supplier.includes(searchTerm)),
    )
    .filter(
      (animal) =>
        healthFilter === "all" || animal.healthStatus === healthFilter,
    )
    .filter((animal) => {
      // فلتر نوع الإنتاج - استخدام الدالة المساعدة للتعامل مع المواليد
      if (productionTypeFilter === "all") return true;
      if (productionTypeFilter === "purchased") return !isInternalProduction(animal);
      if (productionTypeFilter === "internal") return isInternalProduction(animal);
      return true;
    })
    .filter((animal) => {
      if (animalType !== "male" || statusFilter === "all") return true;
      
      switch (statusFilter) {
        case "ready":
          const readyList = maleManagementService.getMalesReadyForSale([animal]);
          return readyList.length > 0;
        case "attention":
          const attentionList = maleManagementService.getMalesNeedingAttention([animal]);
          return attentionList.length > 0;
        case "early":
          const cycleInfo = maleManagementService.getFarmCycleInfo(animal);
          return cycleInfo.timeInFarm < 4;
        case "late":
          const lateInfo = maleManagementService.getFarmCycleInfo(animal);
          return lateInfo.timeInFarm > 5;
        default:
          return true;
      }
    });

  // Helper functions for males
  const getMaleStatusCategory = (animal: Animal) => {
    const readyList = maleManagementService.getMalesReadyForSale([animal]);
    if (readyList.length > 0) return "ready";
    
    const attentionList = maleManagementService.getMalesNeedingAttention([animal]);
    if (attentionList.length > 0) return "attention";
    
    const cycleInfo = maleManagementService.getFarmCycleInfo(animal);
    if (cycleInfo.timeInFarm < 4) return "early";
    if (cycleInfo.timeInFarm > 5) return "late";
    return "normal";
  };

  const getMaleStatusBadge = (animal: Animal) => {
    const status = getMaleStatusCategory(animal);
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-800">جاهز للبيع</Badge>;
      case "attention":
        return <Badge className="bg-red-100 text-red-800">يحتاج انتباه</Badge>;
      case "early":
        return <Badge className="bg-blue-100 text-blue-800">مبكر</Badge>;
      case "late":
        return <Badge className="bg-orange-100 text-orange-800">متأخر</Badge>;
      default:
        return <Badge variant="outline">طبيعي</Badge>;
    }
  };

  const getHealthStatusColor = (status: string) => {
    const healthyStatuses = ["سليم", "سليمة", "healthy"];
    const sickStatuses = ["مريض", "مريضة", "sick"];
    const treatmentStatuses = ["تحت العلاج", "under_treatment"];
    const quarantineStatuses = ["حجر صحي", "quarantine"];

    if (healthyStatuses.includes(status)) {
      return "bg-green-100 text-green-800";
    } else if (sickStatuses.includes(status)) {
      return "bg-red-100 text-red-800";
    } else if (treatmentStatuses.includes(status)) {
      return "bg-yellow-100 text-yellow-800";
    } else if (quarantineStatuses.includes(status)) {
      return "bg-orange-100 text-orange-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  // Helper function to get supplier display with weaning indicator
  const getSupplierDisplay = (animal: Animal) => {
    if (isWeanedFromInternalProduction(animal)) {
      return (
        <div className="flex items-center gap-2">
          <span>{animal.supplier || "-"}</span>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <Baby className="h-3 w-3 mr-1" />
            مفطوم
          </Badge>
        </div>
      );
    }
    return animal.supplier || "-";
  };

  // Helper function to get animal production type badge
  const getProductionTypeBadge = (animal: Animal) => {
    // المواليد دائماً يظهرون كإنتاج داخلي
    if (animal.category === "newborn") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          إنتاج داخلي
        </Badge>
      );
    }
    
    // الحيوانات المفطومة
    if (isWeanedFromInternalProduction(animal)) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          مفطوم ← مشترى
        </Badge>
      );
    }
    
    // الحالات الأخرى
    return (
      <Badge
        variant="outline"
        className={
          animal.internalProduction
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-green-50 text-green-700 border-green-200"
        }
      >
        {animal.internalProduction ? "إنتاج داخلي" : "مشترى"}
      </Badge>
    );
  };

  const getAnimalTypeLabel = (type?: AnimalCategory) => {
    switch (type) {
      case "male":
        return "الذكور";
      case "female":
        return "الإناث";
      case "newborn":
        return "الصغار";
      default:
        return "جميع الحيوانات";
    }
  };

  const getAddButtonLabel = (type: AnimalCategory) => {
    switch (type) {
      case "male":
        return "إضافة ذكر جديد";
      case "female":
        return "إضافة أنثى جديدة";
      case "newborn":
        return "إضافة صغير جديد";
      default:
        return "إضافة حيوان جديد";
    }
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

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">
            إدارة {getAnimalTypeLabel(animalType)}
          </h1>
          <p className="text-muted-foreground">
            عرض وإدارة {getAnimalTypeLabel(animalType)} في المزرعة
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="flex">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 ml-2" />
              Excel
            </Button>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            {getAddButtonLabel(animalType)}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6" dir="rtl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العدد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {analytics.totalCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {animalType === "male" ? "جميع الذكور (مشترى + إنتاج داخلي)" : 
               animalType === "female" ? "جميع الإناث (مشترى + إنتاج داخلي)" :
               "جميع الحيوانات المسجلة"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">متوسط الوزن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {farmHelpers.formatWeight(analytics.avgWeight)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Heart className="h-4 w-4 ml-1 text-green-600" />
              السليمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.healthyCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 ml-1 text-blue-600" />
              التوزيع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span>مشترى:</span>
                <span className="font-bold text-blue-600">{analytics.purchasedCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>إنتاج داخلي:</span>
                <span className="font-bold text-green-600">{analytics.internalProductionCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              القيمة التقديرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {farmHelpers.formatCurrency(analytics.totalValue)}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced cards for males */}
        {animalType === "male" && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 ml-1 text-green-600" />
                  جاهز للبيع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.readyForSale}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 ml-1 text-red-600" />
                  يحتاج انتباه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analytics.needingAttention}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 ml-1 text-blue-600" />
                  متوسط العمر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.averageAge.toFixed(1)} شهر
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 ml-1 text-green-600" />
                  الربح المتوقع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {farmHelpers.formatCurrency(analytics.expectedProfit)}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {(animalType as string) === "female" && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">الحوامل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-600">
                  {analytics.pregnantCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Heart className="h-4 w-4 ml-1 text-green-600" />
                  جاهزة للتلقيح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.readyForBreeding}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 ml-1 text-red-600" />
                  تحتاج متابعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analytics.needingAttention}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 ml-1 text-blue-600" />
                  متوسط العمر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.averageAge.toFixed(1)} شهر
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 ml-1 text-green-600" />
                  كفاءة التكاثر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.breedingEfficiency.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 ml-1 text-green-600" />
                  قيمة الإنتاج المتوقعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {farmHelpers.formatCurrency(analytics.expectedProfit)}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {animalType !== "male" && animalType !== "female" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">الحوامل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">
                {analytics.pregnantCount}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">في العزل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.isolatedCount}
            </div>
          </CardContent>
        </Card>

        {/* بطاقات نوع الإنتاج */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 ml-1 text-green-600" />
              إنتاج داخلي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.internalProductionCount}
            </div>
            <div className="text-xs text-muted-foreground">
              {farmHelpers.formatCurrency(analytics.internalProductionValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 ml-1 text-blue-600" />
              مشترى
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.purchasedCount}
            </div>
            <div className="text-xs text-muted-foreground">
              {farmHelpers.formatCurrency(analytics.purchasedValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Alerts for Males */}
      {animalType === "male" && (
        <div className="space-y-4">
          {/* Auto-registration confirmation */}
          <Alert className="border-blue-200 bg-blue-50">
            <Users className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>تم عرض جميع الذكور المسجلين في قاعدة البيانات تلقائياً</strong> - 
              يشمل ذلك الحيوانات المشتراة والإنتاج الداخلي والمواليد الجدد.
              إجمالي: {analytics.totalCount} ذكر ({analytics.purchasedCount || 0} مشترى + {analytics.internalProductionCount || 0} إنتاج داخلي)
            </AlertDescription>
          </Alert>

          {/* New Male Calves Alert */}
          {maleManagementService.getNewbornMales(filteredAnimals).length > 0 && (
            <Alert className="border-blue-200 bg-blue-50">
              <Baby className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                يوجد {maleManagementService.getNewbornMales(filteredAnimals).length} مولود ذكر في النظام! 
                تم إدراجهم تلقائياً في إدارة الذكور وسيتم نقلهم لحظيرة الذكور عند الفطام.
              </AlertDescription>
            </Alert>
          )}

          {/* Weaned Animals Alert */}
          {filteredAnimals.filter(isWeanedFromInternalProduction).length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                يوجد {filteredAnimals.filter(isWeanedFromInternalProduction).length} حيوان مفطوم من الإنتاج الداخلي! 
                تم تصنيفهم كحيوانات مشتراة وأصبحوا جاهزين لدورة الإنتاج.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Ready for Sale Alert */}
          {analytics.readyForSale > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                يوجد {analytics.readyForSale} ذكر جاهز للبيع الآن! 
                يمكنك البحث عنهم باستخدام فلتر "جاهز للبيع".
              </AlertDescription>
            </Alert>
          )}

          {/* Attention Needed Alert */}
          {analytics.needingAttention > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                يوجد {analytics.needingAttention} ذكر يحتاج انتباه فوري! 
                قد تكون أوزانهم منخفضة أو تجاوزت فترة التربية المثلى.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Enhanced Alerts for Females */}
      {animalType === "female" && (
        <div className="space-y-4">
          {/* Auto-registration confirmation */}
          <Alert className="border-pink-200 bg-pink-50">
            <Users className="h-4 w-4 text-pink-600" />
            <AlertDescription className="text-pink-800">
              <strong>تم عرض جميع الإناث المسجلات في قاعدة البيانات تلقائياً</strong> - 
              يشمل ذلك الحيوانات المشتراة والإنتاج الداخلي والمواليد الجدد.
              إجمالي: {analytics.totalCount} أنثى ({analytics.purchasedCount || 0} مشترى + {analytics.internalProductionCount || 0} إنتاج داخلي)
            </AlertDescription>
          </Alert>

          {/* Weaned Females Alert */}
          {filteredAnimals.filter(isWeanedFromInternalProduction).length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                يوجد {filteredAnimals.filter(isWeanedFromInternalProduction).length} أنثى مفطومة من الإنتاج الداخلي! 
                تم تصنيفهن كحيوانات مشتراة وأصبحن جاهزات لدورة التكاثر.
              </AlertDescription>
            </Alert>
          )}

          {/* Ready for Breeding Alert */}
          {analytics.readyForBreeding > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <Heart className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                يوجد {analytics.readyForBreeding} أنثى جاهزة للتلقيح! 
                في سن التكاثر المثلى ومناسبة للحمل.
              </AlertDescription>
            </Alert>
          )}

          {/* Pregnant Alert */}
          {analytics.pregnantCount > 0 && (
            <Alert className="border-pink-200 bg-pink-50">
              <Baby className="h-4 w-4 text-pink-600" />
              <AlertDescription className="text-pink-800">
                يوجد {analytics.pregnantCount} أنثى حامل. 
                تأكد من المتابعة الدورية والتحضير للولادة.
              </AlertDescription>
            </Alert>
          )}

          {/* Attention Needed Alert */}
          {analytics.needingAttention > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                يوجد {analytics.needingAttention} أنثى تحتاج متابعة فورية! 
                قد تكون قريبة من الولادة أو تحتاج رعاية خاصة.
              </AlertDescription>
            </Alert>
          )}

          {/* Low Breeding Efficiency Alert */}
          {analytics.breedingEfficiency < 70 && analytics.totalCount > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                كفاءة التكاثر منخفضة ({analytics.breedingEfficiency.toFixed(1)}%). 
                راجع أعمار الإناث وحالتهن الصحية.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:space-x-reverse" dir="rtl">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث برقم الأذن أو المورد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="الحالة الصحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات الصحية</SelectItem>
                <SelectItem value="سليم">سليم</SelectItem>
                <SelectItem value="سليمة">سليمة</SelectItem>
                <SelectItem value="مريض">مريض</SelectItem>
                <SelectItem value="مريضة">مريضة</SelectItem>
                <SelectItem value="تحت العلاج">تحت العلاج</SelectItem>
                <SelectItem value="حجر صحي">حجر صحي</SelectItem>
              </SelectContent>
            </Select>

            <Select value={productionTypeFilter} onValueChange={setProductionTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="نوع الإنتاج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="purchased">مشترى</SelectItem>
                <SelectItem value="internal">إنتاج داخلي</SelectItem>
              </SelectContent>
            </Select>

            {/* Enhanced status filter for males */}
            {animalType === "male" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="حالة الذكر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="ready">جاهز للبيع</SelectItem>
                  <SelectItem value="attention">يحتاج انتباه</SelectItem>
                  <SelectItem value="early">مبكر (&lt;4 شهور)</SelectItem>
                  <SelectItem value="late">متأخر (&gt;5 شهور)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Animals Table */}
      <div className="space-y-6">
        {animalType === "male" ? (
          // Enhanced Males Table with Tabs
          <Tabs defaultValue="all" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">جميع الذكور ({analytics.totalCount})</TabsTrigger>
              <TabsTrigger value="ready">جاهز للبيع ({analytics.readyForSale})</TabsTrigger>
              <TabsTrigger value="attention">يحتاج انتباه ({analytics.needingAttention})</TabsTrigger>
              <TabsTrigger value="lifecycle">دورة الحياة</TabsTrigger>
              <TabsTrigger value="performance">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 ml-1" />
                  أداء الحيوانات
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>قائمة جميع الذكور</CardTitle>
                  <CardDescription>
                    إجمالي {filteredAnimals.length} من الذكور
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border" dir="rtl">
                    <Table className="rtl:text-right">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">رقم الأذن</TableHead>
                          <TableHead className="text-right">نوع الإنتاج</TableHead>
                          <TableHead className="text-right">العمر</TableHead>
                          <TableHead className="text-right">الوزن الحالي</TableHead>
                          <TableHead className="text-right">حالة الذكر</TableHead>
                          <TableHead className="text-right">الحالة الصحية</TableHead>
                          <TableHead className="text-right">الحظيرة</TableHead>
                          <TableHead className="text-right">السعر الحالي</TableHead>
                          <TableHead className="text-right">المورد</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAnimals.map((animal) => (
                          <TableRow key={animal.id}>
                            <TableCell className="font-medium text-right">
                              {animal.earTagId}
                              {animal.isIsolated && (
                                <Badge
                                  variant="outline"
                                  className="mr-2 bg-orange-50 text-orange-700"
                                >
                                  عزل
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {getProductionTypeBadge(animal)}
                            </TableCell>
                            <TableCell className="text-right">
                              {animal.ageMonths ? `${animal.ageMonths} شهر` : "غير محدد"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-start gap-1">
                                {farmHelpers.formatWeight(animal.weight)}
                                {recentlyUpdatedAnimals.has(animal.id) && (
                                  <Badge 
                                    variant="outline" 
                                    className="bg-green-50 text-green-600 text-xs mr-1"
                                  >
                                    محدث
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {getMaleStatusBadge(animal)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                className={getHealthStatusColor(animal.healthStatus)}
                              >
                                {animal.healthStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className="flex items-center w-fit"
                              >
                                <MapPin className="h-3 w-3 ml-1" />
                                {getBarnName(animal.barnId)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {farmHelpers.formatCurrency(
                                animal.currentPrice || animal.purchasePrice,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {getSupplierDisplay(animal)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-1 justify-start">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(animal)}
                                  className="h-8 w-8 p-0"
                                  title="حذف"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleWeightRecord(animal)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  title="تسجيل وزن"
                                >
                                  <Scale className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(animal)}
                                  className="h-8 w-8 p-0"
                                  title="تعديل"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAnimal(animal);
                                    setShowLifecycleCard(true);
                                  }}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                  title="عرض دورة الحياة"
                                >
                                  <TrendingUp className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredAnimals.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">
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

            <TabsContent value="ready" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 ml-2 text-green-600" />
                    الذكور الجاهزة للبيع
                  </CardTitle>
                  <CardDescription>
                    الذكور التي وصلت للوزن والعمر المناسب للبيع
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4" dir="rtl">
                    {maleManagementService.getMalesReadyForSale(filteredAnimals).map((male) => (
                      <div key={male.id} className="space-y-2">
                        <MaleLifecycleCard
                          animal={male}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(male)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeightRecord(male)}
                          >
                            تسجيل وزن
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(male)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                    {maleManagementService.getMalesReadyForSale(filteredAnimals).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        لا يوجد ذكور جاهزة للبيع حالياً
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attention" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 ml-2 text-red-600" />
                    ذكور تحتاج انتباه
                  </CardTitle>
                  <CardDescription>
                    الذكور التي تحتاج متابعة فورية أو تدخل
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4" dir="rtl">
                    {maleManagementService.getMalesNeedingAttention(filteredAnimals).map((maleWithReason) => (
                      <div key={maleWithReason.animal.id} className="space-y-2">
                        <MaleLifecycleCard
                          animal={maleWithReason.animal}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(maleWithReason.animal)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeightRecord(maleWithReason.animal)}
                          >
                            تسجيل وزن
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(maleWithReason.animal)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                    {maleManagementService.getMalesNeedingAttention(filteredAnimals).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        جميع الذكور في حالة جيدة! 🎉
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lifecycle" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>دورة الحياة التفصيلية</CardTitle>
                  <CardDescription>
                    عرض تفصيلي لدورة حياة كل ذكر في المزرعة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4" dir="rtl">
                    {filteredAnimals.map((male) => (
                      <div key={male.id} className="space-y-2">
                        <MaleLifecycleCard
                          animal={male}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(male)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeightRecord(male)}
                          >
                            تسجيل وزن
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(male)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredAnimals.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        لا توجد نتائج مطابقة للبحث
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : animalType === "female" ? (
          // Enhanced Females Table with Tabs
          <Tabs defaultValue="all" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">جميع الإناث ({analytics.totalCount})</TabsTrigger>
              <TabsTrigger value="ready">جاهزة للتلقيح ({analytics.readyForBreeding})</TabsTrigger>
              <TabsTrigger value="pregnant">حوامل ({analytics.pregnantCount})</TabsTrigger>
              <TabsTrigger value="lifecycle">دورة الحياة</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>قائمة جميع الإناث</CardTitle>
                  <CardDescription>
                    إجمالي {filteredAnimals.length} من الإناث
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border" dir="rtl">
                    <Table className="rtl:text-right">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">رقم الأذن</TableHead>
                          <TableHead className="text-right">نوع الإنتاج</TableHead>
                          <TableHead className="text-right">الوزن الحالي</TableHead>
                          <TableHead className="text-right">الحالة الصحية</TableHead>
                          <TableHead className="text-right">الحظيرة</TableHead>
                          <TableHead className="text-right">حالة الحمل</TableHead>
                          <TableHead className="text-right">السعر الحالي</TableHead>
                          <TableHead className="text-right">المورد</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAnimals.map((animal) => (
                          <TableRow key={animal.id}>
                            <TableCell className="font-medium text-right">
                              {animal.earTagId}
                              {animal.isIsolated && (
                                <Badge
                                  variant="outline"
                                  className="mr-2 bg-orange-50 text-orange-700"
                                >
                                  عزل
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {getProductionTypeBadge(animal)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-start gap-1">
                                {farmHelpers.formatWeight(animal.weight)}
                                {recentlyUpdatedAnimals.has(animal.id) && (
                                  <Badge 
                                    variant="outline" 
                                    className="bg-green-50 text-green-600 text-xs mr-1"
                                  >
                                    محدث
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                className={getHealthStatusColor(animal.healthStatus)}
                              >
                                {animal.healthStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className="flex items-center w-fit"
                              >
                                <MapPin className="h-3 w-3 ml-1" />
                                {getBarnName(animal.barnId)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {animal.isPregnant ? (
                                <Badge className="bg-pink-100 text-pink-800">
                                  حامل
                                </Badge>
                              ) : (
                                <Badge variant="outline">غير حامل</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {farmHelpers.formatCurrency(
                                animal.currentPrice || animal.purchasePrice,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {getSupplierDisplay(animal)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-1 justify-start">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(animal)}
                                  className="h-8 w-8 p-0"
                                  title="حذف"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleWeightRecord(animal)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  title="تسجيل وزن"
                                >
                                  <Scale className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(animal)}
                                  className="h-8 w-8 p-0"
                                  title="تعديل"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAnimal(animal);
                                    setShowLifecycleCard(true);
                                  }}
                                  className="h-8 w-8 p-0 text-pink-600 hover:text-pink-700"
                                  title="عرض دورة الحياة"
                                >
                                  <Heart className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredAnimals.length === 0 && (
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

            <TabsContent value="ready" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 ml-2 text-green-600" />
                    الإناث الجاهزة للتلقيح
                  </CardTitle>
                  <CardDescription>
                    الإناث في سن التكاثر المثلى والجاهزة للحمل
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4" dir="rtl">
                    {femaleManagementService.getFemalesReadyForBreeding(filteredAnimals).map((female) => (
                      <div key={female.id} className="space-y-2">
                        <FemaleLifecycleCard animal={female} />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(female)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeightRecord(female)}
                          >
                            تسجيل وزن
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(female)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                    {femaleManagementService.getFemalesReadyForBreeding(filteredAnimals).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        لا يوجد إناث جاهزة للتلقيح حالياً
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pregnant" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Baby className="h-5 w-5 ml-2 text-pink-600" />
                    الإناث الحوامل
                  </CardTitle>
                  <CardDescription>
                    الإناث الحوامل والمتابعة المطلوبة لهن
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4" dir="rtl">
                    {filteredAnimals.filter(animal => animal.isPregnant).map((female) => (
                      <div key={female.id} className="space-y-2">
                        <FemaleLifecycleCard animal={female} />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(female)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeightRecord(female)}
                          >
                            تسجيل وزن
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(female)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredAnimals.filter(animal => animal.isPregnant).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        لا يوجد إناث حوامل حالياً
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lifecycle" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>دورة حياة الإناث التفصيلية</CardTitle>
                  <CardDescription>
                    عرض تفصيلي لدورة حياة كل أنثى في المزرعة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4" dir="rtl">
                    {filteredAnimals.map((female) => (
                      <div key={female.id} className="space-y-2">
                        <FemaleLifecycleCard animal={female} />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(female)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeightRecord(female)}
                          >
                            تسجيل وزن
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(female)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredAnimals.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        لا توجد نتائج مطابقة للبحث
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 ml-2 text-blue-600" />
                    أداء الحيوانات
                  </CardTitle>
                  <CardDescription>
                    تحليلات أداء الحيوانات ومعدلات النمو وكفاءة التغذية
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimalPerformanceDashboard 
                    animalType={animalType}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (animalType as AnimalCategory) === "female" ? (
          // Enhanced Females Table with Tabs
          <Tabs defaultValue="all" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">جميع الإناث ({analytics.totalCount})</TabsTrigger>
              <TabsTrigger value="pregnant">حوامل ({analytics.pregnantCount})</TabsTrigger>
              <TabsTrigger value="lifecycle">دورة الحياة</TabsTrigger>
              <TabsTrigger value="performance">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 ml-1" />
                  أداء الحيوانات
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>قائمة جميع الإناث</CardTitle>
                  <CardDescription>
                    إجمالي {filteredAnimals.length} من الإناث
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border" dir="rtl">
                    <Table className="rtl:text-right">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">رقم الأذن</TableHead>
                          <TableHead className="text-right">نوع الإنتاج</TableHead>
                          <TableHead className="text-right">الوزن الحالي</TableHead>
                          <TableHead className="text-right">الحالة الصحية</TableHead>
                          <TableHead className="text-right">الحظيرة</TableHead>
                          <TableHead className="text-right">حالة الحمل</TableHead>
                          <TableHead className="text-right">السعر الحالي</TableHead>
                          <TableHead className="text-right">المورد</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAnimals.map((animal) => (
                          <TableRow key={animal.id}>
                            <TableCell className="font-medium text-right">
                              {animal.earTagId}
                              {animal.isIsolated && (
                                <Badge
                                  variant="outline"
                                  className="mr-2 bg-orange-50 text-orange-700"
                                >
                                  عزل
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {getProductionTypeBadge(animal)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-start gap-1">
                                {farmHelpers.formatWeight(animal.weight)}
                                {recentlyUpdatedAnimals.has(animal.id) && (
                                  <Badge 
                                    variant="outline" 
                                    className="bg-green-50 text-green-600 text-xs mr-1"
                                  >
                                    محدث
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                className={getHealthStatusColor(animal.healthStatus)}
                              >
                                {animal.healthStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className="flex items-center w-fit"
                              >
                                <MapPin className="h-3 w-3 ml-1" />
                                {getBarnName(animal.barnId)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {animal.isPregnant ? (
                                <Badge className="bg-pink-100 text-pink-800">
                                  حامل
                                </Badge>
                              ) : (
                                <Badge variant="outline">غير حامل</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {farmHelpers.formatCurrency(
                                animal.currentPrice || animal.purchasePrice,
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {getSupplierDisplay(animal)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-1 justify-start">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(animal)}
                                  className="h-8 w-8 p-0"
                                  title="حذف"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleWeightRecord(animal)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  title="تسجيل وزن"
                                >
                                  <Scale className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(animal)}
                                  className="h-8 w-8 p-0"
                                  title="تعديل"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAnimal(animal);
                                    setShowLifecycleCard(true);
                                  }}
                                  className="h-8 w-8 p-0 text-pink-600 hover:text-pink-700"
                                  title="عرض دورة الحياة"
                                >
                                  <Heart className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredAnimals.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">
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

            <TabsContent value="pregnant" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 ml-2 text-pink-600" />
                    الإناث الحوامل
                  </CardTitle>
                  <CardDescription>
                    الإناث الحوامل التي تحتاج متابعة ورعاية خاصة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4" dir="rtl">
                    {filteredAnimals.filter(animal => animal.isPregnant).map((female) => (
                      <div key={female.id} className="space-y-2">
                        <FemaleLifecycleCard animal={female} />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(female)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeightRecord(female)}
                          >
                            تسجيل وزن
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(female)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredAnimals.filter(animal => animal.isPregnant).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        لا يوجد إناث حوامل حالياً
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lifecycle" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>دورة حياة الإناث التفصيلية</CardTitle>
                  <CardDescription>
                    عرض تفصيلي لدورة حياة كل أنثى في المزرعة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4" dir="rtl">
                    {filteredAnimals.map((female) => (
                      <div key={female.id} className="space-y-2">
                        <FemaleLifecycleCard animal={female} />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(female)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWeightRecord(female)}
                          >
                            تسجيل وزن
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(female)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredAnimals.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        لا توجد نتائج مطابقة للبحث
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 ml-2 text-blue-600" />
                    أداء الحيوانات
                  </CardTitle>
                  <CardDescription>
                    تحليلات أداء الحيوانات ومعدلات النمو وكفاءة التغذية
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimalPerformanceDashboard 
                    animalType={animalType}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Enhanced Newborns Table with Tabs
          <Tabs defaultValue="all" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">جميع المواليد ({analytics.totalCount})</TabsTrigger>
              <TabsTrigger value="lifecycle">دورة الحياة</TabsTrigger>
              <TabsTrigger value="performance">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 ml-1" />
                  أداء الحيوانات
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>قائمة {getAnimalTypeLabel(animalType)}</CardTitle>
                  <CardDescription>
                    إجمالي {filteredAnimals.length} من {getAnimalTypeLabel(animalType)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
              <div className="rounded-md border" dir="rtl">
                <Table className="rtl:text-right">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الأذن</TableHead>
                      <TableHead className="text-right">الوزن الحالي</TableHead>
                      <TableHead className="text-right">الحالة الصحية</TableHead>
                      <TableHead className="text-right">الحظيرة</TableHead>
                      {(animalType as AnimalCategory) === "female" && (
                        <TableHead className="text-right">حالة الحمل</TableHead>
                      )}
                      {(animalType as AnimalCategory) === "newborn" && (
                        <TableHead className="text-right">الأم</TableHead>
                      )}
                      {animalType !== "newborn" && (
                        <TableHead className="text-right">السعر الحالي</TableHead>
                      )}
                      <TableHead className="text-right">المورد</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnimals.map((animal) => (
                      <TableRow key={animal.id}>
                        <TableCell className="font-medium text-right">
                          {animal.earTagId}
                          {animal.isIsolated && (
                            <Badge
                              variant="outline"
                              className="mr-2 bg-orange-50 text-orange-700"
                            >
                              عزل
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-start gap-1">
                            {farmHelpers.formatWeight(animal.weight)}
                            {recentlyUpdatedAnimals.has(animal.id) && (
                              <Badge 
                                variant="outline" 
                                className="bg-green-50 text-green-600 text-xs mr-1"
                              >
                                محدث
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={getHealthStatusColor(animal.healthStatus)}
                          >
                            {animal.healthStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className="flex items-center w-fit"
                          >
                            <MapPin className="h-3 w-3 ml-1" />
                            {getBarnName(animal.barnId)}
                          </Badge>
                        </TableCell>
                        {(animalType as string) === "female" && (
                          <TableCell className="text-right">
                            {animal.isPregnant ? (
                              <Badge className="bg-pink-100 text-pink-800">
                                حامل
                              </Badge>
                            ) : (
                              <Badge variant="outline">غير حامل</Badge>
                            )}
                          </TableCell>
                        )}
                        {(animalType as string) === "newborn" && (
                          <TableCell className="text-right">
                            {animal.motherEarTagId ||
                              (animal.motherId ? "غير محدد" : "-")}
                          </TableCell>
                        )}
                        {(animalType as string) !== "newborn" && (
                          <TableCell className="text-right">
                            {farmHelpers.formatCurrency(
                              animal.currentPrice || animal.purchasePrice,
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          {getSupplierDisplay(animal)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-start">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(animal)}
                              className="h-8 w-8 p-0"
                              title="حذف"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWeightRecord(animal)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="تسجيل وزن"
                            >
                              <Scale className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(animal)}
                              className="h-8 w-8 p-0"
                              title="تعديل"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAnimals.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={animalType === "newborn" ? 7 : 8}
                          className="text-center py-8"
                        >
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

        <TabsContent value="lifecycle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Baby className="h-5 w-5 ml-2 text-pink-600" />
                دورة حياة المواليد
              </CardTitle>
              <CardDescription>
                مراحل نمو وتطوير المواليد من الولادة إلى الفطام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">سيتم إضافة دورة حياة المواليد قريباً</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 ml-2 text-blue-600" />
                أداء الحيوانات
              </CardTitle>
              <CardDescription>
                تحليلات أداء المواليد ومعدلات النمو وكفاءة التغذية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimalPerformanceDashboard 
                animalType={animalType}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        )}
      </div>

      {/* Lifecycle Card Modal for Males and Females */}
      {((animalType === "male") || (animalType === "female")) && showLifecycleCard && selectedAnimal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {animalType === "male" 
                  ? `دورة حياة الذكر ${selectedAnimal.earTagId}`
                  : `دورة حياة الأنثى ${selectedAnimal.earTagId}`
                }
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLifecycleCard(false)}
              >
                إغلاق
              </Button>
            </div>
            {animalType === "male" ? (
              <MaleLifecycleCard animal={selectedAnimal} />
            ) : (
              <FemaleLifecycleCard animal={selectedAnimal} />
            )}
            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(selectedAnimal)}
              >
                تعديل
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWeightRecord(selectedAnimal)}
              >
                تسجيل وزن
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(selectedAnimal)}
              >
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimalFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSave}
        mode="add"
        animalType={animalType}
      />

      <AnimalFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAnimal(null);
        }}
        onSave={handleSave}
        animal={selectedAnimal}
        mode="edit"
        animalType={animalType}
      />

      <WeightRecordModal
        isOpen={isWeightModalOpen}
        onClose={() => {
          setIsWeightModalOpen(false);
          setSelectedAnimal(null);
        }}
        onSave={handleWeightSave}
        preselectedAnimalId={selectedAnimal?.id}
      />
    </div>
  );
}
