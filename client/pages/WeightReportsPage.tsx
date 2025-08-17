import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Download, Plus, FileText, FileSpreadsheet, Scale } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { WeightRecordModal } from "@/components/forms/WeightEntryModal";
import {
  buildIntervals,
  buildCumulative,
  calculateDaysDifference,
  type AnimalWeightReport,
  type WeightInterval,
  type CumulativeWeight,
} from "@/lib/weights";
import { formatArabicDate, formatArabicNumber } from "@/lib/arabic-utils";
import { dataService } from "@/lib/data-service";
import type { Animal } from "@shared/types";
import { EnhancedWeightTrackingTable } from "@/components/EnhancedWeightTrackingTable";

interface AnimalWeightData extends Animal {
  weightHistory: Array<{ date: string; weightKg: number; id?: string }>;
}

interface SpreadsheetRow {
  earTagId: string;
  firstWeighDate: string | null;
  firstWeight: number | null;
  secondWeighDate: string | null;
  secondWeight: number | null;
  weightDifference: number | null;
  daysDifference: number | null;
  adg: number | null;
  cumulativeDifference: number | null;
  cumulativeDays: number | null;
  cumulativeADG: number | null;
}

export default function WeightReportsPage() {
  const [animals, setAnimals] = useState<AnimalWeightData[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<AnimalWeightData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBarn, setSelectedBarn] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [barns, setBarns] = useState<Array<{ id: string; name: string }>>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [animalsData, barnsData] = await Promise.all([
        dataService.animals.getAll(),
        dataService.barns.getAll(),
      ]);

      // Filter animals that have weightHistory
      const animalsWithWeights = animalsData
        .filter((animal) => animal.weightHistory && animal.weightHistory.length > 0)
        .map((animal) => ({
          ...animal,
          weightHistory: animal.weightHistory || [],
        }));

      setAnimals(animalsWithWeights);
      setFilteredAnimals(animalsWithWeights);
      setBarns(barnsData.map((barn) => ({ id: barn.id, name: barn.name })));
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter animals
  useEffect(() => {
    let filtered = animals;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((animal) => animal.category === selectedCategory);
    }

    if (selectedBarn !== "all") {
      filtered = filtered.filter((animal) => animal.barnId === selectedBarn);
    }

    if (searchTerm) {
      filtered = filtered.filter((animal) =>
        animal.earTagId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAnimals(filtered);
  }, [animals, selectedCategory, selectedBarn, searchTerm]);

  // Convert animal data to spreadsheet format
  const convertToSpreadsheetFormat = (animal: AnimalWeightData): SpreadsheetRow => {
    if (!animal.weightHistory || animal.weightHistory.length === 0) {
      return {
        earTagId: animal.earTagId,
        firstWeighDate: null,
        firstWeight: null,
        secondWeighDate: null,
        secondWeight: null,
        weightDifference: null,
        daysDifference: null,
        adg: null,
        cumulativeDifference: null,
        cumulativeDays: null,
        cumulativeADG: null,
      };
    }

    // Sort weights by date
    const sortedWeights = [...animal.weightHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstWeight = sortedWeights[0];
    const secondWeight = sortedWeights.length > 1 ? sortedWeights[1] : null;
    const lastWeight = sortedWeights[sortedWeights.length - 1];

    // Calculate interval metrics (first two weights)
    let weightDifference = null;
    let daysDifference = null;
    let adg = null;

    if (secondWeight) {
      weightDifference = secondWeight.weightKg - firstWeight.weightKg;
      const date1 = new Date(firstWeight.date);
      const date2 = new Date(secondWeight.date);
      daysDifference = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
      adg = daysDifference > 0 ? Math.round((weightDifference / daysDifference) * 1000 * 1000) / 1000 : 0;
    }

    // Calculate cumulative metrics (first to last)
    let cumulativeDifference = null;
    let cumulativeDays = null;
    let cumulativeADG = null;

    if (sortedWeights.length > 1) {
      cumulativeDifference = lastWeight.weightKg - firstWeight.weightKg;
      const firstDate = new Date(firstWeight.date);
      const lastDate = new Date(lastWeight.date);
      cumulativeDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      cumulativeADG = cumulativeDays > 0 ? Math.round((cumulativeDifference / cumulativeDays) * 1000 * 1000) / 1000 : 0;
    }

    return {
      earTagId: animal.earTagId,
      firstWeighDate: firstWeight.date,
      firstWeight: firstWeight.weightKg,
      secondWeighDate: secondWeight?.date || null,
      secondWeight: secondWeight?.weightKg || null,
      weightDifference,
      daysDifference,
      adg,
      cumulativeDifference,
      cumulativeDays,
      cumulativeADG,
    };
  };

  // Convert animal data to enhanced spreadsheet format with dynamic columns
  const convertToEnhancedSpreadsheetFormat = (animal: AnimalWeightData) => {
    const sortedWeights = (animal.weightHistory || [])
      .filter(w => w.date && w.weightKg > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const result: any = {
      earTagId: animal.earTagId,
      category: animal.category,
    };

    // Add all weight entries dynamically
    sortedWeights.forEach((weight, index) => {
      const weightNum = index + 1;
      result[`weight_${weightNum}_date`] = weight.date;
      result[`weight_${weightNum}_kg`] = weight.weightKg;

      // Calculate differences from previous weight
      if (index > 0) {
        const prevWeight = sortedWeights[index - 1];
        const daysDiff = calculateDaysDifference(prevWeight.date, weight.date);
        const weightDiff = weight.weightKg - prevWeight.weightKg;
        const adg = daysDiff > 0 ? (weightDiff / daysDiff) * 1000 : 0;

        result[`weight_${index}_to_${weightNum}_days`] = daysDiff;
        result[`weight_${index}_to_${weightNum}_diff`] = weightDiff;
        result[`weight_${index}_to_${weightNum}_adg`] = adg;
      }
    });

    // Calculate cumulative values (from first to last)
    if (sortedWeights.length >= 2) {
      const firstWeight = sortedWeights[0];
      const lastWeight = sortedWeights[sortedWeights.length - 1];
      const totalDays = calculateDaysDifference(firstWeight.date, lastWeight.date);
      const totalWeightDiff = lastWeight.weightKg - firstWeight.weightKg;
      const cumulativeADG = totalDays > 0 ? (totalWeightDiff / totalDays) * 1000 : 0;

      result.cumulative_days = totalDays;
      result.cumulative_weight_diff = totalWeightDiff;
      result.cumulative_adg = cumulativeADG;
    }

    result.total_weights = sortedWeights.length;
    return result;
  };

  // Get maximum number of weights for header generation
  const getMaxWeights = (animals: AnimalWeightData[]) => {
    return Math.max(...animals.map(animal => (animal.weightHistory || []).length), 2);
  };

  // Generate dynamic headers for export
  const generateExportHeaders = (maxWeights: number) => {
    const headers = ["رقم الأذن الحيوان"];
    
    for (let i = 1; i <= maxWeights; i++) {
      headers.push(`تاريخ الوزن ${formatArabicNumber(i)}`);
      headers.push(`الوزن ${formatArabicNumber(i)} (كجم)`);
      
      if (i > 1) {
        headers.push(`الفرق ${formatArabicNumber(i-1)}-${formatArabicNumber(i)} (كجم)`);
        headers.push(`الأيام ${formatArabicNumber(i-1)}-${formatArabicNumber(i)}`);
        headers.push(`ADG ${formatArabicNumber(i-1)}-${formatArabicNumber(i)} (جم/يوم)`);
      }
    }
    
    headers.push("إجمالي الأوزان");
    headers.push("الزيادة التراكمية (كجم)");
    headers.push("الأيام التراكمية");
    headers.push("ADG التراكمي (جم/يوم)");
    
    return headers;
  };

  const handleAddWeight = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setShowWeightModal(true);
  };

  const handleWeightAdded = async () => {
    setShowWeightModal(false);
    setSelectedAnimalId("");
    
    // Show loading state briefly while refreshing
    setLoading(true);
    
    try {
      await loadData(); // Refresh all weight data and reports
      
      // The toast notification is already shown by the WeightEntryModal
      // Just ensure data is refreshed
    } catch (error) {
      console.error('Error refreshing weight reports:', error);
      toast({
        title: "خطأ في تحديث التقارير",
        description: "تم تسجيل الوزن لكن حدث خطأ في تحديث التقارير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = filteredAnimals.map(convertToEnhancedSpreadsheetFormat);
    const maxWeights = getMaxWeights(filteredAnimals);
    const headers = generateExportHeaders(maxWeights);
    
    // Create comprehensive HTML table for Excel with proper Arabic support
    const htmlTable = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          table { 
            border-collapse: collapse; 
            direction: rtl; 
            font-family: 'Arial Unicode MS', Arial, sans-serif;
          }
          th { 
            background-color: #4CAF50; 
            color: white; 
            font-weight: bold; 
            padding: 8px; 
            border: 1px solid #ddd;
            text-align: center;
          }
          td { 
            padding: 4px 8px; 
            border: 1px solid #ddd; 
            text-align: center;
            mso-number-format: "@"; /* Force text format for dates */
          }
          .positive { color: #4CAF50; font-weight: bold; }
          .negative { color: #f44336; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => {
              const cells = [
                `<td>${row.earTagId}</td>`
              ];
              
              // Add weight entries dynamically
              const maxWeightCount = Math.max(...data.map(r => r.total_weights || 0), 2);
              
              for (let i = 1; i <= maxWeightCount; i++) {
                const dateKey = `weight_${i}_date`;
                const weightKey = `weight_${i}_kg`;
                
                // Date cell with Arabic formatting
                const dateValue = row[dateKey];
                if (dateValue) {
                  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    calendar: 'gregory'
                  }).format(new Date(dateValue));
                  cells.push(`<td style="mso-number-format:'@'">${formattedDate}</td>`);
                } else {
                  cells.push(`<td>-</td>`);
                }
                
                // Weight cell
                const weightValue = row[weightKey];
                cells.push(`<td>${weightValue ? formatArabicNumber(weightValue) : '-'}</td>`);
                
                // Difference columns (only for i > 1)
                if (i > 1) {
                  const diffKey = `weight_${i-1}_to_${i}_diff`;
                  const daysKey = `weight_${i-1}_to_${i}_days`;
                  const adgKey = `weight_${i-1}_to_${i}_adg`;
                  
                  const diffValue = row[diffKey];
                  const daysValue = row[daysKey];
                  const adgValue = row[adgKey];
                  
                  cells.push(`<td class="${(diffValue || 0) >= 0 ? 'positive' : 'negative'}">${diffValue !== undefined ? formatArabicNumber(diffValue) + ' كجم' : '-'}</td>`);
                  cells.push(`<td>${daysValue ? formatArabicNumber(daysValue) + ' يوم' : '-'}</td>`);
                  cells.push(`<td class="${(adgValue || 0) >= 0 ? 'positive' : 'negative'}">${adgValue !== undefined ? formatArabicNumber(Number(adgValue.toFixed(1))) + ' جم/يوم' : '-'}</td>`);
                }
              }
              
              // Add summary columns
              cells.push(`<td>${formatArabicNumber(row.total_weights || 0)}</td>`);
              cells.push(`<td class="${(row.cumulative_weight_diff || 0) >= 0 ? 'positive' : 'negative'}">${row.cumulative_weight_diff ? formatArabicNumber(row.cumulative_weight_diff) + ' كجم' : '-'}</td>`);
              cells.push(`<td>${row.cumulative_days ? formatArabicNumber(row.cumulative_days) + ' يوم' : '-'}</td>`);
              cells.push(`<td class="${(row.cumulative_adg || 0) >= 0 ? 'positive' : 'negative'}">${row.cumulative_adg ? formatArabicNumber(Number(row.cumulative_adg.toFixed(1))) + ' جم/يوم' : '-'}</td>`);
              
              return `<tr>${cells.join("")}</tr>`;
            }).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Use UTF-8 BOM for proper Arabic display
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + htmlTable], { 
      type: "application/vnd.ms-excel;charset=utf-8" 
    });
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_الأوزان_${new Intl.DateTimeFormat('ar-EG').format(new Date()).replace(/\//g, '-')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);

    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير تقرير الأوزان إلى ملف Excel مع دعم اللغة العربية",
    });
  };

  const exportToCSV = () => {
    const data = filteredAnimals.map(convertToEnhancedSpreadsheetFormat);
    const maxWeights = getMaxWeights(filteredAnimals);
    const headers = generateExportHeaders(maxWeights);

    // Create CSV rows with proper Arabic formatting
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(","));
    
    // Add data rows
    data.forEach(row => {
      const rowData = [
        `"${row.earTagId}"` // Animal ear tag
      ];
      
      // Add weight entries dynamically
      const maxWeightCount = Math.max(...data.map(r => r.total_weights || 0), 2);
      
      for (let i = 1; i <= maxWeightCount; i++) {
        const dateKey = `weight_${i}_date`;
        const weightKey = `weight_${i}_kg`;
        
        // Date with Arabic formatting
        const dateValue = row[dateKey];
        if (dateValue) {
          const formattedDate = new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            calendar: 'gregory'
          }).format(new Date(dateValue));
          rowData.push(`"${formattedDate}"`);
        } else {
          rowData.push(`""`);
        }
        
        // Weight
        const weightValue = row[weightKey];
        rowData.push(weightValue ? formatArabicNumber(weightValue) : "");
        
        // Difference columns (only for i > 1)
        if (i > 1) {
          const diffKey = `weight_${i-1}_to_${i}_diff`;
          const daysKey = `weight_${i-1}_to_${i}_days`;
          const adgKey = `weight_${i-1}_to_${i}_adg`;
          
          const diffValue = row[diffKey];
          const daysValue = row[daysKey]; 
          const adgValue = row[adgKey];
          
          rowData.push(diffValue !== undefined ? formatArabicNumber(diffValue) : "");
          rowData.push(daysValue ? formatArabicNumber(daysValue) : "");
          rowData.push(adgValue !== undefined ? formatArabicNumber(Number(adgValue.toFixed(1))) : "");
        }
      }
      
      // Add summary columns
      rowData.push(formatArabicNumber(row.total_weights || 0));
      rowData.push(row.cumulative_weight_diff ? formatArabicNumber(row.cumulative_weight_diff) : "");
      rowData.push(row.cumulative_days ? formatArabicNumber(row.cumulative_days) : "");
      rowData.push(row.cumulative_adg ? formatArabicNumber(Number(row.cumulative_adg.toFixed(1))) : "");
      
      csvRows.push(rowData.join(","));
    });

    const csvContent = csvRows.join("\n");

    // Use UTF-8 BOM for proper Arabic display
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { 
      type: "text/csv;charset=utf-8" 
    });
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_الأوزان_${new Intl.DateTimeFormat('ar-EG').format(new Date()).replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);

    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير تقرير الأوزان إلى ملف CSV مع دعم اللغة العربية",
    });
  };

  const exportAll = async () => {
    try {
      // Export CSV
      exportToCSV();
      
      // Small delay then export Excel
      setTimeout(() => {
        exportToExcel();
      }, 500);

      // Show completion message
      setTimeout(() => {
        toast({
          title: "تم التصدير بنجاح",
          description: "تم تصدير البيانات بصيغة CSV و Excel",
        });
      }, 1000);

      toast({
        title: "جاري التصدير الشامل",
        description: "سيتم تحميل جميع التقارير تدريجياً...",
      });
    } catch (error) {
      console.error("Error in batch export:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير بعض الملفات",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Scale className="h-12 w-12 text-green-600 animate-pulse mx-auto mb-4" />
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-farm-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل تقارير الأوزان...</p>
          <p className="text-sm text-muted-foreground mt-1">تحديث البيانات والحسابات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Scale className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-farm-800">تقارير الأوزان</h1>
          </div>
          <p className="text-muted-foreground">
            عرض وتحليل بيانات أوزان الحيوانات وحساب الزيادة اليومية
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-2 hover:bg-green-50"
            title="تصدير البيانات إلى ملف CSV"
          >
            <FileSpreadsheet className="h-4 w-4" />
            تصدير CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="gap-2 hover:bg-blue-50"
            title="تصدير البيانات إلى ملف Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            تصدير Excel
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={exportAll}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            title="تصدير جميع التقارير (CSV, Excel)"
          >
            <Download className="h-4 w-4" />
            تصدير شامل
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والفلترة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">نوع الحيوان</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="male">ذكور</SelectItem>
                  <SelectItem value="female">إناث</SelectItem>
                  <SelectItem value="newborn">صغار</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">الحظيرة</label>
              <Select value={selectedBarn} onValueChange={setSelectedBarn}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحظيرة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحظائر</SelectItem>
                  {barns.map((barn) => (
                    <SelectItem key={barn.id} value={barn.id}>
                      {barn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">رقم الأذن</label>
              <Input
                placeholder="ابحث برقم الأذن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Badge variant="secondary" className="h-fit">
                {filteredAnimals.length} حيوان
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Weight Reports Table */}
      <EnhancedWeightTrackingTable 
        animals={filteredAnimals} 
        onRefresh={loadData}
      />

      {/* Legacy Weight Entry Modal (kept for compatibility) */}
      {showWeightModal && (
        <WeightRecordModal
          isOpen={showWeightModal}
          onClose={() => setShowWeightModal(false)}
          animals={animals}
          selectedAnimalId={selectedAnimalId}
          onSuccess={handleWeightAdded}
        />
      )}
    </div>
  );
}