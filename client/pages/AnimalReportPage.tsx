import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { dataService, farmHelpers } from "@/lib/data-service";
import type { Animal, Barn } from "@shared/types";
import { Users, Heart, Scale, AlertTriangle, Baby } from "lucide-react";

export default function AnimalReportPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dataService.animals.getAll(),
      dataService.barns.getAll(),
    ]).then(([animalsData, barnsData]) => {
      setAnimals(animalsData);
      setBarns(barnsData);
      setLoading(false);
    });
  }, []);

  const getBarnName = (barnId: string) => {
    const barn = barns.find(b => b.id === barnId);
    return barn ? barn.name : barnId;
  };

  if (loading) {
    return <div className="text-center py-12">جاري تحميل التقرير...</div>;
  }

  // إحصائيات عامة
  const totalAnimals = animals.length;
  const maleCount = animals.filter(a => a.category === "male").length;
  const femaleCount = animals.filter(a => a.category === "female").length;
  const newbornCount = animals.filter(a => a.category === "newborn").length;
  const healthyCount = animals.filter(a => ["سليم", "سليمة", "healthy"].includes(a.healthStatus)).length;
  const sickCount = totalAnimals - healthyCount;
  const isolatedCount = animals.filter(a => a.isIsolated).length;
  const pregnantCount = animals.filter(a => a.isPregnant).length;
  const averageWeight = totalAnimals > 0 ? (animals.reduce((sum, a) => sum + a.weight, 0) / totalAnimals).toFixed(1) : 0;

  return (
    <div className="space-y-8 p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-farm-800">تقرير مفصل للحيوانات</h1>
        <p className="text-muted-foreground">جميع الإحصائيات والتوزيعات الخاصة بالحيوانات في المزرعة</p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" />إجمالي الحيوانات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnimals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-green-600" />سليمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" />مريضة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sickCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Baby className="h-5 w-5 text-yellow-600" />صغار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{newbornCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-purple-600" />متوسط الوزن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{averageWeight} كج</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-pink-600" />حوامل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{pregnantCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* توزيع الحيوانات على الحظائر */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">توزيع الحيوانات على الحظائر</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>اسم الحظيرة</TableCell>
                <TableCell>إجمالي الحيوانات</TableCell>
                <TableCell>ذكور</TableCell>
                <TableCell>إناث</TableCell>
                <TableCell>صغار</TableCell>
                <TableCell>سليمة</TableCell>
                <TableCell>مريضة</TableCell>
                <TableCell>في العزل</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barns.map(barn => {
                const barnAnimals = animals.filter(a => a.barnId === barn.id);
                const males = barnAnimals.filter(a => a.category === "male").length;
                const females = barnAnimals.filter(a => a.category === "female").length;
                const newborns = barnAnimals.filter(a => a.category === "newborn").length;
                const healthy = barnAnimals.filter(a => ["سليم", "سليمة", "healthy"].includes(a.healthStatus)).length;
                const sick = barnAnimals.length - healthy;
                const isolated = barnAnimals.filter(a => a.isIsolated).length;
                return (
                  <TableRow key={barn.id}>
                    <TableCell>{barn.name}</TableCell>
                    <TableCell>{barnAnimals.length}</TableCell>
                    <TableCell>{males}</TableCell>
                    <TableCell>{females}</TableCell>
                    <TableCell>{newborns}</TableCell>
                    <TableCell>{healthy}</TableCell>
                    <TableCell>{sick}</TableCell>
                    <TableCell>{isolated}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* قائمة الحيوانات التفصيلية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">قائمة الحيوانات التفصيلية</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>رقم الحلقه</TableCell>
                <TableCell>الحظيرة</TableCell>
                <TableCell>النوع</TableCell>
                <TableCell>الوزن</TableCell>
                <TableCell>الحالة الصحية</TableCell>
                <TableCell>في العزل</TableCell>
                <TableCell>حامل</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {animals.map(animal => (
                <TableRow key={animal.id}>
                  <TableCell>{animal.earTagId}</TableCell>
                  <TableCell>{getBarnName(animal.barnId)}</TableCell>
                  <TableCell>{animal.category === "male" ? "ذكر" : animal.category === "female" ? "أنثى" : "صغير"}</TableCell>
                  <TableCell>{animal.weight} كج</TableCell>
                  <TableCell>{animal.healthStatus}</TableCell>
                  <TableCell>{animal.isIsolated ? <Badge variant="destructive">نعم</Badge> : "لا"}</TableCell>
                  <TableCell>{animal.isPregnant ? <Badge variant="outline">نعم</Badge> : "لا"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
