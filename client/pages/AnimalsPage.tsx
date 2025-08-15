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
import AnimalFormModal from "@/components/forms/AnimalFormModal";
import WeightRecordModal from "@/components/forms/WeightRecordModal";
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
import { dataService, farmHelpers } from "@/lib/data-service";
import type { Animal, AnimalCategory } from "@shared/types";
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
} from "lucide-react";

interface AnimalsPageProps {
  animalType: AnimalCategory;
}

export default function AnimalsPage({ animalType }: AnimalsPageProps) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [healthFilter, setHealthFilter] = useState<string>("all");

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
  });

  useEffect(() => {
    loadAnimals();
  }, [animalType]);

  const loadAnimals = async () => {
    try {
      setLoading(true);
      const animalsData = await dataService.animals.getByCategory(animalType);
      setAnimals(animalsData);
      calculateAnalytics(animalsData);
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

  const calculateAnalytics = (animalsData: Animal[]) => {
    const totalCount = animalsData.length;
    const avgWeight = totalCount > 0 
      ? animalsData.reduce((sum, animal) => sum + animal.weight, 0) / totalCount 
      : 0;
    const healthyCount = animalsData.filter(a => a.healthStatus === "سليم" || a.healthStatus === "سليمة").length;
    const totalValue = animalsData.reduce((sum, animal) => sum + (animal.currentPrice || animal.purchasePrice || 0), 0);
    const pregnantCount = animalsData.filter(a => a.isPregnant).length;
    const isolatedCount = animalsData.filter(a => a.isIsolated).length;

    setAnalytics({
      totalCount,
      avgWeight,
      healthyCount,
      totalValue,
      pregnantCount,
      isolatedCount,
    });
  };

  const handleEdit = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsEditModalOpen(true);
  };

  const handleWeightRecord = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsWeightModalOpen(true);
  };

  const handleSave = () => {
    loadAnimals();
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم حفظ بيانات الحيوان بنجاح",
    });
  };

  const handleDelete = async (animal: Animal) => {
    if (window.confirm(`هل أنت متأكد من حذف الحيوان ${animal.earTagId}؟`)) {
      try {
        await dataService.animals.delete(animal.id);
        loadAnimals();
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

  const filteredAnimals = animals.filter(
    (animal) =>
      animal.earTagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (animal.supplier && animal.supplier.includes(searchTerm))
  ).filter(
    (animal) => healthFilter === "all" || animal.healthStatus === healthFilter
  );

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

  const getAnimalTypeLabel = (type: AnimalCategory) => {
    switch (type) {
      case "male": return "الذكور";
      case "female": return "الإناث";
      case "newborn": return "الصغار";
      default: return "الحيوانات";
    }
  };

  const getAddButtonLabel = (type: AnimalCategory) => {
    switch (type) {
      case "male": return "إضافة ذكر جديد";
      case "female": return "إضافة أنثى جديدة";
      case "newborn": return "إضافة صغير جديد";
      default: return "إضافة حيوان جديد";
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
    <div className="space-y-6">
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            {getAddButtonLabel(animalType)}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العدد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {analytics.totalCount}
            </div>
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
            <CardTitle className="text-sm font-medium">القيمة التقديرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {farmHelpers.formatCurrency(analytics.totalValue)}
            </div>
          </CardContent>
        </Card>

        {animalType === "female" && (
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
      </div>

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
                  placeholder="البحث برقم الأذن أو المورد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
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
          </div>
        </CardContent>
      </Card>

      {/* Animals Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة {getAnimalTypeLabel(animalType)}</CardTitle>
          <CardDescription>
            إجمالي {filteredAnimals.length} من {getAnimalTypeLabel(animalType)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الأذن</TableHead>
                  <TableHead className="text-right">الوزن الحالي</TableHead>
                  <TableHead className="text-right">الحالة الصحية</TableHead>
                  <TableHead className="text-right">الحظيرة</TableHead>
                  {animalType === "female" && (
                    <TableHead className="text-right">حالة الحمل</TableHead>
                  )}
                  {animalType === "newborn" && (
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
                        <Badge variant="outline" className="mr-2 bg-orange-50 text-orange-700">
                          عزل
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {farmHelpers.formatWeight(animal.weight)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={getHealthStatusColor(animal.healthStatus)}>
                        {animal.healthStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="flex items-center w-fit">
                        <MapPin className="h-3 w-3 ml-1" />
                        {animal.barnId}
                      </Badge>
                    </TableCell>
                    {animalType === "female" && (
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
                    {animalType === "newborn" && (
                      <TableCell className="text-right">
                        {animal.motherId || "-"}
                      </TableCell>
                    )}
                    {animalType !== "newborn" && (
                      <TableCell className="text-right">
                        {farmHelpers.formatCurrency(animal.currentPrice || animal.purchasePrice)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {animal.supplier || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(animal)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWeightRecord(animal)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <Scale className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(animal)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
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
        onSave={handleSave}
        preselectedAnimalId={selectedAnimal?.id}
      />
    </div>
  );
}
