import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatEGP, formatWeight, formatArabicDate, animalTypes, healthStatus, animalStatus } from "@/lib/arabic-utils";
import { db, Animal } from "@/lib/firebase-mock";
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Activity,
  MapPin,
  Scale
} from "lucide-react";

// Modal states and data loading

interface AnimalsPageProps {
  animalType: 'male' | 'female' | 'newborn';
}

export default function AnimalsPage({ animalType }: AnimalsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");

  const filteredAnimals = mockAnimals
    .filter(animal => animal.type === animalType)
    .filter(animal => 
      animal.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (animal.supplier && animal.supplier.includes(searchTerm))
    )
    .filter(animal => statusFilter === "all" || animal.status === statusFilter)
    .filter(animal => healthFilter === "all" || animal.healthStatus === healthFilter);

  const getHealthStatusColor = (status: keyof typeof healthStatus) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'under_treatment': return 'bg-yellow-100 text-yellow-800';
      case 'quarantine': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: keyof typeof animalStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'dead': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">
            إدارة {animalTypes[animalType]}
          </h1>
          <p className="text-muted-foreground">
            عرض وإدارة {animalTypes[animalType]} ��ي المزرعة
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة {animalType === 'male' ? 'ذكر' : animalType === 'female' ? 'أنثى' : 'صغير'} جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العدد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {filteredAnimals.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">متوسط الوزن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {filteredAnimals.length > 0 
                ? formatWeight(filteredAnimals.reduce((sum, animal) => sum + animal.currentWeight, 0) / filteredAnimals.length)
                : "0 كيلو"
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الحيوانات السليمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredAnimals.filter(a => a.healthStatus === 'healthy').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">القيمة التقديرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatEGP(filteredAnimals.reduce((sum, animal) => sum + (animal.purchasePrice || 0), 0))}
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
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="حالة الحيوان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="sold">مُباع</SelectItem>
                <SelectItem value="dead">نافق</SelectItem>
              </SelectContent>
            </Select>

            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="الحالة الصحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات الصحية</SelectItem>
                <SelectItem value="healthy">سليم</SelectItem>
                <SelectItem value="sick">مريض</SelectItem>
                <SelectItem value="under_treatment">تحت العلاج</SelectItem>
                <SelectItem value="quarantine">حجر صحي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Animals Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة {animalTypes[animalType]}</CardTitle>
          <CardDescription>
            إجمالي {filteredAnimals.length} من {animalTypes[animalType]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الأذن</TableHead>
                  <TableHead className="text-right">تاريخ الميلاد</TableHead>
                  <TableHead className="text-right">الوزن الحالي</TableHead>
                  <TableHead className="text-right">الحالة الصحية</TableHead>
                  <TableHead className="text-right">حالة الحيوان</TableHead>
                  <TableHead className="text-right">الحظيرة</TableHead>
                  {animalType !== 'newborn' && (
                    <TableHead className="text-right">سعر الشراء</TableHead>
                  )}
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnimals.map((animal) => (
                  <TableRow key={animal.id}>
                    <TableCell className="font-medium">{animal.tagId}</TableCell>
                    <TableCell>{formatArabicDate(animal.birthDate)}</TableCell>
                    <TableCell>{formatWeight(animal.currentWeight)}</TableCell>
                    <TableCell>
                      <Badge className={getHealthStatusColor(animal.healthStatus)}>
                        {healthStatus[animal.healthStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(animal.status)}>
                        {animalStatus[animal.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{animal.barnId}</TableCell>
                    {animalType !== 'newborn' && (
                      <TableCell>
                        {animal.purchasePrice ? formatEGP(animal.purchasePrice) : '-'}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Activity className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MapPin className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAnimals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={animalType !== 'newborn' ? 8 : 7} className="text-center py-8">
                      لا توجد نتائج مطابقة للبحث
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
