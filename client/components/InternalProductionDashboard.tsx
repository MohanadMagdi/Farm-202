import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Factory, 
  Users, 
  TrendingUp, 
  Weight,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Heart,
  Baby,
  Clock
} from 'lucide-react';
import { Animal, Barn } from '@shared/types';
import { automaticWeaningTransferService } from '@/lib/automatic-weaning-transfer-service';
import { dataService } from '@/lib/data-service';
import { formatEGP } from '@/lib/utils';
import AnimalFormModal from '@/components/forms/AnimalFormModal';

interface InternalProductionDashboardProps {}

export function InternalProductionDashboard({}: InternalProductionDashboardProps) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // جلب جميع الحيوانات والحظائر
      const [allAnimals, allBarns] = await Promise.all([
        dataService.animals.getAll(),
        dataService.barns.getAll()
      ]);
      
      // فلترة الحيوانات: المواليد + الحيوانات التي يجب إظهارها في الإنتاج الداخلي
      const internalAnimals = allAnimals.filter(animal => 
        animal.category === 'newborn' || 
        animal.internalProduction === true || 
        animal.showInInternalProduction === true
      );
      
      // حساب الإحصائيات
      const stats = calculateStats(internalAnimals);
      
      setAnimals(internalAnimals);
      setBarns(allBarns);
      setStats(stats);
    } catch (error) {
      console.error('Error loading internal production data:', error);
    } finally {
      setLoading(false);
    }
  };

  // دالة للحصول على رقم أذن الأم بدلاً من معرف الأم
  const getMotherEarTag = (motherId: string | undefined): string => {
    if (!motherId || motherId === 'none') {
      return 'غير محدد';
    }
    
    const mother = animals.find(animal => animal.earTagId === motherId);
    return mother ? mother.earTagId : motherId; // إذا لم تجد الأم، اعرض المعرف
  };

  // دالة للحصول على اسم الحظيرة بدلاً من معرف الحظيرة
  const getBarnName = (barnId: string) => {
    const barn = barns.find(b => b.id === barnId);
    return barn ? barn.name : barnId; // Fallback to barnId if not found
  };

  // دالة حساب الإحصائيات
  const calculateStats = (animalsData: Animal[]) => {
    const totalCount = animalsData.length;
    const maleCount = animalsData.filter(a => a.sex === 'male').length;
    const femaleCount = animalsData.filter(a => a.sex === 'female').length;
    const newbornCount = animalsData.filter(a => a.category === 'newborn').length;
    const weanedCount = animalsData.filter(a => a.category !== 'newborn').length;
    
    // إحصائيات خاصة بالمواليد الذكور
    const newbornMalesCount = animalsData.filter(a => a.sex === 'male' && a.category === 'newborn').length;
    const malesReadyForTransfer = animalsData.filter(a => {
      if (a.sex !== 'male' || a.category !== 'newborn') return false;
      return getAnimalTransferStatus(a).status === 'ready';
    }).length;
    
    const byCategory = {} as Record<string, number>;
    animalsData.forEach(animal => {
      byCategory[animal.category] = (byCategory[animal.category] || 0) + 1;
    });

    const totalWeight = animalsData.reduce((sum, animal) => sum + (animal.weight || 0), 0);
    const averageAge = totalCount > 0 
      ? animalsData.reduce((sum, animal) => sum + (animal.ageMonths || 0), 0) / totalCount 
      : 0;

    return {
      totalCount,
      maleCount,
      femaleCount,
      newbornCount,
      weanedCount,
      newbornMalesCount,
      malesReadyForTransfer,
      byCategory,
      totalWeight,
      averageAge
    };
  };

  // فلترة الحيوانات حسب البحث والفئة
  const filteredAnimals = animals.filter(animal => {
    const motherEarTag = getMotherEarTag(animal.motherId);
    const matchesSearch = animal.earTagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motherEarTag.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory === 'male') {
      matchesCategory = animal.sex === 'male';
    } else if (selectedCategory === 'female') {
      matchesCategory = animal.sex === 'female';
    } else if (selectedCategory === 'newborn') {
      matchesCategory = animal.category === 'newborn';
    } else if (selectedCategory === 'weaned') {
      matchesCategory = animal.category !== 'newborn';
    }
    // 'all' يعرض الجميع
    
    return matchesSearch && matchesCategory;
  });

  // حساب قيمة الإنتاج الداخلي
  const calculateTotalValue = () => {
    return filteredAnimals.reduce((total, animal) => {
      return total + (animal.currentPrice || animal.purchasePrice || 0);
    }, 0);
  };

  // معالجة الإجراءات
  const handleViewAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsViewModalOpen(true);
  };

  const handleEditAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setIsEditModalOpen(true);
  };

  const handleDeleteAnimal = async (animal: Animal) => {
    if (window.confirm(`هل أنت متأكد من حذف الحيوان ${animal.earTagId}؟`)) {
      try {
        await dataService.animals.delete(animal.id);
        loadData(); // إعادة تحميل البيانات
      } catch (error) {
        console.error('خطأ في حذف الحيوان:', error);
        alert('حدث خطأ أثناء حذف الحيوان');
      }
    }
  };

  // تحديد حالة الحيوان (جاهز للنقل أم لا)
  const getAnimalTransferStatus = (animal: Animal) => {
    if (animal.category !== 'newborn') {
      return { status: 'transferred', label: 'تم النقل', color: 'bg-green-600' };
    }
    
    // التحقق من تاريخ الفطام
    if (animal.weaningDate) {
      const weaningDate = new Date(animal.weaningDate);
      const today = new Date();
      if (today >= weaningDate) {
        return { status: 'ready', label: 'جاهز للنقل', color: 'bg-orange-600' };
      } else {
        const daysLeft = Math.ceil((weaningDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { status: 'pending', label: `${daysLeft} يوم`, color: 'bg-blue-600' };
      }
    }
    
    // استخدام تاريخ الميلاد لحساب العمر بالأيام
    if (animal.birthDate) {
      const birthDate = new Date(animal.birthDate);
      const today = new Date();
      const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (ageInDays >= 60) {
        return { status: 'ready', label: 'جاهز للنقل', color: 'bg-orange-600' };
      } else {
        const daysLeft = 60 - ageInDays;
        return { status: 'pending', label: `${daysLeft} يوم`, color: 'bg-blue-600' };
      }
    }
    
    return { status: 'unknown', label: 'غير محدد', color: 'bg-gray-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" dir="rtl">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>جارِ تحميل بيانات الإنتاج الداخلي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center">
            <Factory className="h-6 w-6 ml-2 text-primary" />
            الإنتاج الداخلي والمواليد
          </h2>
          <p className="text-muted-foreground">
            جميع المواليد والحيوانات المنتجة داخلياً - الذكور والإناث في جميع المراحل
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            تحديث البيانات
          </Button>
          
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة مولود جديد
          </Button>
        </div>
      </div>

      {/* Overview Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Factory className="h-4 w-4 ml-1 text-green-600" />
                إجمالي الإنتاج الداخلي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalCount}
              </div>
              <p className="text-xs text-muted-foreground">
                حيوان من الإنتاج المحلي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 ml-1 text-blue-600" />
                الذكور / الإناث
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-blue-600">
                  {stats.maleCount}
                </div>
                <span className="text-muted-foreground">/</span>
                <div className="text-lg font-bold text-pink-600">
                  {stats.femaleCount}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ذكر / أنثى
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Baby className="h-4 w-4 ml-1 text-blue-600" />
                المواليد الذكور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.newbornMalesCount}
              </div>
              <p className="text-xs text-muted-foreground">
                مولود ذكر في النظام
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 ml-1 text-orange-600" />
                جاهز للنقل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.malesReadyForTransfer}
              </div>
              <p className="text-xs text-muted-foreground">
                ذكر جاهز للنقل
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Factory className="h-4 w-4 ml-1 text-yellow-600" />
                المواليد / المفطومين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold text-yellow-600">
                  {stats.newbornCount}
                </div>
                <span className="text-muted-foreground">/</span>
                <div className="text-lg font-bold text-purple-600">
                  {stats.weanedCount}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                مولود / مفطوم
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Weight className="h-4 w-4 ml-1 text-orange-600" />
                إجمالي الوزن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalWeight.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                كيلو جرام
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 ml-1 text-purple-600" />
                متوسط العمر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.averageAge.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                شهر
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 ml-2" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">بحث برقم الأذن أو الأم</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="اكتب رقم الأذن..."
                className="w-full"
              />
            </div>
            
            <div>
              <Label htmlFor="category">الفئة</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="all">جميع الفئات</option>
                <option value="male">ذكور</option>
                <option value="female">إناث</option>
                <option value="newborn">مواليد (لم يفطموا بعد)</option>
                <option value="weaned">مفطومين (منتقلين للقطعان)</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                variant="outline"
                className="w-full"
              >
                <Filter className="h-4 w-4 ml-2" />
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animals List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            قائمة الإنتاج الداخلي ({filteredAnimals.length} حيوان)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              القيمة الإجمالية: {formatEGP(calculateTotalValue())}
            </Badge>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAnimals.length === 0 ? (
            <div className="text-center py-8">
              <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'لا توجد نتائج للبحث المحدد'
                  : 'لا يوجد إنتاج داخلي بعد'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الأذن</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">حالة النقل</TableHead>
                    <TableHead className="text-right">رقم أذن الأم</TableHead>
                    <TableHead className="text-right">الوزن</TableHead>
                    <TableHead className="text-right">العمر</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnimals.slice(0, 20).map((animal) => {
                    const age = animal.ageMonths || 0;
                    const ageDisplay = age < 12 
                      ? `${age} شهر` 
                      : `${Math.floor(age / 12)} سنة ${age % 12 > 0 ? `و ${age % 12} شهر` : ''}`;

                    return (
                      <TableRow key={animal.id}>
                        <TableCell className="font-medium">
                          {animal.earTagId}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            animal.sex === 'male' 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-pink-100 text-pink-800"
                          }>
                            {animal.sex === 'male' ? '♂️ ذكر' : '♀️ أنثى'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={
                              animal.category === 'newborn'
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }>
                              <Factory className="h-3 w-3 ml-1" />
                              {animal.category === 'newborn' ? 'مولود' : 'مفطوم'}
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              إنتاج داخلي
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const transferStatus = getAnimalTransferStatus(animal);
                            return (
                              <Badge className={`text-white ${transferStatus.color}`}>
                                <Clock className="h-3 w-3 ml-1" />
                                {transferStatus.label}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {animal.motherEarTagId && animal.motherEarTagId !== 'none' ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                {getMotherEarTag(animal.motherEarTagId)}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              غير محدد
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {animal.weight} كجم
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {ageDisplay}
                          </span>
                        </TableCell>
                        <TableCell>
                          {animal.currentPrice ? (
                            <span className="font-medium text-green-600">
                              {formatEGP(animal.currentPrice)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              غير محدد
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="عرض التفاصيل"
                              onClick={() => handleViewAnimal(animal)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="تعديل"
                              onClick={() => handleEditAnimal(animal)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="حذف"
                              onClick={() => handleDeleteAnimal(animal)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredAnimals.length > 20 && (
                <div className="text-center py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    عرض 20 من أصل {filteredAnimals.length} حيوان
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Animal Modal */}
      <AnimalFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={() => {
          setIsAddModalOpen(false);
          loadData(); // إعادة تحميل البيانات بعد الإضافة
        }}
        mode="add"
        animalType="newborn" // دائماً مولود جديد في هذه الصفحة
      />

      {/* Edit Animal Modal */}
      {selectedAnimal && (
        <AnimalFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAnimal(null);
          }}
          onSave={() => {
            setIsEditModalOpen(false);
            setSelectedAnimal(null);
            loadData(); // إعادة تحميل البيانات بعد التعديل
          }}
          mode="edit"
          animal={selectedAnimal}
        />
      )}

      {/* View Animal Details Modal */}
      {selectedAnimal && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-right flex items-center gap-2">
                <Eye className="h-5 w-5" />
                تفاصيل الحيوان - {selectedAnimal.earTagId}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="text-lg px-3 py-1">
                      {selectedAnimal.earTagId}
                    </Badge>
                    <Badge className={
                      selectedAnimal.sex === 'male' 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-pink-100 text-pink-800"
                    }>
                      {selectedAnimal.sex === 'male' ? '♂️ ذكر' : '♀️ أنثى'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={
                      selectedAnimal.category === 'newborn'
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }>
                      <Factory className="h-3 w-3 ml-1" />
                      {selectedAnimal.category === 'newborn' ? 'مولود' : 'مفطوم'}
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      إنتاج داخلي
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Weight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">الوزن:</span>
                    <span>{selectedAnimal.weight} كجم</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">العمر:</span>
                    <span>
                      {(() => {
                        const age = selectedAnimal.ageMonths || 0;
                        return age < 12 
                          ? `${age} شهر` 
                          : `${Math.floor(age / 12)} سنة ${age % 12 > 0 ? `و ${age % 12} شهر` : ''}`;
                      })()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">الحظيرة:</span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      {selectedAnimal.barnId ? getBarnName(selectedAnimal.barnId) : 'غير محدد'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Mother Information */}
              {(selectedAnimal.motherId && selectedAnimal.motherId !== 'none') && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-600" />
                    معلومات الأم
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">رقم أذن الأم:</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      {getMotherEarTag(selectedAnimal.motherEarTagId)}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Dates Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  التواريخ المهمة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedAnimal.birthDate && (
                    <div>
                      <span className="font-medium">تاريخ الميلاد:</span>
                      <div className="text-muted-foreground">
                        {new Date(selectedAnimal.birthDate).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  )}
                  
                  {selectedAnimal.weaningDate && (
                    <div>
                      <span className="font-medium">تاريخ الفطام:</span>
                      <div className="text-muted-foreground">
                        {new Date(selectedAnimal.weaningDate).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  )}
                  
                  {selectedAnimal.purchaseDate && (
                    <div>
                      <span className="font-medium">تاريخ الشراء:</span>
                      <div className="text-muted-foreground">
                        {new Date(selectedAnimal.purchaseDate).toLocaleDateString('ar-EG')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  المعلومات المالية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedAnimal.purchasePrice && (
                    <div>
                      <span className="font-medium">سعر الشراء:</span>
                      <div className="text-green-600 font-medium">
                        {formatEGP(selectedAnimal.purchasePrice)}
                      </div>
                    </div>
                  )}
                  
                  {selectedAnimal.currentPrice && (
                    <div>
                      <span className="font-medium">السعر الحالي:</span>
                      <div className="text-green-600 font-medium">
                        {formatEGP(selectedAnimal.currentPrice)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedAnimal(null);
                  }}
                >
                  إغلاق
                </Button>
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditModalOpen(true);
                    // selectedAnimal is already set
                  }}
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
