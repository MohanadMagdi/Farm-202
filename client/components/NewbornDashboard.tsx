import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { AlertTriangle, DollarSign, TrendingUp, Users, Calendar, Baby, ArrowRight, ArrowLeftRight } from 'lucide-react';
import type { Animal, Barn } from '@shared/types';
import { NewbornCard } from './NewbornCard';
import { NewbornsTable } from './NewbornsTable';
import { WeaningModal } from './WeaningModal';
import { NewbornBusinessRulesAlert } from './NewbornBusinessRulesAlert';
import { InternalProductionFilter } from './InternalProductionFilter';
import { AutomaticTransferDashboard } from './AutomaticTransferDashboard';
import { AutoTransferAlert } from './AutoTransferAlert';
import { newbornManagementService } from '../lib/newborn-management-service';
import { newbornCostCenterService } from '../lib/newborn-cost-center-service';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface NewbornDashboardProps {
  newborns: Animal[];
  mothers: Animal[];
  availableBarns?: Barn[];
  onNewbornSelect: (newborn: Animal) => void;
  onWeaningRequest: (newborn: Animal) => void;
  onWeaningConfirm?: (newbornId: string, newBarnId: string, weaningDate: Date) => void;
  onTransferConfirm?: (newbornId: string, newBarnId: string) => void; // إضافة معالج تأكيد النقل
  onRefresh?: () => void; // إضافة دالة التحديث
}

export function NewbornDashboard({ 
  newborns, 
  mothers,
  availableBarns = [],
  onNewbornSelect, 
  onWeaningRequest,
  onWeaningConfirm,
  onTransferConfirm,
  onRefresh = () => {} // قيمة افتراضية
}: NewbornDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [weaningModalOpen, setWeaningModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedNewbornForWeaning, setSelectedNewbornForWeaning] = useState<Animal | null>(null);
  const [selectedNewbornForTransfer, setSelectedNewbornForTransfer] = useState<Animal | null>(null);
  const [selectedBarnForTransfer, setSelectedBarnForTransfer] = useState<string>("");

  // حساب الإحصائيات
  const analytics = newbornManagementService.calculateNewbornAnalytics(newborns);
  const financialReport = newbornCostCenterService.generateNewbornFinancialReport(newborns, mothers);
  const needingAttention = newbornManagementService.getNewbornsNeedingAttention(newborns);
  const readyForWeaning = newbornManagementService.getNewbornsReadyForWeaning(newborns);

  const handleWeaningRequest = (newborn: Animal) => {
    setSelectedNewbornForWeaning(newborn);
    setWeaningModalOpen(true);
  };

  const handleTransferRequest = (newborn: Animal) => {
    setSelectedNewbornForTransfer(newborn);
    setSelectedBarnForTransfer("");
    setTransferModalOpen(true);
  };

  const handleWeaningConfirm = (newbornId: string, newBarnId: string, weaningDate: Date) => {
    if (onWeaningConfirm) {
      onWeaningConfirm(newbornId, newBarnId, weaningDate);
    }
    setWeaningModalOpen(false);
    setSelectedNewbornForWeaning(null);
  };

  const handleTransferConfirm = () => {
    if (onTransferConfirm && selectedNewbornForTransfer && selectedBarnForTransfer) {
      onTransferConfirm(selectedNewbornForTransfer.id, selectedBarnForTransfer);
    }
    setTransferModalOpen(false);
    setSelectedNewbornForTransfer(null);
    setSelectedBarnForTransfer("");
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Auto Transfer Alert */}
      <AutoTransferAlert 
        animals={newborns}
        onTransferComplete={onRefresh}
      />
      
      {/* Business Rules Alert */}
      <NewbornBusinessRulesAlert />

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 ml-1 text-blue-600" />
              إجمالي المواليد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.totalNewborns}
            </div>
            <p className="text-xs text-muted-foreground">
              ذكور: {analytics.maleCount} | إناث: {analytics.femaleCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 ml-1 text-green-600" />
              جاهز للفطام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.readyForWeaning}
            </div>
            <p className="text-xs text-muted-foreground">
              عمر 60-75 يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Baby className="h-4 w-4 ml-1 text-yellow-600" />
              مفطوم هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.weanedThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">
              متوسط العمر: {analytics.averageAge} يوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 ml-1 text-purple-600" />
              الصحة العامة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.healthyPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              وزن متوسط: {analytics.averageWeight} كج
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 ml-1 text-green-600" />
              قيمة الإنتاج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.totalProductionValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              جنيه مصري
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="space-y-3">
        {readyForWeaning.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-green-600 ml-2" />
              <div>
                <h4 className="font-medium text-green-800">مواليد جاهزة للفطام</h4>
                <p className="text-sm text-green-700">
                  يوجد {readyForWeaning.length} مولود جاهز للفطام (عمر 60+ يوم)
                </p>
              </div>
            </div>
          </div>
        )}

        {needingAttention.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 ml-2" />
              <div>
                <h4 className="font-medium text-red-800">مواليد تحتاج انتباه</h4>
                <p className="text-sm text-red-700">
                  يوجد {needingAttention.length} مولود يحتاج متابعة فورية
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="weaning">الفطام</TabsTrigger>
          <TabsTrigger value="transfer">النقل التلقائي</TabsTrigger>
          <TabsTrigger value="production">الإنتاج الداخلي</TabsTrigger>
          <TabsTrigger value="costs">مراكز التكلفة</TabsTrigger>
          <TabsTrigger value="table">جدول المواليد</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {newborns.slice(0, 6).map(newborn => {
              const mother = mothers.find(m => m.id === newborn.motherId);
              return (
                <NewbornCard
                  key={newborn.id}
                  newborn={newborn}
                  mother={mother}
                  onSelect={() => onNewbornSelect(newborn)}
                  onWeaningRequest={() => handleWeaningRequest(newborn)}
                />
              );
            })}
          </div>
          
          {newborns.length > 6 && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => setSelectedTab('table')}
              >
                عرض جميع المواليد ({newborns.length})
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Weaning Tab */}
        <TabsContent value="weaning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 ml-2 text-green-600" />
                إدارة الفطام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {readyForWeaning.map(newborn => {
                  const mother = mothers.find(m => m.id === newborn.motherId);
                  return (
                    <NewbornCard
                      key={newborn.id}
                      newborn={newborn}
                      mother={mother}
                      onSelect={() => onNewbornSelect(newborn)}
                      onWeaningRequest={() => handleWeaningRequest(newborn)}
                      showWeaningButton={true}
                    />
                  );
                })}
                
                {readyForWeaning.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا يوجد مواليد جاهزة للفطام حالياً
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automatic Transfer Tab */}
        <TabsContent value="transfer" className="space-y-4">
          <AutomaticTransferDashboard
            animals={newborns}
            onRefresh={onRefresh}
          />
        </TabsContent>

        {/* Internal Production Tab */}
        <TabsContent value="production" className="space-y-4">
          <InternalProductionFilter
            animals={newborns}
            mothers={mothers}
            onAnimalSelect={onNewbornSelect}
          />
        </TabsContent>

        {/* Cost Centers Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cost Center Breakdown */}
            {financialReport.costCenterBreakdown.map(({ costCenter, newborns: centerNewborns, totals }) => {
              const info = newbornCostCenterService.formatCostCenterInfo(costCenter);
              
              return (
                <Card key={costCenter.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{info.displayName}</span>
                      <Badge className={info.color}>
                        {centerNewborns.length} مولود
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">تكلفة الإنتاج</p>
                        <p className="text-lg font-semibold">{totals.productionCost.toLocaleString()} جنيه</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">القيمة الحالية</p>
                        <p className="text-lg font-semibold">{totals.currentValue.toLocaleString()} جنيه</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {info.description}
                    </div>
                    
                    {/* Show sample newborns */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">المواليد في هذا المركز:</p>
                      <div className="flex flex-wrap gap-2">
                        {centerNewborns.slice(0, 5).map(newborn => (
                          <Badge key={newborn.id} variant="outline" className="text-xs">
                            {newborn.earTagId}
                          </Badge>
                        ))}
                        {centerNewborns.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{centerNewborns.length - 5} أخرى
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص مالي شامل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">إجمالي تكلفة الإنتاج</p>
                  <p className="text-2xl font-bold text-red-600">
                    {financialReport.totalProductionCost.toLocaleString()} جنيه
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">إجمالي القيمة الحالية</p>
                  <p className="text-2xl font-bold text-green-600">
                    {financialReport.totalCurrentValue.toLocaleString()} جنيه
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">صافي القيمة</p>
                  <p className={`text-2xl font-bold ${
                    financialReport.totalCurrentValue - financialReport.totalProductionCost > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {(financialReport.totalCurrentValue - financialReport.totalProductionCost).toLocaleString()} جنيه
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table" className="space-y-4">
          <NewbornsTable
            newborns={newborns}
            mothers={mothers}
            onSelectNewborn={onNewbornSelect}
            onWeaningRequest={handleWeaningRequest}
            onTransferRequest={handleTransferRequest}
          />
        </TabsContent>
      </Tabs>

      {/* Weaning Modal */}
      {weaningModalOpen && selectedNewbornForWeaning && (
        <WeaningModal
          isOpen={weaningModalOpen}
          onClose={() => {
            setWeaningModalOpen(false);
            setSelectedNewbornForWeaning(null);
          }}
          newborn={selectedNewbornForWeaning}
          mother={mothers.find(m => m.id === selectedNewbornForWeaning.motherId)}
          availableBarns={availableBarns}
          onConfirmWeaning={handleWeaningConfirm}
        />
      )}

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={(open) => {
        if (!open) {
          setTransferModalOpen(false);
          setSelectedNewbornForTransfer(null);
          setSelectedBarnForTransfer("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>نقل الحيوان المفطوم إلى حظيرة جديدة</DialogTitle>
            <DialogDescription>
              قم باختيار الحظيرة المناسبة لنقل الحيوان بعد فطامه.
            </DialogDescription>
          </DialogHeader>
          {selectedNewbornForTransfer && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">الحيوان:</span>
                <span>{selectedNewbornForTransfer.earTagId}</span>
                <Badge className={selectedNewbornForTransfer.sex === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}>
                  {selectedNewbornForTransfer.sex === 'male' ? 'ذكر' : 'أنثى'}
                </Badge>
              </div>
              
              <div className="grid">
                <label htmlFor="barn" className="text-sm font-medium mb-2">
                  اختر الحظيرة
                </label>
                <Select 
                  value={selectedBarnForTransfer} 
                  onValueChange={setSelectedBarnForTransfer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحظيرة المناسبة" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBarns
                      .filter(barn => 
                        barn.isActive && 
                        (barn.type === 'mixed' || 
                          (selectedNewbornForTransfer.sex === 'male' && barn.type === 'male') ||
                          (selectedNewbornForTransfer.sex === 'female' && barn.type === 'female'))
                      )
                      .map(barn => (
                        <SelectItem key={barn.id} value={barn.id}>
                          {barn.name} ({barn.type === 'male' ? 'ذكور' : barn.type === 'female' ? 'إناث' : 'مختلط'})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setTransferModalOpen(false);
              setSelectedNewbornForTransfer(null);
            }}>
              إلغاء
            </Button>
            <Button 
              type="button" 
              onClick={handleTransferConfirm} 
              disabled={!selectedBarnForTransfer}
              className="flex items-center"
            >
              <ArrowLeftRight className="h-4 w-4 ml-1" />
              تأكيد النقل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
