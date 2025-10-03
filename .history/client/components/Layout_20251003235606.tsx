import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { dataMode } from "@/lib/data-service";
import NotificationCenter from "@/components/NotificationCenter";
import CanvasModeToggle from "@/components/CanvasModeToggle";
import {
  Home,
  Users,
  Building2,
  Package,
  Utensils,
  FileText,
  Settings,
  CircleDot,
  Baby,
  UserCheck,
  LogOut,
  Shield,
  Database,
  Scale,
} from "lucide-react";

const navigation = [
  {
    name: "لوحة التحكم",
    href: "/",
    icon: Home,
    permission: "dashboard",
  },
  {
    name: "الحيوانات",
    href: "/animals",
    icon: CircleDot,
    permission: "animals",
    children: [
      { name: "الذكور", href: "/animals/males", permission: "animals" },
      { name: "الإناث", href: "/animals/females", permission: "animals" },
      { name: "الصغار", href: "/animals/newborns", permission: "animals" },
    ],
  },
  {
    name: "الحظائر",
    href: "/barns",
    icon: Building2,
    permission: "barns",
  },
  {
    name: "التغذية",
    href: "/feeding",
    icon: Utensils,
    permission: "feeding",
  },
  {
    name: "المخزون",
    href: "/inventory",
    icon: Package,
    permission: "inventory",
  },
  {
    name: "تقارير الأوزان",
    href: "/reports/weights",
    icon: Scale,
    permission: "reports",
  },
  {
    name: "التقارير",
    href: "/reports",
    icon: FileText,
    permission: "reports",
  },
  {
    name: "المستخدمين",
    href: "/users",
    icon: UserCheck,
    permission: "users",
  },
];

const roleColors = {
  owner: "bg-red-100 text-red-800",
  manager: "bg-blue-100 text-blue-800",
  vet: "bg-green-100 text-green-800",
  inventory: "bg-purple-100 text-purple-800",
  barn_manager: "bg-orange-100 text-orange-800",
  accountant: "bg-yellow-100 text-yellow-800",
  sales: "bg-pink-100 text-pink-800",
};

const roleLabels = {
  owner: "مدير المزرعة",
  manager: "مدير العمليات",
  vet: "طبيب بيطري",
  inventory: "مسؤول مخزون",
  barn_manager: "مشرف حظائر",
  accountant: "محاسب",
  sales: "مسؤول مبيعات",
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut, hasPermission } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Filter navigation items based on user permissions
  const filteredNavigation = navigation.filter(
    (item) => hasPermission("all") || hasPermission(item.permission),
  );

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background rtl" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-4">
            <CircleDot className="h-8 w-8 text-farm-600" />
            <div>
              <h1 className="text-xl font-bold text-farm-800">مزرعة الأغنام</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  نظام إدارة المزرعة
                </p>
                {dataMode === "mock" && (
                  <Badge variant="outline" className="text-xs">
                    <Database className="h-3 w-3 mr-1" />
                    وضع التطوير
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Canvas Mode Toggle */}
            <CanvasModeToggle />

            {/* Notifications */}
            <NotificationCenter />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto px-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-farm-600 text-white text-xs">
                        {user ? getUserInitials(user.displayName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-right">
                      <p className="text-sm font-medium">{user?.displayName}</p>
                      {user && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${roleColors[user.role]}`}
                        >
                          {roleLabels[user.role]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="h-3 w-3" />
                      <span className="text-xs">
                        {roleLabels[user?.role || "barn_manager"]}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="ml-2 h-4 w-4" />
                  <span>الإعدادات</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserCheck className="ml-2 h-4 w-4" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="overflow-x-hidden">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
