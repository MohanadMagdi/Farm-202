import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '@/lib/data-service';
import { integratedInventoryService } from '@/lib/integrated-inventory-service';
import { PlusCircle, Package, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { FeedMainType, WarehouseItem } from '@shared/types';
import { 
  getMainFeedTypes, 
  getSubTypesForMainType, 
  generateFeedId, 
  getFeedArabicName,
  formatFeedTypeForDisplay 
} from '@/lib/feed-utils';
import useInventorySync from '@/hooks/use-inventory-sync';

export function FeedingTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { stockLevels, getFeedItems, refreshInventory } = useInventorySync();
  const [availableFeedItems, setAvailableFeedItems] = useState<WarehouseItem[]>([]);

  // Feed Input Form State
  const [feedInput, setFeedInput] = useState({
    mainType: '' as FeedMainType | '',
    subType: '',
    quantity: '',
    unitPrice: '',
    notes: ''
  });

  // Feed Distribution Form State
  const [feedDistribution, setFeedDistribution] = useState({
    barnId: '',
    mainType: '' as FeedMainType | '',
    subType: '',
    quantity: '',
    notes: ''
  });

  // Load available feed items and stock levels
  useEffect(() => {
    loadFeedData();
  }, []);

  const loadFeedData = async () => {
    try {
      const feedItems = getFeedItems();
      setAvailableFeedItems(feedItems);
      
      // Refresh inventory data to ensure sync
      await refreshInventory();
    } catch (error) {
      console.error('Error loading feed data:', error);
    }
  };

  // Handle Feed Input Submission
  const handleFeedInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedInput.mainType || !feedInput.subType || !feedInput.quantity) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Use integrated inventory service instead of direct stock movement
      await integratedInventoryService.addFeedToInventory({
        mainType: feedInput.mainType,
        subType: feedInput.subType,
        quantity: parseFloat(feedInput.quantity),
        unitPrice: feedInput.unitPrice ? parseFloat(feedInput.unitPrice) : 0,
        notes: feedInput.notes,
        recordedBy: 'عامل المزرعة'
      });

      const feedName = getFeedArabicName(feedInput.mainType, feedInput.subType);
      toast({
        title: "تم الحفظ بنجاح",
        description: `تم تسجيل دخول ${feedInput.quantity} كيلو من ${feedName} في المخزون`,
        variant: "default"
      });

      // Reset form and reload data
      setFeedInput({ mainType: '', subType: '', quantity: '', unitPrice: '', notes: '' });
      await loadFeedData(); // Refresh stock levels
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Feed Distribution Submission
  const handleFeedDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedDistribution.barnId || !feedDistribution.mainType || !feedDistribution.quantity) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Use integrated inventory service for distribution
      await integratedInventoryService.distributeFeedFromInventory({
        mainType: feedDistribution.mainType,
        subType: feedDistribution.subType,
        quantity: parseFloat(feedDistribution.quantity),
        notes: feedDistribution.notes,
        recordedBy: 'عامل المزرعة'
      });
      
      // Record feeding activity
      const feedId = generateFeedId(feedDistribution.mainType, feedDistribution.subType);
      await dataService.feedingRecords.create({
        barnId: feedDistribution.barnId,
        feedType: feedId,
        quantityIssued: parseFloat(feedDistribution.quantity),
        animalsCount: 10, // Default, should be dynamic
        feedPerAnimal: parseFloat(feedDistribution.quantity) / 10,
        date: new Date(),
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        recordedBy: 'عامل المزرعة',
        notes: feedDistribution.notes
      });

      const feedName = getFeedArabicName(feedDistribution.mainType, feedDistribution.subType);
      toast({
        title: "تم الحفظ بنجاح",
        description: `تم تسجيل صرف ${feedDistribution.quantity} كيلو من ${feedName} للحظيرة ${feedDistribution.barnId}`,
        variant: "default"
      });

      // Reset form and reload data
      setFeedDistribution({ barnId: '', mainType: '', subType: '', quantity: '', notes: '' });
      await loadFeedData(); // Refresh stock levels
    } catch (error) {
      toast({
        title: "خطأ في الحفظ", 
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="space-y-6">
      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            تسجيل دخول علف
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            صرف التغذية
          </TabsTrigger>
        </TabsList>

        {/* Feed Input Tab */}
        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                تسجيل دخول علف جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFeedInput} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="feedType">نوع العلف *</Label>
                    <Select 
                      value={feedInput.mainType} 
                      onValueChange={(value) => setFeedInput(prev => ({ 
                        ...prev, 
                        mainType: value as FeedMainType, 
                        subType: '' 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع العلف" />
                      </SelectTrigger>
                      <SelectContent>
                        {getMainFeedTypes().map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedSubType">نوع فرعي *</Label>
                    <Select 
                      value={feedInput.subType} 
                      onValueChange={(value) => setFeedInput(prev => ({ ...prev, subType: value }))}
                      disabled={!feedInput.mainType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع الفرعي" />
                      </SelectTrigger>
                      <SelectContent>
                        {feedInput.mainType && getSubTypesForMainType(feedInput.mainType).map(subType => {
                          const stockKey = `${feedInput.mainType}_${subType.value}`;
                          const currentStock = stockLevels[stockKey] || 0;
                          return (
                            <SelectItem key={subType.value} value={subType.value}>
                              <div className="flex justify-between items-center w-full">
                                <span>{subType.label}</span>
                                <Badge variant={currentStock < 50 ? "destructive" : "secondary"} className="ml-2">
                                  {currentStock} كيلو
                                </Badge>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {/* Stock level indicator */}
                    {feedInput.mainType && feedInput.subType && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4" />
                        <span>المخزون الحالي: </span>
                        <Badge variant={stockLevels[`${feedInput.mainType}_${feedInput.subType}`] < 50 ? "destructive" : "secondary"}>
                          {stockLevels[`${feedInput.mainType}_${feedInput.subType}`] || 0} كيلو
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">الكمية (كيلوجرام) *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="أدخل الكمية بالكيلوجرام"
                      value={feedInput.quantity}
                      onChange={(e) => setFeedInput(prev => ({ ...prev, quantity: e.target.value }))}
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">سعر الكيلو (اختياري)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      placeholder="أدخل سعر الكيلو بالجنيه"
                      value={feedInput.unitPrice}
                      onChange={(e) => setFeedInput(prev => ({ ...prev, unitPrice: e.target.value }))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input
                    id="notes"
                    placeholder="ملاحظات إضافية (اختياري)"
                    value={feedInput.notes}
                    onChange={(e) => setFeedInput(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ دخول العلف'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feed Distribution Tab */}
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                صرف التغذية للحظائر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFeedDistribution} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="barnId">الحظيرة *</Label>
                    <Select 
                      value={feedDistribution.barnId} 
                      onValueChange={(value) => setFeedDistribution(prev => ({ ...prev, barnId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحظيرة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="barn_001">حظيرة رقم 1</SelectItem>
                        <SelectItem value="barn_002">حظيرة رقم 2</SelectItem>
                        <SelectItem value="barn_003">حظيرة رقم 3</SelectItem>
                        <SelectItem value="barn_004">حظيرة رقم 4</SelectItem>
                        <SelectItem value="barn_005">حظيرة رقم 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="distributionFeedType">نوع العلف *</Label>
                    <Select 
                      value={feedDistribution.mainType} 
                      onValueChange={(value) => setFeedDistribution(prev => ({ 
                        ...prev, 
                        mainType: value as FeedMainType, 
                        subType: '' 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع العلف" />
                      </SelectTrigger>
                      <SelectContent>
                        {getMainFeedTypes().map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="distributionFeedSubType">نوع فرعي *</Label>
                    <Select 
                      value={feedDistribution.subType} 
                      onValueChange={(value) => setFeedDistribution(prev => ({ ...prev, subType: value }))}
                      disabled={!feedDistribution.mainType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر النوع الفرعي" />
                      </SelectTrigger>
                      <SelectContent>
                        {feedDistribution.mainType && getSubTypesForMainType(feedDistribution.mainType).map(subType => {
                          const stockKey = `${feedDistribution.mainType}_${subType.value}`;
                          const currentStock = stockLevels[stockKey] || 0;
                          return (
                            <SelectItem key={subType.value} value={subType.value} disabled={currentStock <= 0}>
                              <div className="flex justify-between items-center w-full">
                                <span>{subType.label}</span>
                                <div className="flex items-center gap-2">
                                  {currentStock <= 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                  <Badge variant={currentStock <= 0 ? "destructive" : currentStock < 50 ? "outline" : "secondary"}>
                                    {currentStock} كيلو
                                  </Badge>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {/* Stock level indicator for distribution */}
                    {feedDistribution.mainType && feedDistribution.subType && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4" />
                        <span>المخزون المتاح: </span>
                        <Badge variant={stockLevels[`${feedDistribution.mainType}_${feedDistribution.subType}`] <= 0 ? "destructive" : "secondary"}>
                          {stockLevels[`${feedDistribution.mainType}_${feedDistribution.subType}`] || 0} كيلو
                        </Badge>
                        {stockLevels[`${feedDistribution.mainType}_${feedDistribution.subType}`] <= 0 && (
                          <span className="text-red-500 text-xs">لا يوجد مخزون!</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="distributionQuantity">الكمية المصروفة (كيلوجرام) *</Label>
                    <Input
                      id="distributionQuantity"
                      type="number"
                      placeholder="أدخل الكمية المصروفة"
                      value={feedDistribution.quantity}
                      onChange={(e) => setFeedDistribution(prev => ({ ...prev, quantity: e.target.value }))}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distributionNotes">ملاحظات</Label>
                  <Input
                    id="distributionNotes"
                    placeholder="ملاحظات إضافية (اختياري)"
                    value={feedDistribution.notes}
                    onChange={(e) => setFeedDistribution(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ صرف التغذية'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}