import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from "recharts";
import type { FeedConsumptionRecord, FeedingRecord } from "@/../../shared/types";
import { farmHelpers } from "@/lib/data-service";
import { formatDate } from "@/lib/utils";

interface BarnFeedingDataProps {
  barnId: string;
  feedConsumptionRecords: FeedConsumptionRecord[];
  feedingRecords: FeedingRecord[];
  animalCount: number;
}

export function BarnFeedingData({ 
  barnId, 
  feedConsumptionRecords, 
  feedingRecords, 
  animalCount 
}: BarnFeedingDataProps) {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");
  
  // Get recent feeding records sorted by date (most recent first)
  const recentFeedingRecords = [...feedConsumptionRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 14); // Last 14 days
  
  // Calculate average daily feed consumption per animal
  const avgDailyConsumption = recentFeedingRecords.length > 0 
    ? recentFeedingRecords.reduce((sum, record) => sum + record.consumptionPerAnimal, 0) / recentFeedingRecords.length
    : 0;
  
  // Calculate total feed issued in the last 30 days
  const last30DaysConsumption = feedConsumptionRecords
    .filter(record => {
      const recordDate = new Date(record.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return recordDate >= thirtyDaysAgo;
    })
    .reduce((sum, record) => sum + record.quantityKg, 0);

  // Prepare data for charts
  const chartData = recentFeedingRecords.map(record => ({
    date: formatDate(new Date(record.date)),
    totalFeed: record.quantityKg,
    perAnimal: record.consumptionPerAnimal,
  })).reverse(); // Reverse to show oldest to newest
  
  // Get feed types
  const feedTypes = [...new Set(feedConsumptionRecords.map(record => record.feedType))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ملخص استهلاك الأعلاف</CardTitle>
          <CardDescription>
            بيانات استهلاك الأعلاف في الحظيرة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">متوسط الاستهلاك اليومي للحيوان</div>
              <div className="text-2xl font-bold mt-1">{avgDailyConsumption.toFixed(2)} كج</div>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">إجمالي الاستهلاك (آخر 30 يوم)</div>
              <div className="text-2xl font-bold mt-1">{last30DaysConsumption.toFixed(1)} كج</div>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">أنواع الأعلاف المستخدمة</div>
              <div className="text-2xl font-bold mt-1">{feedTypes.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {feedTypes.join(', ')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تحليل استهلاك العلف</CardTitle>
          <Tabs defaultValue="daily" onValueChange={(value) => setTimeframe(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">يومي</TabsTrigger>
              <TabsTrigger value="weekly">أسبوعي</TabsTrigger>
              <TabsTrigger value="monthly">شهري</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalFeed"
                  name="إجمالي العلف (كج)"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="perAnimal"
                  name="لكل حيوان (كج)"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد بيانات استهلاك كافية لعرض الرسم البياني
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل استهلاك الأعلاف</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>التاريخ</TableCell>
                <TableCell>نوع العلف</TableCell>
                <TableCell>الكمية (كج)</TableCell>
                <TableCell>عدد الحيوانات</TableCell>
                <TableCell>كمية لكل حيوان</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentFeedingRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(new Date(record.date))}</TableCell>
                  <TableCell>{record.feedType}</TableCell>
                  <TableCell>{record.quantityKg.toFixed(1)} كج</TableCell>
                  <TableCell>{record.animalCount}</TableCell>
                  <TableCell>{record.consumptionPerAnimal.toFixed(2)} كج</TableCell>
                </TableRow>
              ))}
              {recentFeedingRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    لا توجد سجلات استهلاك أعلاف
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
