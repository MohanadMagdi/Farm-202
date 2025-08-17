import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { FeedEfficiencyRecord, WeightRecord, Animal } from "@/../../shared/types";
import { formatDate, formatDateRange } from "@/lib/utils";

interface BarnEfficiencyDataProps {
  feedEfficiencyRecords: FeedEfficiencyRecord[];
  weightRecords: WeightRecord[];
  animals: Animal[];
}

export function BarnEfficiencyData({
  feedEfficiencyRecords,
  weightRecords,
  animals,
}: BarnEfficiencyDataProps) {
  // Sort records by date (most recent first)
  const sortedRecords = [...feedEfficiencyRecords].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  // Calculate overall average efficiency
  const avgEfficiency = sortedRecords.length > 0
    ? sortedRecords.reduce((sum, record) => sum + record.feedEfficiencyRatio, 0) / sortedRecords.length
    : 0;

  // Calculate overall average daily gain
  const avgDailyGain = sortedRecords.length > 0
    ? sortedRecords.reduce((sum, record) => sum + record.dailyGain, 0) / sortedRecords.length
    : 0;

  // Prepare chart data
  const chartData = sortedRecords.map((record) => ({
    period: formatDateRange(new Date(record.startDate), new Date(record.endDate)),
    dailyGain: record.dailyGain,
    feedEfficiency: record.feedEfficiencyRatio,
    feedPerDay: record.feedPerDay,
  })).reverse(); // Reverse to show oldest to newest

  // Determine if efficiency is improving or declining
  const isEfficiencyImproving = sortedRecords.length >= 2 
    ? sortedRecords[0].feedEfficiencyRatio < sortedRecords[1].feedEfficiencyRatio
    : false;

  // Determine if daily gain is improving or declining
  const isDailyGainImproving = sortedRecords.length >= 2 
    ? sortedRecords[0].dailyGain > sortedRecords[1].dailyGain
    : false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>كفاءة التغذية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">معامل كفاءة التغذية</div>
              <div className="text-2xl font-bold mt-1">
                {avgEfficiency ? avgEfficiency.toFixed(2) : "لا يوجد"} كج علف/كج وزن
              </div>
              <div className="flex items-center text-xs mt-1">
                {avgEfficiency ? (
                  isEfficiencyImproving ? (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-green-500 ml-1" />
                      <span className="text-green-500">تحسن في الكفاءة</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-red-500 ml-1" />
                      <span className="text-red-500">تراجع في الكفاءة</span>
                    </>
                  )
                ) : (
                  <>
                    <Minus className="h-3 w-3 text-muted-foreground ml-1" />
                    <span className="text-muted-foreground">بيانات غير كافية</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">متوسط الزيادة اليومية</div>
              <div className="text-2xl font-bold mt-1">
                {avgDailyGain ? avgDailyGain.toFixed(2) : "لا يوجد"} كج/يوم
              </div>
              <div className="flex items-center text-xs mt-1">
                {avgDailyGain ? (
                  isDailyGainImproving ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-green-500 ml-1" />
                      <span className="text-green-500">تحسن في معدل النمو</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-500 ml-1" />
                      <span className="text-red-500">تراجع في معدل النمو</span>
                    </>
                  )
                ) : (
                  <>
                    <Minus className="h-3 w-3 text-muted-foreground ml-1" />
                    <span className="text-muted-foreground">بيانات غير كافية</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">فترات القياس</div>
              <div className="text-2xl font-bold mt-1">{sortedRecords.length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {sortedRecords.length > 0 
                  ? `آخر قياس: ${formatDate(new Date(sortedRecords[0].endDate))}`
                  : "لا توجد قياسات"
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>رسم بياني للكفاءة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="dailyGain"
                  name="الزيادة اليومية (كج)"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="feedEfficiency"
                  name="معامل الكفاءة"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>سجل قياسات الكفاءة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>الفترة</TableCell>
                <TableCell>الوزن البدائي</TableCell>
                <TableCell>الوزن النهائي</TableCell>
                <TableCell>زيادة الوزن</TableCell>
                <TableCell>أيام القياس</TableCell>
                <TableCell>الزيادة اليومية</TableCell>
                <TableCell>إجمالي العلف</TableCell>
                <TableCell>معامل الكفاءة</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {formatDateRange(new Date(record.startDate), new Date(record.endDate))}
                  </TableCell>
                  <TableCell>{record.startWeight.toFixed(1)} كج</TableCell>
                  <TableCell>{record.endWeight.toFixed(1)} كج</TableCell>
                  <TableCell>{record.weightGain.toFixed(1)} كج</TableCell>
                  <TableCell>{record.daysCount} يوم</TableCell>
                  <TableCell>{record.dailyGain.toFixed(2)} كج/يوم</TableCell>
                  <TableCell>{record.totalFeedConsumed.toFixed(1)} كج</TableCell>
                  <TableCell>{record.feedEfficiencyRatio.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {sortedRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    لا توجد سجلات قياسات كفاءة
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
