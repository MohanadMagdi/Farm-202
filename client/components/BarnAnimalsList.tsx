import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Weight,
  Tag,
} from "lucide-react";
import type { Animal, WeightRecord } from "@/../../shared/types";
import { dataService, farmHelpers } from "@/lib/data-service";
import { formatDate } from "@/lib/utils";

interface BarnAnimalsListProps {
  animals: Animal[];
  weightRecords: WeightRecord[];
}

export function BarnAnimalsList({ animals, weightRecords }: BarnAnimalsListProps) {
  const [expandedAnimals, setExpandedAnimals] = useState<Record<string, boolean>>({});

  const toggleAnimal = (animalId: string) => {
    setExpandedAnimals(prev => ({
      ...prev,
      [animalId]: !prev[animalId]
    }));
  };

  // Get animal weight records
  const getAnimalWeightRecords = (animalId: string) => {
    return weightRecords
      .filter(record => record.animalId === animalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Get animal category display
  const getCategoryDisplay = (category: string) => {
    switch (category) {
      case "male": return "ذكور";
      case "female": return "إناث";
      case "newborn": return "مواليد";
      default: return category;
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableCell className="w-10"></TableCell>
            <TableCell>الحالة الصحية</TableCell>
            <TableCell>آخر وزن</TableCell>
            <TableCell>تاريخ الشراء/الولادة</TableCell>
            <TableCell>الوزن الحالي</TableCell>
            <TableCell>النوع</TableCell>
            <TableCell>رقم الأذن</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {animals.map((animal) => {
            const weightHistory = getAnimalWeightRecords(animal.id);
            const lastWeighDate = weightHistory.length > 0 ? 
              new Date(weightHistory[0].date) : null;
              
            return (
              <React.Fragment key={animal.id}>
                <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleAnimal(animal.id)}>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {expandedAnimals[animal.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={animal.healthStatus === "سليم" || animal.healthStatus === "healthy" ? "outline" : "destructive"}
                    >
                      {animal.healthStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lastWeighDate ? formatDate(lastWeighDate) : "لا يوجد"}
                  </TableCell>
                  <TableCell>
                    {formatDate(animal.birthDate || animal.purchaseDate)}
                  </TableCell>
                  <TableCell>{animal.weight} كج</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryDisplay(animal.category)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2 text-primary" />
                      {animal.earTagId}
                    </div>
                  </TableCell>
                </TableRow>
                
                {expandedAnimals[animal.id] && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="mb-3 font-semibold">سجل الأوزان:</div>
                        
                        {weightHistory.length > 0 ? (
                          <div className="grid grid-cols-3 gap-3">
                            {weightHistory.map((record) => (
                              <div key={record.id} className="bg-card p-2 rounded-md shadow-sm">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center text-sm">
                                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                    {formatDate(new Date(record.date))}
                                  </div>
                                  <div className="flex items-center font-medium">
                                    <Weight className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                    {record.weight} كج
                                  </div>
                                </div>
                                {record.notes && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {record.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            لا توجد سجلات وزن لهذا الحيوان
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
          
          {animals.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                لا توجد حيوانات في هذه الحظيرة
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
