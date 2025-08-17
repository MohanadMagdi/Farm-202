/**
 * Export Utilities for Sheep Farm Management System
 * Handles Excel export functionality for all reports
 */

import type {
  Animal,
  FeedingRecord,
  WarehouseItem,
  Barn,
  WeightRecord,
  StockMovement,
  HealthRecord,
  BarnMovement,
} from "@shared/types";
import { formatArabicDate } from "./arabic-utils";
import { farmHelpers } from "./data-service";

// Define the export functions that will use dynamic imports
export interface ExportOptions {
  title: string;
  subtitle?: string;
  includeDate?: boolean;
  orientation?: "portrait" | "landscape";
  author?: string;
  filename?: string;
}

export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: "left" | "center" | "right";
  formatter?: (value: any) => string;
}

/**
 * Export data to Excel format
 */
export async function exportToExcel<T>(
  data: T[],
  columns: TableColumn[],
  options: ExportOptions,
): Promise<void> {
  try {
    // Dynamic import to reduce bundle size
    const XLSX = await import("xlsx");

    // Transform data according to columns
    const transformedData = data.map((item) => {
      const row: any = {};
      columns.forEach((col) => {
        const value = (item as any)[col.key];
        row[col.header] = col.formatter ? col.formatter(value) : value || "";
      });
      return row;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(transformedData);

    // Set column widths
    const wscols = columns.map((col) => ({ wch: col.width || 15 }));
    ws["!cols"] = wscols;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "البيانات");

    // Add metadata sheet
    const metadata = [
      { المعلومة: "عنوان التقرير", القيمة: options.title },
      {
        المعلومة: "تاريخ الإنشاء",
        القيمة: new Date().toLocaleDateString("ar-EG"),
      },
      { المعلومة: "المؤلف", القيمة: options.author || "نظام إدارة المزرعة" },
      { المعلومة: "عد�� السجلات", القيمة: data.length.toString() },
    ];

    if (options.subtitle) {
      metadata.splice(1, 0, {
        المعلومة: "العنوان الفرعي",
        القيمة: options.subtitle,
      });
    }

    const metaWs = XLSX.utils.json_to_sheet(metadata);
    XLSX.utils.book_append_sheet(wb, metaWs, "معلومات التقرير");

    // Generate filename
    const filename =
      options.filename ||
      `${options.title.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw new Error("فشل في تصدير ملف Excel");
  }
}

/**
 * Export Animals Report
 */
export async function exportAnimalsReport(
  animals: Animal[],
  format: "excel",
  category?: string,
): Promise<void> {
  const columns: TableColumn[] = [
    { header: "رقم الأذن", key: "earTagId", width: 15 },
    {
      header: "النوع",
      key: "sex",
      width: 10,
      formatter: (value) => (value === "male" ? "ذكر" : "أنثى"),
    },
    { header: "التصنيف", key: "category", width: 15 },
    {
      header: "الوزن (كيلو)",
      key: "weight",
      width: 15,
      formatter: (value) => `${value?.toFixed(1) || 0}`,
    },
    {
      header: "سعر الشراء",
      key: "purchasePrice",
      width: 15,
      formatter: (value) => farmHelpers.formatCurrency(value || 0),
    },
    {
      header: "السعر الحالي",
      key: "currentPrice",
      width: 15,
      formatter: (value) => farmHelpers.formatCurrency(value || 0),
    },
    { header: "المورد", key: "supplier", width: 20 },
    {
      header: "تاريخ الشراء",
      key: "purchaseDate",
      width: 15,
      formatter: (value) => formatArabicDate(value),
    },
    { header: "الحالة الصحية", key: "healthStatus", width: 15 },
    {
      header: "معزول",
      key: "isIsolated",
      width: 10,
      formatter: (value) => (value ? "نعم" : "لا"),
    },
  ];

  // Add category-specific columns
  if (!category || category === "female") {
    columns.splice(
      9,
      0,
      {
        header: "حامل",
        key: "isPregnant",
        width: 10,
        formatter: (value) => (value ? "نعم" : "لا"),
      },
      {
        header: "عدد النسل",
        key: "offspringCount",
        width: 12,
        formatter: (value) => value?.toString() || "0",
      },
    );
  }

  if (!category || category === "newborn") {
    columns.splice(
      9,
      0,
      { header: "الأم", key: "motherEarTagId", width: 15 },
      {
        header: "تاريخ الميلاد",
        key: "birthDate",
        width: 15,
        formatter: (value) => (value ? formatArabicDate(value) : "-"),
      },
    );
  }

  const options: ExportOptions = {
    title: `تقرير الحيوانات${category ? ` - ${getCategoryName(category)}` : ""}`,
    subtitle: `إجمالي العدد: ${animals.length} حيوان`,
    author: "نظام إدارة المزرعة",
    orientation: "landscape",
  };

  await exportToExcel(animals, columns, options);
}

/**
 * Export Feeding Efficiency Report
 */
export async function exportFeedingReport(
  feedingRecords: FeedingRecord[],
  format: "excel",
): Promise<void> {
  const columns: TableColumn[] = [
    {
      header: "التاريخ",
      key: "date",
      width: 15,
      formatter: (value) => formatArabicDate(value),
    },
    { header: "الحظيرة", key: "barnName", width: 20 },
    { header: "نوع العلف", key: "feedTypeName", width: 20 },
    {
      header: "الكمية المخططة",
      key: "quantityPlanned",
      width: 15,
      formatter: (value) => `${value?.toFixed(1) || 0} كيلو`,
    },
    {
      header: "الكمية المقدمة",
      key: "quantityServed",
      width: 15,
      formatter: (value) => `${value?.toFixed(1) || 0} كيلو`,
    },
    { header: "عدد الحيوانات", key: "animalsCount", width: 15 },
    {
      header: "العلف/حيوان",
      key: "feedPerAnimal",
      width: 15,
      formatter: (value) => `${value?.toFixed(2) || 0} كيلو`,
    },
    {
      header: "معدل النمو اليومي",
      key: "avgDailyGain",
      width: 18,
      formatter: (value) => `${value?.toFixed(3) || 0} كيلو`,
    },
    {
      header: "كفاءة التغذية",
      key: "feedingEfficiency",
      width: 15,
      formatter: (value) => value?.toFixed(2) || "0",
    },
    { header: "الملاحظات", key: "notes", width: 25 },
  ];

  const options: ExportOptions = {
    title: "تقرير كفاءة التغذية",
    subtitle: `إجمالي السجلات: ${feedingRecords.length} سجل`,
    orientation: "landscape",
  };

  await exportToExcel(feedingRecords, columns, options);
}

/**
 * Export Inventory Report
 */
export async function exportInventoryReport(
  items: WarehouseItem[],
  movements: StockMovement[],
  format: "excel",
): Promise<void> {
  const columns: TableColumn[] = [
    { header: "اسم المادة", key: "name", width: 25 },
    {
      header: "النوع",
      key: "type",
      width: 15,
      formatter: (value) => getWarehouseTypeName(value),
    },
    { header: "الفئة", key: "category", width: 15 },
    {
      header: "المخزون الحالي",
      key: "currentStock",
      width: 15,
      formatter: (value, item) => `${value || 0} ${(item as any)?.unit || ""}`,
    },
    {
      header: "الحد الأدنى",
      key: "minStockLevel",
      width: 15,
      formatter: (value, item) => `${value || 0} ${(item as any)?.unit || ""}`,
    },
    {
      header: "الحد الأقصى",
      key: "maxStockLevel",
      width: 15,
      formatter: (value, item) => `${value || 0} ${(item as any)?.unit || ""}`,
    },
    {
      header: "سعر الوحدة",
      key: "unitPrice",
      width: 15,
      formatter: (value) => farmHelpers.formatCurrency(value || 0),
    },
    {
      header: "القيمة الإجمالية",
      key: "totalValue",
      width: 18,
      formatter: (value, item) => {
        const total =
          ((item as any)?.currentStock || 0) * ((item as any)?.unitPrice || 0);
        return farmHelpers.formatCurrency(total);
      },
    },
    {
      header: "تاريخ الانتهاء",
      key: "expiryDate",
      width: 15,
      formatter: (value) => (value ? formatArabicDate(value) : "-"),
    },
    {
      header: "الأيام المتبقية",
      key: "remainingDays",
      width: 15,
      formatter: (value) => (value ? `${value} يوم` : "-"),
    },
    { header: "المورد", key: "supplier", width: 20 },
  ];

  const options: ExportOptions = {
    title: "تقرير المخزون",
    subtitle: `إجمالي المواد: ${items.length} مادة`,
    orientation: "landscape",
  };

  await exportToExcel(items, columns, options);
}

/**
 * Export Weight Records Report
 */
export async function exportWeightRecordsReport(
  records: (WeightRecord & { animalEarTagId?: string })[],
  format: "excel",
): Promise<void> {
  const columns: TableColumn[] = [
    { header: "رقم الأذن", key: "animalEarTagId", width: 15 },
    {
      header: "الوزن (كيلو)",
      key: "weight",
      width: 15,
      formatter: (value) => `${value?.toFixed(1) || 0}`,
    },
    {
      header: "التاريخ",
      key: "date",
      width: 15,
      formatter: (value) => formatArabicDate(value),
    },
    { header: "المسجل بواسطة", key: "recordedBy", width: 20 },
    { header: "الملاحظات", key: "notes", width: 30 },
  ];

  const options: ExportOptions = {
    title: "تقرير سجلات الوزن",
    subtitle: `إجمالي القياسات: ${records.length} قياس`,
    orientation: "portrait",
  };

  await exportToExcel(records, columns, options);
}

/**
 * Export Health Records Report
 */
export async function exportHealthRecordsReport(
  records: (HealthRecord & { animalEarTagId?: string })[],
  format: "excel",
): Promise<void> {
  const columns: TableColumn[] = [
    { header: "رقم الأذن", key: "animalEarTagId", width: 15 },
    { header: "نوع السجل", key: "type", width: 15 },
    {
      header: "التاريخ",
      key: "date",
      width: 15,
      formatter: (value) => formatArabicDate(value),
    },
    { header: "الوصف", key: "description", width: 25 },
    { header: "الدواء/اللقاح", key: "medicineUsed", width: 20 },
    { header: "الجرعة", key: "dosage", width: 15 },
    { header: "المعطي", key: "administeredBy", width: 20 },
    {
      header: "التكلفة",
      key: "cost",
      width: 15,
      formatter: (value) => farmHelpers.formatCurrency(value || 0),
    },
    { header: "الملاحظات", key: "notes", width: 25 },
  ];

  const options: ExportOptions = {
    title: "تقرير السجلات الصحية",
    subtitle: `إجمالي السجلات: ${records.length} سجل`,
    orientation: "landscape",
  };

  await exportToExcel(records, columns, options);
}

// Helper functions
function getCategoryName(category: string): string {
  switch (category) {
    case "male":
      return "الذكور";
    case "female":
      return "الإناث";
    case "newborn":
      return "المواليد";
    default:
      return category;
  }
}

function getWarehouseTypeName(type: string): string {
  switch (type) {
    case "chemicals":
      return "كيماويات";
    case "medicines":
      return "أدوية";
    case "medical_supplies":
      return "مستلزمات طبية";
    case "equipment":
      return "معدات";
    case "maintenance":
      return "صيانة";
    default:
      return type;
  }
}

/**
 * Export comprehensive farm report
 */
export async function exportComprehensiveFarmReport(
  animals: Animal[],
  feedingRecords: FeedingRecord[],
  warehouseItems: WarehouseItem[],
  format: "excel",
): Promise<void> {
  // This would create a multi-sheet Excel export with all farm data
  // Implementation would depend on specific requirements
  console.log("Comprehensive farm report export not yet implemented");
}
