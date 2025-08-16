import { WarehouseItem } from "@shared/types";

export interface ExpiryNotification {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  expiryDate: Date;
  remainingDays: number;
  severity: "critical" | "warning" | "info";
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ExpiryStats {
  expired: number;
  expiringSoon: number; // < 7 days
  expiringThisMonth: number; // < 30 days
  totalWithExpiry: number;
}

// Configuration for expiry thresholds
export const EXPIRY_THRESHOLDS = {
  CRITICAL: 3, // days
  WARNING: 7, // days
  INFO: 30, // days
};

/**
 * Calculate remaining days until expiry for an item
 */
export function calculateRemainingDays(expiryDate: Date): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Update remaining days for all warehouse items with expiry
 */
export function updateItemExpiryCountdown(
  items: WarehouseItem[],
): WarehouseItem[] {
  return items.map((item) => {
    if (!item.hasExpiry || !item.expiryDate) {
      return item;
    }

    const remainingDays = calculateRemainingDays(item.expiryDate);

    return {
      ...item,
      remainingDays,
    };
  });
}

/**
 * Determine expiry severity based on remaining days
 */
export function getExpirySeverity(
  remainingDays: number,
): "critical" | "warning" | "info" | null {
  if (remainingDays < 0) return "critical"; // Already expired
  if (remainingDays <= EXPIRY_THRESHOLDS.CRITICAL) return "critical";
  if (remainingDays <= EXPIRY_THRESHOLDS.WARNING) return "warning";
  if (remainingDays <= EXPIRY_THRESHOLDS.INFO) return "info";
  return null;
}

/**
 * Generate expiry notification for an item
 */
export function generateExpiryNotification(
  item: WarehouseItem,
): ExpiryNotification | null {
  if (!item.hasExpiry || !item.expiryDate || item.remainingDays === undefined) {
    return null;
  }

  const severity = getExpirySeverity(item.remainingDays);
  if (!severity) return null;

  let message = "";
  if (item.remainingDays < 0) {
    message = `انتهت صلاحية "${item.name}" منذ ${Math.abs(item.remainingDays)} يوم`;
  } else if (item.remainingDays === 0) {
    message = `تنتهي صلاحية "${item.name}" اليوم`;
  } else if (item.remainingDays === 1) {
    message = `تنتهي صلاحية "${item.name}" غداً`;
  } else {
    message = `تنتهي صلاحية "${item.name}" خلال ${item.remainingDays} يوم`;
  }

  return {
    id: `expiry-${item.id}-${Date.now()}`,
    itemId: item.id,
    itemName: item.name,
    category: item.category,
    expiryDate: item.expiryDate,
    remainingDays: item.remainingDays,
    severity,
    message,
    isRead: false,
    createdAt: new Date(),
  };
}

/**
 * Get all expiry notifications for warehouse items
 */
export function getAllExpiryNotifications(
  items: WarehouseItem[],
): ExpiryNotification[] {
  const notifications: ExpiryNotification[] = [];

  for (const item of items) {
    if (!item.isActive) continue;

    const notification = generateExpiryNotification(item);
    if (notification) {
      notifications.push(notification);
    }
  }

  // Sort by severity (critical first) then by remaining days
  return notifications.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.remainingDays - b.remainingDays;
  });
}

/**
 * Calculate expiry statistics
 */
export function calculateExpiryStats(items: WarehouseItem[]): ExpiryStats {
  const activeItemsWithExpiry = items.filter(
    (item) =>
      item.isActive &&
      item.hasExpiry &&
      item.expiryDate &&
      item.remainingDays !== undefined,
  );

  const stats: ExpiryStats = {
    expired: 0,
    expiringSoon: 0,
    expiringThisMonth: 0,
    totalWithExpiry: activeItemsWithExpiry.length,
  };

  for (const item of activeItemsWithExpiry) {
    const remainingDays = item.remainingDays!;

    if (remainingDays < 0) {
      stats.expired++;
    } else if (remainingDays <= 7) {
      stats.expiringSoon++;
    } else if (remainingDays <= 30) {
      stats.expiringThisMonth++;
    }
  }

  return stats;
}

/**
 * Get notification badge count (critical + warning only)
 */
export function getNotificationBadgeCount(
  notifications: ExpiryNotification[],
): number {
  return notifications.filter(
    (n) => !n.isRead && (n.severity === "critical" || n.severity === "warning"),
  ).length;
}

/**
 * Filter items by expiry status
 */
export function filterItemsByExpiryStatus(
  items: WarehouseItem[],
  status: "expired" | "expiring-soon" | "expiring-month" | "all",
): WarehouseItem[] {
  const activeItemsWithExpiry = items.filter(
    (item) =>
      item.isActive &&
      item.hasExpiry &&
      item.expiryDate &&
      item.remainingDays !== undefined,
  );

  switch (status) {
    case "expired":
      return activeItemsWithExpiry.filter((item) => item.remainingDays! < 0);
    case "expiring-soon":
      return activeItemsWithExpiry.filter(
        (item) => item.remainingDays! >= 0 && item.remainingDays! <= 7,
      );
    case "expiring-month":
      return activeItemsWithExpiry.filter(
        (item) => item.remainingDays! > 7 && item.remainingDays! <= 30,
      );
    default:
      return activeItemsWithExpiry;
  }
}

/**
 * Format remaining days for display
 */
export function formatRemainingDays(remainingDays: number): string {
  if (remainingDays < 0) {
    return `منتهية الصلاحية منذ ${Math.abs(remainingDays)} يوم`;
  } else if (remainingDays === 0) {
    return "تنتهي اليوم";
  } else if (remainingDays === 1) {
    return "تنتهي غداً";
  } else {
    return `${remainingDays} يوم متبقي`;
  }
}

/**
 * Get expiry badge color based on severity
 */
export function getExpiryBadgeVariant(
  remainingDays: number,
): "destructive" | "default" | "secondary" {
  const severity = getExpirySeverity(remainingDays);
  switch (severity) {
    case "critical":
      return "destructive";
    case "warning":
      return "default";
    default:
      return "secondary";
  }
}
