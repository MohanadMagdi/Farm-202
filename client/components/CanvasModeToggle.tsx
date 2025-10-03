import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Camera,
  Monitor,
  Smartphone,
  Download,
  Settings,
  Eye,
  EyeOff,
  Image,
  FileImage,
  Palette,
} from "lucide-react";
import { CanvasExportButton } from "@/components/buttons/CanvasExportButton";

interface CanvasModeToggleProps {
  className?: string;
  onModeChange?: (mode: CanvasMode) => void;
}

export type CanvasMode = "off" | "preview" | "export" | "print";

interface CanvasModeConfig {
  mode: CanvasMode;
  label: string;
  description: string;
  icon: any;
  color: string;
}

const canvasModes: CanvasModeConfig[] = [
  {
    mode: "off",
    label: "عادي",
    description: "وضع العرض العادي",
    icon: EyeOff,
    color: "bg-gray-100 text-gray-600",
  },
  {
    mode: "preview",
    label: "معاينة",
    description: "معاينة الصورة قبل التصدير",
    icon: Eye,
    color: "bg-blue-100 text-blue-600",
  },
  {
    mode: "export",
    label: "تصدير",
    description: "تصدير كصورة عالية الجودة",
    icon: Download,
    color: "bg-green-100 text-green-600",
  },
  {
    mode: "print",
    label: "طباعة",
    description: "تحسين للطباعة",
    icon: FileImage,
    color: "bg-purple-100 text-purple-600",
  },
];

export function CanvasModeToggle({ className, onModeChange }: CanvasModeToggleProps) {
  const [currentMode, setCurrentMode] = useState<CanvasMode>("off");
  const [showPreview, setShowPreview] = useState(false);

  const currentModeConfig = canvasModes.find(m => m.mode === currentMode) || canvasModes[0];

  useEffect(() => {
    onModeChange?.(currentMode);
  }, [currentMode, onModeChange]);

  const handleModeChange = (mode: CanvasMode) => {
    setCurrentMode(mode);
    
    if (mode === "preview") {
      setShowPreview(true);
      toast({
        title: "وضع المعاينة مفعل",
        description: "يمكنك الآن معاينة الصورة قبل التصدير",
      });
    } else if (mode === "export") {
      toast({
        title: "وضع التصدير مفعل",
        description: "انقر على أي عنصر لتصديره كصورة",
      });
    } else if (mode === "print") {
      toast({
        title: "وضع الطباعة مفعل",
        description: "العناصر محسنة للطباعة",
      });
    } else {
      setShowPreview(false);
      toast({
        title: "الوضع العادي",
        description: "تم إلغاء وضع المعاينة",
      });
    }
  };

  const handleQuickExport = () => {
    // This will be handled by the CanvasExportButton
    toast({
      title: "تصدير سريع",
      description: "انقر على العنصر الذي تريد تصديره",
    });
  };

  const handlePrintMode = () => {
    if (currentMode === "print") {
      window.print();
    } else {
      handleModeChange("print");
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Mode Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`flex items-center gap-2 ${currentModeConfig.color}`}
          >
            <currentModeConfig.icon className="h-4 w-4" />
            <span>{currentModeConfig.label}</span>
            {currentMode !== "off" && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {currentMode}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>وضع العرض</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {canvasModes.map((mode) => (
            <DropdownMenuItem
              key={mode.mode}
              onClick={() => handleModeChange(mode.mode)}
              className="flex items-center gap-3"
            >
              <mode.icon className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{mode.label}</span>
                <span className="text-xs text-muted-foreground">
                  {mode.description}
                </span>
              </div>
              {currentMode === mode.mode && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  نشط
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleQuickExport}>
            <Camera className="mr-2 h-4 w-4" />
            تصدير سريع
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handlePrintMode}>
            <FileImage className="mr-2 h-4 w-4" />
            {currentMode === "print" ? "طباعة الآن" : "وضع الطباعة"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Export Button */}
      {currentMode === "export" && (
        <CanvasExportButton
          exportType="page"
          filename="page-export"
          title="تصدير الصفحة"
          variant="default"
          size="sm"
          showDropdown={false}
        />
      )}

      {/* Preview Toggle */}
      {currentMode === "preview" && (
        <Button
          variant={showPreview ? "default" : "outline"}
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {showPreview ? "إخفاء المعاينة" : "إظهار المعاينة"}
        </Button>
      )}

      {/* Print Button */}
      {currentMode === "print" && (
        <Button
          variant="default"
          size="sm"
          onClick={() => window.print()}
        >
          <FileImage className="h-4 w-4 mr-2" />
          طباعة
        </Button>
      )}
    </div>
  );
}

export default CanvasModeToggle;

