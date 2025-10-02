import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '@/lib/data-service';
import { PlusCircle, Weight, Baby, Search } from 'lucide-react';

export function AnimalsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // New Animal Form State
  const [newAnimal, setNewAnimal] = useState({
    category: '',
    earTagId: '',
    birthDate: '',
    purchaseDate: '',
    weight: '',
    barnId: '',
    notes: ''
  });

  // Weight Record Form State
  const [weightRecord, setWeightRecord] = useState({
    animalId: '',
    weight: '',
    date: '',
    notes: ''
  });

  // Weaning Record Form State
  const [weaningRecord, setWeaningRecord] = useState({
    animalId: '',
    date: '',
    targetBarnId: '',
    notes: ''
  });

  // Handle New Animal Submission
  const handleNewAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnimal.category || !newAnimal.earTagId || !newAnimal.weight) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (!newAnimal.birthDate && !newAnimal.purchaseDate) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب تحديد تاريخ الولادة أو تاريخ الشراء",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await dataService.animals.create({
        earTagId: newAnimal.earTagId,
        category: newAnimal.category as 'male' | 'female' | 'newborn',
        sex: newAnimal.category === 'newborn' ? 'male' : newAnimal.category as 'male' | 'female',
        weight: parseFloat(newAnimal.weight),
        ageMonths: 0,
        purchaseDate: newAnimal.purchaseDate ? new Date(newAnimal.purchaseDate) : new Date(),
        purchasePrice: 0,
        pricingMethod: 'manual',
        barnId: newAnimal.barnId || 'barn_001',
        healthStatus: 'صحي',
        isIsolated: false,
        birthDate: newAnimal.birthDate ? new Date(newAnimal.birthDate) : undefined,
        isPregnant: newAnimal.category === 'female' ? false : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'عامل المزرعة',
        updatedBy: 'عامل المزرعة'
      });

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم تسجيل ${getCategoryName(newAnimal.category)} برقم ${newAnimal.earTagId}`,
        variant: "default"
      });

      // Reset form
      setNewAnimal({ 
        category: '', earTagId: '', birthDate: '', purchaseDate: '', 
        weight: '', barnId: '', notes: '' 
      });
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

  // Handle Weight Record Submission
  const handleWeightRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightRecord.animalId || !weightRecord.weight || !weightRecord.date) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await dataService.weightRecords.create({
        animalId: weightRecord.animalId,
        weight: parseFloat(weightRecord.weight),
        date: new Date(weightRecord.date),
        recordedBy: 'عامل المزرعة',
        notes: `وزن دوري - ${weightRecord.notes}`
      });

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم تسجيل وزن ${weightRecord.weight} كيلو للحيوان ${weightRecord.animalId}`,
        variant: "default"
      });

      // Reset form
      setWeightRecord({ animalId: '', weight: '', date: '', notes: '' });
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

  // Handle Weaning Record Submission
  const handleWeaningRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weaningRecord.animalId || !weaningRecord.date) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Record barn movement if target barn is specified
      if (weaningRecord.targetBarnId) {
        await dataService.barnMovements.create({
          animalId: weaningRecord.animalId,
          fromBarnId: undefined,
          toBarnId: weaningRecord.targetBarnId,
          date: new Date(weaningRecord.date),
          reason: `فطام - ${weaningRecord.notes}`,
          recordedBy: 'عامل المزرعة'
        });
      }

      // Record weaning as a health record
      await dataService.healthRecords.create({
        animalId: weaningRecord.animalId,
        type: 'checkup',
        description: 'فطام',
        cost: 0,
        date: new Date(weaningRecord.date),
        recordedBy: 'عامل المزرعة',
        notes: `فطام - ${weaningRecord.targetBarnId ? `نقل إلى ${weaningRecord.targetBarnId}` : ''} ${weaningRecord.notes}`
      });

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم تسجيل فطام الحيوان ${weaningRecord.animalId}`,
        variant: "default"
      });

      // Reset form
      setWeaningRecord({ animalId: '', date: '', targetBarnId: '', notes: '' });
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
  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      male: 'ذكر',
      female: 'أنثى',
      newborn: 'مولود'
    };
    return categories[category] || category;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="new-animal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new-animal" className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            تسجيل حيوان جديد
          </TabsTrigger>
          <TabsTrigger value="weight" className="flex items-center gap-2">
            <Weight className="w-4 h-4" />
            تسجيل وزن
          </TabsTrigger>
          <TabsTrigger value="weaning" className="flex items-center gap-2">
            <Baby className="w-4 h-4" />
            تسجيل فطام
          </TabsTrigger>
        </TabsList>

        {/* New Animal Tab */}
        <TabsContent value="new-animal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                تسجيل حيوان جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewAnimal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">نوع الحيوان *</Label>
                    <Select 
                      value={newAnimal.category} 
                      onValueChange={(value) => setNewAnimal(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الحيوان" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                        <SelectItem value="newborn">مولود</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="earTagId">رقم/كود الحيوان *</Label>
                    <Input
                      id="earTagId"
                      placeholder="أدخل رقم الحيوان"
                      value={newAnimal.earTagId}
                      onChange={(e) => setNewAnimal(prev => ({ ...prev, earTagId: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">تاريخ الولادة</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={newAnimal.birthDate}
                      onChange={(e) => setNewAnimal(prev => ({ ...prev, birthDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">تاريخ الشراء</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={newAnimal.purchaseDate}
                      onChange={(e) => setNewAnimal(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">الوزن (كيلوجرام) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="أدخل الوزن"
                      value={newAnimal.weight}
                      onChange={(e) => setNewAnimal(prev => ({ ...prev, weight: e.target.value }))}
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barnId">الحظيرة</Label>
                    <Select 
                      value={newAnimal.barnId} 
                      onValueChange={(value) => setNewAnimal(prev => ({ ...prev, barnId: value }))}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="animalNotes">ملاحظات</Label>
                  <Input
                    id="animalNotes"
                    placeholder="ملاحظات إضافية (اختياري)"
                    value={newAnimal.notes}
                    onChange={(e) => setNewAnimal(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ الحيوان الجديد'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weight Record Tab */}
        <TabsContent value="weight">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Weight className="w-5 h-5" />
                تسجيل وزن جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWeightRecord} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weightAnimalId">رقم الحيوان *</Label>
                    <div className="relative">
                      <Input
                        id="weightAnimalId"
                        placeholder="أدخل رقم الحيوان"
                        value={weightRecord.animalId}
                        onChange={(e) => setWeightRecord(prev => ({ ...prev, animalId: e.target.value }))}
                      />
                      <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newWeight">الوزن الجديد (كيلوجرام) *</Label>
                    <Input
                      id="newWeight"
                      type="number"
                      placeholder="أدخل الوزن الجديد"
                      value={weightRecord.weight}
                      onChange={(e) => setWeightRecord(prev => ({ ...prev, weight: e.target.value }))}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weightDate">تاريخ الوزن *</Label>
                  <Input
                    id="weightDate"
                    type="date"
                    value={weightRecord.date}
                    onChange={(e) => setWeightRecord(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weightNotes">ملاحظات</Label>
                  <Input
                    id="weightNotes"
                    placeholder="ملاحظات إضافية (اختياري)"
                    value={weightRecord.notes}
                    onChange={(e) => setWeightRecord(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ الوزن الجديد'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weaning Record Tab */}
        <TabsContent value="weaning">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="w-5 h-5" />
                تسجيل فطام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWeaningRecord} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weaningAnimalId">رقم الحيوان *</Label>
                    <div className="relative">
                      <Input
                        id="weaningAnimalId"
                        placeholder="أدخل رقم الحيوان"
                        value={weaningRecord.animalId}
                        onChange={(e) => setWeaningRecord(prev => ({ ...prev, animalId: e.target.value }))}
                      />
                      <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weaningDate">تاريخ الفطام *</Label>
                    <Input
                      id="weaningDate"
                      type="date"
                      value={weaningRecord.date}
                      onChange={(e) => setWeaningRecord(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetBarnId">الحظيرة الجديدة (اختياري)</Label>
                  <Select 
                    value={weaningRecord.targetBarnId} 
                    onValueChange={(value) => setWeaningRecord(prev => ({ ...prev, targetBarnId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحظيرة الجديدة (اختياري)" />
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
                  <Label htmlFor="weaningNotes">ملاحظات</Label>
                  <Input
                    id="weaningNotes"
                    placeholder="ملاحظات إضافية (اختياري)"
                    value={weaningRecord.notes}
                    onChange={(e) => setWeaningRecord(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ تسجيل الفطام'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}