// Enhanced Males Management Page
// صفحة إدارة الذكور مع قواعد العمل الجديدة

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AnimalFormModal from "@/components/forms/AnimalFormModal";
import WeightRecordModal from "@/components/forms/WeightRecordModal";
import MaleLifecycleCard from "@/components/MaleLifecycleCard";
import { toast } from "@/hooks/use-toast";
import { dataService, farmHelpers } from "@/lib/data-service";
import { maleManagementService } from "@/lib/male-management-service";
import type { Animal } from "@shared/types";
import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Scale,
  Calendar,
  DollarSign,
  Filter,
  Users
} from "lucide-react";

export default function EnhancedMalesPage() {
  const [males, setMales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMale, setSelectedMale] = useState<Animal | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [showLifecycleCard, setShowLifecycleCard] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalMales: 0,
    readyForSale: 0,
    needingAttention: 0,
    averageWeight: 0,
    averageAge: 0,
    totalValue: 0,
    expectedProfit: 0
  });

  useEffect(() => {
    loadMales();
  }, []);

  const loadMales = async () => {
    try {
      setLoading(true);
      const animalsData = await dataService.animals.getByCategory("male");
      setMales(animalsData);
      calculateAnalytics(animalsData);
    } catch (error) {
      console.error("Error loading males:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات الذكور",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (malesData: Animal[]) => {
    const totalMales = malesData.length;
    const readyForSale = maleManagementService.getMalesReadyForSale(malesData).length;
    const needingAttention = maleManagementService.getMalesNeedingAttention(malesData).length;
    const averageWeight = totalMales > 0 ? 
      malesData.reduce((sum, male) => sum + male.weight, 0) / totalMales : 0;
    const averageAge = totalMales > 0 ? 
      malesData.reduce((sum, male) => sum + (male.ageMonths || 0), 0) / totalMales : 0;
    const totalValue = malesData.reduce((sum, male) => sum + (male.currentPrice || male.purchasePrice || 0), 0);
    
    // Calculate expected profit
    const expectedProfit = malesData.reduce((sum, male) => {
      const profit = maleManagementService.calculateExpectedProfit(male);
      return sum + profit.profit;
    }, 0);

    setAnalytics({
      totalMales,
      readyForSale,
      needingAttention,
      averageWeight,
      averageAge,
      totalValue,
      expectedProfit
    });
  };

  const handleSaleReady = (male: Animal) => {
    toast({
      title: "ذكر جاهز للبيع",
      description: `الذكر ${male.earTagId} جاهز للبيع. الوزن: ${male.weight} كج`,
    });
    // Here you could open a sale preparation modal
  };

  const handleSave = async () => {
    await loadMales();
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم تحديث بيانات الذكر بنجاح",
    });
  };

  // Get filtered males based on search and status
  const getFilteredMales = () => {
    let filtered = males.filter(male =>
      male.earTagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (male.supplier && male.supplier.includes(searchTerm))
    );

    if (statusFilter === "ready") {
      filtered = maleManagementService.getMalesReadyForSale(filtered);
    } else if (statusFilter === "attention") {
      const needingAttention = maleManagementService.getMalesNeedingAttention(filtered);
      filtered = needingAttention.map(item => item.animal);
    } else if (statusFilter === "early") {
      filtered = filtered.filter(male => {
        const cycleInfo = maleManagementService.getFarmCycleInfo(male);
        return cycleInfo.cycleStatus === "early";
      });
    } else if (statusFilter === "overdue") {
      filtered = filtered.filter(male => {
        const cycleInfo = maleManagementService.getFarmCycleInfo(male);
        return cycleInfo.cycleStatus === "overdue";
      });
    }

    return filtered;
  };

  const readyMales = maleManagementService.getMalesReadyForSale(males);
  const malesNeedingAttention = maleManagementService.getMalesNeedingAttention(males);
  const filteredMales = getFilteredMales();

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-farm-800">إدارة الذكور المحسنة</h1>
          <p className="text-muted-foreground">
            إدارة الذكور مع قواعد العمل: وزن الشراء 18+ كج، وزن البيع 60 كج حد أقصى، دورة 4-5 شهور
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة ذكر جديد
        </Button>
      </div>

      {/* Business Rules Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>قواعد الذكور:</strong> وزن الشراء الأدنى 18 كج | وزن البيع الأقصى 60 كج | دورة التربية 4-5 شهور
        </AlertDescription>
      </Alert>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              إجمالي الذكور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-farm-800">
              {analytics.totalMales}
            </div>
            <div className="text-xs text-muted-foreground">
              متوسط العمر: {analytics.averageAge.toFixed(1)} شهر
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              جاهز للبيع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.readyForSale}
            </div>
            <div className="text-xs text-muted-foreground">
              {analytics.totalMales > 0 ? 
                `${((analytics.readyForSale / analytics.totalMales) * 100).toFixed(1)}% من المجموع` : 
                '0% من المجموع'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              يحتاج انتباه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.needingAttention}
            </div>
            <div className="text-xs text-muted-foreground">
              وزن زائد أو دورة متأخرة
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              الربح المتوقع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {farmHelpers.formatCurrency(analytics.expectedProfit)}
            </div>
            <div className="text-xs text-muted-foreground">
              من جميع الذكور
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {(readyMales.length > 0 || malesNeedingAttention.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {readyMales.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="flex items-center justify-between">
                    <span>لديك {readyMales.length} ذكر جاهز للبيع</span>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      عرض الجاهزين للبيع
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {malesNeedingAttention.length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="flex items-center justify-between">
                    <span>لديك {malesNeedingAttention.length} ذكر يحتاج انتباه</span>
                    <Button size="sm" variant="outline" className="border-orange-300">
                      عرض التفاصيل
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:space-x-reverse">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث برقم الأذن أو المورد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="حالة الذكر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الذكور</SelectItem>
                <SelectItem value="ready">جاهز للبيع</SelectItem>
                <SelectItem value="attention">يحتاج انتباه</SelectItem>
                <SelectItem value="early">مبكر (أقل من 4 شهور)</SelectItem>
                <SelectItem value="overdue">متأخر (أكثر من 5 شهور)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Males Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">قائمة الذكور</TabsTrigger>
          <TabsTrigger value="lifecycle">دورة الحياة</TabsTrigger>
          <TabsTrigger value="ready">جاهز للبيع ({readyMales.length})</TabsTrigger>
          <TabsTrigger value="attention">يحتاج انتباه ({malesNeedingAttention.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>قائمة الذكور ({filteredMales.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMales.map((male) => {
                  const cycleInfo = maleManagementService.getFarmCycleInfo(male);
                  const validation = maleManagementService.validateSale(male);
                  const formattedInfo = maleManagementService.formatCycleInfo(cycleInfo);

                  return (
                    <div key={male.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="font-mono">
                          {male.earTagId}
                        </Badge>
                        <div>
                          <div className="font-medium">
                            {farmHelpers.formatWeight(male.weight)} | {male.ageMonths || 0} شهر
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formattedInfo.timeInFarmLabel} | {formattedInfo.weightGainLabel}
                          </div>
                        </div>
                        <Badge className={formattedInfo.statusColor}>
                          {formattedInfo.statusLabel}
                        </Badge>
                        {cycleInfo.isReadyForSale && validation.errors.length === 0 && (
                          <Badge className="bg-green-100 text-green-800">جاهز للبيع</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMale(male);
                            setShowLifecycleCard(true);
                          }}
                        >
                          دورة الحياة
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMale(male);
                            setIsWeightModalOpen(true);
                          }}
                        >
                          <Scale className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle">
          {selectedMale && (
            <MaleLifecycleCard
              animal={selectedMale}
              onSaleReady={handleSaleReady}
              showProfitAnalysis={true}
              currentMarketPrice={80} // Example market price per kg
            />
          )}
          {!selectedMale && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">اختر ذكراً من القائمة لعرض دورة حياته</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ready">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                الذكور الجاهزة للبيع ({readyMales.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {readyMales.map((male) => (
                  <MaleLifecycleCard
                    key={male.id}
                    animal={male}
                    onSaleReady={handleSaleReady}
                    showProfitAnalysis={true}
                    currentMarketPrice={80}
                  />
                ))}
                {readyMales.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد ذكور جاهزة للبيع حالياً
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attention">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                الذكور التي تحتاج انتباه ({malesNeedingAttention.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {malesNeedingAttention.map(({ animal, reasons }) => (
                  <div key={animal.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="font-mono">
                        {animal.earTagId}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {farmHelpers.formatWeight(animal.weight)} | {animal.ageMonths || 0} شهر
                      </div>
                    </div>
                    <div className="space-y-1">
                      {reasons.map((reason, index) => (
                        <div key={index} className="text-sm text-orange-600 flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {malesNeedingAttention.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    جميع الذكور في حالة جيدة
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AnimalFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSave}
        mode="add"
        animalType="male"
      />

      <AnimalFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMale(null);
        }}
        onSave={handleSave}
        animal={selectedMale}
        mode="edit"
        animalType="male"
      />

      <WeightRecordModal
        isOpen={isWeightModalOpen}
        onClose={() => {
          setIsWeightModalOpen(false);
          setSelectedMale(null);
        }}
        onSave={handleSave}
        preselectedAnimalId={selectedMale?.id}
      />
    </div>
  );
}
