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
import { maleManagementService } from "@/lib/male-management-service";
import {
  calculateCurrentPrice,
  formatEGP,
  getPricingBreakdown,
} from "@/lib/pricing-utils";
import {
  validateMotherChildRelationship,
  createMotherChildRelationship,
  updateMotherChildRelationship,
} from "@/lib/animal-relationships";
import type { Animal, Barn, AnimalCategory } from "@shared/types";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, ChevronDown, Lightbulb } from "lucide-react";

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
    ageMonths: "", // Added age field
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
    warnings: [] as string[],
  });

  useEffect(() => {
    if (isOpen) {
      loadSelectData();
      if (mode === "edit" && animal) {
        populateFormData(animal);
        
        // التحقق من حالة الفطام للمولود
        if (animal.category === "newborn" && animal.weaningDate) {
          const today = new Date();
          const weaningDate = new Date(animal.weaningDate);
          const isWeaned = weaningDate < today;
          
          if (isWeaned) {
            // إظهار رسالة تأكيد حالة الفطام
            toast({
              title: "حالة المولود",
              description: "هذا المولود تم فطامه ويعتبر حيوان بالغ الآن",
              variant: "default",
            });
          }
        }
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
    if (formData.pricingMethod === "formula" && formData.weight) {
      const tempAnimal = createAnimalFromFormData(formData);
      const calculatedPrice = calculateCurrentPrice(tempAnimal as any);
      if (calculatedPrice !== parseFloat(formData.currentPrice || "0")) {
        setFormData((prev) => ({
          ...prev,
          currentPrice: calculatedPrice.toString(),
        }));
      }
    }
  }, [
    formData.weight,
    formData.pricingMethod,
    formData.formulaMultiplier,
    formData.purchasePrice,
    formData.birthDate,
  ]);

  // Validate mother selection in real-time
  useEffect(() => {
    if (
      formData.category === "newborn" &&
      formData.motherId &&
      formData.motherId !== "none" &&
      animals.length > 0
    ) {
      const validation = validateMotherChildRelationship(
        formData.motherId,
        formData.category,
        animals,
      );
      setMotherValidation(validation);
    } else {
      setMotherValidation({ isValid: true, errors: [], warnings: [] });
    }
  }, [formData.motherId, formData.category, animals]);

  // Auto-calculate weaning date when birth date changes for newborns
  useEffect(() => {
    if (formData.category === "newborn" && formData.birthDate && mode === "add") {
      const birthDate = new Date(formData.birthDate);
      const weaningDate = new Date(birthDate);
      weaningDate.setDate(weaningDate.getDate() + 67); // 67 يوم (متوسط بين 60-75)
      
      setFormData(prev => ({
        ...prev,
        weaningDate: weaningDate.toISOString().split("T")[0]
      }));
    }
  }, [formData.birthDate, formData.category, mode]);

  // Auto-assign barn when mother is selected for newborns
  useEffect(() => {
    if (formData.category === "newborn" && formData.motherId && formData.motherId !== "none") {
      const mother = animals.find(a => a.id === formData.motherId);
      if (mother && mother.barnId && mother.barnId !== formData.barnId) {
        setFormData(prev => ({
          ...prev,
          barnId: mother.barnId // تعيين نفس حظيرة الأم
        }));
      }
    }
  }, [formData.motherId, formData.category, animals]);

  // Auto-calculate age in months for newborns based on birth date
  useEffect(() => {
    if (formData.category === "newborn" && formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      const ageInMonths = Math.floor(ageInDays / 30.44); // متوسط أيام الشهر
      
      setFormData(prev => ({
        ...prev,
        ageMonths: ageInMonths.toString()
      }));
    }
  }, [formData.birthDate, formData.category]);

  // Auto-calculate weaning date based on birth date (60-75 days after birth)
  useEffect(() => {
    if (formData.category === "newborn" && formData.birthDate && mode === "add") {
      const birthDate = new Date(formData.birthDate);
      const weaningDate = new Date(birthDate);
      weaningDate.setDate(weaningDate.getDate() + 67); // متوسط 67 يوم (وسط بين 60-75)
      
      setFormData(prev => ({
        ...prev,
        weaningDate: weaningDate.toISOString().split("T")[0]
      }));
    }
  }, [formData.birthDate, formData.category, mode]);

  // Helper function to convert form data to Animal-like object for pricing
  const createAnimalFromFormData = (data: typeof formData) => {
    const animalLike = {
      ...data,
      weight: parseFloat(data.weight) || 0,
      purchasePrice: parseFloat(data.purchasePrice) || 0,
      currentPrice: parseFloat(data.currentPrice) || undefined,
      pricingMethod: data.pricingMethod as any,
      formulaMultiplier: data.formulaMultiplier
        ? parseFloat(data.formulaMultiplier)
        : undefined,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      purchaseDate: new Date(data.purchaseDate),
      offspringCount: data.offspringCount
        ? parseInt(data.offspringCount)
        : undefined,
    };
    return animalLike;
  };

  // دالة لحساب تاريخ الولادة المتوقع (5 أشهر بعد تاريخ التلقيح)
  const calculateExpectedBirthDate = (aiDate: string): string => {
    if (!aiDate) return "";
    const date = new Date(aiDate);
    date.setMonth(date.getMonth() + 5);
    return date.toISOString().split("T")[0];
  };
  
  const loadSelectData = async () => {
    try {
      const [barnsData, animalsData] = await Promise.all([
        dataService.barns.getAll(),
        dataService.animals.getAll(),
      ]);

      setBarns(barnsData.filter((barn) => barn.isActive));
      setAnimals(animalsData);
    } catch (error) {
      console.error("Error loading select data:", error);
    }
  };

  const generateEarTagSuggestion = async () => {
    try {
      const nextId = await dataService.animals.getNextEarTagId(animalType);
      setEarTagSuggestion(nextId);
      setFormData((prev) => ({ ...prev, earTagId: nextId }));
    } catch (error) {
      console.error("Error generating ear tag:", error);
    }
  };

  const checkEarTagExists = async () => {
    try {
      const exists = await dataService.animals.checkEarTagExists(
        formData.earTagId,
        animal?.id,
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
      ageMonths: animalData.ageMonths?.toString() || "",
      supplier: animalData.supplier || "",
      purchaseDate: animalData.purchaseDate.toISOString().split("T")[0],
      purchasePrice: animalData.purchasePrice.toString(),
      currentPrice: animalData.currentPrice?.toString() || "",
      pricingMethod: (animalData as any).pricingMethod || "formula",
      formulaMultiplier:
        (animalData as any).formulaMultiplier?.toString() || "",
      barnId: animalData.barnId,
      healthStatus: animalData.healthStatus,
      isIsolated: animalData.isIsolated,
      isolationType: animalData.isolationType || "",
      isolationReason: animalData.isolationReason || "",

      // For females
      isPregnant: animalData.isPregnant || false,
      aiDate: animalData.aiDate?.toISOString().split("T")[0] || "",
      expectedBirthDate: (() => {
        // إذا كان هناك تاريخ ولادة متوقع، استخدمه
        if (animalData.expectedBirthDate) {
          return animalData.expectedBirthDate.toISOString().split("T")[0];
        } 
        // إذا كان هناك تاريخ تلقيح ولكن بدون تاريخ ولادة متوقع، احسب تاريخ الولادة
        else if (animalData.aiDate) {
          const aiDateStr = animalData.aiDate.toISOString().split("T")[0];
          return calculateExpectedBirthDate(aiDateStr);
        }
        // إذا لم يكن هناك تواريخ، أعد سلسلة فارغة
        else {
          return "";
        }
      })(),
      offspringCount: animalData.offspringCount?.toString() || "",

      // For newborns
      motherId: animalData.motherId || "none",
      birthDate:
        animalData.birthDate?.toISOString().split("T")[0] ||
        animalData.purchaseDate.toISOString().split("T")[0],
      weaningDate: animalData.weaningDate?.toISOString().split("T")[0] || "",
    });
  };

  const resetForm = () => {
    const isNewborn = animalType === "newborn";
    const today = new Date();
    
    // حساب تاريخ الفطام المتوقع (60-75 يوم من اليوم)
    const expectedWeaningDate = new Date(today);
    expectedWeaningDate.setDate(expectedWeaningDate.getDate() + 67); // متوسط 67 يوم (وسط بين 60-75)
    
    setFormData({
      earTagId: "",
      category: animalType,
      sex: animalType === "female" ? "female" : animalType === "male" ? "male" : "male", // للمواليد يمكن اختيار الجنس
      weight: isNewborn ? "3" : "", // وزن افتراضي للمواليد 3 كج
      ageMonths: isNewborn ? "0" : "", // عمر 0 للمواليد
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

      // For newborns - قيم تلقائية
      motherId: "none",
      birthDate: new Date().toISOString().split("T")[0], // تاريخ اليوم
      weaningDate: isNewborn ? expectedWeaningDate.toISOString().split("T")[0] : "", // تاريخ الفطام المتوقع
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

    // Validate male business rules if adding a male
    if (formData.category === "male" && mode === "add") {
      const weight = parseFloat(formData.weight) || 0;
      const age = parseInt(formData.ageMonths) || 0;
      const validation = maleManagementService.validatePurchase(weight, age);
      
      if (!validation.isValid) {
        toast({
          title: "خطأ في قواعد الذكور",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return;
      }

      if (validation.warnings.length > 0) {
        // Show warnings but continue
        toast({
          title: "تحذير",
          description: validation.warnings.join(", "),
          variant: "default",
        });
      }
    }

    setLoading(true);
    try {
      const animalData: Omit<Animal, "id"> = {
        earTagId: formData.earTagId,
        category: formData.category,
        sex: formData.sex,
        weight: parseFloat(formData.weight),
        ageMonths: parseInt(formData.ageMonths) || 0, // Add age field
        supplier: formData.supplier || undefined,
        purchaseDate: new Date(formData.purchaseDate),
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        currentPrice: formData.currentPrice
          ? parseFloat(formData.currentPrice)
          : undefined,
        pricingMethod: formData.pricingMethod as any,
        formulaMultiplier: formData.formulaMultiplier
          ? parseFloat(formData.formulaMultiplier)
          : undefined,
        barnId: formData.barnId,
        healthStatus: formData.healthStatus,
        isIsolated: formData.isIsolated,
        isolationType: (formData.isolationType as any) || undefined,
        isolationReason: formData.isolationReason || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "current_user", // TODO: Get from auth context
        updatedBy: "current_user",
      };

      // Add category-specific fields
      if (formData.category === "female") {
        animalData.isPregnant = formData.isPregnant;
        animalData.aiDate = formData.aiDate
          ? new Date(formData.aiDate)
          : undefined;
        animalData.expectedBirthDate = formData.expectedBirthDate
          ? new Date(formData.expectedBirthDate)
          : undefined;
        animalData.offspringCount = formData.offspringCount
          ? parseInt(formData.offspringCount)
          : undefined;
      }

      if (formData.category === "newborn") {
        animalData.motherId =
          formData.motherId === "none" || !formData.motherId
            ? undefined
            : formData.motherId;
        animalData.birthDate = formData.birthDate
          ? new Date(formData.birthDate)
          : undefined;
        animalData.weaningDate = formData.weaningDate
          ? new Date(formData.weaningDate)
          : undefined;
        // تحديد أن هذا إنتاج داخلي ويجب إظهاره في جميع الصفحات المناسبة
        animalData.internalProduction = true;
        animalData.showInInternalProduction = true;
      }

      if (formData.isIsolated) {
        animalData.isolationDate = new Date();
      }

      // Calculate current price if using formula method
      if (animalData.pricingMethod === "formula") {
        animalData.currentPrice = calculateCurrentPrice(animalData as Animal);
      }

      if (mode === "edit" && animal) {
        // Handle relationship changes for existing animals
        if (formData.category === "newborn") {
          const newMotherId =
            formData.motherId === "none" || !formData.motherId
              ? null
              : formData.motherId;
          const oldMotherId = animal.motherId || null;

          if (newMotherId !== oldMotherId) {
            const relationshipResult = await updateMotherChildRelationship(
              animal.id,
              newMotherId,
              oldMotherId,
            );
            if (!relationshipResult.success) {
              throw new Error(relationshipResult.errors.join(", "));
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
        if (
          formData.category === "newborn" &&
          formData.motherId &&
          formData.motherId !== "none"
        ) {
          const relationshipResult = await createMotherChildRelationship(
            formData.motherId,
            animalData,
          );
          if (!relationshipResult.success) {
            throw new Error(relationshipResult.errors.join(", "));
          }
          toast({
            title: "تم الإضافة بنجاح",
            description: `تم إضافة المولود ${formData.earTagId} وربطه بالأم بنجاح`,
          });
        } else {
          await dataService.animals.create(animalData);
          
          // إضافة المواليد إلى الإدارة المناسبة تلقائياً
          if (animalData.category === 'newborn') {
            if (animalData.sex === 'male') {
              const maleValidation = maleManagementService.addNewbornMale(animalData as Animal);
              if (maleValidation.warnings.length > 0) {
                console.log('تحذيرات إضافة المولود الذكر:', maleValidation.warnings);
              }
            }
            // يمكن إضافة منطق للإناث هنا إذا لزم الأمر
          }
          
          toast({
            title: "تم الإضافة بنجاح",
            description: `تم إضافة الحيوان ${formData.earTagId} بنجاح${animalData.category === 'newborn' ? ` وإدراجه في قائمة ${animalData.sex === 'male' ? 'الذكور' : 'الإناث'}` : ''}`,
          });
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving animal:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ بيانات الحيوان",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter barns based on category and sex
  const getFilteredBarns = () => {
    // عرض جميع الحظائر المتاحة بغض النظر عن النوع
    return barns.filter(barn => barn.isActive);
  };

  const filteredBarns = getFilteredBarns();

  // فلترة الأمهات المحتملات لتشمل جميع الإناث البالغات (بعد الفطام تعتبر الأنثى بالغة)
  const potentialMothers = animals.filter((a) => {
    // يجب أن تكون أنثى وليست الحيوان الحالي
    if (a.sex !== "female" || a.id === animal?.id) return false;
    
    // للمواليد: نتحقق من أنها مفطومة بالفعل (بعد الفطام تعتبر أنثى بالغة)
    if (a.category === "newborn") {
      // إذا كان تاريخ الفطام موجود، نتحقق أن الفطام قد تم بالفعل
      if (a.weaningDate) {
        const today = new Date();
        const weaningDate = new Date(a.weaningDate);
        return weaningDate < today; // تم الفطام، تعتبر بالغة
      } 
      // إذا كان عمرها أكثر من 75 يوماً (متوسط وقت الفطام + هامش أمان) وتاريخ الميلاد معروف
      else if (a.birthDate) {
        const today = new Date();
        const birthDate = new Date(a.birthDate);
        const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
        return ageInDays > 75; // عمرها يتجاوز فترة الفطام النموذجية، تعتبر بالغة
      }
      // إذا كان عمرها معروف بالشهور ويزيد عن 2.5 شهر
      else if (a.ageMonths) {
        return a.ageMonths > 2.5; // أكثر من 75 يوم (2.5 شهر)، تعتبر بالغة
      }
      // لا يوجد معلومات كافية، نستبعدها ليكون الاختيار آمنًا
      return false;
    }
    
    // باقي الإناث (من فئة female أو أخرى) مؤهلات للإنجاب بشكل افتراضي لأنها بالغات
    return true;
  });

  const isolationTypes = [
    { value: "health_quarantine", label: "حجر صحي للوافدين الجدد" },
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
              : "تعديل البيانات الأساسية للحيوان"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>

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
                <Label htmlFor="sex">النوع (الجنس) *</Label>
                <Select
                  value={formData.sex}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sex: value as "male" | "female" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
                {formData.category === "newborn" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    سيتم النقل التلقائي بعد الفطام حسب النوع: الذكور → حظيرة ذكور، الإناث → حظيرة إناث
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="ageMonths">
                  العمر {formData.category === "newborn" ? "(تلقائي)" : "(شهور)"} *
                </Label>
                <Input
                  id="ageMonths"
                  type="number"
                  min="0"
                  value={formData.ageMonths}
                  onChange={(e) =>
                    setFormData({ ...formData, ageMonths: e.target.value })
                  }
                  placeholder={formData.category === "newborn" ? "0 (يحسب تلقائياً)" : "12"}
                  disabled={formData.category === "newborn"} // للمواليد يحسب تلقائياً
                />
                {formData.category === "newborn" && formData.birthDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    العمر يحسب تلقائياً من تاريخ الميلاد: 
                    {Math.floor((new Date().getTime() - new Date(formData.birthDate).getTime()) / (1000 * 60 * 60 * 24))} يوم
                  </p>
                )}
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
                    <SelectValue placeholder="اختر الحظيرة" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBarns.map((barn) =>  (
                      <SelectItem key={barn.id} value={barn.id}>
                        {barn.name} 
                        ({barn.type === "mixed" ? "مختلط" : barn.type === "male" ? "ذكور" : barn.type === "female" ? "إناث" : "صغار"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* معلومات إضافية عن الحظائر */}
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.category === "newborn" && formData.motherId && formData.motherId !== "none" && 
                    " (سيتم تعيين حظيرة الأم تلقائياً إذا تم اختيار أم)"
                  }
                </p>
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
                    <SelectItem value="مريض">مريض</SelectItem>
                    <SelectItem value="تحت العلاج">تحت العلاج</SelectItem>
                    <SelectItem value="متابعة تغذية">متابعة تغذية</SelectItem>
                    <SelectItem value="متابعة ولادة">متابعة ولادة</SelectItem>
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
                      setFormData({
                        ...formData,
                        isolationReason: e.target.value,
                      })
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
                      setFormData({
                        ...formData,
                        purchasePrice: e.target.value,
                      })
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
                      <SelectItem value="formula">
                        حساب تلقائي بالمعادلة
                      </SelectItem>
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
                        setFormData({
                          ...formData,
                          currentPrice: e.target.value,
                        })
                      }
                      placeholder="4500"
                    />
                  </div>
                )}

                {formData.pricingMethod === "formula" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="formulaMultiplier">
                        سعر الكيلو (جنيه) - اختياري
                      </Label>
                      <Input
                        id="formulaMultiplier"
                        type="number"
                        value={formData.formulaMultiplier}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            formulaMultiplier: e.target.value,
                          })
                        }
                        placeholder="45"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        اتركه فارغاً لاستخدام المعادلة الافتراضية
                      </p>
                    </div>

                    {formData.weight && (
                      <div className="bg-blue-50 p-3 rounded-lg border">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          السعر المحسوب:
                        </p>
                        <p className="text-lg font-bold text-blue-900">
                          {formatEGP(
                            calculateCurrentPrice(
                              createAnimalFromFormData(formData) as any,
                            ),
                          )}
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
                    <p className="text-sm font-medium text-green-800 mb-1">
                      سعر السوق المقدر:
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {formData.weight &&
                        formatEGP(
                          calculateCurrentPrice({
                            ...createAnimalFromFormData(formData),
                            pricingMethod: "market_rate",
                          } as any),
                        )}
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
                      onChange={(e) => {
                        const aiDate = e.target.value;
                        
                        // حساب تاريخ الولادة المتوقع (إضافة 5 أشهر لتاريخ التلقيح)
                        const expectedDate = calculateExpectedBirthDate(aiDate);
                        
                        setFormData({ 
                          ...formData, 
                          aiDate: aiDate,
                          // تعيين تاريخ الولادة المتوقع تلقائياً
                          expectedBirthDate: expectedDate 
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedBirthDate">
                      تاريخ الولادة المتوقع
                    </Label>
                    <Input
                      id="expectedBirthDate"
                      type="date"
                      value={formData.expectedBirthDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expectedBirthDate: e.target.value,
                        })
                      }
                      placeholder="يحسب تلقائياً من تاريخ التلقيح"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      يتم الحساب تلقائياً (5 أشهر من تاريخ التلقيح)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="offspringCount">
                      عدد المواليد السابقة
                    </Label>
                    <Input
                      id="offspringCount"
                      type="number"
                      value={formData.offspringCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          offspringCount: e.target.value,
                        })
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
                  <div className="flex justify-between">
                    <Label htmlFor="motherId">الأم</Label>
                    <span className="text-xs text-blue-600">
                      {potentialMothers.length} أم مؤهلة
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    تشمل جميع الإناث البالغات بما فيها المواليد المفطومة (تعتبر أنثى بالغة بعد الفطام)
                  </p>
                  
                  {/* استبدال Select بعنصر select عادي */}
                  <div className="relative">
                    <select
                      id="mother-select"
                      value={formData.motherId || "none"}
                      onChange={(e) => setFormData({ ...formData, motherId: e.target.value === "none" ? "" : e.target.value })}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="none">بدون أم محددة</option>
                      {potentialMothers.map((mother) => {
                        // إضافة معلومات مفيدة عن الأم
                        const motherAge = mother.ageMonths ? `${mother.ageMonths} شهر` : 
                                         mother.birthDate ? `${Math.floor((new Date().getTime() - new Date(mother.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} شهر` : 
                                         "غير معروف";
                        
                        // تحديد نوع الأم مع اعتبار أن المفطومة أنثى بالغة
                        let motherCategory = "أنثى";
                        if (mother.internalProduction) {
                          motherCategory = "إنتاج داخلي";
                        }
                        
                        // إضافة وصف المصدر للأم مع تحديد حالة الفطام
                        let motherSource = "";
                        let isWeaned = false;
                        
                        if (mother.category === "newborn" && mother.weaningDate) {
                          // تحقق إذا كانت قد فُطمت بالفعل
                          const today = new Date();
                          const weaningDate = new Date(mother.weaningDate);
                          
                          if (weaningDate < today) {
                            isWeaned = true;
                            motherSource = " (مفطومة - تعتبر بالغة)";
                          } else {
                            // تاريخ الفطام المتوقع في المستقبل
                            const daysToWeaning = Math.ceil((weaningDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            motherSource = ` (غير مفطومة - متبقي ${daysToWeaning} يوم للفطام)`;
                          }
                        }
                        
                        return (
                          <option key={mother.id} value={mother.id}>
                            {mother.earTagId} - {motherCategory}{motherSource} - العمر: {motherAge} - الحظيرة: {barns.find(b => b.id === mother.barnId)?.name || 'غير محدد'}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </div>

                  {/* Mother validation feedback */}
                  {formData.motherId && formData.motherId !== "none" && (
                    <div className="mt-2 space-y-2">
                      {!motherValidation.isValid &&
                        motherValidation.errors.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 ml-2" />
                              <div>
                                <p className="text-sm font-medium text-red-800">
                                  أخطاء في اختيار الأم:
                                </p>
                                <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                                  {motherValidation.errors.map(
                                    (error, index) => (
                                      <li key={index}>{error}</li>
                                    ),
                                  )}
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
                              <p className="text-sm font-medium text-yellow-800">
                                تحذيرات:
                              </p>
                              <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                                {motherValidation.warnings.map(
                                  (warning, index) => (
                                    <li key={index}>{warning}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {motherValidation.isValid &&
                        formData.motherId !== "none" && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <Lightbulb className="h-4 w-4 text-green-500 mt-0.5 ml-2" />
                              <div>
                                <p className="text-sm font-medium text-green-800">
                                  ✅ اختيار الأم صحيح
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                  سيتم ربط المولود بالأم تلقائياً مع تحديث
                                  إحصائيات الأم
                                </p>
                                {(() => {
                                  const selectedMother = animals.find(a => a.id === formData.motherId);
                                  const motherBarn = barns.find(b => b.id === selectedMother?.barnId);
                                  return selectedMother && motherBarn && (
                                    <p className="text-sm text-green-700 mt-1">
                                      🏠 سيبقى في حظيرة الأم: {motherBarn.name}
                                    </p>
                                  );
                                })()}
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
                  {/* عرض العمر الحالي */}
                  {formData.birthDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      العمر الحالي: {Math.floor((new Date().getTime() - new Date(formData.birthDate).getTime()) / (1000 * 60 * 60 * 24))} يوم
                      ({Math.floor((new Date().getTime() - new Date(formData.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 7))} أسبوع)
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="weaningDate">تاريخ الفطام المتوقع</Label>
                    
                    {formData.weaningDate && (
                      <>
                        {new Date(formData.weaningDate) < new Date() ? (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800">
                            تم الفطام - يعتبر بالغ
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-yellow-100 text-yellow-800">
                            {Math.ceil((new Date(formData.weaningDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} يوم متبقي للفطام
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <Input
                    id="weaningDate"
                    type="date"
                    value={formData.weaningDate}
                    onChange={(e) => {
                      const newWeaningDate = e.target.value;
                      setFormData({ ...formData, weaningDate: newWeaningDate });
                      
                      // التحقق ما إذا كان تاريخ الفطام الجديد يدل على أن المولود قد فُطم بالفعل
                      const today = new Date();
                      if (newWeaningDate && new Date(newWeaningDate) < today) {
                        toast({
                          title: "تم الفطام",
                          description: "تم تعيين تاريخ فطام في الماضي - سيتم اعتبار هذا المولود بالغًا الآن",
                          variant: "default",
                        });
                      }
                    }}
                  />
                  {/* تحذير حول الفطام المبكر/المتأخر */}
                  {formData.birthDate && formData.weaningDate && (
                    <div className="mt-1">
                      {(() => {
                        const ageDays = Math.floor((new Date(formData.weaningDate).getTime() - new Date(formData.birthDate).getTime()) / (1000 * 60 * 60 * 24));
                        if (ageDays < 60) {
                          return (
                            <p className="text-xs text-red-600">
                              ⚠️ فطام مبكر ({ageDays} يوم) - الأفضل بعد 60 يوم
                            </p>
                          );
                        } else if (ageDays >= 60 && ageDays <= 75) {
                          return (
                            <p className="text-xs text-green-600">
                              ✅ توقيت مثالي للفطام ({ageDays} يوم)
                            </p>
                          );
                        } else {
                          return (
                            <p className="text-xs text-orange-600">
                              ⚠️ فطام متأخر ({ageDays} يوم) - الأفضل قبل 75 يوم
                            </p>
                          );
                        }
                      })()}
                    </div>
                  )}
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
