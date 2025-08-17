import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { dataService } from "@/lib/data-service";
import type { Animal } from "@shared/types";
import {
  Edit,
  Trash2,
  Scale,
  Heart,
  Eye,
  MoreHorizontal,
  Move,
  Copy,
  Archive,
  AlertTriangle,
  FileText,
  Camera,
  MapPin,
  Calendar,
  TrendingUp,
  Baby,
  Activity,
  Shield,
  Users,
  Stethoscope,
  Pill,
  Syringe,
  Thermometer,
} from "lucide-react";

interface AnimalActionButtonsProps {
  animal: Animal;
  onEdit?: (animal: Animal) => void;
  onDelete?: (animal: Animal) => void;
  onWeightRecord?: (animal: Animal) => void;
  onTreatment?: (animal: Animal) => void;
  onMove?: (animal: Animal) => void;
  onActionComplete?: () => void;
}

export default function AnimalActionButtons({
  animal,
  onEdit,
  onDelete,
  onWeightRecord,
  onTreatment,
  onMove,
  onActionComplete,
}: AnimalActionButtonsProps) {
  const [loading, setLoading] = useState(false);

  const handleQuickWeigh = async () => {
    setLoading(true);
    try {
      // Quick weight recording
      onWeightRecord?.(animal);
      toast({
        title: "تسجيل الوزن",
        description: `تم فتح نموذج تسجيل الوزن للحيوان ${animal.earTagId}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء فتح نموذج تسجيل الوزن",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTreatment = async () => {
    setLoading(true);
    try {
      onTreatment?.(animal);
      toast({
        title: "تسجيل العلاج",
        description: `تم فتح نموذج العلاج للحيوان ${animal.earTagId}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء فتح نموذج العلاج",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async () => {
    setLoading(true);
    try {
      onMove?.(animal);
      toast({
        title: "نقل الحيوان",
        description: `تم فتح نموذج نقل الحيوان ${animal.earTagId}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء فتح نموذج النقل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIsolate = async () => {
    setLoading(true);
    try {
      const updatedAnimal = {
        ...animal,
        isIsolated: !animal.isIsolated,
        healthStatus: animal.isIsolated ? "سليم" : "معزول",
      };
      await dataService.animals.update(animal.id, updatedAnimal);
      
      toast({
        title: animal.isIsolated ? "إلغاء العزل" : "عزل الحيوان",
        description: animal.isIsolated 
          ? `تم إلغاء عزل الحيوان ${animal.earTagId}`
          : `تم عزل الحيوان ${animal.earTagId}`,
      });
      
      onActionComplete?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة العزل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      // Generate QR code for animal
      const qrData = {
        id: animal.id,
        earTagId: animal.earTagId,
        category: animal.category,
        weight: animal.weight,
      };
      
      // Here you would implement QR code generation
      toast({
        title: "رمز الاستجابة السريعة",
        description: `تم إنشاء رمز QR للحيوان ${animal.earTagId}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء رمز QR",
        variant: "destructive",
      });
    }
  };

  const handleCreateReport = async () => {
    try {
      // Create individual animal report
      // This would generate a comprehensive report for the specific animal
      const reportData = {
        animalId: animal.id,
        earTagId: animal.earTagId,
        category: animal.category,
        weight: animal.weight,
        healthStatus: animal.healthStatus,
        generatedAt: new Date(),
      };
      
      toast({
        title: "تقرير الحيوان",
        description: `تم إنشاء تقرير للحيوان ${animal.earTagId}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Primary Actions - Always Visible */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit?.(animal)}
        className="h-8 w-8 p-0 hover:bg-blue-50"
        title="تعديل البيانات"
      >
        <Edit className="h-3 w-3 text-blue-600" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleQuickWeigh}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-green-50"
        title="تسجيل الوزن"
      >
        <Scale className="h-3 w-3 text-green-600" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleQuickTreatment}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-red-50"
        title="تسجيل علاج"
      >
        <Heart className="h-3 w-3 text-red-600" />
      </Button>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-50"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>إجراءات الحيوان</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* View Details */}
          <DropdownMenuItem onClick={() => {}}>
            <Eye className="h-4 w-4 ml-2" />
            عرض التفاصيل
          </DropdownMenuItem>

          {/* Move Animal */}
          <DropdownMenuItem onClick={handleMove}>
            <Move className="h-4 w-4 ml-2" />
            نقل إلى حظيرة أخرى
          </DropdownMenuItem>

          {/* Medical Actions */}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>الإجراءات الطبية</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={handleIsolate}>
            <Shield className={`h-4 w-4 ml-2 ${animal.isIsolated ? 'text-green-600' : 'text-orange-600'}`} />
            {animal.isIsolated ? "إلغاء العزل" : "عزل الحيوان"}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => {}}>
            <Thermometer className="h-4 w-4 ml-2 text-blue-600" />
            قياس الحرارة
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => {}}>
            <Syringe className="h-4 w-4 ml-2 text-purple-600" />
            تسجيل تطعيم
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => {}}>
            <Pill className="h-4 w-4 ml-2 text-green-600" />
            إعطاء دواء
          </DropdownMenuItem>

          {/* Breeding Actions - For Females */}
          {animal.category === "female" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>إجراءات التكاثر</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => {}}>
                <Baby className="h-4 w-4 ml-2 text-pink-600" />
                تسجيل حمل
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => {}}>
                <Calendar className="h-4 w-4 ml-2 text-indigo-600" />
                تحديد موعد الولادة
              </DropdownMenuItem>
            </>
          )}

          {/* Reports & Documentation */}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>التقارير والتوثيق</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={handleCreateReport}>
            <FileText className="h-4 w-4 ml-2 text-blue-600" />
            إنشاء تقرير
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleGenerateQR}>
            <Camera className="h-4 w-4 ml-2 text-gray-600" />
            إنشاء رمز QR
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => {}}>
            <TrendingUp className="h-4 w-4 ml-2 text-green-600" />
            عرض المخططات
          </DropdownMenuItem>

          {/* Dangerous Actions */}
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => {}}>
            <Archive className="h-4 w-4 ml-2 text-orange-600" />
            أرشفة
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => onDelete?.(animal)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف الحيوان
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Badges */}
      <div className="flex gap-1 mr-2">
        {animal.isIsolated && (
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
            <AlertTriangle className="h-3 w-3 ml-1" />
            معزول
          </Badge>
        )}
        
        {animal.isPregnant && (
          <Badge variant="outline" className="text-xs bg-pink-50 text-pink-700">
            <Baby className="h-3 w-3 ml-1" />
            حامل
          </Badge>
        )}
        
        {animal.healthStatus === "مريض" && (
          <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
            <Stethoscope className="h-3 w-3 ml-1" />
            مريض
          </Badge>
        )}
      </div>
    </div>
  );
}
