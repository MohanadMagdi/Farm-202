import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '@/lib/data-service-unified';
import { integratedInventoryService } from '@/lib/integrated-inventory-service';
import { PlusCircle, Syringe, Heart, Shield, Package, AlertTriangle, Pill, ArrowRightLeft } from 'lucide-react';
import { WarehouseItem, Animal } from '@shared/types';
import useInventorySync from '@/hooks/use-inventory-sync';

export function MedicinesTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { stockLevels, refreshInventory } = useInventorySync();
  const [availableMedicines, setAvailableMedicines] = useState<WarehouseItem[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [barns, setBarns] = useState<any[]>([]);

  // Medicine Input Form State
  const [medicineInput, setMedicineInput] = useState({
    name: '',
    type: '',
    quantity: '',
    unit: 'قطعة',
    unitPrice: '',
    expiryDate: '',
    notes: ''
  });

  // Load available medicines
  useEffect(() => {
    loadMedicineData();
  }, []);

  const loadMedicineData = async () => {
    try {
      // Load medicines from inventory
      const medicines = await integratedInventoryService.getAvailableMedicineItems();
      setAvailableMedicines(medicines);

      // Load animals and barns
      const [animalsData, barnsData] = await Promise.all([
        dataService.getAnimals(),
        dataService.getBarns()
      ]);
      setAnimals(animalsData);
      setBarns(barnsData);
    } catch (error) {
      console.error('Error loading medicine data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "تعذر تحميل بيانات الأدوية",
        variant: "destructive"
      });
    }
  };

  // Medicine Distribution Form State
  const [medicineDistribution, setMedicineDistribution] = useState({
    type: '',
    medicineId: '',
    animalId: '',
    barnId: '',
    dosage: '',
    administrationMethod: 'فموي',
    reason: '',
    notes: ''
  });

  // Handle Medicine Input Submission
  const handleMedicineInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineInput.name || !medicineInput.type || !medicineInput.quantity) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Use integrated inventory service
      await integratedInventoryService.addMedicineToInventory({
        name: medicineInput.name,
        type: 'medicine',
        quantity: parseFloat(medicineInput.quantity),
        unitPrice: medicineInput.unitPrice ? parseFloat(medicineInput.unitPrice) : 0,
        hasExpiry: !!medicineInput.expiryDate,
        expiryDate: medicineInput.expiryDate ? new Date(medicineInput.expiryDate) : undefined,
        notes: medicineInput.notes
      });

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم تسجيل دخول ${medicineInput.quantity} ${medicineInput.unit} من ${medicineInput.name} في المخزون`,
        variant: "default"
      });

      // Reset form and reload data
      setMedicineInput({ 
        name: '', 
        type: '', 
        quantity: '', 
        unit: 'قطعة',
        unitPrice: '',
        expiryDate: '', 
        notes: '' 
      });
      await loadMedicineData();
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Medicine Distribution Submission
  const handleMedicineDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineDistribution.type || !medicineDistribution.medicineId || !medicineDistribution.dosage) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    // Validation for treatment vs vaccination
    if (medicineDistribution.type === 'treatment' && !medicineDistribution.animalId) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب تحديد الحيوان للعلاج",
        variant: "destructive"
      });
      return;
    }

    if (medicineDistribution.type === 'vaccination' && !medicineDistribution.barnId) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب تحديد الحظيرة للتحصين",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const selectedMedicine = availableMedicines.find(m => m.id === medicineDistribution.medicineId);
      if (!selectedMedicine) {
        throw new Error('الدواء المختار غير موجود');
      }

      // Check stock availability
      if (selectedMedicine.currentStock < parseFloat(medicineDistribution.dosage)) {
        throw new Error('كمية غير كافية في المخزون');
      }

      // Record health activity for treatment or vaccination
      if (medicineDistribution.type === 'treatment') {
        await dataService.createHealthRecord({
          animalId: medicineDistribution.animalId,
          type: 'treatment',
          description: `علاج - ${selectedMedicine.name}`,
          medicineUsed: selectedMedicine.name,
          dosage: `${medicineDistribution.dosage} ${medicineDistribution.administrationMethod === 'فموي' ? 'مل' : 'جرعة'}`,
          cost: parseFloat(medicineDistribution.dosage) * selectedMedicine.unitPrice,
          date: new Date(),
          recordedBy: 'عامل المزرعة',
          notes: `طريقة الإعطاء: ${medicineDistribution.administrationMethod} - ${medicineDistribution.reason} - ${medicineDistribution.notes}`
        });
      } else {
        // For vaccination, record for all animals in the barn
        const barnAnimals = animals.filter(animal => animal.barnId === medicineDistribution.barnId);
        for (const animal of barnAnimals) {
          await dataService.createHealthRecord({
            animalId: animal.id,
            type: 'vaccination',
            description: `تحصين - ${selectedMedicine.name}`,
            medicineUsed: selectedMedicine.name,
            dosage: `${parseFloat(medicineDistribution.dosage) / barnAnimals.length} جرعة`,
            cost: (parseFloat(medicineDistribution.dosage) * selectedMedicine.unitPrice) / barnAnimals.length,
            date: new Date(),
            recordedBy: 'عامل المزرعة',
            notes: `تحصين جماعي للحظيرة ${medicineDistribution.barnId} - ${medicineDistribution.notes}`
          });
        }
      }

      // Update medicine stock
      await dataService.updateWarehouseItem(selectedMedicine.id, {
        currentStock: selectedMedicine.currentStock - parseFloat(medicineDistribution.dosage),
        updatedAt: new Date()
      });

      // Record stock movement
      await dataService.createStockMovement({
        itemId: selectedMedicine.id,
        type: 'out',
        quantity: parseFloat(medicineDistribution.dosage),
        unitPrice: selectedMedicine.unitPrice,
        totalCost: parseFloat(medicineDistribution.dosage) * selectedMedicine.unitPrice,
        date: new Date(),
        reason: medicineDistribution.type === 'treatment' ? `علاج ${medicineDistribution.animalId}` : `تحصين حظيرة ${medicineDistribution.barnId}`,
        recordedBy: 'عامل المزرعة'
      });

      const targetDescription = medicineDistribution.type === 'treatment' 
        ? `الحيوان ${medicineDistribution.animalId}`
        : `الحظيرة ${medicineDistribution.barnId}`;

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم تسجيل ${getMedicineTypeName(medicineDistribution.type)} بـ${selectedMedicine.name} لـ ${targetDescription}`,
        variant: "default"
      });

      // Reset form
      setMedicineDistribution({
        type: '',
        medicineId: '',
        animalId: '',
        barnId: '',
        dosage: '',
        administrationMethod: 'فموي',
        reason: '',
        notes: ''
      });

      // Refresh data
      await loadMedicineData();
      await refreshInventory();
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getMedicineTypeName = (type: string) => {
    const types: Record<string, string> = {
      treatment: 'علاج',
      vaccination: 'تحصين'
    };
    return types[type] || type;
  };

  // Get low stock medicines
  const lowStockMedicines = availableMedicines.filter(medicine => 
    medicine.currentStock <= medicine.minStockLevel
  );

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockMedicines.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
            <CardTitle className="text-amber-800">تنبيه: أدوية منخفضة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockMedicines.map((medicine) => (
                <Badge key={medicine.id} variant="secondary" className="bg-amber-100 text-amber-800">
                  {medicine.name}: {medicine.currentStock} {medicine.unit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            إدخال أدوية
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            صرف أدوية
          </TabsTrigger>
        </TabsList>

        {/* Medicine Input Tab */}
        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                تسجيل دخول دواء جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMedicineInput} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicineName">اسم الدواء *</Label>
                    <Input
                      id="medicineName"
                      placeholder="أدخل اسم الدواء"
                      value={medicineInput.name}
                      onChange={(e) => setMedicineInput(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicineType">النوع *</Label>
                    <Select 
                      value={medicineInput.type} 
                      onValueChange={(value) => setMedicineInput(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الدواء" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="treatment">علاج</SelectItem>
                        <SelectItem value="vaccination">تحصين</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">الكمية *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="أدخل الكمية"
                      value={medicineInput.quantity}
                      onChange={(e) => setMedicineInput(prev => ({ ...prev, quantity: e.target.value }))}
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">الوحدة *</Label>
                    <Select 
                      value={medicineInput.unit} 
                      onValueChange={(value) => setMedicineInput(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الوحدة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="قرص">قرص</SelectItem>
                        <SelectItem value="مليلتر">مليلتر</SelectItem>
                        <SelectItem value="جرام">جرام</SelectItem>
                        <SelectItem value="أمبولة">أمبولة</SelectItem>
                        <SelectItem value="زجاجة">زجاجة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">سعر الوحدة (اختياري)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      placeholder="أدخل السعر بالجنيه"
                      value={medicineInput.unitPrice}
                      onChange={(e) => setMedicineInput(prev => ({ ...prev, unitPrice: e.target.value }))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={medicineInput.expiryDate}
                      onChange={(e) => setMedicineInput(prev => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicineUnit">الوحدة</Label>
                    <Select
                      value={medicineInput.unit}
                      onValueChange={(value) => setMedicineInput(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الوحدة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="قطعة">قطعة</SelectItem>
                        <SelectItem value="أمبولة">أمبولة</SelectItem>
                        <SelectItem value="مل">مل</SelectItem>
                        <SelectItem value="جرام">جرام</SelectItem>
                        <SelectItem value="علبة">علبة</SelectItem>
                        <SelectItem value="قارورة">قارورة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>



                <div className="space-y-2">
                  <Label htmlFor="medicineNotes">ملاحظات</Label>
                  <Input
                    id="medicineNotes"
                    placeholder="ملاحظات إضافية (اختياري)"
                    value={medicineInput.notes}
                    onChange={(e) => setMedicineInput(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ دخول الدواء'}
                </Button>
              </form>

              {/* Available Medicines Section */}
              {availableMedicines.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    الأدوية المتاحة في المخزون
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableMedicines.map(medicine => (
                      <div key={medicine.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{medicine.name}</span>
                          <Badge variant={medicine.currentStock < medicine.minStockLevel ? "destructive" : "secondary"}>
                            {medicine.currentStock} {medicine.unit}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          <div>النوع: {medicine.category}</div>
                          {medicine.expiryDate && (
                            <div className="flex items-center gap-1">
                              {new Date(medicine.expiryDate) < new Date() ? (
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                              ) : null}
                              انتهاء الصلاحية: {new Date(medicine.expiryDate).toLocaleDateString('ar-EG')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medicine Distribution Tab */}
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="w-5 h-5" />
                صرف الأدوية والتحصينات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMedicineDistribution} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="distributionType">نوع العملية *</Label>
                    <Select 
                      value={medicineDistribution.type} 
                      onValueChange={(value) => setMedicineDistribution(prev => ({ 
                        ...prev, 
                        type: value,
                        animalId: '',
                        barnId: ''
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع العملية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="treatment">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            علاج
                          </div>
                        </SelectItem>
                        <SelectItem value="vaccination">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            تحصين
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicineSelect">الدواء *</Label>
                    <Select
                      value={medicineDistribution.medicineId}
                      onValueChange={(value) => setMedicineDistribution(prev => ({ ...prev, medicineId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدواء" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMedicines.filter(medicine => medicine.currentStock > 0).map((medicine) => (
                          <SelectItem key={medicine.id} value={medicine.id}>
                            {medicine.name} (متوفر: {medicine.currentStock} {medicine.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditional fields based on type */}
                {medicineDistribution.type === 'treatment' && (
                  <div className="space-y-2">
                    <Label htmlFor="animalSelect">الحيوان *</Label>
                    <Select
                      value={medicineDistribution.animalId}
                      onValueChange={(value) => setMedicineDistribution(prev => ({ ...prev, animalId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحيوان" />
                      </SelectTrigger>
                      <SelectContent>
                        {animals.map((animal) => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {animal.earTagId || animal.id} - {animal.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {medicineDistribution.type === 'vaccination' && (
                  <div className="space-y-2">
                    <Label htmlFor="barnId">الحظيرة *</Label>
                    <Select 
                      value={medicineDistribution.barnId} 
                      onValueChange={(value) => setMedicineDistribution(prev => ({ ...prev, barnId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحظيرة" />
                      </SelectTrigger>
                      <SelectContent>
                        {barns.map((barn) => (
                          <SelectItem key={barn.id} value={barn.id}>
                            {barn.name} ({animals.filter(a => a.barnId === barn.id).length} حيوان)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dosage">الجرعة (مليلتر) *</Label>
                    <Input
                      id="dosage"
                      type="number"
                      placeholder="أدخل الجرعة بالمليلتر"
                      value={medicineDistribution.dosage}
                      onChange={(e) => setMedicineDistribution(prev => ({ ...prev, dosage: e.target.value }))}
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="administrationMethod">طريقة الإعطاء</Label>
                    <Select
                      value={medicineDistribution.administrationMethod}
                      onValueChange={(value) => setMedicineDistribution(prev => ({ ...prev, administrationMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر طريقة الإعطاء" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="فموي">فموي</SelectItem>
                        <SelectItem value="حقن عضلي">حقن عضلي</SelectItem>
                        <SelectItem value="حقن وريدي">حقن وريدي</SelectItem>
                        <SelectItem value="حقن تحت الجلد">حقن تحت الجلد</SelectItem>
                        <SelectItem value="موضعي">موضعي</SelectItem>
                        <SelectItem value="استنشاق">استنشاق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">سبب العلاج/التحصين</Label>
                  <Input
                    id="reason"
                    placeholder="مثال: التهاب رئوي، تحصين دوري، وقاية"
                    value={medicineDistribution.reason}
                    onChange={(e) => setMedicineDistribution(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distributionNotes">ملاحظات</Label>
                  <Textarea
                    id="distributionNotes"
                    placeholder="أي ملاحظات إضافية حول العلاج أو التحصين..."
                    value={medicineDistribution.notes}
                    onChange={(e) => setMedicineDistribution(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'جاري الحفظ...' : `تسجيل ${getMedicineTypeName(medicineDistribution.type)}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}