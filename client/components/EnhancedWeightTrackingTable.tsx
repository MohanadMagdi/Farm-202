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
import { Plus, Scale } from 'lucide-react';
import { WeightRecordModal } from '@/components/forms/WeightEntryModal';
import { formatArabicDate, formatArabicNumber } from '@/lib/arabic-utils';
import { calculateDaysDifference } from '@/lib/weights';
import { useToast } from '@/hooks/use-toast';
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
  // Advanced ADG columns for weights 3+
  advancedAdgColumns?: Array<{
    toPrevIndex: number;
    daysLabel: string;
    diffLabel: string;
    adgLabel: string;
  }>;
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
    // Advanced ADG calculations for multiple previous weights
    adgToPrevious?: Array<{
      toWeightIndex: number;
      daysDiff: number;
      weightDiff: number;
      adg: number;
      label: string;
    }>;
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
  const { toast } = useToast();
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
      const advancedAdgColumns: Array<{
        toPrevIndex: number;
        daysLabel: string;
        diffLabel: string;
        adgLabel: string;
      }> = [];
      
      // For weights 3+, add advanced ADG columns
      if (i >= 3) {
        for (let j = i - 2; j >= 1; j--) {
          advancedAdgColumns.push({
            toPrevIndex: j,
            daysLabel: `أيام ${formatArabicNumber(i)}-${formatArabicNumber(j)}`,
            diffLabel: `فرق ${formatArabicNumber(i)}-${formatArabicNumber(j)} (كجم)`,
            adgLabel: `ADG ${formatArabicNumber(i)}-${formatArabicNumber(j)} (جم/يوم)`,
          });
        }
      }
      
      columns.push({
        index: i,
        dateLabel: `تاريخ الوزن ${formatArabicNumber(i)}`,
        weightLabel: `الوزن ${formatArabicNumber(i)} (كجم)`,
        diffLabel: i > 1 ? `الفرق ${formatArabicNumber(i-1)}-${formatArabicNumber(i)} (كجم)` : undefined,
        daysLabel: i > 1 ? `الأيام ${formatArabicNumber(i-1)}-${formatArabicNumber(i)}` : undefined,
        adgLabel: i > 1 ? `ADG ${formatArabicNumber(i-1)}-${formatArabicNumber(i)} (جم/يوم)` : undefined,
        advancedAdgColumns: advancedAdgColumns.length > 0 ? advancedAdgColumns : undefined,
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
      let adgToPrevious: Array<{
        toWeightIndex: number;
        daysDiff: number;
        weightDiff: number;
        adg: number;
        label: string;
      }> = [];

      if (index > 0) {
        const prevWeight = sortedWeights[index - 1];
        daysDiff = calculateDaysDifference(prevWeight.date, weight.date);
        weightDiff = weight.weightKg - prevWeight.weightKg;
        adg = daysDiff > 0 ? (weightDiff / daysDiff) * 1000 : 0;
      }

      // Calculate ADG to all previous weights for weights 3+ (index >= 2)
      if (index >= 2) {
        // For weight 3 (index 2): calculate ADG to weight 2 and weight 1
        // For weight 4 (index 3): calculate ADG to weight 3, weight 2, and weight 1
        for (let prevIndex = index - 1; prevIndex >= 0; prevIndex--) {
          const prevWeight = sortedWeights[prevIndex];
          const daysDiffToPrev = calculateDaysDifference(prevWeight.date, weight.date);
          const weightDiffToPrev = weight.weightKg - prevWeight.weightKg;
          const adgToPrev = daysDiffToPrev > 0 ? (weightDiffToPrev / daysDiffToPrev) * 1000 : 0;
          
          adgToPrevious.push({
            toWeightIndex: prevIndex + 1, // 1-based index for display
            daysDiff: daysDiffToPrev,
            weightDiff: weightDiffToPrev,
            adg: adgToPrev,
            label: `ADG ${formatArabicNumber(index + 1)}-${formatArabicNumber(prevIndex + 1)}`
          });
        }
      }

      return {
        date: weight.date,
        weight: weight.weightKg,
        daysDiff,
        weightDiff,
        adg,
        adgToPrevious,
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
    const selectedAnimal = animals.find(a => a.id === selectedAnimalId);
    
    setWeightModalOpen(false);
    setSelectedAnimalId('');
    
    // Show success notification
    toast({
      title: "تم تسجيل الوزن بنجاح",
      description: `تم تحديث بيانات الحيوان ${selectedAnimal?.earTagId || ''} وتقارير الأوزان`,
      variant: "default",
    });
    
    onRefresh(); // Refresh data after successful addition - this updates the weight reports page
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
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-green-600" />
          تتبع الأوزان المتقدم - حسابات ADG الشاملة
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          عرض جميع أوزان الحيوانات مع حسابات ADG متقدمة. للحيوانات ذات 3+ أوزان: يتم حساب ADG بين كل وزن وجميع الأوزان السابقة
        </p>
        <div className="flex flex-wrap gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>أعمدة ADG العادية</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-50 border border-blue-300 rounded"></div>
            <span>أعمدة ADG المتقدمة (3+ أوزان)</span>
          </div>
        </div>
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
                    {/* Advanced ADG columns for weights 3+ */}
                    {col.advancedAdgColumns && col.advancedAdgColumns.map((advCol) => (
                      <React.Fragment key={`adv-${col.index}-${advCol.toPrevIndex}`}>
                        <TableHead className="text-right bg-blue-50">{advCol.daysLabel}</TableHead>
                        <TableHead className="text-right bg-blue-50">{advCol.diffLabel}</TableHead>
                        <TableHead className="text-right bg-blue-50">{advCol.adgLabel}</TableHead>
                      </React.Fragment>
                    ))}
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
                                    {formatArabicNumber(Number(weightEntry.adg.toFixed(1)))} جم/يوم
                                  </span>
                                ) : '-'}
                              </TableCell>
                            </>
                          )}
                          
                          {/* Advanced ADG columns for weights 3+ */}
                          {col.advancedAdgColumns && col.advancedAdgColumns.map((advCol) => {
                            const advancedData = weightEntry?.adgToPrevious?.find(
                              adg => adg.toWeightIndex === advCol.toPrevIndex
                            );
                            
                            return (
                              <React.Fragment key={`adv-${col.index}-${advCol.toPrevIndex}`}>
                                {/* Advanced Days */}
                                <TableCell className="text-right bg-blue-50">
                                  {advancedData ? `${formatArabicNumber(advancedData.daysDiff)} يوم` : '-'}
                                </TableCell>
                                
                                {/* Advanced Weight Difference */}
                                <TableCell className="text-right bg-blue-50">
                                  {advancedData ? (
                                    <span className={advancedData.weightDiff >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                      {advancedData.weightDiff >= 0 ? '+' : ''}
                                      {formatArabicNumber(advancedData.weightDiff)} كجم
                                    </span>
                                  ) : '-'}
                                </TableCell>
                                
                                {/* Advanced ADG */}
                                <TableCell className="text-right bg-blue-50">
                                  {advancedData ? (
                                    <span className={advancedData.adg >= 0 ? 'text-blue-600 font-bold' : 'text-red-600 font-bold'}>
                                      {advancedData.adg >= 0 ? '+' : ''}
                                      {formatArabicNumber(Number(advancedData.adg.toFixed(1)))} جم/يوم
                                    </span>
                                  ) : '-'}
                                </TableCell>
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                    
                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddWeight(animal.id)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent rounded-md h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        title="إضافة وزن جديد"
                      >
                        <Scale className="h-4 w-4" />
                        <span className="sr-only">إضافة وزن</span>
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
