import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getFutureBirthForecast } from '@/lib/advanced-analytics';
import { Calendar, Baby } from 'lucide-react';

interface BirthForecastTableProps {
  className?: string;
}

export function BirthForecastTable({ className }: BirthForecastTableProps) {
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<Array<{
    month: Date;
    expectedBirths: number;
    expectedOffspring: number;
    femalesGivingBirth: string[];
  }>>([]);

  useEffect(() => {
    async function loadForecastData() {
      try {
        const data = await getFutureBirthForecast();
        setForecastData(data);
      } catch (error) {
        console.error('Failed to load birth forecast data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadForecastData();
  }, []);

  const totalExpectedBirths = forecastData.reduce((sum, month) => sum + month.expectedBirths, 0);
  const totalExpectedOffspring = forecastData.reduce((sum, month) => sum + month.expectedOffspring, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              توقعات الولادة المستقبلية
            </CardTitle>
            <CardDescription>
              التوقعات للولادات خلال الـ 12 شهرًا القادمة
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">إجمالي الولادات المتوقعة: {totalExpectedBirths}</div>
            <div className="text-xs text-muted-foreground">إجمالي المواليد المتوقعة: {totalExpectedOffspring}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : forecastData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table dir="rtl">
              <TableHeader>
                <TableRow>
                  <TableHead>الشهر</TableHead>
                  <TableHead className="text-center">الولادات المتوقعة</TableHead>
                  <TableHead className="text-center">المواليد المتوقعة</TableHead>
                  <TableHead>الإناث المتوقع ولادتها</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastData.map((month, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                    <TableCell className="font-medium">
                      {month.month.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-center">{month.expectedBirths}</TableCell>
                    <TableCell className="text-center">{month.expectedOffspring}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {month.femalesGivingBirth.length > 0 ? (
                          month.femalesGivingBirth.map((earTagId, i) => (
                            <Badge key={i} variant="outline" className="flex items-center gap-1">
                              <Baby className="h-3 w-3" />
                              {earTagId}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">لا توجد ولادات متوقعة</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-10">
            <p className="text-muted-foreground">
              لا توجد توقعات مستقبلية للولادات في الوقت الحالي
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BirthForecastTable;
