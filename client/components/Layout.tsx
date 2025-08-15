import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

const navigation = [
  {
    name: "لوحة التحكم",
    href: "/",
    icon: Home,
  },
  {
    name: "الحيوانات",
    href: "/animals",
    icon: CircleDot,
    children: [
      { name: "الذكور", href: "/animals/males" },
      { name: "الإناث", href: "/animals/females" },
      { name: "الصغار", href: "/animals/newborns" },
    ],
  },
  {
    name: "الحظائر",
    href: "/barns",
    icon: Building2,
  },
  {
    name: "المخزون",
    href: "/inventory",
    icon: Package,
  },
  {
    name: "التغذية",
    href: "/feeding",
    icon: Utensils,
  },
  {
    name: "التقارير",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "المستخدمين",
    href: "/users",
    icon: UserCheck,
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background rtl" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex items-center space-x-4 space-x-reverse">
            <CircleDot className="h-8 w-8 text-farm-600" />
            <div>
              <h1 className="text-xl font-bold text-farm-800">مزرعة الأغنام</h1>
              <p className="text-sm text-muted-foreground">
                نظام إدارة المزرعة
              </p>
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button variant="outline" size="sm">
              الإعدادات
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-l bg-card">
          <nav className="space-y-2 p-4">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.children &&
                  item.children.some(
                    (child) => location.pathname === child.href,
                  ));

              return (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 space-x-reverse rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-farm-100 text-farm-800"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>

                  {/* Sub-navigation */}
                  {item.children && (
                    <div className="mr-8 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm transition-colors",
                            location.pathname === child.href
                              ? "bg-farm-50 text-farm-700 font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
