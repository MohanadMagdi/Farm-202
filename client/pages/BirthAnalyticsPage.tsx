import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import BirthAnalyticsCharts from '@/components/BirthAnalyticsCharts';
import BirthForecastTable from '@/components/BirthForecastTable';
import OffspringTable from '@/components/OffspringTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Baby, BarChart2, LineChart, Calendar, Search, RefreshCw, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { getBirthAnalytics } from '@/lib/advanced-analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import dataService from '@/lib/data-service-unified';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import type { BirthAnalytics } from '@/lib/advanced-analytics';
import type { Animal } from '@shared/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BirthAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<BirthAnalytics | null>(null);
  const [females, setFemales] = useState<Animal[]>([]);
  const [offspring, setOffspring] = useState<Animal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFemales, setFilteredFemales] = useState<Animal[]>([]);
  const [selectedFemaleId, setSelectedFemaleId] = useState<string | null>(null);
  const [selectedFemaleOffspring, setSelectedFemaleOffspring] = useState<Animal[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [data, animalsData] = await Promise.all([
          getBirthAnalytics(),
          dataService.getAnimals()
        ]);
        
        // فلترة الإناث البالغة
        const femalesList = animalsData.filter(animal => 
          animal.sex === 'female' && 
          animal.category === 'female'
        );
        
        // فلترة المواليد - تشمل جميع الفئات (مفطومين وغير مفطومين)
        const offspringList = animalsData.filter(animal => 
          animal.motherId && animal.motherId !== ""
        );
        
        setAnalyticsData(data);
        setFemales(femalesList);
        setOffspring(offspringList);
        setFilteredFemales(femalesList);
      } catch (error) {
        console.error('Failed to load birth analytics data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);
  
  // تحديث المواليد المختارة عند تغيير الأنثى المختارة
  useEffect(() => {
    if (!selectedFemaleId) {
      setSelectedFemaleOffspring([]);
      return;
    }
    
    // البحث عن الإناث المحددة
    const selectedFemale = females.find(f => f.id === selectedFemaleId);
    if (!selectedFemale) {
      setSelectedFemaleOffspring([]);
      return;
    }
    
    // البحث عن المواليد إما بالمعرف أو برقم الأذن
    const femaleOffspring = offspring.filter(animal => 
      animal.motherId === selectedFemaleId || 
      (selectedFemale.earTagId && animal.motherId === selectedFemale.earTagId)
    );
    
    console.log(`تم العثور على ${femaleOffspring.length} مولود للأنثى ${selectedFemale.earTagId} (${selectedFemaleId})`);
    setSelectedFemaleOffspring(femaleOffspring);
  }, [selectedFemaleId, offspring, females]);

  // البحث حسب الأم (رقم الأذن أو الاسم)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFemales(females);
      return;
    }

    const filtered = females.filter(female => 
      female.earTagId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredFemales(filtered);
  }, [searchQuery, females]);

  // تحديث البيانات
  const refreshData = async () => {
    try {
      setLoading(true);
      const data = await getBirthAnalytics();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to refresh birth analytics data:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
      <div className="space-y-6 pb-16" dir="rtl">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Baby className="h-8 w-8" />
                تحليلات الولادة والإنتاج
              </h1>
              <p className="text-muted-foreground">
                تحليل بيانات الولادة وإنتاجية الإناث في المزرعة
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              تحديث البيانات
            </Button>
          </div>
        </div>
        
        {/* إنذار في حالة وجود مشكلة في البيانات */}
        {analyticsData && analyticsData.femaleProductivity.some(f => !f.isInFemalesList) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              هناك {analyticsData.femaleProductivity.filter(f => !f.isInFemalesList).length} أنثى لها مواليد مسجلة في النظام ولكنها غير موجودة في قائمة الإناث البالغة. تأكد من تصحيح البيانات.
            </AlertDescription>
          </Alert>
        )}
        
        {/* واجهة البحث */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" dir="rtl">
          <div className="md:col-span-3 relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث حسب رقم الأذن أو الملاحظات..."
              className="pr-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
            <span>عدد الإناث البالغة:</span>
            <strong>{females.length}</strong>
          </div>
        </div>
        
        <Separator />
        
        {/* قسم عرض الإناث */}
        {filteredFemales.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3" dir="rtl">
            {filteredFemales.map(female => {
              // البحث عن بيانات الإنتاجية للأنثى من التحليلات
              const productivityData = analyticsData?.femaleProductivity.find(f => f.femaleId === female.id);
              
              return (
                <Card 
                  key={female.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedFemaleId === female.id ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setSelectedFemaleId(female.id === selectedFemaleId ? null : female.id)}
                >
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="font-medium">#{female.earTagId}</div>
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <Baby className="h-3.5 w-3.5" />
                        {productivityData ? productivityData.totalBirths : '0'} ولادات
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {productivityData?.totalOffspring || '0'} مولود
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* رسالة عند عدم وجود نتائج للبحث */}
        {searchQuery && filteredFemales.length === 0 && (
          <div className="text-center p-8 bg-muted/20 rounded-lg">
            <p>لا توجد إناث تطابق معايير البحث</p>
          </div>
        )}

        {/* تفاصيل الأنثى المختارة */}
        {selectedFemaleId && (
          <Card className="border-primary/40">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>تفاصيل الإنتاج للأنثى</CardTitle>
                <Link 
                  to={`/animals/females?id=${selectedFemaleId}`} 
                  className="text-sm text-primary flex items-center gap-1"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  الذهاب إلى صفحة الأنثى
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  {(() => {
                    const female = females.find(f => f.id === selectedFemaleId);
                    const productivityData = analyticsData?.femaleProductivity.find(f => f.femaleId === selectedFemaleId);
                    
                    if (!female || !productivityData) {
                      return (
                        <div className="text-center p-4">
                          <p className="text-muted-foreground">لا تتوفر بيانات كافية لهذه الأنثى</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">رقم الأذن</div>
                            <div className="bg-muted/50 p-2 rounded text-center">{female.earTagId}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">عدد الولادات</div>
                            <div className="bg-muted/50 p-2 rounded text-center">{productivityData.totalBirths}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">عدد المواليد</div>
                            <div className="bg-muted/50 p-2 rounded text-center">{productivityData.totalOffspring}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">معدل الإنتاجية</div>
                            <div className="bg-muted/50 p-2 rounded text-center">{productivityData.productivityRate}%</div>
                          </div>
                          
                          {productivityData.lastBirthDate && (
                            <div className="space-y-2 md:col-span-2">
                              <div className="text-sm font-medium">آخر ولادة</div>
                              <div className="bg-muted/50 p-2 rounded text-center">
                                {new Date(productivityData.lastBirthDate).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          )}
                          
                          {productivityData.nextExpectedBirth && (
                            <div className="space-y-2 md:col-span-2">
                              <div className="text-sm font-medium">الولادة المتوقعة القادمة</div>
                              <div className="bg-muted/50 p-2 rounded text-center">
                                {new Date(productivityData.nextExpectedBirth).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* المواليد */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">المواليد</h4>
                            <div className="text-sm text-muted-foreground">
                              إجمالي: {selectedFemaleOffspring.length}
                            </div>
                          </div>
                          
                          {selectedFemaleOffspring.length === 0 && productivityData.totalBirths > 0 && (
                            <Alert variant="destructive" className="mb-3">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                هذه الأنثى لها ولادات مسجلة ({productivityData.totalBirths} ولادات) لكن لا يمكن العثور على المواليد في النظام. قد يكون السبب أن المواليد تم نقلها أو تغيير الأم.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          <OffspringTable offspring={selectedFemaleOffspring} />
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="charts"  dir="rtl">
          <TabsList className="justify-end "  dir="rtl">
            <TabsTrigger value="charts" className="flex  items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              الرسوم البيانية
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              التوقعات المستقبلية
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              إحصائيات
            </TabsTrigger>
            {analyticsData && analyticsData.femaleProductivity.some(f => !f.isInFemalesList) && (
              <TabsTrigger value="issues" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                مشاكل البيانات
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="charts" className="space-y-6 pt-4"  dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>ملخص الإنتاجية</CardTitle>
                  <CardDescription>
                    نظرة عامة على إنتاجية الإناث في المزرعة
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {loading ? (
                    <Skeleton className="h-[150px] w-full" />
                  ) : (
                    <div className="grid grid-cols-2 gap-4" dir="rtl">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="text-sm font-medium">إجمالي الولادات</div>
                        <div className="text-2xl font-bold">{analyticsData?.totalBirths || 0}</div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="text-sm font-medium">إجمالي المواليد</div>
                        <div className="text-2xl font-bold">{analyticsData?.totalOffspring || 0}</div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="text-sm font-medium">متوسط المواليد لكل ولادة</div>
                        <div className="text-2xl font-bold">{analyticsData?.averageOffspringPerBirth.toFixed(1) || 0}</div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="text-sm font-medium">معدل الإنتاجية</div>
                        <div className="text-2xl font-bold">
                          {analyticsData?.expectedVsActualBirths.productivityPercentage || 0}٪
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>التوقعات المستقبلية</CardTitle>
                  <CardDescription>
                    توقعات الولادات في الأشهر القادمة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[150px] w-full" />
                  ) : analyticsData && analyticsData.femaleProductivity.some(f => f.nextExpectedBirth) ? (
                    <div className="space-y-4">
                      <div className="text-sm font-medium">الولادات المتوقعة في الأشهر القادمة:</div>
                      <div className="space-y-2">
                        {analyticsData.femaleProductivity
                          .filter(f => f.nextExpectedBirth)
                          .sort((a, b) => 
                            (a.nextExpectedBirth?.getTime() || 0) - (b.nextExpectedBirth?.getTime() || 0)
                          )
                          .slice(0, 5)
                          .map((female, index) => (
                            <div key={index} className="flex justify-between items-center border-b pb-2">
                              <span className="font-medium">الأنثى #{female.earTagId}</span>
                              <span className="text-sm">
                                {female.nextExpectedBirth?.toLocaleDateString("ar-EG", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric"
                                })}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                      <div className="text-xs text-muted-foreground mt-4">
                        * التوقعات تستند على دورة الولادة البالغة 8 أشهر تقريباً
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <p className="text-muted-foreground">
                        لا توجد توقعات للولادات القادمة في الوقت الحالي
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="overflow-hidden">
              <BirthAnalyticsCharts className="pt-4" />
            </div>
          </TabsContent>
          
          <TabsContent value="forecast" className="space-y-6 pt-4">
            <BirthForecastTable />
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>تفاصيل إحصائية</CardTitle>
                  <CardDescription>
                    تحليل مفصل لبيانات الولادات والإنتاجية
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : analyticsData ? (
                    <div className="space-y-4">
                      <div className="border-b pb-2">
                        <h3 className="font-medium">إحصاءات عامة</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2" dir="rtl">
                          <div className="text-sm">عدد الإناث البالغات:</div>
                          <div className="text-sm">{analyticsData.femaleProductivity.length}</div>
                          <div className="text-sm">إناث منتجة:</div>
                          <div className="text-sm">
                            {analyticsData.femaleProductivity.filter(f => f.totalBirths > 0).length}
                          </div>
                          <div className="text-sm">إجمالي عدد الولادات:</div>
                          <div className="text-sm">{analyticsData.totalBirths}</div>
                          <div className="text-sm">إجمالي المواليد:</div>
                          <div className="text-sm">{analyticsData.totalOffspring}</div>
                        </div>
                      </div>
                      <div className="border-b pb-2">
                        <h3 className="font-medium">كفاءة الإنتاج</h3>
                        <div className="grid grid-cols-2 gap-2 mt-2" dir="rtl">
                          <div className="text-sm">المتوقع سنوياً:</div>
                          <div className="text-sm">{analyticsData.expectedVsActualBirths.expectedAnnualBirths}</div>
                          <div className="text-sm">الفعلي سنوياً:</div>
                          <div className="text-sm">{analyticsData.expectedVsActualBirths.actualAnnualBirths}</div>
                          <div className="text-sm">معدل الإنتاجية:</div>
                          <div className="text-sm">{analyticsData.expectedVsActualBirths.productivityPercentage}٪</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <p className="text-muted-foreground">
                        لا توجد بيانات متاحة
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>أفضل الإناث إنتاجية</CardTitle>
                  <CardDescription>
                    الإناث ذات معدل الإنتاج الأعلى في المزرعة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : analyticsData && analyticsData.femaleProductivity.length > 0 ? (
                    <div className="space-y-3">
                      {analyticsData.femaleProductivity
                        .filter(female => female.totalBirths > 0)
                        .sort((a, b) => b.productivityRate - a.productivityRate)
                        .slice(0, 5)
                        .map((female, index) => (
                          <div key={index} className="flex items-center space-x-4 space-x-reverse">
                            <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">الأنثى #{female.earTagId}</div>
                              <div className="text-xs text-muted-foreground">
                                {female.totalOffspring} مولود من {female.totalBirths} ولادة
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{female.productivityRate}%</div>
                              <div className="text-xs text-muted-foreground">معدل الإنتاجية</div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <p className="text-muted-foreground">
                        لا توجد بيانات إنتاج متاحة
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* تبويب مشاكل البيانات */}
          <TabsContent value="issues" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>مشاكل البيانات</CardTitle>
                <CardDescription>
                  الإناث التي لديها مواليد مسجلة ولكنها غير موجودة في قائمة الإناث البالغة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : analyticsData && analyticsData.femaleProductivity.some(f => !f.isInFemalesList) ? (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        هذه المشكلة قد تحدث عندما يتم تسجيل مولود بأم معينة ولكن الأم غير موجودة في قائمة الإناث البالغة، أو تم تغيير حالتها أو فئتها.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="border rounded-md">
                      <Table dir="rtl">
                        <TableHeader>
                          <TableRow>
                            <TableHead>معرف الأم</TableHead>
                            <TableHead>رقم الأذن (مقدر)</TableHead>
                            <TableHead className="text-center">عدد الولادات</TableHead>
                            <TableHead className="text-center">عدد المواليد</TableHead>
                            <TableHead className="text-left">إجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analyticsData.femaleProductivity
                            .filter(female => !female.isInFemalesList)
                            .map((female, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono text-sm">{female.femaleId}</TableCell>
                                <TableCell>{female.earTagId}</TableCell>
                                <TableCell className="text-center">{female.totalBirths}</TableCell>
                                <TableCell className="text-center">{female.totalOffspring}</TableCell>
                                <TableCell>
                                  <Button size="sm" variant="ghost" asChild>
                                    <Link to={`/animals?filter=id:${female.femaleId}`}>
                                      بحث متقدم
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          }
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-10">
                    <p className="text-green-600">
                      لم يتم العثور على مشاكل في بيانات الولادات!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
