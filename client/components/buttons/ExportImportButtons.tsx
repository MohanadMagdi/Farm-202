import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { dataService } from "@/lib/data-service";
import {
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  Database,
  Package,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface ExportImportButtonsProps {
  onOperationComplete?: () => void;
}

export default function ExportImportButtons({ onOperationComplete }: ExportImportButtonsProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState({
    format: "excel",
    includeAnimals: true,
    includeBarns: true,
    includeFeeding: true,
    includeInventory: true,
    includeWeights: true,
    dateRange: "all",
    filterBy: "all",
  });

  const handleExport = async () => {
    setLoading(true);
    setProgress(0);
    
    try {
      const data: any = {};
      let step = 0;
      const totalSteps = Object.values(exportOptions).filter(v => v === true).length;

      if (exportOptions.includeAnimals) {
        data.animals = await dataService.animals.getAll();
        step++;
        setProgress((step / totalSteps) * 100);
      }

      if (exportOptions.includeBarns) {
        data.barns = await dataService.barns.getAll();
        step++;
        setProgress((step / totalSteps) * 100);
      }

      if (exportOptions.includeFeeding) {
        data.feedingRecords = await dataService.feedingRecords.getAll();
        step++;
        setProgress((step / totalSteps) * 100);
      }

      if (exportOptions.includeInventory) {
        data.warehouseItems = await dataService.warehouseItems.getAll();
        step++;
        setProgress((step / totalSteps) * 100);
      }

      if (exportOptions.includeWeights) {
        data.weightRecords = await dataService.weightRecords.getAll();
        step++;
        setProgress((step / totalSteps) * 100);
      }

      // Create downloadable content
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `farm-export-${timestamp}`;
      
      // Simple JSON export (can be expanded later)
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير البيانات بصيغة JSON`,
      });

      setShowExportDialog(false);
      onOperationComplete?.();

    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleImport = async (file: File) => {
    setLoading(true);
    setProgress(0);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension !== "json") {
        throw new Error("فقط ملفات JSON مدعومة حالياً");
      }

      setProgress(25);
      
      const text = await file.text();
      const data = JSON.parse(text);

      setProgress(50);

      // Simple validation
      if (!data || typeof data !== 'object') {
        throw new Error("ملف غير صالح");
      }

      setProgress(75);

      toast({
        title: "تم قراءة الملف",
        description: `تم العثور على ${Object.keys(data).length} نوع من البيانات`,
      });

      setProgress(100);
      setShowImportDialog(false);
      onOperationComplete?.();

    } catch (error) {
      toast({
        title: "خطأ في الاستيراد",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const handleQuickExport = async (type: string) => {
    try {
      let data: any;
      let filename: string;
      
      switch(type) {
        case 'animals':
          data = { animals: await dataService.animals.getAll() };
          filename = 'animals-export.json';
          break;
        case 'inventory':
          data = { warehouseItems: await dataService.warehouseItems.getAll() };
          filename = 'inventory-export.json';
          break;
        case 'feeding':
          data = { feedingRecords: await dataService.feedingRecords.getAll() };
          filename = 'feeding-export.json';
          break;
        case 'health':
          data = { healthRecords: await dataService.healthRecords.getAll() };
          filename = 'health-export.json';
          break;
        default:
          return;
      }
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ 
        title: "تم التصدير", 
        description: `تم تصدير ${type} بنجاح` 
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التصدير",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Export/Import Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowExportDialog(true)}
          variant="outline"
          className="hover:bg-green-50"
        >
          <Download className="h-4 w-4 ml-2 text-green-600" />
          تصدير البيانات
        </Button>

        <Button
          onClick={() => setShowImportDialog(true)}
          variant="outline"
          className="hover:bg-blue-50"
        >
          <Upload className="h-4 w-4 ml-2 text-blue-600" />
          استيراد البيانات
        </Button>
      </div>

      {/* Quick Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">تصدير سريع</CardTitle>
          <CardDescription className="text-xs">
            تصدير سريع للبيانات الأساسية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              size="sm"
              variant="ghost"
              className="justify-start"
              onClick={() => handleQuickExport('animals')}
            >
              <FileSpreadsheet className="h-4 w-4 ml-2 text-green-600" />
              <span>الحيوانات</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="justify-start"
              onClick={() => handleQuickExport('inventory')}
            >
              <Package className="h-4 w-4 ml-2 text-blue-600" />
              <span>المخزون</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="justify-start"
              onClick={() => handleQuickExport('feeding')}
            >
              <Database className="h-4 w-4 ml-2 text-orange-600" />
              <span>التغذية</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="justify-start"
              onClick={() => handleQuickExport('health')}
            >
              <FileText className="h-4 w-4 ml-2 text-red-600" />
              <span>السجلات الصحية</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تصدير البيانات</DialogTitle>
            <DialogDescription>
              اختر نوع البيانات والصيغة المطلوبة للتصدير
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <Label>صيغة التصدير</Label>
              <Select
                value={exportOptions.format}
                onValueChange={(value) => setExportOptions({...exportOptions, format: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Selection */}
            <div>
              <Label>البيانات المطلوب تصديرها</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { key: 'includeAnimals', label: 'الحيوانات' },
                  { key: 'includeBarns', label: 'الحظائر' },
                  { key: 'includeFeeding', label: 'التغذية' },
                  { key: 'includeInventory', label: 'المخزون' },
                  { key: 'includeWeights', label: 'سجلات الوزن' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={key}
                      checked={exportOptions[key as keyof typeof exportOptions] as boolean}
                      onCheckedChange={(checked) => 
                        setExportOptions({...exportOptions, [key]: checked})
                      }
                    />
                    <Label htmlFor={key} className="text-sm">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            {loading && (
              <div>
                <Label>تقدم التصدير</Label>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">{Math.round(progress)}%</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري التصدير...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>استيراد البيانات</DialogTitle>
            <DialogDescription>
              اختر ملف البيانات المراد استيراده
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <Label>اختر الملف</Label>
              <input
                type="file"
                accept=".xlsx,.xls,.json,.csv"
                onChange={handleFileSelect}
                className="w-full mt-2 p-2 border rounded-md"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                الصيغ المدعومة: Excel (.xlsx, .xls), JSON (.json), CSV (.csv)
              </p>
            </div>

            {/* Progress Bar */}
            {loading && (
              <div>
                <Label>تقدم الاستيراد</Label>
                <Progress value={progress} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">{Math.round(progress)}%</p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 ml-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    تحذير
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    الاستيراد قد يؤثر على البيانات الموجودة. تأكد من صحة الملف المختار.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
