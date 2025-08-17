import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { WeightRecordModal } from '@/components/forms/WeightEntryModal';
import { formatArabicDate, formatArabicNumber } from '@/lib/arabic-utils';
import { calculateDaysDifference } from '@/lib/weights';
import type { Animal } from '@shared/types';

interface WeightEntry {
  date: string;
  weightKg: number;
  id?: string;
}

interface EnhancedAnimalWeightData extends Animal {
  weightHistory: WeightEntry[];
}

interface WeightColumn {
  index: number;
  dateLabel: string;
  weightLabel: string;
  diffLabel?: string;
  daysLabel?: string;
  adgLabel?: string;
}

interface ProcessedWeightData {
  earTagId: string;
  category: 'male' | 'female' | 'newborn';
  weights: Array<{
    date: string;
    weight: number;
    daysDiff?: number;
    weightDiff?: number;
    adg?: number;
  }>;
}

interface EnhancedWeightTrackingTableProps {
  animals: EnhancedAnimalWeightData[];
  onRefresh: () => void;
}

export function EnhancedWeightTrackingTable({ 
  animals, 
  onRefresh 
}: EnhancedWeightTrackingTableProps) {
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');
  const [maxWeightEntries, setMaxWeightEntries] = useState(0);

  // Calculate the maximum number of weight entries across all animals
  useEffect(() => {
    const maxEntries = Math.max(
      ...animals.map(animal => (animal.weightHistory || []).length),
      2 // Minimum 2 columns to start with
    );
    setMaxWeightEntries(maxEntries);
  }, [animals]);

  // Generate dynamic column headers
  const generateColumns = (): WeightColumn[] => {
    const columns: WeightColumn[] = [];
    
    for (let i = 1; i <= maxWeightEntries; i++) {
      columns.push({
        index: i,
        dateLabel: `تاريخ الوزن ${formatArabicNumber(i)}`,
        weightLabel: `الوزن ${formatArabicNumber(i)} (كجم)`,
        diffLabel: i > 1 ? `الفرق ${formatArabicNumber(i-1)}-${formatArabicNumber(i)} (كجم)` : undefined,
        daysLabel: i > 1 ? `الأيام ${formatArabicNumber(i-1)}-${formatArabicNumber(i)}` : undefined,
        adgLabel: i > 1 ? `ADG ${formatArabicNumber(i-1)}-${formatArabicNumber(i)} (كجم/يوم)` : undefined,
      });
    }
    
    return columns;
  };

  // Process animal data for display
  const processAnimalData = (animal: EnhancedAnimalWeightData): ProcessedWeightData => {
    const sortedWeights = (animal.weightHistory || [])
      .filter(w => w.date && w.weightKg > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const processedWeights = sortedWeights.map((weight, index) => {
      let daysDiff: number | undefined;
      let weightDiff: number | undefined;
      let adg: number | undefined;

      if (index > 0) {
        const prevWeight = sortedWeights[index - 1];
        daysDiff = calculateDaysDifference(prevWeight.date, weight.date);
        weightDiff = weight.weightKg - prevWeight.weightKg;
        adg = daysDiff > 0 ? weightDiff / daysDiff : 0;
      }

      return {
        date: weight.date,
        weight: weight.weightKg,
        daysDiff,
        weightDiff,
        adg,
      };
    });

    return {
      earTagId: animal.earTagId,
      category: animal.category,
      weights: processedWeights,
    };
  };

  const handleAddWeight = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setWeightModalOpen(true);
  };

  const handleWeightModalClose = () => {
    setWeightModalOpen(false);
    setSelectedAnimalId('');
  };

  const handleWeightModalSuccess = () => {
    setWeightModalOpen(false);
    setSelectedAnimalId('');
    onRefresh(); // Refresh data after successful addition
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap = {
      male: { label: 'ذكر', variant: 'default' as const },
      female: { label: 'أنثى', variant: 'secondary' as const },
      newborn: { label: 'صغير', variant: 'outline' as const }
    };
    
    const config = categoryMap[category as keyof typeof categoryMap] || { label: category, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = generateColumns();
  const processedAnimals = animals.map(processAnimalData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>تتبع الأوزان المتقدم - جميع القياسات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right sticky left-0 bg-white">رقم الأذن الحيوان</TableHead>
                {columns.map((col) => (
                  <React.Fragment key={col.index}>
                    <TableHead className="text-right">{col.dateLabel}</TableHead>
                    <TableHead className="text-right">{col.weightLabel}</TableHead>
                    {col.diffLabel && (
                      <>
                        <TableHead className="text-right">{col.diffLabel}</TableHead>
                        <TableHead className="text-right">{col.daysLabel}</TableHead>
                        <TableHead className="text-right">{col.adgLabel}</TableHead>
                      </>
                    )}
                  </React.Fragment>
                ))}
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedAnimals.map((animalData) => {
                const animal = animals.find(a => a.earTagId === animalData.earTagId);
                if (!animal) return null;

                return (
                  <TableRow key={animal.id}>
                    <TableCell className="font-medium sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(animalData.category)}
                        {animalData.earTagId}
                      </div>
                    </TableCell>
                    
                    {columns.map((col) => {
                      const weightEntry = animalData.weights[col.index - 1];
                      
                      return (
                        <React.Fragment key={`${animal.id}-${col.index}`}>
                          {/* Date Column */}
                          <TableCell className="text-right">
                            {weightEntry ? formatArabicDate(new Date(weightEntry.date)) : '-'}
                          </TableCell>
                          
                          {/* Weight Column */}
                          <TableCell className="text-right">
                            {weightEntry ? formatArabicNumber(weightEntry.weight) : '-'}
                          </TableCell>
                          
                          {/* Difference columns (only for index > 1) */}
                          {col.index > 1 && (
                            <>
                              {/* Weight Difference */}
                              <TableCell className="text-right">
                                {weightEntry?.weightDiff !== undefined ? (
                                  <span className={weightEntry.weightDiff >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {weightEntry.weightDiff >= 0 ? '+' : ''}
                                    {formatArabicNumber(weightEntry.weightDiff)} كجم
                                  </span>
                                ) : '-'}
                              </TableCell>
                              
                              {/* Days Difference */}
                              <TableCell className="text-right">
                                {weightEntry?.daysDiff ? `${formatArabicNumber(weightEntry.daysDiff)} يوم` : '-'}
                              </TableCell>
                              
                              {/* ADG */}
                              <TableCell className="text-right">
                                {weightEntry?.adg !== undefined ? (
                                  <span className={weightEntry.adg >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {weightEntry.adg >= 0 ? '+' : ''}
                                    {formatArabicNumber(Number(weightEntry.adg.toFixed(3)))} كجم/يوم
                                  </span>
                                ) : '-'}
                              </TableCell>
                            </>
                          )}
                        </React.Fragment>
                      );
                    })}
                    
                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddWeight(animal.id)}
                        className="gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        إضافة وزن
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {processedAnimals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد بيانات أوزان متاحة
          </div>
        )}

        <WeightRecordModal
          isOpen={weightModalOpen}
          onClose={handleWeightModalClose}
          animals={animals}
          selectedAnimalId={selectedAnimalId}
          onSuccess={handleWeightModalSuccess}
        />
      </CardContent>
    </Card>
  );
}
