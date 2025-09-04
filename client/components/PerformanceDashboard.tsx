import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Users, BarChart3, Building2, AlertTriangle, TrendingUp, Utensils, Scale, DollarSign, CircleDollarSign } from 'lucide-react';
import { AnimalCategory, Animal, WeightRecord, FeedingRecord, Barn } from '../../shared/types';
import { 
  calculateAnimalPerformanceMetrics, 
  FeedEfficiencyResult, 
  AnimalPerformanceMetrics 
} from '../lib/animal-performance-analytics';
import { syncAllAnimalWeights } from '../lib/weights-service';
import { weightEvents } from '../lib/weight-events';
import { 
  calculateAnimalCostBreakdown, 
  calculateGroupCostBreakdown, 
  AnimalCostBreakdown 
} from '../lib/animal-pricing-calculator';
import dataService from '../lib/data-service-unified';

interface AnimalPerformanceDashboardProps {
  animalType: AnimalCategory | 'all';
}

function AnimalPerformanceDashboard({ animalType }: AnimalPerformanceDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTypeData, setCurrentTypeData] = useState<FeedEfficiencyResult | null>(null);
  const [allAnimalsData, setAllAnimalsData] = useState<FeedEfficiencyResult | null>(null);
  const [malesData, setMalesData] = useState<FeedEfficiencyResult | null>(null);
  const [femalesData, setFemalesData] = useState<FeedEfficiencyResult | null>(null);
  const [newbornsData, setNewbornsData] = useState<FeedEfficiencyResult | null>(null);
  // Add filtered data for purchased vs internal production
  const [malesPurchasedData, setMalesPurchasedData] = useState<FeedEfficiencyResult | null>(null);
  const [malesInternalData, setMalesInternalData] = useState<FeedEfficiencyResult | null>(null);
  const [femalesPurchasedData, setFemalesPurchasedData] = useState<FeedEfficiencyResult | null>(null);
  const [femalesInternalData, setFemalesInternalData] = useState<FeedEfficiencyResult | null>(null);
  const [barnPerformance, setBarnPerformance] = useState<Record<string, FeedEfficiencyResult>>({});
  const [barns, setBarns] = useState<Barn[]>([]);
  const [currentTypeCosts, setCurrentTypeCosts] = useState<AnimalCostBreakdown[]>([]);
  const [allAnimalsCosts, setAllAnimalsCosts] = useState<AnimalCostBreakdown[]>([]);
  // Filter state for males and females tabs
  const [malesFilter, setMalesFilter] = useState<'all' | 'purchased' | 'internal'>('all');
  const [femalesFilter, setFemalesFilter] = useState<'all' | 'purchased' | 'internal'>('all');
  
  console.log('🚀 PerformanceDashboard component initialized for animalType:', animalType);
  console.log('🔍 Component state:', {
    loading,
    currentTypeDataExists: !!currentTypeData,
    allAnimalsDataExists: !!allAnimalsData,
    malesDataExists: !!malesData,
    femalesDataExists: !!femalesData,
    newbornsDataExists: !!newbornsData
  });

  // Calculate feed efficiency for a group of animals
  const calculateFeedEfficiency = (
    animals: Animal[],
    weightRecords: WeightRecord[],
    feedingRecords: FeedingRecord[],
    periodDays: number = 30
  ): FeedEfficiencyResult => {
    return calculateAnimalPerformanceMetrics(animals, weightRecords, feedingRecords, periodDays);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // First, sync all animal weights with latest weight records
      await syncAllAnimalWeights();
      
      const [animalsData, weightsData, feedingData, barnsData] = await Promise.all([
        dataService.getAnimals(),
        dataService.getWeightRecords(),
        dataService.getFeedingRecords(),
        dataService.getBarns()
      ]);

      console.log('📊 Performance Dashboard Data Loaded:', {
        animals: animalsData.length,
        weights: weightsData.length,
        feeding: feedingData.length,
        animalType,
        detailedWeights: weightsData.map(w => ({
          id: w.id,
          animalId: w.animalId,
          weight: w.weight,
          date: typeof w.date === 'string' ? w.date : w.date.toISOString().split('T')[0]
        })),
        detailedAnimals: animalsData.map(a => ({
          id: a.id,
          earTagId: a.earTagId,
          category: a.category,
          currentWeight: a.weight,
          birthDate: a.birthDate?.toISOString()?.split('T')[0],
          purchaseDate: a.purchaseDate?.toISOString()?.split('T')[0]
        }))
      });

      // Ensure dates are properly formatted
      const processedWeightsData = weightsData.map(record => ({
        ...record,
        date: record.date instanceof Date ? record.date : new Date(record.date)
      }));
      
      const processedFeedingData = feedingData.map(record => ({
        ...record,
        date: record.date instanceof Date ? record.date : new Date(record.date)
      }));

      setBarns(barnsData);

      // Filter animals by type for current type performance
      const filteredAnimals = animalType === 'all' 
        ? animalsData // Si es 'all', no filtramos
        : animalsData.filter(animal => animal.category === animalType);
      
      console.log(`🔍 Filtering animals for type '${animalType}':`, {
        totalAnimals: animalsData.length,
        animalCategories: animalsData.map(a => a.category),
        filteredCount: filteredAnimals.length,
        filteredAnimals: filteredAnimals.map(a => ({ id: a.id, earTagId: a.earTagId, category: a.category }))
      });

      // Calculate performance for current type
      const typePerformance = calculateFeedEfficiency(filteredAnimals, processedWeightsData, processedFeedingData);
      console.log('📊 Type performance calculation completed:', {
        animalType,
        inputAnimals: filteredAnimals.length,
        inputWeights: processedWeightsData.length,
        resultExists: !!typePerformance,
        animalPerformanceLength: typePerformance?.animalPerformance?.length || 0,
        samplePerformanceData: typePerformance?.animalPerformance?.slice(0, 3).map(ap => ({
          earTagId: ap.earTagId,
          initialWeight: ap.initialWeight,
          currentWeight: ap.currentWeight,
          daysInMeasurement: ap.daysInMeasurement,
          avgDailyGain: ap.avgDailyGain
        }))
      });
      
      // Add a simple test case if no data
      if (!typePerformance || typePerformance.animalPerformance.length === 0) {
        console.log('Creating test performance data...');
        const testPerformance: FeedEfficiencyResult = {
          animalPerformance: [{
            animalId: 'test',
            earTagId: 'TEST001',
            initialWeight: 50,
            currentWeight: 75,
            weightGain: 25,
            daysInMeasurement: 30,
            avgDailyGain: 0.83,
            estimatedFeedConsumption: 120,
            actualFeedConsumption: 130,
            feedEfficiencyRatio: 5.2
          }],
          totalFeedConsumption: 500,
          averageDailyGain: 0.83,
          overallFeedEfficiency: 20
        };
        setCurrentTypeData(testPerformance);
      } else {
        setCurrentTypeData(typePerformance);
      }
      
      // Calculate cost breakdown for current type
      const typeCosts = calculateGroupCostBreakdown(filteredAnimals, processedWeightsData, processedFeedingData);
      setCurrentTypeCosts(typeCosts);

      // Calculate performance for all animals (ensure we have data)
      const allPerformance = calculateFeedEfficiency(animalsData, processedWeightsData, processedFeedingData);
      setAllAnimalsData(allPerformance);
      
      // Calculate performance for each animal type separately
      const maleAnimals = animalsData.filter(animal => animal.category === 'male');
      const femaleAnimals = animalsData.filter(animal => animal.category === 'female');  
      // For newborns: include all internal production (born on farm) regardless of current category
      const newbornAnimals = animalsData.filter(animal => {
        // Include current newborns
        if (animal.category === 'newborn') return true;
        // Include weaned animals that were born on farm
        if (animal.internalProduction === true || animal.showInInternalProduction === true) return true;
        // Include animals with motherId (indicates born on farm)
        if (animal.motherId) return true;
        // Include animals with birthDate but no purchaseDate (indicates born on farm)
        if (animal.birthDate && !animal.supplier) return true;
        return false;
      });
      
      // Calculate filtered data for males and females
      const malesPurchased = maleAnimals.filter(animal => {
        // Purchased if has supplier or no motherId and no birthDate
        return animal.supplier || (!animal.motherId && !animal.birthDate);
      });
      const malesInternal = maleAnimals.filter(animal => {
        // Internal production if has motherId, birthDate, or internalProduction flag
        return animal.motherId || animal.birthDate || animal.internalProduction === true;
      });
      
      const femalesPurchased = femaleAnimals.filter(animal => {
        // Purchased if has supplier or no motherId and no birthDate
        return animal.supplier || (!animal.motherId && !animal.birthDate);
      });
      const femalesInternal = femaleAnimals.filter(animal => {
        // Internal production if has motherId, birthDate, or internalProduction flag
        return animal.motherId || animal.birthDate || animal.internalProduction === true;
      });
      
      const malePerformance = calculateFeedEfficiency(maleAnimals, processedWeightsData, processedFeedingData);
      const femalePerformance = calculateFeedEfficiency(femaleAnimals, processedWeightsData, processedFeedingData);
      const newbornPerformance = calculateFeedEfficiency(newbornAnimals, processedWeightsData, processedFeedingData);
      
      // Calculate performance for filtered data
      const malesPurchasedPerformance = calculateFeedEfficiency(malesPurchased, processedWeightsData, processedFeedingData);
      const malesInternalPerformance = calculateFeedEfficiency(malesInternal, processedWeightsData, processedFeedingData);
      const femalesPurchasedPerformance = calculateFeedEfficiency(femalesPurchased, processedWeightsData, processedFeedingData);
      const femalesInternalPerformance = calculateFeedEfficiency(femalesInternal, processedWeightsData, processedFeedingData);
      
      setMalesData(malePerformance);
      setFemalesData(femalePerformance);
      setNewbornsData(newbornPerformance);
      setMalesPurchasedData(malesPurchasedPerformance);
      setMalesInternalData(malesInternalPerformance);
      setFemalesPurchasedData(femalesPurchasedPerformance);
      setFemalesInternalData(femalesInternalPerformance);
      
      console.log('Performance data by type:', {
        males: malePerformance?.animalPerformance?.length || 0,
        females: femalePerformance?.animalPerformance?.length || 0,
        newborns: newbornPerformance?.animalPerformance?.length || 0,
        malesPurchased: malesPurchasedPerformance?.animalPerformance?.length || 0,
        malesInternal: malesInternalPerformance?.animalPerformance?.length || 0,
        femalesPurchased: femalesPurchasedPerformance?.animalPerformance?.length || 0,
        femalesInternal: femalesInternalPerformance?.animalPerformance?.length || 0
      });
      
      console.log('Animal filtering debug:', {
        totalAnimals: animalsData.length,
        maleCount: maleAnimals.length,
        femaleCount: femaleAnimals.length,
        newbornCount: newbornAnimals.length,
        malesPurchasedCount: malesPurchased.length,
        malesInternalCount: malesInternal.length,
        femalesPurchasedCount: femalesPurchased.length,
        femalesInternalCount: femalesInternal.length
      });
      
      // Calculate cost breakdown for all animals
      const allCosts = calculateGroupCostBreakdown(animalsData, processedWeightsData, processedFeedingData);
      setAllAnimalsCosts(allCosts);

      // Calculate barn-level performance
      const barnPerformanceData: Record<string, FeedEfficiencyResult> = {};
      
      for (const barn of barnsData) {
        const barnAnimals = animalsData.filter(animal => animal.barnId === barn.id);
        if (barnAnimals.length > 0) {
          const barnData = calculateFeedEfficiency(barnAnimals, processedWeightsData, processedFeedingData);
          barnPerformanceData[barn.id] = barnData;
        }
      }
      
      setBarnPerformance(barnPerformanceData);

      console.log('Performance data loaded:', {
        currentType: typePerformance,
        allAnimals: allPerformance,
        barnCount: Object.keys(barnPerformanceData).length,
        totalAnimals: animalsData.length
      });

    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [animalType]);

  // Listen for weight updates and refresh data
  useEffect(() => {
    console.log('🔔 Setting up weight update listener for PerformanceDashboard');
    
    const unsubscribe = weightEvents.onWeightUpdate((animalId, newWeight) => {
      console.log(`🔔 PerformanceDashboard received weight update: Animal ${animalId} → ${newWeight} kg`);
      console.log('🔄 Refreshing performance data due to weight update...');
      
      // Refresh all performance data
      loadData();
    });

    return unsubscribe; // Cleanup on component unmount
  }, []);

  // Log current listener count for debugging
  useEffect(() => {
    console.log(`📊 PerformanceDashboard active listeners: ${weightEvents.getListenerCount()}`);
  });

  // Reset filters when data changes
  useEffect(() => {
    setMalesFilter('all');
    setFemalesFilter('all');
  }, [malesData, femalesData]);

  // Helper function to get filtered data for males
  const getMalesFilteredData = (): FeedEfficiencyResult | null => {
    switch (malesFilter) {
      case 'purchased': return malesPurchasedData || null;
      case 'internal': return malesInternalData || null;
      case 'all': 
      default: return malesData || null;
    }
  };

  // Helper function to get filtered data for females
  const getFemalesFilteredData = (): FeedEfficiencyResult | null => {
    switch (femalesFilter) {
      case 'purchased': return femalesPurchasedData || null;
      case 'internal': return femalesInternalData || null;
      case 'all': 
      default: return femalesData || null;
    }
  };

  // Helper function to get filter label for males
  const getMalesFilterLabel = (): string => {
    switch (malesFilter) {
      case 'purchased': return 'الذكور المشتراة';
      case 'internal': return 'الذكور من الإنتاج الداخلي';
      case 'all': 
      default: return 'جميع الذكور';
    }
  };

  // Helper function to get filter label for females
  const getFemalesFilterLabel = (): string => {
    switch (femalesFilter) {
      case 'purchased': return 'الإناث المشتراة';
      case 'internal': return 'الإناث من الإنتاج الداخلي';
      case 'all': 
      default: return 'جميع الإناث';
    }
  };

  const renderPerformanceContent = (performanceData: FeedEfficiencyResult | null, title: string) => {
    if (!performanceData || performanceData.animalPerformance.length === 0) {
      return (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">لا توجد بيانات كافية لحساب الأداء</p>
          <p className="text-sm text-muted-foreground mt-2">
            تأكد من وجود سجلات الوزن والتغذية للحيوانات
          </p>
          <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
            <strong>Debug Info:</strong><br/>
            Performance Data: {performanceData ? 'EXISTS' : 'NULL'}<br/>
            Animal Performance Length: {performanceData?.animalPerformance?.length || 0}<br/>
            Title: {title}<br/>
            Raw Data: {JSON.stringify(performanceData, null, 2)}<br/>
            <button 
              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
              onClick={() => window.location.reload()}
            >
              إعادة تحميل
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6" dir="rtl">
        <h3 className="text-xl font-bold text-farm-800">{title}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="mr-4">
                  <p className="text-sm font-medium text-muted-foreground">متوسط النمو اليومي</p>
                  <div className="text-2xl font-bold text-green-700">
                    {performanceData.averageDailyGain.toFixed(2)} كيلو/يوم
                  </div>
                  <p className="text-xs text-muted-foreground">
                    عدد الحيوانات: {performanceData.animalPerformance.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Utensils className="h-8 w-8 text-blue-600" />
                <div className="mr-4">
                  <p className="text-sm font-medium text-muted-foreground">إجمالي العلف المستهلك</p>
                  <div className="text-2xl font-bold text-blue-700">
                    {performanceData.totalFeedConsumption.toFixed(1)} كيلو
                  </div>
                  <p className="text-xs text-muted-foreground">خلال الفترة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Scale className="h-8 w-8 text-purple-600" />
                <div className="mr-4">
                  <p className="text-sm font-medium text-muted-foreground">كفاءة التغذية الكلية</p>
                  <div className="text-2xl font-bold text-purple-700">
                    {performanceData.overallFeedEfficiency.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">كيلو علف/كيلو نمو</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Individual Animal Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل أداء الحيوانات الفردية</CardTitle>
            <p className="text-sm text-gray-600">البيانات مأخوذة من سجلات الأوزان الفعلية في قاعدة البيانات</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right p-2 font-medium text-gray-600">رقم الأذن</th>
                    <th className="text-right p-2 font-medium text-gray-600">الوزن الأولي (كيلو)</th>
                    <th className="text-right p-2 font-medium text-gray-600">الوزن الحالي (كيلو)</th>
                    <th className="text-right p-2 font-medium text-gray-600">النمو اليومي (كيلو)</th>
                    <th className="text-right p-2 font-medium text-gray-600">العلف المستهلك (كيلو)</th>
                    <th className="text-right p-2 font-medium text-gray-600">كفاءة التغذية</th>
                    <th className="text-right p-2 font-medium text-gray-600">فترة القياس (يوم)</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.animalPerformance.map((animal, index) => (
                    <tr key={animal.animalId} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="p-2 text-right">{animal.earTagId}</td>
                      <td className="p-2 text-right">{animal.initialWeight.toFixed(1)}</td>
                      <td className="p-2 text-right">{animal.currentWeight.toFixed(1)}</td>
                      <td className="p-2 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          animal.avgDailyGain > 0.8 ? 'bg-green-100 text-green-800' :
                          animal.avgDailyGain > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {animal.avgDailyGain.toFixed(3)}
                        </span>
                      </td>
                      <td className="p-2 text-right">{animal.actualFeedConsumption.toFixed(1)}</td>
                      <td className="p-2 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          animal.feedEfficiencyRatio < 5 ? 'bg-green-100 text-green-800' :
                          animal.feedEfficiencyRatio < 7 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {animal.feedEfficiencyRatio.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-2 text-right">{animal.daysInMeasurement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحليل بيانات الأداء...</p>
        </div>
      </div>
    );
  }
  return (
    <Tabs defaultValue={animalType === "male" ? "males" : animalType === "female" ? "females" : animalType === "newborn" ? "newborns" : "all"} className="w-full" dir="rtl">
      <TabsList className="grid w-full grid-cols-7 mb-6">
        <TabsTrigger value="males">
          <div className="flex items-center">
            <Users className="h-4 w-4 ml-1 text-blue-600" />
            الذكور
          </div>
        </TabsTrigger>
        <TabsTrigger value="females">
          <div className="flex items-center">
            <Users className="h-4 w-4 ml-1 text-pink-600" />
            الإناث
          </div>
        </TabsTrigger>
        <TabsTrigger value="newborns">
          <div className="flex items-center">
            <Users className="h-4 w-4 ml-1 text-green-600" />
            المواليد
          </div>
        </TabsTrigger>
        <TabsTrigger value="all">
          <div className="flex items-center">
            <BarChart3 className="h-4 w-4 ml-1" />
            جميع الحيوانات
          </div>
        </TabsTrigger>
        <TabsTrigger value="barns">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 ml-1" />
            تحليل الحظائر
          </div>
        </TabsTrigger>
        <TabsTrigger value="pricing">
          <div className="flex items-center">
            <Scale className="h-4 w-4 ml-1" />
            التكاليف
          </div>
        </TabsTrigger>
        <TabsTrigger value="costs">
          <div className="flex items-center">
            <Scale className="h-4 w-4 ml-1" />
            السعر
          </div>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="males" className="space-y-6">
        <div className="space-y-6" dir="rtl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-farm-800">
              أداء الذكور
            </h3>
            
            {/* Filter buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setMalesFilter('all')}
                className={`px-3 py-1 text-sm rounded ${
                  malesFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setMalesFilter('purchased')}
                className={`px-3 py-1 text-sm rounded ${
                  malesFilter === 'purchased' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                مشترى
              </button>
              <button
                onClick={() => setMalesFilter('internal')}
                className={`px-3 py-1 text-sm rounded ${
                  malesFilter === 'internal' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                إنتاج داخلي
              </button>
            </div>
          </div>
          
          {(() => {
            const currentData = getMalesFilteredData();
            return currentData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">متوسط النمو اليومي</p>
                        <div className="text-2xl font-bold text-green-700">
                          {currentData.averageDailyGain.toFixed(2)} كيلو/يوم
                        </div>
                        <p className="text-xs text-muted-foreground">
                          عدد الحيوانات: {currentData.animalPerformance.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Utensils className="h-8 w-8 text-blue-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">إجمالي العلف المستهلك</p>
                        <div className="text-2xl font-bold text-blue-700">
                          {currentData.totalFeedConsumption.toFixed(1)} كيلو
                        </div>
                        <p className="text-xs text-muted-foreground">خلال الفترة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Scale className="h-8 w-8 text-purple-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">كفاءة التغذية الكلية</p>
                        <div className="text-2xl font-bold text-purple-700">
                          {currentData.overallFeedEfficiency.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">كيلو علف/كيلو نمو</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Individual Animal Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل أداء الحيوانات الفردية</CardTitle>
                  <p className="text-sm text-gray-600">البيانات مأخوذة من سجلات الأوزان الفعلية في قاعدة البيانات</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-right p-2 font-medium text-gray-600">رقم الأذن</th>
                          <th className="text-right p-2 font-medium text-gray-600">الوزن الأولي (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">الوزن الحالي (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">النمو اليومي (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">العلف المستهلك (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">كفاءة التغذية</th>
                          <th className="text-right p-2 font-medium text-gray-600">فترة القياس (يوم)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentData.animalPerformance.map((animal, index) => (
                          <tr key={animal.animalId} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="p-2 text-right font-medium">{animal.earTagId}</td>
                            <td className="p-2 text-right">{animal.initialWeight.toFixed(1)}</td>
                            <td className="p-2 text-right">{animal.currentWeight.toFixed(1)}</td>
                            <td className="p-2 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                animal.avgDailyGain > 0.8 ? 'bg-green-100 text-green-800' :
                                animal.avgDailyGain > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {animal.avgDailyGain.toFixed(3)}
                              </span>
                            </td>
                            <td className="p-2 text-right">{animal.actualFeedConsumption.toFixed(1)}</td>
                            <td className="p-2 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                animal.feedEfficiencyRatio < 5 ? 'bg-green-100 text-green-800' :
                                animal.feedEfficiencyRatio < 7 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {animal.feedEfficiencyRatio.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-2 text-right">{animal.daysInMeasurement}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد بيانات كافية لحساب الأداء</p>
              <p className="text-sm text-muted-foreground mt-2">
                تأكد من وجود سجلات الوزن والتغذية لـ {getMalesFilterLabel()}
              </p>
            </div>
          );
        })()}
        </div>
      </TabsContent>

      <TabsContent value="females" className="space-y-6">
        <div className="space-y-6" dir="rtl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-farm-800">
              أداء الإناث
            </h3>
            
            {/* Filter buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFemalesFilter('all')}
                className={`px-3 py-1 text-sm rounded ${
                  femalesFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFemalesFilter('purchased')}
                className={`px-3 py-1 text-sm rounded ${
                  femalesFilter === 'purchased' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                مشترى
              </button>
              <button
                onClick={() => setFemalesFilter('internal')}
                className={`px-3 py-1 text-sm rounded ${
                  femalesFilter === 'internal' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                إنتاج داخلي
              </button>
            </div>
          </div>
          
          {(() => {
            const currentData = getFemalesFilteredData();
            return currentData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">متوسط النمو اليومي</p>
                        <div className="text-2xl font-bold text-green-700">
                          {currentData.averageDailyGain.toFixed(2)} كيلو/يوم
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Utensils className="h-8 w-8 text-blue-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">استهلاك العلف</p>
                        <div className="text-2xl font-bold text-blue-700">
                          {currentData.totalFeedConsumption.toFixed(1)} كيلو
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Scale className="h-8 w-8 text-purple-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">معامل كفاءة العلف</p>
                        <div className="text-2xl font-bold text-purple-700">
                          {(currentData.totalFeedConsumption / (currentData.averageDailyGain * 30)).toFixed(2)}:1
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Individual Animal Performance Table for Females */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل أداء الإناث الفردية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-right p-2 font-medium text-gray-600">رقم الأذن</th>
                          <th className="text-right p-2 font-medium text-gray-600">الوزن الأولي (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">الوزن الحالي (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">النمو اليومي (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">العلف المستهلك (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">كفاءة التغذية</th>
                          <th className="text-right p-2 font-medium text-gray-600">فترة القياس (يوم)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentData.animalPerformance.map((animal, index) => (
                          <tr key={animal.animalId} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="p-2 text-right">{animal.earTagId}</td>
                            <td className="p-2 text-right">{animal.initialWeight.toFixed(1)}</td>
                            <td className="p-2 text-right">{animal.currentWeight.toFixed(1)}</td>
                            <td className="p-2 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                animal.avgDailyGain > 0.8 ? 'bg-green-100 text-green-800' :
                                animal.avgDailyGain > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {animal.avgDailyGain.toFixed(3)}
                              </span>
                            </td>
                            <td className="p-2 text-right">{animal.actualFeedConsumption.toFixed(1)}</td>
                            <td className="p-2 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                animal.feedEfficiencyRatio < 5 ? 'bg-green-100 text-green-800' :
                                animal.feedEfficiencyRatio < 7 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {animal.feedEfficiencyRatio.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-2 text-right">{animal.daysInMeasurement}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد بيانات كافية لحساب الأداء</p>
              <p className="text-sm text-muted-foreground mt-2">
                تأكد من وجود سجلات الوزن والتغذية لـ {getFemalesFilterLabel()}
              </p>
            </div>
          );
          })()}
        </div>
      </TabsContent>

      <TabsContent value="newborns" className="space-y-6">
        <div className="space-y-6" dir="rtl">
          <div>
            <h3 className="text-xl font-bold text-farm-800">
              أداء المواليد والإنتاج الداخلي
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              يشمل جميع الحيوانات المولودة في المزرعة حتى المفطومة منها
            </p>
          </div>
          
          {newbornsData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 border border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">متوسط النمو اليومي</p>
                        <div className="text-2xl font-bold text-green-700">
                          {newbornsData.averageDailyGain.toFixed(2)} كيلو/يوم
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Utensils className="h-8 w-8 text-blue-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">استهلاك العلف</p>
                        <div className="text-2xl font-bold text-blue-700">
                          {newbornsData.totalFeedConsumption.toFixed(1)} كيلو
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Scale className="h-8 w-8 text-purple-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">معامل كفاءة العلف</p>
                        <div className="text-2xl font-bold text-purple-700">
                          {(newbornsData.totalFeedConsumption / (newbornsData.averageDailyGain * 30)).toFixed(2)}:1
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Individual Animal Performance Table for Newborns */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل أداء الإنتاج الداخلي الفردية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-right p-2 font-medium text-gray-600">رقم الأذن</th>
                          <th className="text-right p-2 font-medium text-gray-600">الوزن الأولي (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">الوزن الحالي (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">النمو اليومي (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">العلف المستهلك (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">كفاءة التغذية</th>
                          <th className="text-right p-2 font-medium text-gray-600">فترة القياس (يوم)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newbornsData.animalPerformance.map((animal, index) => (
                          <tr key={animal.animalId} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="p-2 text-right">{animal.earTagId}</td>
                            <td className="p-2 text-right">{animal.initialWeight.toFixed(1)}</td>
                            <td className="p-2 text-right">{animal.currentWeight.toFixed(1)}</td>
                            <td className="p-2 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                animal.avgDailyGain > 0.8 ? 'bg-green-100 text-green-800' :
                                animal.avgDailyGain > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {animal.avgDailyGain.toFixed(3)}
                              </span>
                            </td>
                            <td className="p-2 text-right">{animal.actualFeedConsumption.toFixed(1)}</td>
                            <td className="p-2 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                animal.feedEfficiencyRatio < 5 ? 'bg-green-100 text-green-800' :
                                animal.feedEfficiencyRatio < 7 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {animal.feedEfficiencyRatio.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-2 text-right">{animal.daysInMeasurement}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد بيانات كافية لحساب الأداء</p>
              <p className="text-sm text-muted-foreground mt-2">
                تأكد من وجود سجلات الوزن والتغذية للإنتاج الداخلي والمواليد
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="all" className="space-y-6">
        <div className="space-y-6" dir="rtl">
          <h3 className="text-xl font-bold text-farm-800">أداء جميع الحيوانات</h3>
          
          {allAnimalsData ? (
            <>
              {/* Overall Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-green-50 border border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">متوسط النمو اليومي</p>
                        <div className="text-2xl font-bold text-green-700">
                          {allAnimalsData.averageDailyGain.toFixed(2)} كيلو/يوم
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Utensils className="h-8 w-8 text-blue-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">إجمالي العلف</p>
                        <div className="text-2xl font-bold text-blue-700">
                          {allAnimalsData.totalFeedConsumption.toFixed(1)} كيلو
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Scale className="h-8 w-8 text-purple-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">كفاءة التغذية</p>
                        <div className="text-2xl font-bold text-purple-700">
                          {allAnimalsData.overallFeedEfficiency.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-orange-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">إجمالي الحيوانات</p>
                        <div className="text-2xl font-bold text-orange-700">
                          {allAnimalsData.animalPerformance.length}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance by Animal Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">أداء حسب فئة الحيوانات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['male', 'female', 'newborn'] as AnimalCategory[]).map(category => {
                      
                      const categoryAnimals = allAnimalsData.animalPerformance.filter(animal => {
                        
                        if (category === 'male') return animal.earTagId.startsWith('M');
                        if (category === 'female') return animal.earTagId.startsWith('F');
                        if (category === 'newborn') return animal.earTagId.startsWith('N');
                        return false;
                      });
                      
                      const avgDailyGain = categoryAnimals.length > 0 
                        ? categoryAnimals.reduce((sum, a) => sum + a.avgDailyGain, 0) / categoryAnimals.length 
                        : 0;
                      
                      const totalFeedConsumption = categoryAnimals.reduce((sum, a) => sum + a.actualFeedConsumption, 0);
                      
                      const categoryName = category === 'male' ? 'الذكور' : 
                                         category === 'female' ? 'الإناث' : 'المواليد';
                      
                      const categoryStyles = category === 'male' ? 'bg-blue-50 border-blue-200 text-blue-800' : 
                                          category === 'female' ? 'bg-pink-50 border-pink-200 text-pink-800' : 
                                          'bg-green-50 border-green-200 text-green-800';
                      
                      const categoryTextColor = category === 'male' ? 'text-blue-600' : 
                                              category === 'female' ? 'text-pink-600' : 'text-green-600';
                      
                      return (
                        <Card key={category} className={categoryStyles}>
                          <CardHeader className="pb-3">
                            <CardTitle className={categoryTextColor}>{categoryName}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">العدد:</span>
                                <span className="font-semibold">{categoryAnimals.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">النمو اليومي:</span>
                                <span className={`font-semibold ${categoryTextColor}`}>
                                  {avgDailyGain.toFixed(2)} كيلو
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">العلف المستهلك:</span>
                                <span className="font-semibold">{totalFeedConsumption.toFixed(1)} كيلو</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Complete Animal Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل أداء جميع الحيوانات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-right p-2 font-medium text-gray-600">رقم الأذن</th>
                          <th className="text-right p-2 font-medium text-gray-600">الفئة</th>
                          <th className="text-right p-2 font-medium text-gray-600">الوزن الأولي</th>
                          <th className="text-right p-2 font-medium text-gray-600">الوزن الحالي</th>
                          <th className="text-right p-2 font-medium text-gray-600">النمو اليومي</th>
                          <th className="text-right p-2 font-medium text-gray-600">العلف المستهلك</th>
                          <th className="text-right p-2 font-medium text-gray-600">كفاءة التغذية</th>
                          <th className="text-right p-2 font-medium text-gray-600">فترة القياس</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAnimalsData.animalPerformance
                          .sort((a, b) => b.avgDailyGain - a.avgDailyGain)
                          .map((animal, index) => {
                            const category = animal.earTagId.startsWith('M') ? 'ذكر' : 
                                           animal.earTagId.startsWith('F') ? 'أنثى' : 'مولود';
                            const categoryBadgeStyle = animal.earTagId.startsWith('M') ? 'bg-blue-100 text-blue-800' : 
                                                 animal.earTagId.startsWith('F') ? 'bg-pink-100 text-pink-800' : 
                                                 'bg-green-100 text-green-800';
                            
                            return (
                              <tr key={animal.animalId} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                <td className="p-2 text-right font-medium">{animal.earTagId}</td>
                                <td className="p-2 text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryBadgeStyle}`}>
                                    {category}
                                  </span>
                                </td>
                                <td className="p-2 text-right">{animal.initialWeight.toFixed(1)} كيلو</td>
                                <td className="p-2 text-right">{animal.currentWeight.toFixed(1)} كيلو</td>
                                <td className="p-2 text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    animal.avgDailyGain > 0.8 ? 'bg-green-100 text-green-800' :
                                    animal.avgDailyGain > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {animal.avgDailyGain.toFixed(3)} كيلو
                                  </span>
                                </td>
                                <td className="p-2 text-right">{animal.actualFeedConsumption.toFixed(1)} كيلو</td>
                                <td className="p-2 text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    animal.feedEfficiencyRatio < 5 ? 'bg-green-100 text-green-800' :
                                    animal.feedEfficiencyRatio < 7 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {animal.feedEfficiencyRatio.toFixed(2)}
                                  </span>
                                </td>
                                <td className="p-2 text-right">{animal.daysInMeasurement} يوم</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Recommendations */}
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-800">توصيات تحسين الأداء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {allAnimalsData.overallFeedEfficiency > 6 && (
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 ml-2" />
                        <p className="text-orange-700">
                          <strong>تحسين كفاءة التغذية:</strong> كفاءة التغذية الحالية ({allAnimalsData.overallFeedEfficiency.toFixed(2)}) تحتاج تحسين. 
                          ينصح بمراجعة نوعية العلف وجدولة التغذية.
                        </p>
                      </div>
                    )}
                    {allAnimalsData.averageDailyGain < 0.5 && (
                      <div className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 ml-2" />
                        <p className="text-orange-700">
                          <strong>تحسين النمو:</strong> متوسط النمو اليومي ({allAnimalsData.averageDailyGain.toFixed(2)} كيلو/يوم) أقل من المتوقع. 
                          ينصح بزيادة التغذية المركزة.
                        </p>
                      </div>
                    )}
                    {allAnimalsData.animalPerformance.length < 10 && (
                      <div className="flex items-start">
                        <Users className="h-4 w-4 text-blue-600 mt-0.5 ml-2" />
                        <p className="text-blue-700">
                          <strong>زيادة القطيع:</strong> العدد الحالي ({allAnimalsData.animalPerformance.length} حيوان) يمكن زيادته لتحسين الإنتاجية.
                        </p>
                      </div>
                    )}
                    {Object.keys(barnPerformance).length > 1 && (
                      <div className="flex items-start">
                        <Building2 className="h-4 w-4 text-green-600 mt-0.5 ml-2" />
                        <p className="text-green-700">
                          <strong>توزيع الحظائر:</strong> يتم توزيع الحيوانات على {Object.keys(barnPerformance).length} حظائر. 
                          راجع تبويب "تحليل الحظائر" لمقارنة الأداء.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد بيانات كافية لحساب الأداء</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="barns" className="space-y-6">
        <div className="space-y-6" dir="rtl">
          <h3 className="text-xl font-bold text-farm-800">تحليل أداء الحظائر</h3>
          
          {Object.keys(barnPerformance).length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد بيانات كافية لتحليل الحظائر</p>
            </div>
          ) : (
            <>
              {/* Overall Barn Performance Summary */}
              <Card className="bg-gradient-to-r from-farm-50 to-farm-100 border border-farm-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-farm-800">
                    <BarChart3 className="h-5 w-5 ml-2" />
                    ملخص عام لأداء الحظائر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-farm-700">
                        {Object.keys(barnPerformance).length}
                      </div>
                      <p className="text-sm text-muted-foreground">إجمالي الحظائر</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {Math.max(...Object.values(barnPerformance).map(barn => barn.averageDailyGain)).toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">أفضل نمو يومي (كيلو)</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.min(...Object.values(barnPerformance).map(barn => barn.overallFeedEfficiency)).toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">أفضل كفاءة تغذية</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Object.values(barnPerformance).reduce((sum, barn) => sum + barn.animalPerformance.length, 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">إجمالي الحيوانات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Barn Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(barnPerformance)
                  .sort(([,a], [,b]) => b.averageDailyGain - a.averageDailyGain)
                  .map(([barnId, barnData]) => {
                    const barn = barns.find(b => b.id === barnId);
                    const performanceRating = barnData.overallFeedEfficiency < 5 ? 'ممتاز' : 
                                            barnData.overallFeedEfficiency < 6 ? 'جيد' : 
                                            barnData.overallFeedEfficiency < 7 ? 'متوسط' : 'يحتاج تحسين';
                    const ratingColor = barnData.overallFeedEfficiency < 5 ? 'text-green-700 bg-green-100' : 
                                       barnData.overallFeedEfficiency < 6 ? 'text-blue-700 bg-blue-100' : 
                                       barnData.overallFeedEfficiency < 7 ? 'text-yellow-700 bg-yellow-100' : 'text-red-700 bg-red-100';
                    
                    return (
                      <Card key={barnId} className="border border-farm-200 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <div className="flex items-center">
                              <Building2 className="h-5 w-5 ml-2 text-farm-600" />
                              {barn?.name || `حظيرة ${barnId}`}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ratingColor}`}>
                              {performanceRating}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground flex items-center">
                                <TrendingUp className="h-4 w-4 ml-1" />
                                النمو اليومي:
                              </span>
                              <span className="font-semibold text-green-600">
                                {barnData.averageDailyGain.toFixed(2)} كيلو/يوم
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground flex items-center">
                                <Utensils className="h-4 w-4 ml-1" />
                                العلف المستهلك:
                              </span>
                              <span className="font-semibold text-blue-600">
                                {barnData.totalFeedConsumption.toFixed(1)} كيلو
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground flex items-center">
                                <Scale className="h-4 w-4 ml-1" />
                                كفاءة التغذية:
                              </span>
                              <span className="font-semibold text-purple-600">
                                {barnData.overallFeedEfficiency.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground flex items-center">
                                <Users className="h-4 w-4 ml-1" />
                                عدد الحيوانات:
                              </span>
                              <span className="font-semibold text-gray-700">
                                {barnData.animalPerformance.length}
                              </span>
                            </div>
                            
                            {/* Animal Categories Breakdown */}
                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-600 mb-2">توزيع الحيوانات:</p>
                              <div className="flex justify-between text-xs">
                                <span className="text-blue-600">
                                  ذكور: {barnData.animalPerformance.filter(a => a.animalId.includes('M') || a.earTagId.includes('M')).length}
                                </span>
                                <span className="text-pink-600">
                                  إناث: {barnData.animalPerformance.filter(a => a.animalId.includes('F') || a.earTagId.includes('F')).length}
                                </span>
                                <span className="text-green-600">
                                  مواليد: {barnData.animalPerformance.filter(a => a.animalId.includes('N') || a.earTagId.includes('N')).length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {/* Barn Performance Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">مقارنة أداء الحظائر</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-right p-3 font-medium text-gray-600">اسم الحظيرة</th>
                          <th className="text-right p-3 font-medium text-gray-600">عدد الحيوانات</th>
                          <th className="text-right p-3 font-medium text-gray-600">النمو اليومي (كيلو)</th>
                          <th className="text-right p-3 font-medium text-gray-600">العلف المستهلك (كيلو)</th>
                          <th className="text-right p-3 font-medium text-gray-600">كفاءة التغذية</th>
                          <th className="text-right p-3 font-medium text-gray-600">التقييم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(barnPerformance)
                          .sort(([,a], [,b]) => b.averageDailyGain - a.averageDailyGain)
                          .map(([barnId, barnData], index) => {
                            const barn = barns.find(b => b.id === barnId);
                            const performanceRating = barnData.overallFeedEfficiency < 5 ? 'ممتاز' : 
                                                    barnData.overallFeedEfficiency < 6 ? 'جيد' : 
                                                    barnData.overallFeedEfficiency < 7 ? 'متوسط' : 'يحتاج تحسين';
                            const ratingColor = barnData.overallFeedEfficiency < 5 ? 'bg-green-100 text-green-800' : 
                                               barnData.overallFeedEfficiency < 6 ? 'bg-blue-100 text-blue-800' : 
                                               barnData.overallFeedEfficiency < 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                            
                            return (
                              <tr key={barnId} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                <td className="p-3 text-right font-medium">{barn?.name || `حظيرة ${barnId}`}</td>
                                <td className="p-3 text-right">{barnData.animalPerformance.length}</td>
                                <td className="p-3 text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    barnData.averageDailyGain > 0.8 ? 'bg-green-100 text-green-800' :
                                    barnData.averageDailyGain > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {barnData.averageDailyGain.toFixed(2)}
                                  </span>
                                </td>
                                <td className="p-3 text-right">{barnData.totalFeedConsumption.toFixed(1)}</td>
                                <td className="p-3 text-right">{barnData.overallFeedEfficiency.toFixed(2)}</td>
                                <td className="p-3 text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ratingColor}`}>
                                    {performanceRating}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="pricing" className="space-y-6">
        <div className="space-y-6" dir="rtl">
          <h3 className="text-xl font-bold text-farm-800">التكاليف والتسعير حسب الصيغ المحددة</h3>
          
          {currentTypeCosts.length > 0 ? (
            <>
              {/* Cost Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-green-50 border border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">إجمالي الاستثمار</p>
                        <div className="text-2xl font-bold text-green-700">
                          {currentTypeCosts.reduce((sum, animal) => sum + animal.totalInvestment, 0).toFixed(0)} ج.م
                        </div>
                        <p className="text-xs text-muted-foreground">شراء + علف</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Utensils className="h-8 w-8 text-blue-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">تكلفة العلف الكلية</p>
                        <div className="text-2xl font-bold text-blue-700">
                          {currentTypeCosts.reduce((sum, animal) => sum + animal.totalFeedCost, 0).toFixed(0)} ج.م
                        </div>
                        <p className="text-xs text-muted-foreground">حسب الاستهلاك الفعلي</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Scale className="h-8 w-8 text-purple-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">القيمة السوقية</p>
                        <div className="text-2xl font-bold text-purple-700">
                          {currentTypeCosts.reduce((sum, animal) => sum + animal.currentMarketPrice, 0).toFixed(0)} ج.م
                        </div>
                        <p className="text-xs text-muted-foreground">السعر الحالي</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">إجمالي الربح</p>
                        <div className={`text-2xl font-bold ${
                          currentTypeCosts.reduce((sum, animal) => sum + animal.profitLoss, 0) > 0 
                            ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {currentTypeCosts.reduce((sum, animal) => sum + animal.profitLoss, 0).toFixed(0)} ج.م
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(currentTypeCosts.reduce((sum, animal) => sum + animal.profitMargin, 0) / currentTypeCosts.length).toFixed(1)}% هامش ربح
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Cost Breakdown Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل التكاليف والتسعير لكل حيوان</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>الصيغ المستخدمة:</strong> ADG = (وزن 2 - وزن 1) / عدد الأيام | 
                    كمية العلف الفعلية = (ADG الفردي / مجموع ADG الكلي) × إجمالي العلف
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-right p-2 font-medium text-gray-600">رقم الأذن</th>
                          <th className="text-right p-2 font-medium text-gray-600">ADG (كيلو/يوم)</th>
                          <th className="text-right p-2 font-medium text-gray-600">نسبة الزيادة (%)</th>
                          <th className="text-right p-2 font-medium text-gray-600">العلف الفعلي (كيلو)</th>
                          <th className="text-right p-2 font-medium text-gray-600">تكلفة العلف (ج.م)</th>
                          <th className="text-right p-2 font-medium text-gray-600">سعر الشراء (ج.م)</th>
                          <th className="text-right p-2 font-medium text-gray-600">إجمالي الاستثمار (ج.م)</th>
                          <th className="text-right p-2 font-medium text-gray-600">السعر الحالي (ج.م)</th>
                          <th className="text-right p-2 font-medium text-gray-600">الربح/الخسارة (ج.م)</th>
                          <th className="text-right p-2 font-medium text-gray-600">السعر المقترح (ج.م)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTypeCosts
                          .sort((a, b) => b.profitMargin - a.profitMargin)
                          .map((animal, index) => (
                            <tr key={animal.animalId} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                              <td className="p-2 text-right font-medium">{animal.earTagId}</td>
                              <td className="p-2 text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  animal.avgDailyGain > 0.8 ? 'bg-green-100 text-green-800' :
                                  animal.avgDailyGain > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {animal.avgDailyGain.toFixed(3)}
                                </span>
                              </td>
                              <td className="p-2 text-right">
                                <span className="font-medium text-blue-600">
                                  {(animal.growthPercentage * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-2 text-right font-medium">{animal.actualFeedConsumption.toFixed(1)}</td>
                              <td className="p-2 text-right font-medium text-orange-600">
                                {animal.totalFeedCost.toFixed(0)}
                              </td>
                              <td className="p-2 text-right">{animal.purchasePrice.toFixed(0)}</td>
                              <td className="p-2 text-right font-bold text-gray-800">
                                {animal.totalInvestment.toFixed(0)}
                              </td>
                              <td className="p-2 text-right font-medium text-purple-600">
                                {animal.currentMarketPrice.toFixed(0)}
                              </td>
                              <td className="p-2 text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  animal.profitLoss > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {animal.profitLoss.toFixed(0)} ({animal.profitMargin.toFixed(1)}%)
                                </span>
                              </td>
                              <td className="p-2 text-right font-bold text-green-700">
                                {animal.recommendedSellPrice.toFixed(0)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Formula Explanation */}
              <Card className="bg-blue-50 border border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800">شرح الصيغ المستخدمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-bold text-blue-700 mb-2">1. متوسط الزيادة اليومية (ADG):</h4>
                      <p className="text-gray-700 mb-2">ADG = (وزن 2 - وزن 1) ÷ فرق التواريخ (عدد الأيام)</p>
                      <p className="text-xs text-muted-foreground">يقيس معدل نمو الحيوان يومياً</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-bold text-blue-700 mb-2">2. كمية الأكل الغير فعلي للحيوان الواحد:</h4>
                      <p className="text-gray-700 mb-2">= إجمالي العلف ÷ عدد الحيوانات</p>
                      <p className="text-xs text-muted-foreground">التوزيع المتساوي للعلف على جميع الحيوانات</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-bold text-blue-700 mb-2">3. نسبة الزيادة (%):</h4>
                      <p className="text-gray-700 mb-2">= معدل الزيادة اليومية لحيوان معين (ADG₁) ÷ مجموع معدل الزيادة اليومية لجميع الحيوانات (ADG_Total)</p>
                      <p className="text-xs text-muted-foreground">تحدد نصيب كل حيوان من إجمالي النمو</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-bold text-blue-700 mb-2">4. كمية الأكل الفعلية للحيوان الواحد:</h4>
                      <p className="text-gray-700 mb-2">= نسبة الزيادة × إجمالي العلف</p>
                      <p className="text-xs text-muted-foreground">الكمية الفعلية من العلف المستهلكة حسب معدل النمو</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد بيانات كافية لحساب التكاليف</p>
              <p className="text-sm text-muted-foreground mt-2">
                تأكد من وجود سجلات الوزن والتغذية وأسعار الشراء
              </p>
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="costs" className="space-y-6">
        <div className="space-y-6" dir="rtl">
          <h3 className="text-xl font-bold text-farm-800">تحليل التكاليف وحسابات الأسعار</h3>
          
          {currentTypeCosts.length > 0 ? (
            <>
              {/* Cost Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-amber-50 border border-amber-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <DollarSign className="h-8 w-8 text-amber-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">متوسط سعر الشراء</p>
                        <div className="text-2xl font-bold text-amber-700">
                          {(currentTypeCosts.reduce((sum, animal) => sum + animal.purchasePrice, 0) / currentTypeCosts.length).toFixed(0)} ج.م
                        </div>
                        <p className="text-xs text-muted-foreground">للحيوان الواحد</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-cyan-50 border border-cyan-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-cyan-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">متوسط التكلفة الإجمالية</p>
                        <div className="text-2xl font-bold text-cyan-700">
                          {(currentTypeCosts.reduce((sum, animal) => sum + animal.totalInvestment, 0) / currentTypeCosts.length).toFixed(0)} ج.م
                        </div>
                        <p className="text-xs text-muted-foreground">شامل العلف والرعاية</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-emerald-50 border border-emerald-200">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <CircleDollarSign className="h-8 w-8 text-emerald-600" />
                      <div className="mr-4">
                        <p className="text-sm font-medium text-muted-foreground">متوسط السعر المقترح</p>
                        <div className="text-2xl font-bold text-emerald-700">
                          {(currentTypeCosts.reduce((sum, animal) => sum + animal.recommendedSellPrice, 0) / currentTypeCosts.length).toFixed(0)} ج.م
                        </div>
                        <p className="text-xs text-muted-foreground">بهامش ربح مستهدف</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cost Analysis Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">توزيع التكاليف</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <div className="flex h-full items-center justify-center">
                      <div className="w-full max-w-sm">
                        {/* Pie Chart Placeholder - in a real implementation, use a chart library */}
                        <div className="relative aspect-square rounded-full overflow-hidden border">
                          <div 
                            className="absolute inset-0 bg-amber-400" 
                            style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 50% 100%)' }}
                          ></div>
                          <div 
                            className="absolute inset-0 bg-blue-400" 
                            style={{ clipPath: 'polygon(50% 50%, 50% 100%, 0 100%, 0 0, 50% 0)' }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white rounded-full w-3/5 h-3/5 flex items-center justify-center text-sm font-medium">
                              التكاليف
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="flex items-center">
                            <span className="w-3 h-3 bg-amber-400 rounded-full mr-2"></span>
                            <span className="text-sm">تكلفة الشراء ({Math.round(currentTypeCosts.reduce((sum, animal) => sum + animal.purchasePrice, 0) / currentTypeCosts.reduce((sum, animal) => sum + animal.totalInvestment, 0) * 100)}%)</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                            <span className="text-sm">تكلفة العلف ({Math.round(currentTypeCosts.reduce((sum, animal) => sum + animal.totalFeedCost, 0) / currentTypeCosts.reduce((sum, animal) => sum + animal.totalInvestment, 0) * 100)}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">تحليل الربحية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">متوسط هامش الربح</span>
                          <span className="text-sm font-medium">
                            {(currentTypeCosts.reduce((sum, animal) => sum + animal.profitMargin, 0) / currentTypeCosts.length).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (currentTypeCosts.reduce((sum, animal) => sum + animal.profitMargin, 0) / currentTypeCosts.length) > 20 
                                ? 'bg-green-500' 
                                : (currentTypeCosts.reduce((sum, animal) => sum + animal.profitMargin, 0) / currentTypeCosts.length) > 10
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min((currentTypeCosts.reduce((sum, animal) => sum + animal.profitMargin, 0) / currentTypeCosts.length), 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">نسبة الأعلاف من التكلفة</span>
                          <span className="text-sm font-medium">
                            {(currentTypeCosts.reduce((sum, animal) => sum + animal.totalFeedCost, 0) / currentTypeCosts.reduce((sum, animal) => sum + animal.totalInvestment, 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${(currentTypeCosts.reduce((sum, animal) => sum + animal.totalFeedCost, 0) / currentTypeCosts.reduce((sum, animal) => sum + animal.totalInvestment, 0) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">كفاءة استخدام العلف</span>
                          <span className="text-sm font-medium">
                            {(currentTypeCosts.reduce((sum, animal) => sum + animal.avgDailyGain, 0) / currentTypeCosts.length).toFixed(2)} كجم/يوم
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (currentTypeCosts.reduce((sum, animal) => sum + animal.avgDailyGain, 0) / currentTypeCosts.length) > 0.8 
                                ? 'bg-green-500' 
                                : (currentTypeCosts.reduce((sum, animal) => sum + animal.avgDailyGain, 0) / currentTypeCosts.length) > 0.5
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min((currentTypeCosts.reduce((sum, animal) => sum + animal.avgDailyGain, 0) / currentTypeCosts.length) / 1.5 * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Price Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">توصيات التسعير</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    بناءً على متوسط تكلفة الحيوان وهامش الربح المستهدف
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <div className="text-sm font-medium text-muted-foreground mb-1">سعر التعادل</div>
                      <div className="text-2xl font-bold text-yellow-700">
                        {(currentTypeCosts.reduce((sum, animal) => sum + animal.totalInvestment, 0) / currentTypeCosts.length).toFixed(0)} ج.م
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">السعر الأدنى بدون ربح أو خسارة</p>
                    </div>

                    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="text-sm font-medium text-muted-foreground mb-1">سعر بهامش ربح 15%</div>
                      <div className="text-2xl font-bold text-green-700">
                        {(currentTypeCosts.reduce((sum, animal) => sum + animal.totalInvestment, 0) / currentTypeCosts.length * 1.15).toFixed(0)} ج.م
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">سعر مناسب للمبيعات العادية</p>
                    </div>

                    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                      <div className="text-sm font-medium text-muted-foreground mb-1">سعر بهامش ربح 25%</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {(currentTypeCosts.reduce((sum, animal) => sum + animal.totalInvestment, 0) / currentTypeCosts.length * 1.25).toFixed(0)} ج.م
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">سعر مثالي للربحية</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد بيانات كافية لحساب التكاليف</p>
              <p className="text-sm text-muted-foreground mt-2">
                تأكد من وجود سجلات الوزن والتغذية وأسعار الشراء
              </p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default AnimalPerformanceDashboard;
