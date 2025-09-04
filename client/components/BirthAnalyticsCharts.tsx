import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getBirthChartData } from '@/lib/advanced-analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer } from '@/components/ui/chart';

interface ChartProps {
  className?: string;
}

export function BirthAnalyticsCharts({ className }: ChartProps) {
  const [loading, setLoading] = useState(true);
  const [chartDimensions, setChartDimensions] = useState({
    width: 600,
    height: 280,
  });
  const [chartData, setChartData] = useState<{
    monthlyBirthsChart: Array<{ name: string; births: number; offspring: number }>;
    femaleProductivityChart: Array<{ earTagId: string; births: number; productivity: number }>;
    birthTrendChart: Array<{ month: string; births: number; cumulativeBirths: number; productivityRate: number }>;
  }>({
    monthlyBirthsChart: [],
    femaleProductivityChart: [],
    birthTrendChart: [],
  });
  
  // Add a resize handler to update chart dimensions
  useEffect(() => {
    const handleResize = () => {
      // Set chart width based on container width
      const containerWidth = Math.min(
        document.documentElement.clientWidth * 0.8, // استخدم 80% من عرض الشاشة
        600 // أقصى عرض 600 بكسل
      );
      setChartDimensions({
        width: containerWidth,
        height: 250, // قلل الارتفاع إلى 250 بكسل
      });
    };
    
    // Initial sizing
    handleResize();
    
    // Listen for window resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadChartData() {
      try {
        const data = await getBirthChartData();
        setChartData(data);
      } catch (error) {
        console.error('Failed to load birth chart data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadChartData();
  }, []);

  const chartConfig = {
    births: {
      label: 'الولادات',
      color: '#8884d8',
    },
    offspring: {
      label: 'المواليد',
      color: '#82ca9d',
    },
    productivity: {
      label: 'معدل الإنتاجية',
      color: '#ffc658',
    },
    cumulativeBirths: {
      label: 'إجمالي الولادات',
      color: '#ff8042',
    },
  };

  return (
    <div className={className} dir="rtl">
      {/* شهريًا الولادات */}
      <Card className="mb-6" dir="rtl">
        <CardHeader>
          <CardTitle>الولادات الشهرية</CardTitle>
          <CardDescription>عدد الولادات والمواليد خلال الـ 12 شهرًا الماضية</CardDescription>
        </CardHeader>
        <CardContent style={{ height: '280px', overflow: 'hidden' }}>
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ChartContainer config={chartConfig}>
                <BarChart 
                  data={chartData.monthlyBirthsChart} 
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  width={chartDimensions.width}
                  height={chartDimensions.height}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                    width={40}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="births" name="الولادات" fill="var(--color-births)" />
                  <Bar dataKey="offspring" name="المواليد" fill="var(--color-offspring)" />
                </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* إنتاجية الإناث */}
      <Card className="mb-6" dir="rtl">
        <CardHeader>
          <CardTitle>إنتاجية الإناث</CardTitle>
          <CardDescription>أعلى 10 إناث من حيث الإنتاجية</CardDescription>
        </CardHeader>
        <CardContent style={{ height: '280px', overflow: 'hidden' }}>
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ChartContainer config={chartConfig}>
                <BarChart 
                  data={chartData.femaleProductivityChart}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  width={chartDimensions.width}
                  height={chartDimensions.height}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    dataKey="earTagId" 
                    type="category" 
                    width={60}
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="births" name="عدد الولادات" fill="var(--color-births)" />
                  <Bar dataKey="productivity" name="معدل الإنتاجية %" fill="var(--color-productivity)" />
                </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* اتجاهات الولادة */}
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>اتجاهات الولادة</CardTitle>
          <CardDescription>اتجاهات الولادة خلال الـ 12 شهرًا الماضية</CardDescription>
        </CardHeader>
        <CardContent style={{ height: '280px', overflow: 'hidden' }}>
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ChartContainer config={chartConfig}>
                <LineChart 
                  data={chartData.birthTrendChart}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  width={chartDimensions.width}
                  height={chartDimensions.height}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                    width={40}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                    width={40}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="births"
                    name="الولادات الشهرية"
                    stroke="var(--color-births)"
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="cumulativeBirths"
                    name="إجمالي الولادات"
                    stroke="var(--color-cumulativeBirths)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="productivityRate"
                    name="معدل الإنتاجية %"
                    stroke="var(--color-productivity)"
                    strokeWidth={2}
                  />
                </LineChart>
            </ChartContainer>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          معدل الإنتاجية يقيس النسبة المئوية للولادات الفعلية مقارنة بالمتوقعة.
        </CardFooter>
      </Card>
    </div>
  );
}

export default BirthAnalyticsCharts;
