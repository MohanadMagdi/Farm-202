// Newborn Management Service
// خدمة إدارة المواليد (الإنتاج الداخلي)

import type { Animal, Barn } from "@shared/types";

// قواعد إدارة المواليد
export interface NewbornBusinessRules {
  // قواعد الفطام (بالأيام)
  weaningAge: {
    min: number;           // الحد الأدنى للفطام
    optimal: {
      min: number;         // بداية النطاق المثالي
      max: number;         // نهاية النطاق المثالي
    };
    max: number;           // الحد الأقصى المقبول
  };
  
  // قواعد الوزن
  minWeaningWeight: number;      // الوزن الأدنى للفطام
  
  // قواعد الحظائر
  stayWithMother: boolean;       // البقاء مع الأم حتى الفطام
  
  // قواعد مراكز التكلفة
  costAllocation: {
    beforeWeaning: 'mother' | 'females' | 'general_revenue';
    afterWeaning: 'mother' | 'females' | 'general_revenue';
  };
}

export interface NewbornStatus {
  ageDays: number;
  ageMonths: number;
  isWeaned: boolean;
  readyForWeaning: boolean;
  daysUntilWeaning: number;
  weaningCategory: 'too_early' | 'optimal' | 'late' | 'overdue';
  healthStatus: 'healthy' | 'underweight' | 'overweight' | 'needs_attention';
  weightProgress: number;
  barnAssignment: {
    currentBarn: string;
    shouldStayWithMother: boolean;
    recommendedBarnType: 'male' | 'female' | 'newborn';
    hasBeenTransferred: boolean;  // إضافة خاصية لتتبع ما إذا كان المولود قد تم نقله
  };
}

export interface NewbornFinancials {
  productionCost: number;
  currentValue: number;
  revenueAllocation: 'mother' | 'females' | 'general_revenue';
  estimatedFutureValue: number;
}

export interface NewbornAnalytics {
  totalNewborns: number;
  readyForWeaning: number;
  weanedThisMonth: number;
  averageAge: number;
  averageWeight: number;
  maleCount: number;
  femaleCount: number;
  healthyPercentage: number;
  totalProductionValue: number;
}

export class NewbornManagementService {
  private businessRules: NewbornBusinessRules = {
    weaningAge: {
      min: 42,               // 6 أسابيع (للحالات المكثفة)
      optimal: {
        min: 60,             // 8-9 أسابيع
        max: 75              // 10-11 أسبوع
      },
      max: 84                // 12 أسبوع
    },
    minWeaningWeight: 15,    // كيلو جرام
    stayWithMother: true,
    costAllocation: {
      beforeWeaning: 'mother',
      afterWeaning: 'females'
    }
  };

  // حساب عمر المولود بالأيام
  calculateAgeDays(newborn: Animal): number {
    if (!newborn.birthDate) return 0;
    
    const now = new Date();
    const birthDate = new Date(newborn.birthDate);
    const diffTime = Math.abs(now.getTime() - birthDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // حساب عمر المولود بالشهور
  calculateAgeMonths(newborn: Animal): number {
    return Math.floor(this.calculateAgeDays(newborn) / 30);
  }

  // التحقق من جاهزية الفطام
  isReadyForWeaning(newborn: Animal): boolean {
    const ageDays = this.calculateAgeDays(newborn);
    
    // التحقق من العمر والوزن
    return (
      ageDays >= this.businessRules.weaningAge.optimal.min &&
      newborn.weight >= this.businessRules.minWeaningWeight &&
      !newborn.weaningDate // لم يتم فطامه بعد
    );
  }

  // تحديد فئة توقيت الفطام
  getWeaningCategory(newborn: Animal): 'too_early' | 'optimal' | 'late' | 'overdue' {
    const ageDays = this.calculateAgeDays(newborn);
    
    if (ageDays < this.businessRules.weaningAge.optimal.min) {
      return 'too_early';
    } else if (ageDays <= this.businessRules.weaningAge.optimal.max) {
      return 'optimal';
    } else if (ageDays <= this.businessRules.weaningAge.max) {
      return 'late';
    } else {
      return 'overdue';
    }
  }

  // التحقق من حالة الفطام
  isWeaned(newborn: Animal): boolean {
    // إذا لم يكن هناك تاريخ فطام محدد، فإن المولود لم يتم فطامه
    if (!newborn.weaningDate) return false;
    
    // تحقق مما إذا كان تاريخ الفطام قد مر بالفعل
    const today = new Date();
    const weaningDate = new Date(newborn.weaningDate);
    
    // المولود يعتبر مفطومًا فقط إذا كان تاريخ الفطام سابقًا لتاريخ اليوم
    return weaningDate < today;
  }

  // حساب الأيام المتبقية للفطام
  getDaysUntilWeaning(newborn: Animal): number {
    const ageDays = this.calculateAgeDays(newborn);
    const daysRemaining = this.businessRules.weaningAge.optimal.min - ageDays;
    return Math.max(0, daysRemaining);
  }

  // تقييم الحالة الصحية للمولود
  assessHealthStatus(newborn: Animal): 'healthy' | 'underweight' | 'overweight' | 'needs_attention' {
    const ageDays = this.calculateAgeDays(newborn);
    const expectedWeight = this.getExpectedWeight(ageDays);
    
    const weightRatio = newborn.weight / expectedWeight;
    
    if (weightRatio < 0.8) {
      return 'underweight';
    } else if (weightRatio > 1.3) {
      return 'overweight';
    } else if (weightRatio < 0.9 || weightRatio > 1.2) {
      return 'needs_attention';
    } else {
      return 'healthy';
    }
  }

  // الوزن المتوقع حسب العمر
  private getExpectedWeight(ageDays: number): number {
    // منحنى نمو تقديري للخراف
    // وزن الولادة: 3-5 كج
    // نمو يومي: 200-300 جرام
    const birthWeight = 4; // كج
    const dailyGain = 0.25; // كج يومياً
    
    return birthWeight + (ageDays * dailyGain);
  }

  // حساب تقدم النمو
  calculateWeightProgress(newborn: Animal): number {
    const ageDays = this.calculateAgeDays(newborn);
    const expectedWeight = this.getExpectedWeight(ageDays);
    
    return Math.min((newborn.weight / expectedWeight) * 100, 150);
  }

  // التحقق من تخصيص الحظيرة
  validateBarnAssignment(newborn: Animal, mother?: Animal): {
    currentBarn: string;
    shouldStayWithMother: boolean;
    recommendedBarnType: 'male' | 'female' | 'newborn';
    hasBeenTransferred: boolean;  // إضافة خاصية لتتبع ما إذا كان المولود قد تم نقله
  } {
    const isWeaned = this.isWeaned(newborn);
    
    // تحديد ما إذا تم نقل المولود من حظيرة الأم
    const hasBeenTransferred = (() => {
      // إذا لم تكن هناك معلومات عن الأم، لا يمكننا التحقق من النقل
      if (!mother || !mother.barnId) return false;
      
      // إذا لم يكن للمولود حظيرة محددة، فلم يتم نقله بعد
      if (!newborn.barnId) return false;
      
      // تحقق مما إذا كانت حظيرة المولود مختلفة عن حظيرة الأم
      return newborn.barnId !== mother.barnId;
    })();
    
    // قبل الفطام - يجب البقاء مع الأم
    if (!isWeaned && this.businessRules.stayWithMother && !hasBeenTransferred) {
      return {
        currentBarn: newborn.barnId || mother?.barnId || '',
        shouldStayWithMother: true,
        recommendedBarnType: 'newborn',
        hasBeenTransferred: false
      };
    }
    
    // بعد الفطام - تحديد الحظيرة حسب الجنس
    const recommendedBarnType = newborn.sex === 'male' ? 'male' : 'female';
    
    return {
      currentBarn: newborn.barnId || '',
      shouldStayWithMother: false,
      recommendedBarnType,
      hasBeenTransferred: hasBeenTransferred
    };
  }

  // الحصول على حالة المولود الشاملة
  getNewbornStatus(newborn: Animal, mother?: Animal): NewbornStatus {
    const ageDays = this.calculateAgeDays(newborn);
    const ageMonths = this.calculateAgeMonths(newborn);
    const isWeaned = this.isWeaned(newborn);
    const readyForWeaning = this.isReadyForWeaning(newborn);
    const daysUntilWeaning = this.getDaysUntilWeaning(newborn);
    const weaningCategory = this.getWeaningCategory(newborn);
    const healthStatus = this.assessHealthStatus(newborn);
    const weightProgress = this.calculateWeightProgress(newborn);
    const barnAssignment = this.validateBarnAssignment(newborn, mother);

    return {
      ageDays,
      ageMonths,
      isWeaned,
      readyForWeaning,
      daysUntilWeaning,
      weaningCategory,
      healthStatus,
      weightProgress,
      barnAssignment
    };
  }

  // حساب التكلفة المالية للمولود
  calculateNewbornFinancials(newborn: Animal, mother?: Animal): NewbornFinancials {
    const ageDays = this.calculateAgeDays(newborn);
    const isWeaned = this.isWeaned(newborn);
    
    // تكلفة الإنتاج (تغذية، رعاية، إلخ)
    const dailyCost = 2; // جنيه يومياً
    const productionCost = ageDays * dailyCost;
    
    // القيمة الحالية
    const baseValue = 200; // قيمة أساسية
    const weightValue = newborn.weight * 15; // 15 جنيه لكل كيلو
    const currentValue = baseValue + weightValue;
    
    // تحديد تخصيص الإيرادات
    let revenueAllocation: 'mother' | 'females' | 'general_revenue';
    if (!isWeaned) {
      revenueAllocation = this.businessRules.costAllocation.beforeWeaning;
    } else {
      revenueAllocation = this.businessRules.costAllocation.afterWeaning;
    }
    
    // القيمة المستقبلية المتوقعة
    const estimatedFutureValue = this.estimateFutureValue(newborn);
    
    return {
      productionCost,
      currentValue,
      revenueAllocation,
      estimatedFutureValue
    };
  }

  // تقدير القيمة المستقبلية
  private estimateFutureValue(newborn: Animal): number {
    const expectedAdultWeight = newborn.sex === 'male' ? 80 : 60; // كج
    const pricePerKg = newborn.sex === 'male' ? 25 : 20; // جنيه/كج
    
    return expectedAdultWeight * pricePerKg;
  }

  // الحصول على المواليد الجاهزة للفطام
  getNewbornsReadyForWeaning(newborns: Animal[]): Animal[] {
    return newborns.filter(newborn => 
      newborn.category === 'newborn' && 
      this.isReadyForWeaning(newborn)
    );
  }

  // الحصول على المواليد التي تحتاج انتباه
  getNewbornsNeedingAttention(newborns: Animal[]): Animal[] {
    return newborns.filter(newborn => {
      if (newborn.category !== 'newborn') return false;
      
      const status = this.getNewbornStatus(newborn);
      return (
        status.healthStatus === 'needs_attention' ||
        status.healthStatus === 'underweight' ||
        status.healthStatus === 'overweight' ||
        status.weaningCategory === 'overdue'
      );
    });
  }

  // حساب إحصائيات المواليد
  calculateNewbornAnalytics(newborns: Animal[]): NewbornAnalytics {
    const newbornAnimals = newborns.filter(animal => animal.category === 'newborn');
    const totalNewborns = newbornAnimals.length;
    
    if (totalNewborns === 0) {
      return {
        totalNewborns: 0,
        readyForWeaning: 0,
        weanedThisMonth: 0,
        averageAge: 0,
        averageWeight: 0,
        maleCount: 0,
        femaleCount: 0,
        healthyPercentage: 0,
        totalProductionValue: 0
      };
    }

    const readyForWeaning = this.getNewbornsReadyForWeaning(newborns).length;
    
    // المفطومة هذا الشهر
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weanedThisMonth = newbornAnimals.filter(newborn => 
      newborn.weaningDate && 
      new Date(newborn.weaningDate) >= monthStart
    ).length;

    const averageAge = newbornAnimals.reduce((sum, newborn) => 
      sum + this.calculateAgeDays(newborn), 0
    ) / totalNewborns;

    const averageWeight = newbornAnimals.reduce((sum, newborn) => 
      sum + newborn.weight, 0
    ) / totalNewborns;

    const maleCount = newbornAnimals.filter(newborn => newborn.sex === 'male').length;
    const femaleCount = newbornAnimals.filter(newborn => newborn.sex === 'female').length;

    const healthyCount = newbornAnimals.filter(newborn => {
      const status = this.assessHealthStatus(newborn);
      return status === 'healthy';
    }).length;
    const healthyPercentage = (healthyCount / totalNewborns) * 100;

    const totalProductionValue = newbornAnimals.reduce((sum, newborn) => {
      const financials = this.calculateNewbornFinancials(newborn);
      return sum + financials.currentValue;
    }, 0);

    return {
      totalNewborns,
      readyForWeaning,
      weanedThisMonth,
      averageAge: Math.round(averageAge),
      averageWeight: Math.round(averageWeight * 10) / 10,
      maleCount,
      femaleCount,
      healthyPercentage: Math.round(healthyPercentage * 10) / 10,
      totalProductionValue: Math.round(totalProductionValue)
    };
  }

  // تنسيق معلومات المولود للعرض
  formatNewbornInfo(status: NewbornStatus): {
    statusLabel: string;
    statusColor: string;
    weaningLabel: string;
    ageLabel: string;
    weaningCategoryLabel: string;
    weaningCategoryColor: string;
    transferStatus?: string;  // إضافة حالة النقل
  } {
    let statusLabel = "";
    let statusColor = "";
    let transferStatus: string | undefined = undefined;
    
    // تحديد حالة الفطام والنقل
    if (status.isWeaned) {
      // إذا كان المولود مفطوم، يعتبر "مفطوم" بدلاً من "مواليد"
      statusLabel = "مفطوم";
      statusColor = "bg-green-100 text-green-800";
      
      // إذا تم نقله من حظيرة الأم، أضف حالة النقل
      if (status.barnAssignment.hasBeenTransferred) {
        transferStatus = "تم النقل";
      } else {
        transferStatus = "لم يتم النقل";
      }
    } else if (status.readyForWeaning) {
      statusLabel = "جاهز للفطام";
      statusColor = "bg-yellow-100 text-yellow-800";
    } else {
      statusLabel = "مع الأم";
      statusColor = "bg-blue-100 text-blue-800";
    }

    const weaningLabel = status.isWeaned 
      ? "تم الفطام" 
      : status.daysUntilWeaning > 0 
        ? `متبقي ${status.daysUntilWeaning} يوم للفطام`
        : "جاهز للفطام";

    const ageLabel = `${status.ageDays} يوم (${Math.floor(status.ageDays / 7)} أسبوع)`;
    
    // تسميات فئة الفطام
    let weaningCategoryLabel = "";
    let weaningCategoryColor = "";
    
    switch (status.weaningCategory) {
      case 'too_early':
        weaningCategoryLabel = "مبكر للفطام";
        weaningCategoryColor = "bg-red-100 text-red-800";
        break;
      case 'optimal':
        weaningCategoryLabel = "وقت مثالي";
        weaningCategoryColor = "bg-green-100 text-green-800";
        break;
      case 'late':
        weaningCategoryLabel = "متأخر قليلاً";
        weaningCategoryColor = "bg-orange-100 text-orange-800";
        break;
      case 'overdue':
        weaningCategoryLabel = "متأخر جداً";
        weaningCategoryColor = "bg-red-100 text-red-800";
        break;
    }

    return {
      statusLabel,
      statusColor,
      weaningLabel,
      ageLabel,
      weaningCategoryLabel,
      weaningCategoryColor
    };
  }

  // معالجة عملية الفطام
  async processWeaning(
    newborn: Animal, 
    newBarnId: string, 
    weaningDate: Date = new Date()
  ): Promise<{
    success: boolean;
    newborn: Animal;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    // التحقق من جاهزية الفطام
    if (!this.isReadyForWeaning(newborn)) {
      errors.push('المولود غير جاهز للفطام بعد');
    }
    
    // التحقق من صحة الحظيرة الجديدة
    if (!newBarnId) {
      errors.push('يجب تحديد حظيرة جديدة للمولود');
    }
    
    if (errors.length > 0) {
      return {
        success: false,
        newborn,
        errors
      };
    }
    
    // تحديث بيانات المولود
    const updatedNewborn: Animal = {
      ...newborn,
      weaningDate,
      barnId: newBarnId
    };
    
    return {
      success: true,
      newborn: updatedNewborn,
      errors: []
    };
  }

  // فلترة الإنتاج الداخلي
  getInternalProduction(animals: Animal[]): {
    internallyBorn: Animal[];
    purchased: Animal[];
    analytics: {
      internalPercentage: number;
      weaningSuccessRate: number;
      averageWeaningAge: number;
    };
  } {
    const internallyBorn = animals.filter(animal => 
      animal.birthDate && animal.category === 'newborn'
    );
    
    const purchased = animals.filter(animal => 
      animal.purchaseDate && !animal.birthDate
    );

    // حساب معدل نجاح الفطام
    const weanedCount = internallyBorn.filter(newborn => this.isWeaned(newborn)).length;
    const weaningSuccessRate = internallyBorn.length > 0 
      ? (weanedCount / internallyBorn.length) * 100 
      : 0;

    // متوسط عمر الفطام
    const weanedAnimals = internallyBorn.filter(newborn => this.isWeaned(newborn));
    const averageWeaningAge = weanedAnimals.length > 0
      ? weanedAnimals.reduce((sum, newborn) => {
          const weaningAge = newborn.weaningDate 
            ? Math.abs(new Date(newborn.weaningDate).getTime() - new Date(newborn.birthDate!).getTime()) / (1000 * 60 * 60 * 24)
            : 0;
          return sum + weaningAge;
        }, 0) / weanedAnimals.length
      : 0;

    const totalAnimals = animals.length;
    const internalPercentage = totalAnimals > 0 
      ? (internallyBorn.length / totalAnimals) * 100 
      : 0;

    return {
      internallyBorn,
      purchased,
      analytics: {
        internalPercentage: Math.round(internalPercentage * 10) / 10,
        weaningSuccessRate: Math.round(weaningSuccessRate * 10) / 10,
        averageWeaningAge: Math.round(averageWeaningAge)
      }
    };
  }

  // الحصول على قواعد العمل
  getBusinessRules(): Readonly<NewbornBusinessRules> {
    return { ...this.businessRules };
  }

  // فحص المواليد التي تحتاج نقل تلقائي
  checkForAutomaticTransfer(animals: Animal[]): {
    needsTransfer: Animal[];
    overdueTransfer: Animal[];
    shouldRunAutoTransfer: boolean;
  } {
    const weanedNewborns = animals.filter(animal => 
      animal.category === 'newborn' && 
      this.isWeaned(animal) && 
      !animal.transferDate // لم يتم نقلها بعد
    );

    const overdueAnimals = weanedNewborns.filter(animal => {
      const ageDays = this.calculateAgeDays(animal);
      return ageDays > 75; // متأخر عن الفطام المثالي
    });

    return {
      needsTransfer: weanedNewborns,
      overdueTransfer: overdueAnimals,
      shouldRunAutoTransfer: weanedNewborns.length > 0
    };
  }
}

// إنشاء مثيل واحد من الخدمة
export const newbornManagementService = new NewbornManagementService();
