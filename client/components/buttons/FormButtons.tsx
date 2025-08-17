import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Save,
  X,
  Check,
  AlertTriangle,
  Loader2,
  Copy,
  RefreshCw,
  Trash2,
  Edit,
  Plus,
  Minus,
  Upload,
  Download,
  Printer,
  Share,
  Archive,
  RotateCcw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Settings,
  Info,
  HelpCircle,
} from "lucide-react";

interface FormActionsProps {
  mode?: "add" | "edit" | "view";
  loading?: boolean;
  canSave?: boolean;
  canDelete?: boolean;
  canCancel?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onReset?: () => void;
  customActions?: Array<{
    label: string;
    icon?: any;
    variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
    action: () => void;
    disabled?: boolean;
    loading?: boolean;
  }>;
}

export function FormActions({
  mode = "add",
  loading = false,
  canSave = true,
  canDelete = false,
  canCancel = true,
  onSave,
  onCancel,
  onDelete,
  onReset,
  customActions = [],
}: FormActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex items-center justify-between gap-2 pt-4 border-t">
      {/* Left side - Secondary actions */}
      <div className="flex items-center gap-2">
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={loading}
            title="إعادة تعيين"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">إعادة تعيين</span>
          </Button>
        )}

        {canDelete && mode === "edit" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700"
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">حذف</span>
          </Button>
        )}

        {/* Custom actions */}
        {customActions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "outline"}
            size="sm"
            onClick={action.action}
            disabled={action.disabled || loading}
            title={action.label}
          >
            {action.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              action.icon && <action.icon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Right side - Primary actions */}
      <div className="flex items-center gap-2">
        {canCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 ml-2" />
            إلغاء
          </Button>
        )}

        {canSave && (
          <Button
            onClick={onSave}
            disabled={!canSave || loading}
            className="min-w-[100px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                {mode === "add" ? "إضافة" : "حفظ التعديلات"}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أنك تريد حذف هذا العنصر؟
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface TableActionsProps {
  selectedCount?: number;
  totalCount?: number;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onBulkDelete?: () => void;
  onBulkArchive?: () => void;
  onBulkExport?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function TableActions({
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkArchive,
  onBulkExport,
  onRefresh,
  loading = false,
}: TableActionsProps) {
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const handleBulkDelete = () => {
    if (selectedCount > 0) {
      setShowBulkDeleteConfirm(true);
    }
  };

  const confirmBulkDelete = () => {
    onBulkDelete?.();
    setShowBulkDeleteConfirm(false);
  };

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      {/* Left side - Selection info and actions */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            <span className="text-sm text-muted-foreground">
              تم تحديد {selectedCount} من {totalCount} عنصر
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              title="إلغاء التحديد"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="h-4 w-px bg-border" />

            {onBulkExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkExport}
                disabled={loading}
                title="تصدير المحدد"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">تصدير</span>
              </Button>
            )}

            {onBulkArchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkArchive}
                disabled={loading}
                title="أرشفة المحدد"
              >
                <Archive className="h-4 w-4" />
                <span className="hidden sm:inline">أرشفة</span>
              </Button>
            )}

            {onBulkDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={loading}
                className="text-red-600 hover:text-red-700"
                title="حذف المحدد"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">حذف</span>
              </Button>
            )}
          </>
        )}

        {selectedCount === 0 && onSelectAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={loading || totalCount === 0}
            title="تحديد الكل"
          >
            <Check className="h-4 w-4" />
            <span className="hidden sm:inline">تحديد الكل</span>
          </Button>
        )}
      </div>

      {/* Right side - Refresh and other actions */}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            title="تحديث البيانات"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
        )}
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              تأكيد الحذف الجماعي
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أنك تريد حذف {selectedCount} عنصر؟
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف {selectedCount} عنصر نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface PaginationButtonsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
}

export function PaginationButtons({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  loading = false,
}: PaginationButtonsProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      {/* Items info */}
      <div className="text-sm text-muted-foreground">
        عرض {startItem} إلى {endItem} من أصل {totalItems} عنصر
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="hidden sm:inline">السابق</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <div key={index}>
              {page === "..." ? (
                <span className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  disabled={loading}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
        >
          <span className="hidden sm:inline">التالي</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Page size selector */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">عرض</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
            disabled={loading}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-muted-foreground">عنصر</span>
        </div>
      )}
    </div>
  );
}

export default {
  FormActions,
  TableActions,
  PaginationButtons,
};
