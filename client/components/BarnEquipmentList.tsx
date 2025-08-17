import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { BarnEquipment } from "@/../../shared/types";
import { formatDate } from "@/lib/utils";
import { dataService } from "@/lib/data-service";
import { toast } from "@/hooks/use-toast";
import { EquipmentFormModal } from "./EquipmentFormModal";

interface BarnEquipmentListProps {
  barnId: string;
}

export function BarnEquipmentList({ barnId }: BarnEquipmentListProps) {
  const [equipment, setEquipment] = React.useState<BarnEquipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedEquipment, setSelectedEquipment] = React.useState<BarnEquipment | null>(null);
  const [formMode, setFormMode] = React.useState<"add" | "edit">("add");
  
  // Load equipment
  React.useEffect(() => {
    loadEquipment();
  }, [barnId]);
  
  const loadEquipment = async () => {
    setLoading(true);
    try {
      const data = await dataService.barnEquipment.query([
        { field: "barnId", operator: "==", value: barnId }
      ]);
      setEquipment(data);
    } catch (error) {
      console.error("Error loading equipment:", error);
      toast({
        title: "خطأ في تحميل المعدات",
        description: "حدث خطأ أثناء تحميل معدات الحظيرة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAdd = () => {
    setFormMode("add");
    setSelectedEquipment(null);
    setShowModal(true);
  };
  
  const onEditEquipment = (equipment: BarnEquipment) => {
    setFormMode("edit");
    setSelectedEquipment(equipment);
    setShowModal(true);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await dataService.barnEquipment.delete(id);
      toast({
        title: "تم حذف المعدات",
        description: "تم حذف المعدات بنجاح",
      });
      await loadEquipment();
    } catch (error) {
      console.error("Error deleting equipment:", error);
      toast({
        title: "خطأ في حذف المعدات",
        description: "حدث خطأ أثناء حذف معدات الحظيرة",
        variant: "destructive",
      });
    }
  };
  const getEquipmentTypeLabel = (type: string) => {
    switch(type) {
      case "waterer": return "سقاية";
      case "feeder": return "معلف";
      case "scale": return "ميزان";
      case "heater": return "مدفأة";
      case "ventilator": return "مروحة";
      default: return "أخرى";
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "operational":
        return <Badge className="bg-green-100 text-green-800">يعمل</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">صيانة</Badge>;
      case "broken":
        return <Badge className="bg-red-100 text-red-800">معطل</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>معدات الحظيرة</CardTitle>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          إضافة معدات
        </Button>
      </CardHeader>
      <CardContent>
        {equipment.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="text-left">إجراءات</TableCell>
                <TableCell>ملاحظات</TableCell>
                <TableCell>تاريخ آخر صيانة</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>العدد</TableCell>
                <TableCell>النوع</TableCell>
                <TableCell>المعدة</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onEditEquipment(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {item.notes || "-"}
                  </TableCell>
                  <TableCell>
                    {item.maintenanceDate 
                      ? formatDate(new Date(item.maintenanceDate)) 
                      : "لا يوجد"}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{getEquipmentTypeLabel(item.type)}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد معدات مسجلة لهذه الحظيرة
          </div>
        )}
      </CardContent>
      
      {/* Equipment Form Modal */}
      <EquipmentFormModal
        barnId={barnId}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        equipment={selectedEquipment || undefined}
        onSave={loadEquipment}
      />
    </Card>
  );
}
