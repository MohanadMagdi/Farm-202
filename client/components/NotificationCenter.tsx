import { useState, useEffect } from "react";
import { Bell, X, Package, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatArabicDate } from "@/lib/arabic-utils";
import {
  ExpiryNotification,
  ExpiryStats,
  getAllExpiryNotifications,
  calculateExpiryStats,
  getNotificationBadgeCount,
  formatRemainingDays,
  updateItemExpiryCountdown
} from "@/lib/expiry-notifications";
import { dataService } from "@/lib/data-service";
import type { WarehouseItem } from "@shared/types";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ExpiryNotification[]>([]);
  const [stats, setStats] = useState<ExpiryStats>({
    expired: 0,
    expiringSoon: 0,
    expiringThisMonth: 0,
    totalWithExpiry: 0
  });
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);

  // Load and update notifications
  const loadNotifications = async () => {
    try {
      const items = await dataService.getWarehouseItems();
      const updatedItems = updateItemExpiryCountdown(items);
      setWarehouseItems(updatedItems);

      const notifications = getAllExpiryNotifications(updatedItems);
      const stats = calculateExpiryStats(updatedItems);

      setNotifications(notifications);
      setStats(stats);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Update notifications every minute
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const badgeCount = getNotificationBadgeCount(notifications);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Package className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'border-r-red-500 bg-red-50';
      case 'warning':
        return 'border-r-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-r-blue-500 bg-blue-50';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 rounded-full"
        >
          <Bell className="h-4 w-4" />
          {badgeCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {badgeCount > 99 ? '99+' : badgeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">إشعارات انتهاء الصلاحية</CardTitle>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  تحديد الكل كمقروء
                </Button>
              )}
            </div>
            
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">{stats.expired}</div>
                <div className="text-xs text-red-600">منتهية</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{stats.expiringSoon}</div>
                <div className="text-xs text-yellow-600">تنتهي قريباً</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{stats.expiringThisMonth}</div>
                <div className="text-xs text-blue-600">هذا الشهر</div>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-sm">لا توجد تنبيهات صلاحية</div>
                <div className="text-xs mt-1">جميع المنتجات في حالة جيدة</div>
              </div>
            ) : (
              <ScrollArea className="h-80">
                <div className="p-3 space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border-r-4 transition-colors ${getSeverityColor(notification.severity)} ${
                        notification.isRead ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getSeverityIcon(notification.severity)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {notification.itemName}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {notification.message}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.category}
                              </Badge>
                              <div className="text-xs text-gray-500">
                                {formatArabicDate(notification.expiryDate)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>

          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to inventory page with expiry filter
                    window.location.hash = '#/inventory?filter=expiry';
                  }}
                >
                  عرض جميع المنتجات المنتهية الصلاحية
                </Button>
              </div>
            </>
          )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}
