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
import { CalendarIcon, Download, Plus, FileText, FileSpreadsheet } from "lucide-react";
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
      adg = daysDifference > 0 ? Math.round((weightDifference / daysDifference) * 1000) / 1000 : 0;
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
      cumulativeADG = cumulativeDays > 0 ? Math.round((cumulativeDifference / cumulativeDays) * 1000) / 1000 : 0;
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
        const adg = daysDiff > 0 ? weightDiff / daysDiff : 0;

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
      const cumulativeADG = totalDays > 0 ? totalWeightDiff / totalDays : 0;

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
        headers.push(`ADG ${formatArabicNumber(i-1)}-${formatArabicNumber(i)} (كجم/يوم)`);
      }
    }
    
    headers.push("إجمالي الأوزان");
    headers.push("الزيادة التراكمية (كجم)");
    headers.push("الأيام التراكمية");
    headers.push("ADG التراكمي (كجم/يوم)");
    
    return headers;
  };

  const handleAddWeight = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setShowWeightModal(true);
  };

  const handleWeightAdded = () => {
    loadData();
    setShowWeightModal(false);
    setSelectedAnimalId("");
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
                  cells.push(`<td class="${(adgValue || 0) >= 0 ? 'positive' : 'negative'}">${adgValue !== undefined ? formatArabicNumber(Number(adgValue.toFixed(3))) + ' كجم/يوم' : '-'}</td>`);
                }
              }
              
              // Add summary columns
              cells.push(`<td>${formatArabicNumber(row.total_weights || 0)}</td>`);
              cells.push(`<td class="${(row.cumulative_weight_diff || 0) >= 0 ? 'positive' : 'negative'}">${row.cumulative_weight_diff ? formatArabicNumber(row.cumulative_weight_diff) + ' كجم' : '-'}</td>`);
              cells.push(`<td>${row.cumulative_days ? formatArabicNumber(row.cumulative_days) + ' يوم' : '-'}</td>`);
              cells.push(`<td class="${(row.cumulative_adg || 0) >= 0 ? 'positive' : 'negative'}">${row.cumulative_adg ? formatArabicNumber(Number(row.cumulative_adg.toFixed(3))) + ' كجم/يوم' : '-'}</td>`);
              
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
          rowData.push(adgValue !== undefined ? formatArabicNumber(Number(adgValue.toFixed(3))) : "");
        }
      }
      
      // Add summary columns
      rowData.push(formatArabicNumber(row.total_weights || 0));
      rowData.push(row.cumulative_weight_diff ? formatArabicNumber(row.cumulative_weight_diff) : "");
      rowData.push(row.cumulative_days ? formatArabicNumber(row.cumulative_days) : "");
      rowData.push(row.cumulative_adg ? formatArabicNumber(Number(row.cumulative_adg.toFixed(3))) : "");
      
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

  const exportToPDF = () => {
    const data = filteredAnimals.map(convertToEnhancedSpreadsheetFormat);
    const maxWeights = getMaxWeights(filteredAnimals);
    const headers = generateExportHeaders(maxWeights);
    
    const currentDate = new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    }).format(new Date());
    
    // Generate summary statistics
    const validData = data.filter(row => row.cumulative_adg !== undefined && row.cumulative_weight_diff !== undefined);
    const totalAnimals = data.length;
    const averageADG = validData.length > 0 ? 
      validData.reduce((sum, row) => sum + (row.cumulative_adg || 0), 0) / validData.length : 0;
    const totalWeightGain = validData.reduce((sum, row) => sum + (row.cumulative_weight_diff || 0), 0);
    const positiveGrowthAnimals = validData.filter(row => (row.cumulative_adg || 0) > 0).length;
    
    const categoryName = selectedCategory === "all" ? "جميع الأنواع" : 
                       selectedCategory === "male" ? "ذكور" :
                       selectedCategory === "female" ? "إناث" : "صغار";

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير أوزان الحيوانات</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Cairo', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            direction: rtl;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 15px;
          }
          
          .header h1 {
            font-size: 28px;
            color: #4CAF50;
            margin-bottom: 10px;
            font-weight: bold;
          }
          
          .header .info {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 12px;
            color: #666;
          }
          
          .summary {
            background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            border: 1px solid #4CAF50;
          }
          
          .summary h3 {
            text-align: center;
            margin-bottom: 15px;
            color: #2E7D32;
            font-size: 16px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            text-align: center;
          }
          
          .summary-item {
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .summary-item .value {
            font-size: 20px;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 5px;
          }
          
          .summary-item .label {
            color: #666;
            font-size: 11px;
          }
          
          .filters {
            background-color: #f8f9fa;
            padding: 12px;
            margin-bottom: 20px;
            border-radius: 6px;
            border-left: 4px solid #4CAF50;
            font-size: 12px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 8px 4px;
            text-align: center;
          }
          
          th {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            font-weight: bold;
            font-size: 9px;
          }
          
          tbody tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          tbody tr:hover {
            background-color: #e8f5e8;
          }
          
          .positive { color: #4CAF50; font-weight: bold; }
          .negative { color: #f44336; font-weight: bold; }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #4CAF50;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          
          @media print {
            body { padding: 10px; }
            .header h1 { font-size: 24px; }
            table { font-size: 8px; }
            th, td { padding: 3px 2px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🐑 تقرير أوزان الحيوانات</h1>
          <div class="info">
            <span><strong>التاريخ:</strong> ${currentDate}</span>
            <span><strong>عدد الحيوانات:</strong> ${totalAnimals}</span>
            <span><strong>نظام إدارة المزرعة</strong></span>
          </div>
        </div>
        
        <div class="summary">
          <h3>📊 ملخص الإحصائيات</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="value">${totalAnimals}</div>
              <div class="label">إجمالي الحيوانات</div>
            </div>
            <div class="summary-item">
              <div class="value">${formatArabicNumber(Number(averageADG.toFixed(3)))}</div>
              <div class="label">متوسط الزيادة اليومية</div>
            </div>
            <div class="summary-item">
              <div class="value">${formatArabicNumber(Number(totalWeightGain.toFixed(1)))}</div>
              <div class="label">إجمالي الزيادة (كجم)</div>
            </div>
            <div class="summary-item">
              <div class="value">${positiveGrowthAnimals}</div>
              <div class="label">حيوانات نمو إيجابي</div>
            </div>
          </div>
        </div>
        
        <div class="filters">
          <strong>🔍 المرشحات المطبقة:</strong>
          نوع الحيوان: ${categoryName} |
          ${selectedBarn !== "all" ? `الحظيرة: ${barns.find(b => b.id === selectedBarn)?.name || selectedBarn} |` : ''}
          ${searchTerm ? `البحث: ${searchTerm} |` : ''}
          التاريخ: ${currentDate}
        </div>
        
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => {
              const cells = [`<td><strong>${row.earTagId}</strong></td>`];
              
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
                  cells.push(`<td>${formattedDate}</td>`);
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
                  
                  cells.push(`<td class="${(diffValue || 0) >= 0 ? 'positive' : 'negative'}">${diffValue !== undefined ? formatArabicNumber(diffValue) : '-'}</td>`);
                  cells.push(`<td>${daysValue ? formatArabicNumber(daysValue) : '-'}</td>`);
                  cells.push(`<td class="${(adgValue || 0) >= 0 ? 'positive' : 'negative'}">${adgValue !== undefined ? formatArabicNumber(Number(adgValue.toFixed(3))) : '-'}</td>`);
                }
              }
              
              // Add summary columns
              cells.push(`<td>${formatArabicNumber(row.total_weights || 0)}</td>`);
              cells.push(`<td class="${(row.cumulative_weight_diff || 0) >= 0 ? 'positive' : 'negative'}">${row.cumulative_weight_diff ? formatArabicNumber(row.cumulative_weight_diff) : '-'}</td>`);
              cells.push(`<td>${row.cumulative_days ? formatArabicNumber(row.cumulative_days) : '-'}</td>`);
              cells.push(`<td class="${(row.cumulative_adg || 0) >= 0 ? 'positive' : 'negative'}">${row.cumulative_adg ? formatArabicNumber(Number(row.cumulative_adg.toFixed(3))) : '-'}</td>`);
              
              return `<tr>${cells.join('')}</tr>`;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>📈 نظام إدارة المزرعة - تقارير الأوزان</strong></p>
          <p>تم إنتاج هذا التقرير في: ${currentDate}</p>
          <p>جميع الأوزان بالكيلوجرام • جميع قيم ADG بالكيلوجرام/يوم</p>
          <p style="margin-top: 10px; font-size: 9px; color: #888;">
            الألوان: <span style="color: #4CAF50;">●</span> نمو إيجابي | <span style="color: #f44336;">●</span> نمو سلبي
          </p>
        </div>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Don't auto-close, let user decide
        }, 1000);
      };

      toast({
        title: "تم فتح نافذة الطباعة",
        description: "يمكنك طباعة التقرير أو حفظه كـ PDF من متصفحك",
      });
    } else {
      toast({
        title: "خطأ",
        description: "لا يمكن فتح نافذة الطباعة. تحقق من إعدادات النوافذ المنبثقة",
        variant: "destructive",
      });
    }
  };

  const exportAll = async () => {
    try {
      // Export CSV
      exportToCSV();
      
      // Small delay then export Excel
      setTimeout(() => {
        exportToExcel();
      }, 500);

      // Small delay then show PDF option
      setTimeout(() => {
        toast({
          title: "تصدير شامل",
          description: "تم تصدير CSV و Excel. هل تريد تصدير PDF أيضاً؟",
          action: (
            <button onClick={exportToPDF} className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
              تصدير PDF
            </button>
          ),
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل تقارير الأوزان...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800 mb-2">تقارير الأوزان</h1>
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
            variant="outline" 
            size="sm"
            onClick={exportToPDF}
            className="gap-2 hover:bg-red-50"
            title="تصدير البيانات إلى ملف PDF للطباعة"
          >
            <FileText className="h-4 w-4" />
            تصدير PDF
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={exportAll}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            title="تصدير جميع التقارير (CSV, Excel, PDF)"
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