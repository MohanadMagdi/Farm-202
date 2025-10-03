// Main button components for the Farm Management System

export { default as QuickActionButtons } from './QuickActionButtons';
export { default as AnimalActionButtons } from './AnimalActionButtons';
export { default as CanvasExportButton } from './CanvasExportButton';
export { default as ExportImportButtons } from './ExportImportButtons';
export { default as NavigationButtons } from './NavigationButtons';
export { default as DashboardButtons } from './DashboardButtons';

// Form and Table Action components
export { FormActions, TableActions, PaginationButtons } from './FormButtons';

// Re-export commonly used button variants
export { Button } from '../ui/button';

// Button utility types
export interface ButtonConfig {
  label: string;
  icon?: any;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  size?: "sm" | "default" | "lg" | "icon";
  action: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  title?: string;
}

export interface ActionButtonGroup {
  title: string;
  buttons: ButtonConfig[];
  orientation?: "horizontal" | "vertical";
  spacing?: "sm" | "md" | "lg";
}

// Common button configurations
export const commonButtonConfigs = {
  // Primary actions
  save: (onClick: () => void, loading = false): ButtonConfig => ({
    label: "حفظ",
    variant: "default",
    action: onClick,
    loading,
  }),

  cancel: (onClick: () => void): ButtonConfig => ({
    label: "إلغاء",
    variant: "outline",
    action: onClick,
  }),

  delete: (onClick: () => void, loading = false): ButtonConfig => ({
    label: "حذف",
    variant: "destructive",
    action: onClick,
    loading,
  }),

  // Secondary actions
  edit: (onClick: () => void): ButtonConfig => ({
    label: "تعديل",
    variant: "outline",
    action: onClick,
  }),

  view: (onClick: () => void): ButtonConfig => ({
    label: "عرض",
    variant: "ghost",
    action: onClick,
  }),

  refresh: (onClick: () => void, loading = false): ButtonConfig => ({
    label: "تحديث",
    variant: "outline",
    action: onClick,
    loading,
  }),

  // Export/Import
  export: (onClick: () => void, loading = false): ButtonConfig => ({
    label: "تصدير",
    variant: "outline",
    action: onClick,
    loading,
  }),

  import: (onClick: () => void, loading = false): ButtonConfig => ({
    label: "استيراد",
    variant: "outline",
    action: onClick,
    loading,
  }),

  // Quick actions
  addAnimal: (onClick: () => void): ButtonConfig => ({
    label: "إضافة حيوان",
    variant: "default",
    action: onClick,
  }),

  recordWeight: (onClick: () => void): ButtonConfig => ({
    label: "تسجيل وزن",
    variant: "outline",
    action: onClick,
  }),

  addTreatment: (onClick: () => void): ButtonConfig => ({
    label: "تسجيل علاج",
    variant: "outline",
    action: onClick,
  }),

  dispenseFood: (onClick: () => void): ButtonConfig => ({
    label: "صرف علف",
    variant: "outline",
    action: onClick,
  }),
};

// Button group presets for common use cases
export const buttonGroups = {
  // Form actions (save, cancel, delete)
  formActions: (
    onSave: () => void,
    onCancel: () => void,
    onDelete?: () => void,
    loading = false
  ): ActionButtonGroup => ({
    title: "إجراءات النموذج",
    orientation: "horizontal",
    buttons: [
      commonButtonConfigs.cancel(onCancel),
      ...(onDelete ? [commonButtonConfigs.delete(onDelete, loading)] : []),
      commonButtonConfigs.save(onSave, loading),
    ],
  }),

  // Table actions (add, export, refresh)
  tableActions: (
    onAdd: () => void,
    onExport?: () => void,
    onRefresh?: () => void,
    loading = false
  ): ActionButtonGroup => ({
    title: "إجراءات الجدول",
    orientation: "horizontal",
    buttons: [
      ...(onRefresh ? [commonButtonConfigs.refresh(onRefresh, loading)] : []),
      ...(onExport ? [commonButtonConfigs.export(onExport, loading)] : []),
      { ...commonButtonConfigs.addAnimal(onAdd), label: "إضافة جديد" },
    ],
  }),

  // Animal quick actions
  animalQuickActions: (
    onAddAnimal: () => void,
    onRecordWeight: () => void,
    onAddTreatment: () => void
  ): ActionButtonGroup => ({
    title: "إجراءات سريعة للحيوانات",
    orientation: "horizontal",
    buttons: [
      commonButtonConfigs.addAnimal(onAddAnimal),
      commonButtonConfigs.recordWeight(onRecordWeight),
      commonButtonConfigs.addTreatment(onAddTreatment),
    ],
  }),
};

// Utility functions for button management
export const buttonUtils = {
  // Create a button with loading state management
  createLoadingButton: (
    config: ButtonConfig,
    loadingState: boolean
  ): ButtonConfig => ({
    ...config,
    loading: loadingState,
    disabled: config.disabled || loadingState,
  }),

  // Create a conditional button (shows only if condition is met)
  createConditionalButton: (
    config: ButtonConfig,
    condition: boolean
  ): ButtonConfig | null => {
    return condition ? config : null;
  },

  // Create a group of buttons with consistent spacing
  createButtonGroup: (
    buttons: (ButtonConfig | null)[],
    spacing: "sm" | "md" | "lg" = "md"
  ): ButtonConfig[] => {
    return buttons.filter((button): button is ButtonConfig => button !== null);
  },

  // Apply theme variants to buttons
  applyTheme: (config: ButtonConfig, theme: "primary" | "success" | "danger" | "warning"): ButtonConfig => {
    const themeMap = {
      primary: "default",
      success: "default",
      danger: "destructive",
      warning: "outline",
    } as const;

    return {
      ...config,
      variant: themeMap[theme],
    };
  },
};
