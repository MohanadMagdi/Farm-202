import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatArabicNumber, animalTypes } from "@/lib/arabic-utils";
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
  CheckCircle
} from "lucide-react";

interface Barn {
  id: string;
  name: string;
  type: 'male' | 'female' | 'newborn' | 'mixed';
  capacity: number;
  currentOccupancy: number;
  location: string;
  notes?: string;
  active: boolean;
  animals: Array<{
    id: string;
    tagId: string;
    type: 'male' | 'female' | 'newborn';
  }>;
}

// Mock data
const mockBarns: Barn[] = [
  {
    id: "B001",
    name: "الحظيرة الرئيسية - ذكور",
    type: "male",
    capacity: 50,
    currentOccupancy: 35,
    location: "الجانب الشرقي",
    notes: "حظيرة مجهزة بأنظمة تهوية حديثة",
    active: true,
    animals: [
      { id: "1", tagId: "M001", type: "male" },
      { id: "2", tagId: "M015", type: "male" },
    ]
  },
  {
    id: "B002", 
    name: "حظيرة الإناث الرئيسية",
    type: "female",
    capacity: 60,
    currentOccupancy: 45,
    location: "الجانب الغربي",
    notes: "مخصصة للإناث الحوامل والمرضعات",
    active: true,
    animals: [
      { id: "3", tagId: "F047", type: "female" },
      { id: "4", tagId: "F023", type: "female" },
    ]
  },
  {
    id: "B003",
    name: "حظيرة الصغار",
    type: "newborn", 
    capacity: 30,
    currentOccupancy: 18,
    location: "المنطقة الوسطى",
    notes: "مجهزة بأنظمة تدفئة للصغار",
    active: true,
    animals: [
      { id: "5", tagId: "N012", type: "newborn" },
      { id: "6", tagId: "N008", type: "newborn" },
    ]
  },
  {
    id: "B004",
    name: "حظيرة الحجر الصحي",
    type: "mixed",
    capacity: 20,
    currentOccupancy: 3,
    location: "منطقة منفصلة",
    notes: "للحيوانات الجديدة أو المريضة",
    active: true,
    animals: []
  },
  {
    id: "B005",
    name: "الحظيرة الاحتياطية",
    type: "mixed",
    capacity: 40,
    currentOccupancy: 0,
    location: "الجانب الجنوبي",
    notes: "حظيرة احتياطية للحالات الطارئة",
    active: false,
    animals: []
  }
];

const barnTypeLabels = {
  male: "ذكور",
  female: "إناث", 
  newborn: "صغار",
  mixed: "مختلط"
};

export default function BarnsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBarns = mockBarns
    .filter(barn => 
      barn.name.includes(searchTerm) ||
      barn.location.includes(searchTerm) ||
      barn.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(barn => typeFilter === "all" || barn.type === typeFilter)
    .filter(barn => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return barn.active;
      if (statusFilter === "inactive") return !barn.active;
      if (statusFilter === "full") return barn.currentOccupancy >= barn.capacity;
      if (statusFilter === "near_full") return barn.currentOccupancy / barn.capacity > 0.8;
      return true;
    });

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 100) return "text-red-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-green-600";
  };

  const getOccupancyBadge = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 100) return { text: "ممتلئة", color: "bg-red-100 text-red-800" };
    if (percentage >= 80) return { text: "شبه ممتلئة", color: "bg-yellow-100 text-yellow-800" };
    if (percentage === 0) return { text: "فارغة", color: "bg-gray-100 text-gray-800" };
    return { text: "متاحة", color: "bg-green-100 text-green-800" };
  };

  const totalCapacity = mockBarns.reduce((sum, barn) => sum + barn.capacity, 0);
  const totalOccupancy = mockBarns.reduce((sum, barn) => sum + barn.currentOccupancy, 0);
  const activeBarns = mockBarns.filter(barn => barn.active).length;
  const fullBarns = mockBarns.filter(barn => barn.currentOccupancy >= barn.capacity).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">إدارة الحظائر</h1>
          <p className="text-muted-foreground">
            عرض وإدارة حظائر المزرعة ونقل الحيوانات
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button variant="outline" size="sm">
            <ArrowRightLeft className="h-4 w-4 ml-2" />
            نقل الحيوانات
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة حظيرة جديدة
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحظائر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(mockBarns.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatArabicNumber(activeBarns)} حظيرة نشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">السعة الإجمالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(totalCapacity)}
            </div>
            <p className="text-xs text-muted-foreground">
              حيوان كحد أقصى
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الإشغال الحالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(totalOccupancy)}
            </div>
            <Progress 
              value={(totalOccupancy / totalCapacity) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((totalOccupancy / totalCapacity) * 100)}% من السعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">تنبيهات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 space-x-reverse">
              {fullBarns > 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatArabicNumber(fullBarns)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      حظيرة ممتلئة
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <p className="text-xs text-muted-foreground">
                      لا توجد تنبيهات
                    </p>
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
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:space-x-reverse">
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
                <SelectItem value="male">ذكور</SelectItem>
                <SelectItem value="female">إناث</SelectItem>
                <SelectItem value="newborn">صغار</SelectItem>
                <SelectItem value="mixed">مختلط</SelectItem>
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
                <SelectItem value="full">ممتلئة</SelectItem>
                <SelectItem value="near_full">شبه ممتلئة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Barns Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBarns.map((barn) => {
          const occupancyPercentage = (barn.currentOccupancy / barn.capacity) * 100;
          const occupancyBadge = getOccupancyBadge(barn.currentOccupancy, barn.capacity);
          
          return (
            <Card key={barn.id} className={`${!barn.active ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{barn.name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 space-x-reverse mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{barn.location}</span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline">
                      {barnTypeLabels[barn.type]}
                    </Badge>
                    <Badge className={occupancyBadge.color}>
                      {occupancyBadge.text}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Occupancy */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">الإشغال</span>
                    <span className={`text-sm font-bold ${getOccupancyColor(barn.currentOccupancy, barn.capacity)}`}>
                      {formatArabicNumber(barn.currentOccupancy)} / {formatArabicNumber(barn.capacity)}
                    </span>
                  </div>
                  <Progress value={occupancyPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(occupancyPercentage)}% مشغولة
                  </p>
                </div>

                {/* Notes */}
                {barn.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">{barn.notes}</p>
                  </div>
                )}

                {/* Animals List */}
                {barn.animals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">الحيوانات:</p>
                    <div className="flex flex-wrap gap-1">
                      {barn.animals.slice(0, 3).map((animal) => (
                        <Badge key={animal.id} variant="secondary" className="text-xs">
                          {animal.tagId}
                        </Badge>
                      ))}
                      {barn.animals.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{formatArabicNumber(barn.animals.length - 3)} أخرى
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2 space-x-reverse pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3 w-3 ml-1" />
                    عرض
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Users className="h-3 w-3 ml-1" />
                    نقل
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
    </div>
  );
}
