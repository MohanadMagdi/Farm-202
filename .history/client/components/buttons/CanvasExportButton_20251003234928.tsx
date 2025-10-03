import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Camera,
  Download,
  Image,
  FileImage,
  Monitor,
  Smartphone,
  Loader2,
  Settings,
  Check,
} from "lucide-react";
import {
  exportElementToCanvas,
  exportPageToCanvas,
  exportComponentToCanvas,
  exportDashboardToCanvas,
  exportTableToCanvas,
  exportChartToCanvas,
  type CanvasExportOptions,
} from "@/lib/canvas-export";

interface CanvasExportButtonProps {
  targetElement?: HTMLElement | null;
  targetSelector?: string;
  filename?: string;
  title?: string;
  exportType?: "element" | "page" | "component" | "dashboard" | "table" | "chart";
  className?: string;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showDropdown?: boolean;
  onExportComplete?: (success: boolean) => void;
}

export function CanvasExportButton({
  targetElement,
  targetSelector,
  filename = "export",
  title = "Export",
  exportType = "element",
  className,
  variant = "outline",
  size = "default",
  showDropdown = true,
  onExportComplete,
}: CanvasExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [exportOptions, setExportOptions] = useState<CanvasExportOptions>({
    quality: 0.92,
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    allowTaint: false,
  });

  const handleExport = async (options: CanvasExportOptions = {}) => {
    setLoading(true);
    
    try {
      let result;
      const finalOptions = { ...exportOptions, ...options };

      switch (exportType) {
        case "page":
          result = await exportPageToCanvas(finalOptions);
          break;
        case "component":
          if (!targetSelector) {
            throw new Error("Target selector is required for component export");
          }
          result = await exportComponentToCanvas(targetSelector, finalOptions);
          break;
        case "dashboard":
          if (!targetElement) {
            throw new Error("Target element is required for dashboard export");
          }
          result = await exportDashboardToCanvas(targetElement, title, finalOptions);
          break;
        case "table":
          if (!targetElement) {
            throw new Error("Target element is required for table export");
          }
          result = await exportTableToCanvas(targetElement, title, finalOptions);
          break;
        case "chart":
          if (!targetElement) {
            throw new Error("Target element is required for chart export");
          }
          result = await exportChartToCanvas(targetElement, title, finalOptions);
          break;
        default:
          if (!targetElement) {
            throw new Error("Target element is required for element export");
          }
          result = await exportElementToCanvas(targetElement, {
            filename,
            ...finalOptions,
          });
      }

      if (result.success) {
        toast({
          title: "تم التصدير بنجاح",
          description: `تم حفظ الصورة كـ ${filename}.png`,
        });
        onExportComplete?.(true);
      } else {
        throw new Error(result.error || "فشل في التصدير");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "خطأ في التصدير",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      onExportComplete?.(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickExport = () => {
    handleExport();
  };

  const handleHighQualityExport = () => {
    handleExport({
      quality: 1.0,
      scale: 3,
    });
  };

  const handleMobileOptimizedExport = () => {
    handleExport({
      scale: 1,
      quality: 0.8,
    });
  };

  const handlePrintOptimizedExport = () => {
    handleExport({
      scale: 2,
      quality: 0.95,
      backgroundColor: "#ffffff",
    });
  };

  if (!showDropdown) {
    return (
      <Button
        onClick={handleQuickExport}
        disabled={loading}
        variant={variant}
        size={size}
        className={className}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        <span className="mr-2">تصدير كصورة</span>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={loading}
            variant={variant}
            size={size}
            className={className}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <span className="mr-2">تصدير كصورة</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>خيارات التصدير</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleQuickExport}>
            <Download className="mr-2 h-4 w-4" />
            تصدير سريع
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleHighQualityExport}>
            <Image className="mr-2 h-4 w-4" />
            جودة عالية
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleMobileOptimizedExport}>
            <Smartphone className="mr-2 h-4 w-4" />
            محسن للجوال
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handlePrintOptimizedExport}>
            <FileImage className="mr-2 h-4 w-4" />
            محسن للطباعة
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            إعدادات متقدمة
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showSettings} onOpenChange={setShowSettings}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إعدادات التصدير المتقدمة</AlertDialogTitle>
            <AlertDialogDescription>
              قم بتخصيص إعدادات تصدير الصورة
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">الجودة (0.1 - 1.0)</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={exportOptions.quality}
                onChange={(e) =>
                  setExportOptions({
                    ...exportOptions,
                    quality: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">
                {Math.round((exportOptions.quality || 0.92) * 100)}%
              </span>
            </div>
            
            <div>
              <label className="text-sm font-medium">مقياس التكبير</label>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.5"
                value={exportOptions.scale}
                onChange={(e) =>
                  setExportOptions({
                    ...exportOptions,
                    scale: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
              <span className="text-xs text-muted-foreground">
                {exportOptions.scale}x
              </span>
            </div>
            
            <div>
              <label className="text-sm font-medium">لون الخلفية</label>
              <input
                type="color"
                value={exportOptions.backgroundColor}
                onChange={(e) =>
                  setExportOptions({
                    ...exportOptions,
                    backgroundColor: e.target.value,
                  })
                }
                className="w-full h-10 rounded border"
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleExport(exportOptions)}>
              <Check className="mr-2 h-4 w-4" />
              تصدير بالإعدادات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default CanvasExportButton;
