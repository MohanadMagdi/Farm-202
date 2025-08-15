import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatArabicDate, formatArabicNumber } from "@/lib/arabic-utils";
import { db, User } from "@/lib/firebase-mock";
import {
  Plus,
  Search,
  UserCheck,
  Shield,
  Settings,
  Eye,
  Edit,
  Trash2,
  Lock,
  Unlock,
  UserPlus,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const roleLabels = {
  owner: "مالك المزرعة",
  manager: "مدير عام",
  vet: "طبيب بيطري",
  inventory: "مدير المخزون",
  barn_manager: "مشرف الحظائر",
  accountant: "محاسب",
  sales: "مدير المبيعات",
};

const rolePermissions = {
  owner: ["قراءة", "كتابة", "حذف", "إدارة المستخدمين", "إدارة الأدوار"],
  manager: ["قراءة", "كتابة", "حذف", "التقارير"],
  vet: ["قراءة الحيوانات", "كتابة السجلات الصحية"],
  inventory: ["إدارة المخزون", "حركة المخزون", "التقارير"],
  barn_manager: ["إدارة الحظائر", "جداول التغذية", "نقل الحيوانات"],
  accountant: ["قراءة التقارير المالية", "تصدير البيانات"],
  sales: ["إدارة المبيعات", "قراءة معلومات الحيوانات"],
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "barn_manager" as keyof typeof roleLabels,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const snapshot = await db.collection("users").get();
      const usersData = snapshot.docs.map((doc) => doc.data() as User);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const userDoc = {
        ...newUser,
        uid: `firebase_uid_${Date.now()}`,
        active: true,
        claimsSynced: false,
      };

      await db.collection("users").add(userDoc);
      setIsAddUserDialogOpen(false);
      setNewUser({ name: "", email: "", role: "barn_manager" });
      loadUsers();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean,
  ) => {
    try {
      await db.collection("users").doc(userId).update({
        active: !currentStatus,
      });
      loadUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      try {
        await db.collection("users").doc(userId).delete();
        loadUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users
    .filter(
      (user) =>
        user.name.includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((user) => roleFilter === "all" || user.role === roleFilter)
    .filter((user) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return user.active;
      if (statusFilter === "inactive") return !user.active;
      return true;
    });

  const activeUsers = users.filter((u) => u.active);
  const roleDistribution = Object.keys(roleLabels).map((role) => ({
    role: role as keyof typeof roleLabels,
    count: users.filter((u) => u.role === role).length,
    label: roleLabels[role as keyof typeof roleLabels],
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">
            إدارة مستخدمي النظام والصلاحيات
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 ml-2" />
            إعدادات الأدوار
          </Button>
          <Dialog
            open={isAddUserDialogOpen}
            onOpenChange={setIsAddUserDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                <DialogDescription>
                  إدخال بيانات المستخدم الجديد وتحديد الدور المناسب
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    الاسم
                  </Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    الدور
                  </Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser({
                        ...newUser,
                        role: value as keyof typeof roleLabels,
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddUser}>
                  إضافة المستخدم
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(users.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatArabicNumber(activeUsers.length)} نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              المستخدمين النشطين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatArabicNumber(activeUsers.length)}
            </div>
            <div className="flex items-center space-x-1 space-x-reverse text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>
                {Math.round(
                  (activeUsers.length / Math.max(1, users.length)) * 100,
                )}
                % من المجموع
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              الأدوار المختلفة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {formatArabicNumber(
                roleDistribution.filter((r) => r.count > 0).length,
              )}
            </div>
            <p className="text-xs text-muted-foreground">دور مختلف</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">حالات التنبيه</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 space-x-reverse">
              {users.filter((u) => !u.claimsSynced).length > 0 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatArabicNumber(
                        users.filter((u) => !u.claimsSynced).length,
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      يحتاج مزامنة
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <p className="text-xs text-muted-foreground">
                      لا توجد تنبيهات
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Shield className="h-5 w-5 text-farm-600" />
            <span>توزيع الأدوار</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {roleDistribution.map((role) => (
              <div
                key={role.role}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <div className="font-medium">{role.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {rolePermissions[role.role]?.slice(0, 2).join("، ")}
                    {rolePermissions[role.role]?.length > 2 && "..."}
                  </div>
                </div>
                <Badge variant="outline">
                  {formatArabicNumber(role.count)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:space-x-reverse">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>
            إجمالي {filteredUsers.length} مستخدم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">
                    البريد الإلكتروني
                  </TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">آخر تحديث</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabels[user.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <Badge
                          className={
                            user.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {user.active ? "نشط" : "غير نشط"}
                        </Badge>
                        {!user.claimsSynced && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-yellow-100 text-yellow-800"
                          >
                            يحتاج مزامنة
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatArabicDate(user.timestamps.createdAt)}
                    </TableCell>
                    <TableCell>
                      {formatArabicDate(user.timestamps.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleUserStatus(user.id, user.active)
                          }
                        >
                          {user.active ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Unlock className="h-3 w-3" />
                          )}
                        </Button>
                        {user.role !== "owner" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      لا توجد نتائج مطابقة للبحث
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Shield className="h-5 w-5 text-farm-600" />
            <span>مصفوفة الصلاحيات</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(roleLabels).map(([role, label]) => (
              <div key={role} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{label}</h4>
                  <Badge variant="outline">
                    {formatArabicNumber(
                      users.filter((u) => u.role === role).length,
                    )}{" "}
                    مستخدم
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rolePermissions[role as keyof typeof rolePermissions]?.map(
                    (permission, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {permission}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
