import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatArabicDate } from "@/lib/arabic-utils";
import { dataService } from "@/lib/data-service";
import { calculateCurrentPrice, formatEGP, getPricingBreakdown } from "@/lib/pricing-utils";
import {
  validateMotherChildRelationship,
  createMotherChildRelationship,
  updateMotherChildRelationship
} from "@/lib/animal-relationships";
import type { Animal, Barn, AnimalCategory } from "@shared/types";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Lightbulb } from "lucide-react";

interface AnimalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  animal?: Animal | null;
  mode: "add" | "edit";
  animalType?: AnimalCategory;
}

export default function AnimalFormModal({
  isOpen,
  onClose,
  onSave,
  animal,
  mode,
  animalType = "male",
}: AnimalFormModalProps) {
  const [formData, setFormData] = useState({
    earTagId: "",
    category: animalType,
    sex: "male" as "male" | "female",
    weight: "",
    supplier: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasePrice: "",
    currentPrice: "",
    pricingMethod: "formula" as "manual" | "formula" | "market_rate",
    formulaMultiplier: "",
    barnId: "",
    healthStatus: "سليم",
    isIsolated: false,
    isolationType: "",
    isolationReason: "",
    
    // For females
    isPregnant: false,
    aiDate: "",
    expectedBirthDate: "",
    offspringCount: "",
    
    // For newborns
    motherId: "",
    birthDate: new Date().toISOString().split("T")[0],
    weaningDate: "",
  });

  const [barns, setBarns] = useState<Barn[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [earTagSuggestion, setEarTagSuggestion] = useState("");
  const [earTagExists, setEarTagExists] = useState(false);
  const [motherValidation, setMotherValidation] = useState({
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      loadSelectData();
      if (mode === "edit" && animal) {
        populateFormData(animal);
      } else {
        resetForm();
        generateEarTagSuggestion();
      }
    }
  }, [isOpen, mode, animal, animalType]);

  useEffect(() => {
    if (formData.earTagId && mode === "add") {
      checkEarTagExists();
    }
  }, [formData.earTagId, mode]);

  // Automatically update price when weight or pricing method changes
  useEffect(() => {
    if (formData.pricingMethod === 'formula' && formData.weight) {
      const tempAnimal = createAnimalFromFormData(formData);
      const calculatedPrice = calculateCurrentPrice(tempAnimal as any);
      if (calculatedPrice !== parseFloat(formData.currentPrice || '0')) {
        setFormData(prev => ({ ...prev, currentPrice: calculatedPrice.toString() }));
      }
    }
  }, [formData.weight, formData.pricingMethod, formData.formulaMultiplier, formData.purchasePrice, formData.birthDate]);

  // Validate mother selection in real-time
  useEffect(() => {
    if (formData.category === "newborn" && formData.motherId && formData.motherId !== "none" && animals.length > 0) {
      const validation = validateMotherChildRelationship(formData.motherId, formData.category, animals);
      setMotherValidation(validation);
    } else {
      setMotherValidation({ isValid: true, errors: [], warnings: [] });
    }
  }, [formData.motherId, formData.category, animals]);

  // Helper function to convert form data to Animal-like object for pricing
  const createAnimalFromFormData = (data: typeof formData) => {
    const animalLike = {
      ...data,
      weight: parseFloat(data.weight) || 0,
      purchasePrice: parseFloat(data.purchasePrice) || 0,
      currentPrice: parseFloat(data.currentPrice) || undefined,
      pricingMethod: data.pricingMethod as any,
      formulaMultiplier: data.formulaMultiplier ? parseFloat(data.formulaMultiplier) : undefined,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      purchaseDate: new Date(data.purchaseDate),
      offspringCount: data.offspringCount ? parseInt(data.offspringCount) : undefined
    };
    return animalLike;
  };

  const loadSelectData = async () => {
    try {
      const [barnsData, animalsData] = await Promise.all([
        dataService.barns.getAll(),
        dataService.animals.getAll(),
      ]);

      setBarns(barnsData.filter(barn => barn.isActive));
      setAnimals(animalsData);
    } catch (error) {
      console.error("Error loading select data:", error);
    }
  };

  const generateEarTagSuggestion = async () => {
    try {
      const nextId = await dataService.animals.getNextEarTagId(animalType);
      setEarTagSuggestion(nextId);
      setFormData(prev => ({ ...prev, earTagId: nextId }));
    } catch (error) {
      console.error("Error generating ear tag:", error);
    }
  };

  const checkEarTagExists = async () => {
    try {
      const exists = await dataService.animals.checkEarTagExists(
        formData.earTagId,
        animal?.id
      );
      setEarTagExists(exists);
    } catch (error) {
      console.error("Error checking ear tag:", error);
    }
  };

  const populateFormData = (animalData: Animal) => {
    setFormData({
      earTagId: animalData.earTagId,
      category: animalData.category,
      sex: animalData.sex,
      weight: animalData.weight.toString(),
      supplier: animalData.supplier || "",
      purchaseDate: animalData.purchaseDate.toISOString().split("T")[0],
      purchasePrice: animalData.purchasePrice.toString(),
      currentPrice: animalData.currentPrice?.toString() || "",
      pricingMethod: (animalData as any).pricingMethod || "formula",
      formulaMultiplier: (animalData as any).formulaMultiplier?.toString() || "",
      barnId: animalData.barnId,
      healthStatus: animalData.healthStatus,
      isIsolated: animalData.isIsolated,
      isolationType: animalData.isolationType || "",
      isolationReason: animalData.isolationReason || "",
      
      // For females
      isPregnant: animalData.isPregnant || false,
      aiDate: animalData.aiDate?.toISOString().split("T")[0] || "",
      expectedBirthDate: animalData.expectedBirthDate?.toISOString().split("T")[0] || "",
      offspringCount: animalData.offspringCount?.toString() || "",
      
      // For newborns
      motherId: animalData.motherId || "none",
      birthDate: animalData.birthDate?.toISOString().split("T")[0] || 
                 animalData.purchaseDate.toISOString().split("T")[0],
      weaningDate: animalData.weaningDate?.toISOString().split("T")[0] || "",
    });
  };

  const resetForm = () => {
    setFormData({
      earTagId: "",
      category: animalType,
      sex: animalType === "female" ? "female" : "male",
      weight: "",
      supplier: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      purchasePrice: "",
      currentPrice: "",
      pricingMethod: "formula" as "manual" | "formula" | "market_rate",
      formulaMultiplier: "",
      barnId: "",
      healthStatus: animalType === "female" ? "سليمة" : "سليم",
      isIsolated: false,
      isolationType: "",
      isolationReason: "",
      
      // For females
      isPregnant: false,
      aiDate: "",
      expectedBirthDate: "",
      offspringCount: "",
      
      // For newborns
      motherId: "none",
      birthDate: new Date().toISOString().split("T")[0],
      weaningDate: "",
    });
    setEarTagExists(false);
  };

  const handleSave = async () => {
    if (earTagExists) {
      toast({
        title: "رقم الأذن مكرر",
        description: "رقم الأذن موجود بالفعل، يرجى استخدام رقم آخر",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const animalData: Omit<Animal, 'id'> = {
        earTagId: formData.earTagId,
        category: formData.category,
        sex: formData.sex,
        weight: parseFloat(formData.weight),
        supplier: formData.supplier || undefined,
        purchaseDate: new Date(formData.purchaseDate),
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        currentPrice: formData.currentPrice ? parseFloat(formData.currentPrice) : undefined,
        pricingMethod: formData.pricingMethod as any,
        formulaMultiplier: formData.formulaMultiplier ? parseFloat(formData.formulaMultiplier) : undefined,
        barnId: formData.barnId,
        healthStatus: formData.healthStatus,
        isIsolated: formData.isIsolated,
        isolationType: formData.isolationType as any || undefined,
        isolationReason: formData.isolationReason || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "current_user", // TODO: Get from auth context
        updatedBy: "current_user",
      };

      // Add category-specific fields
      if (formData.category === "female") {
        animalData.isPregnant = formData.isPregnant;
        animalData.aiDate = formData.aiDate ? new Date(formData.aiDate) : undefined;
        animalData.expectedBirthDate = formData.expectedBirthDate ? new Date(formData.expectedBirthDate) : undefined;
        animalData.offspringCount = formData.offspringCount ? parseInt(formData.offspringCount) : undefined;
      }

      if (formData.category === "newborn") {
        animalData.motherId = formData.motherId === "none" || !formData.motherId ? undefined : formData.motherId;
        animalData.birthDate = formData.birthDate ? new Date(formData.birthDate) : undefined;
        animalData.weaningDate = formData.weaningDate ? new Date(formData.weaningDate) : undefined;
      }

      if (formData.isIsolated) {
        animalData.isolationDate = new Date();
      }

      // Calculate current price if using formula method
      if (animalData.pricingMethod === 'formula') {
        animalData.currentPrice = calculateCurrentPrice(animalData as Animal);
      }

      if (mode === "edit" && animal) {
        // Handle relationship changes for existing animals
        if (formData.category === "newborn") {
          const newMotherId = formData.motherId === "none" || !formData.motherId ? null : formData.motherId;
          const oldMotherId = animal.motherId || null;

          if (newMotherId !== oldMotherId) {
            const relationshipResult = await updateMotherChildRelationship(animal.id, newMotherId, oldMotherId);
            if (!relationshipResult.success) {
              throw new Error(relationshipResult.errors.join(', '));
            }
          }
        }

        await dataService.animals.update(animal.id, animalData);
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث بيانات الحيوان ${formData.earTagId}`,
        });
      } else {
        // Handle new animal creation with relationships
        if (formData.category === "newborn" && formData.motherId && formData.motherId !== "none") {
          const relationshipResult = await createMotherChildRelationship(formData.motherId, animalData);
          if (!relationshipResult.success) {
            throw new Error(relationshipResult.errors.join(', '));
          }
          toast({
            title: "تم الإضافة بنجاح",
            description: `تم إضافة المولود ${formData.earTagId} وربطه بالأم بنجاح`,
          });
        } else {
          await dataService.animals.create(animalData);
          toast({
            title: "تم الإضافة بنجاح",
            description: `تم إضافة الحيوان ${formData.earTagId} بنجاح`,
          });
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving animal:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثنا�� حفظ بيانات الحيوان",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBarns = barns.filter(
    (barn) => barn.type === formData.category || barn.type === "mixed"
  );

  const potentialMothers = animals.filter(
    (a) => a.category === "female" && a.id !== animal?.id
  );

  const isolationTypes = [
    { value: "health_quarantine", label: "حجر صحي للوافد��ن الجدد" },
    { value: "illness", label: "عزل بسبب المرض" },
    { value: "post_birth", label: "عزل ما بعد الولادة" },
    { value: "feeding", label: "عزل للتغذية الخاصة" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "إضافة حيوان جديد" : "تعديل بيانات الحيوان"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "إدخال بيانات الحيوان الجديد بالمزرعة"
              : "تعديل البيانات الأساس��ة للحيوان"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">المعلومات الأساس��ة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="earTagId">رقم الأذن *</Label>
                <div className="space-y-2">
                  <Input
                    id="earTagId"
                    value={formData.earTagId}
                    onChange={(e) =>
                      setFormData({ ...formData, earTagId: e.target.value })
                    }
                    placeholder="مثال: M001"
                    className={earTagExists ? "border-red-500" : ""}
                  />
                  {earTagExists && (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4 ml-1" />
                      رقم الأذن موجود بالفعل
                    </div>
                  )}
                  {earTagSuggestion && mode === "add" && !formData.earTagId && (
                    <div className="flex items-center text-blue-600 text-sm">
                      <Lightbulb className="h-4 w-4 ml-1" />
                      الرقم المقترح: {earTagSuggestion}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="weight">الوزن الحالي (كيلو) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  placeholder="65.5"
                />
              </div>

              <div>
                <Label htmlFor="barnId">الحظيرة *</Label>
                <Select
                  value={formData.barnId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, barnId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحظي��ة" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBarns.map((barn) => (
                      <SelectItem key={barn.id} value={barn.id}>
                        {barn.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="healthStatus">الحالة الصحية *</Label>
                <Select
                  value={formData.healthStatus}
                  onValueChange={(value) =>
                    setFormData({ ...formData, healthStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="سليم">سليم</SelectItem>
                    <SelectItem value="سليمة">سليمة</SelectItem>
                    <SelectItem value="مريض">مريض</SelectItem>
                    <SelectItem value="مريضة">مريضة</SelectItem>
                    <SelectItem value="تحت العلاج">تحت العلاج</SelectItem>
                    <SelectItem value="حجر صحي">حجر صحي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="isolated"
                  checked={formData.isIsolated}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isIsolated: checked as boolean })
                  }
                />
                <Label htmlFor="isolated">الحيوان في العزل</Label>
              </div>
            </div>

            {formData.isIsolated && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
                <div>
                  <Label htmlFor="isolationType">نوع العزل</Label>
                  <Select
                    value={formData.isolationType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isolationType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع العزل" />
                    </SelectTrigger>
                    <SelectContent>
                      {isolationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="isolationReason">سبب العزل</Label>
                  <Input
                    id="isolationReason"
                    value={formData.isolationReason}
                    onChange={(e) =>
                      setFormData({ ...formData, isolationReason: e.target.value })
                    }
                    placeholder="وصف سبب العزل"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Purchase Information */}
          {formData.category !== "newborn" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">معلومات الشراء</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="purchaseDate">تاريخ الشراء</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="purchasePrice">سعر الشراء (جنيه)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, purchasePrice: e.target.value })
                    }
                    placeholder="3500"
                  />
                </div>

                <div>
                  <Label htmlFor="pricingMethod">طريقة التسعير</Label>
                  <Select
                    value={formData.pricingMethod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, pricingMethod: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة التسعير" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formula">حساب تلقائي بالمعادلة</SelectItem>
                      <SelectItem value="manual">تحديد يدوي</SelectItem>
                      <SelectItem value="market_rate">سعر السوق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.pricingMethod === "manual" && (
                  <div>
                    <Label htmlFor="currentPrice">السعر الحالي (جنيه)</Label>
                    <Input
                      id="currentPrice"
                      type="number"
                      value={formData.currentPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, currentPrice: e.target.value })
                      }
                      placeholder="4500"
                    />
                  </div>
                )}

                {formData.pricingMethod === "formula" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="formulaMultiplier">سعر الكيلو (جنيه) - اختياري</Label>
                      <Input
                        id="formulaMultiplier"
                        type="number"
                        value={formData.formulaMultiplier}
                        onChange={(e) =>
                          setFormData({ ...formData, formulaMultiplier: e.target.value })
                        }
                        placeholder="45"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        اتركه فارغاً لاستخدام المعادلة الافتراضية
                      </p>
                    </div>

                    {formData.weight && (
                      <div className="bg-blue-50 p-3 rounded-lg border">
                        <p className="text-sm font-medium text-blue-800 mb-1">ال��عر المحسوب:</p>
                        <p className="text-lg font-bold text-blue-900">
                          {formatEGP(calculateCurrentPrice({
                            ...formData,
                            weight: parseFloat(formData.weight) || 0,
                            purchasePrice: parseFloat(formData.purchasePrice) || 0,
                            pricingMethod: formData.pricingMethod as any,
                            formulaMultiplier: formData.formulaMultiplier ? parseFloat(formData.formulaMultiplier) : undefined
                          } as any))}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          سيتم تحديث السعر تلقائياً عند الحفظ
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {formData.pricingMethod === "market_rate" && (
                  <div className="bg-green-50 p-3 rounded-lg border">
                    <p className="text-sm font-medium text-green-800 mb-1">سعر السوق المقدر:</p>
                    <p className="text-lg font-bold text-green-900">
                      {formData.weight && formatEGP(calculateCurrentPrice({
                        ...formData,
                        weight: parseFloat(formData.weight) || 0,
                        purchasePrice: parseFloat(formData.purchasePrice) || 0,
                        pricingMethod: 'market_rate'
                      } as any))}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      سيتم تحديث السعر تلقائياً حسب أسعار السوق
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="supplier">المورد</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    placeholder="اسم المورد أو المزرعة"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Female-specific fields */}
          {formData.category === "female" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">معلومات التناسل</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pregnant"
                  checked={formData.isPregnant}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPregnant: checked as boolean })
                  }
                />
                <Label htmlFor="pregnant">حامل</Label>
              </div>

              {formData.isPregnant && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-pink-50 rounded-lg">
                  <div>
                    <Label htmlFor="aiDate">تاريخ التلقيح</Label>
                    <Input
                      id="aiDate"
                      type="date"
                      value={formData.aiDate}
                      onChange={(e) =>
                        setFormData({ ...formData, aiDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedBirthDate">تاريخ الولادة المتوقع</Label>
                    <Input
                      id="expectedBirthDate"
                      type="date"
                      value={formData.expectedBirthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, expectedBirthDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="offspringCount">عدد الموا��يد السابقة</Label>
                    <Input
                      id="offspringCount"
                      type="number"
                      value={formData.offspringCount}
                      onChange={(e) =>
                        setFormData({ ...formData, offspringCount: e.target.value })
                      }
                      placeholder="2"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Newborn-specific fields */}
          {formData.category === "newborn" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">معلومات المولود</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="motherId">الأم</Label>
                  <Select
                    value={formData.motherId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, motherId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون أم محددة</SelectItem>
                      {potentialMothers.map((mother) => (
                        <SelectItem key={mother.id} value={mother.id}>
                          {mother.earTagId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Mother validation feedback */}
                  {formData.motherId && formData.motherId !== "none" && (
                    <div className="mt-2 space-y-2">
                      {!motherValidation.isValid && motherValidation.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 ml-2" />
                            <div>
                              <p className="text-sm font-medium text-red-800">أخطاء في اختيار الأم:</p>
                              <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                                {motherValidation.errors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {motherValidation.warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 ml-2" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">تحذيرات:</p>
                              <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                                {motherValidation.warnings.map((warning, index) => (
                                  <li key={index}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {motherValidation.isValid && formData.motherId !== "none" && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start">
                            <Lightbulb className="h-4 w-4 text-green-500 mt-0.5 ml-2" />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                ✅ اختيار الأم صحيح
                              </p>
                              <p className="text-sm text-green-700 mt-1">
                                سيتم ربط المولود بالأم تلقائياً مع تحديث إ��صائيات الأم
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="birthDate">تاريخ الميلاد</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="weaningDate">تا��يخ الفطام</Label>
                  <Input
                    id="weaningDate"
                    type="date"
                    value={formData.weaningDate}
                    onChange={(e) =>
                      setFormData({ ...formData, weaningDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={loading || earTagExists}>
            {loading
              ? "جاري الحفظ..."
              : mode === "add"
                ? "إضافة الحيوان"
                : "حفظ التعديلات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
