// Female Management Service
// خدمة إدارة الإناث في المزرعة

import type { Animal } from "@shared/types";

export interface FemaleBusinessRules {
  // Breeding cycle rules
  birthsPerTwoPeriod: number; // 3 births every 2 years
  birthCycleMonths: number; // 8 months per birth cycle
  pregnancyDurationMonths: number; // 5 months from fertilization
  
  // Offspring rules
  minOffspringPerBirth: number; // 1-2 animals per birth
  maxOffspringPerBirth: number;
  
  // Lifespan
  minLifespanYears: number; // 7-10 years
  maxLifespanYears: number;
  
  // Health and productivity tracking
  optimalBreedingAgeMonths: { min: number; max: number };
  recoveryPeriodMonths: number; // Rest period between births
}

export interface FemaleCycleInfo {
  ageInMonths: number;
  pregnancyStatus: 'pregnant' | 'nursing' | 'ready' | 'resting' | 'too_young' | 'too_old';
  monthsSinceLastBirth?: number;
  expectedBirthDate?: Date;
  breedingCycleNumber: number;
  isProductiveAge: boolean;
  remainingProductiveYears: number;
  totalExpectedOffspring: number;
}

export interface FemaleBirthPrediction {
  nextBirthDate: Date;
  pregnancyStartDate: Date;
  expectedOffspringCount: number;
  cycleNumber: number;
}

export interface FemaleProductivityAnalysis {
  currentValue: number;
  lifetimeProductionValue: number;
  monthlyProductionRate: number;
  breedingEfficiency: number; // percentage
  recommendedAction: string;
}

class FemaleManagementService {
  private businessRules: FemaleBusinessRules = {
    birthsPerTwoPeriod: 3,
    birthCycleMonths: 8,
    pregnancyDurationMonths: 5,
    minOffspringPerBirth: 1,
    maxOffspringPerBirth: 2,
    minLifespanYears: 7,
    maxLifespanYears: 10,
    optimalBreedingAgeMonths: { min: 18, max: 84 }, // 1.5 to 7 years
    recoveryPeriodMonths: 3, // 3 months rest between cycles
  };

  getBusinessRules(): FemaleBusinessRules {
    return { ...this.businessRules };
  }

  getFemaleBreedingInfo(female: Animal): FemaleCycleInfo {
    const ageInMonths = female.ageMonths || 0;
    const minBreedingAge = this.businessRules.optimalBreedingAgeMonths.min;
    const maxBreedingAge = this.businessRules.optimalBreedingAgeMonths.max;
    
    // Determine pregnancy status
    let pregnancyStatus: FemaleCycleInfo['pregnancyStatus'] = 'ready';
    
    if (ageInMonths < minBreedingAge) {
      pregnancyStatus = 'too_young';
    } else if (ageInMonths > maxBreedingAge) {
      pregnancyStatus = 'too_old';
    } else if (female.isPregnant) {
      pregnancyStatus = 'pregnant';
    } else {
      pregnancyStatus = 'ready';
    }

    // Calculate breeding cycle number (approximation based on age)
    const breedingCycleNumber = Math.floor(
      Math.max(0, ageInMonths - minBreedingAge) / this.businessRules.birthCycleMonths
    );

    // Calculate remaining productive years
    const remainingProductiveYears = Math.max(0, 
      (this.businessRules.maxLifespanYears * 12 - ageInMonths) / 12
    );

    // Estimate total expected offspring
    const remainingCycles = Math.floor(
      (maxBreedingAge - Math.max(ageInMonths, minBreedingAge)) / this.businessRules.birthCycleMonths
    );
    const avgOffspringPerBirth = (this.businessRules.minOffspringPerBirth + this.businessRules.maxOffspringPerBirth) / 2;
    const totalExpectedOffspring = Math.max(0, remainingCycles * avgOffspringPerBirth);

    return {
      ageInMonths,
      pregnancyStatus,
      breedingCycleNumber,
      isProductiveAge: ageInMonths >= minBreedingAge && ageInMonths <= maxBreedingAge,
      remainingProductiveYears,
      totalExpectedOffspring
    };
  }

  predictNextBirth(female: Animal): FemaleBirthPrediction | null {
    const cycleInfo = this.getFemaleBreedingInfo(female);
    
    if (!cycleInfo.isProductiveAge || cycleInfo.pregnancyStatus === 'too_old') {
      return null;
    }

    const now = new Date();
    let nextBirthDate: Date;
    let pregnancyStartDate: Date;

    if (female.isPregnant) {
      // If already pregnant, estimate birth date
      // Assume pregnancy started recently if no specific date
      pregnancyStartDate = new Date(now);
      pregnancyStartDate.setMonth(pregnancyStartDate.getMonth() - 2); // Assume 2 months pregnant
      
      nextBirthDate = new Date(pregnancyStartDate);
      nextBirthDate.setMonth(nextBirthDate.getMonth() + this.businessRules.pregnancyDurationMonths);
    } else {
      // Calculate next breeding opportunity
      pregnancyStartDate = new Date(now);
      pregnancyStartDate.setMonth(pregnancyStartDate.getMonth() + 1); // Next month
      
      nextBirthDate = new Date(pregnancyStartDate);
      nextBirthDate.setMonth(nextBirthDate.getMonth() + this.businessRules.pregnancyDurationMonths);
    }

    const expectedOffspringCount = Math.round(
      (this.businessRules.minOffspringPerBirth + this.businessRules.maxOffspringPerBirth) / 2
    );

    return {
      nextBirthDate,
      pregnancyStartDate,
      expectedOffspringCount,
      cycleNumber: cycleInfo.breedingCycleNumber + 1
    };
  }

  calculateProductivityAnalysis(female: Animal, avgOffspringValue: number = 5000): FemaleProductivityAnalysis {
    const cycleInfo = this.getFemaleBreedingInfo(female);
    const currentValue = female.currentPrice || female.purchasePrice || 0;
    
    // Calculate lifetime production value
    const avgOffspringPerBirth = (this.businessRules.minOffspringPerBirth + this.businessRules.maxOffspringPerBirth) / 2;
    const remainingCycles = Math.floor(cycleInfo.remainingProductiveYears * 12 / this.businessRules.birthCycleMonths);
    const lifetimeProductionValue = remainingCycles * avgOffspringPerBirth * avgOffspringValue;
    
    // Monthly production rate
    const monthlyProductionRate = cycleInfo.isProductiveAge ? 
      (avgOffspringPerBirth * avgOffspringValue) / this.businessRules.birthCycleMonths : 0;
    
    // Breeding efficiency (based on age and status)
    let breedingEfficiency = 100;
    if (cycleInfo.ageInMonths < this.businessRules.optimalBreedingAgeMonths.min) {
      breedingEfficiency = 60; // Too young
    } else if (cycleInfo.ageInMonths > this.businessRules.optimalBreedingAgeMonths.max * 0.8) {
      breedingEfficiency = 70; // Getting older
    } else if (cycleInfo.ageInMonths > this.businessRules.optimalBreedingAgeMonths.max) {
      breedingEfficiency = 30; // Too old
    }

    // Recommended action
    let recommendedAction = "";
    if (cycleInfo.pregnancyStatus === 'too_young') {
      recommendedAction = "انتظار حتى سن التكاثر المناسب";
    } else if (cycleInfo.pregnancyStatus === 'too_old') {
      recommendedAction = "النظر في البيع أو التقاعد";
    } else if (cycleInfo.pregnancyStatus === 'pregnant') {
      recommendedAction = "متابعة الحمل وتحضير الولادة";
    } else if (cycleInfo.pregnancyStatus === 'ready') {
      recommendedAction = "جاهزة للتلقيح";
    } else {
      recommendedAction = "متابعة دورية";
    }

    return {
      currentValue,
      lifetimeProductionValue,
      monthlyProductionRate,
      breedingEfficiency,
      recommendedAction
    };
  }

  getFemalesReadyForBreeding(females: Animal[]): Animal[] {
    return females.filter(female => {
      const cycleInfo = this.getFemaleBreedingInfo(female);
      return cycleInfo.pregnancyStatus === 'ready' && cycleInfo.isProductiveAge;
    });
  }

  getFemalesNeedingAttention(females: Animal[]): { female: Animal; reason: string }[] {
    const results: { female: Animal; reason: string }[] = [];
    
    females.forEach(female => {
      const cycleInfo = this.getFemaleBreedingInfo(female);
      const reasons: string[] = [];
      
      // Age-related concerns
      if (cycleInfo.pregnancyStatus === 'too_old') {
        reasons.push("تجاوزت سن التكاثر المثلى");
      }
      
      // Health concerns
      if (female.healthStatus !== 'سليمة' && female.healthStatus !== 'سليم') {
        reasons.push("حالة صحية تحتاج متابعة");
      }
      
      // Pregnancy tracking
      if (female.isPregnant) {
        const prediction = this.predictNextBirth(female);
        if (prediction) {
          const daysUntilBirth = Math.ceil(
            (prediction.nextBirthDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilBirth <= 30) {
            reasons.push(`الولادة متوقعة خلال ${daysUntilBirth} يوم`);
          }
        }
      }
      
      // Long time without breeding
      if (!female.isPregnant && cycleInfo.isProductiveAge && cycleInfo.ageInMonths > 24) {
        reasons.push("لم تتكاثر لفترة طويلة");
      }
      
      if (reasons.length > 0) {
        results.push({
          female,
          reason: reasons.join(", ")
        });
      }
    });
    
    return results;
  }

  formatBreedingInfo(cycleInfo: FemaleCycleInfo): {
    statusLabel: string;
    statusColor: string;
    productivityLabel: string;
    ageLabel: string;
  } {
    let statusLabel = "";
    let statusColor = "";
    
    switch (cycleInfo.pregnancyStatus) {
      case 'pregnant':
        statusLabel = "حامل";
        statusColor = "bg-pink-100 text-pink-800";
        break;
      case 'nursing':
        statusLabel = "ترضع";
        statusColor = "bg-blue-100 text-blue-800";
        break;
      case 'ready':
        statusLabel = "جاهزة للتلقيح";
        statusColor = "bg-green-100 text-green-800";
        break;
      case 'resting':
        statusLabel = "فترة راحة";
        statusColor = "bg-yellow-100 text-yellow-800";
        break;
      case 'too_young':
        statusLabel = "صغيرة السن";
        statusColor = "bg-gray-100 text-gray-800";
        break;
      case 'too_old':
        statusLabel = "تجاوزت سن التكاثر";
        statusColor = "bg-red-100 text-red-800";
        break;
    }

    const productivityLabel = cycleInfo.isProductiveAge 
      ? `دورة رقم ${cycleInfo.breedingCycleNumber + 1}` 
      : "خارج سن الإنتاج";
      
    const ageLabel = `${Math.floor(cycleInfo.ageInMonths / 12)} سنة و ${cycleInfo.ageInMonths % 12} شهر`;

    return {
      statusLabel,
      statusColor,
      productivityLabel,
      ageLabel
    };
  }

  // Calculate comprehensive female analytics
  calculateFemaleAnalytics(females: Animal[]): {
    totalFemales: number;
    pregnant: number;
    readyForBreeding: number;
    needingAttention: number;
    averageAge: number;
    productionValue: number;
    breedingEfficiency: number;
  } {
    const totalFemales = females.length;
    const pregnant = females.filter(f => f.isPregnant).length;
    const readyForBreeding = this.getFemalesReadyForBreeding(females).length;
    const needingAttention = this.getFemalesNeedingAttention(females).length;
    
    const averageAge = totalFemales > 0 
      ? females.reduce((sum, female) => sum + (female.ageMonths || 0), 0) / totalFemales 
      : 0;
    
    // Calculate total production value (estimated)
    const productionValue = females.reduce((sum, female) => {
      const analysis = this.calculateProductivityAnalysis(female);
      return sum + analysis.lifetimeProductionValue;
    }, 0);
    
    // Calculate overall breeding efficiency
    const breedingEfficiency = totalFemales > 0
      ? females.reduce((sum, female) => {
          const analysis = this.calculateProductivityAnalysis(female);
          return sum + analysis.breedingEfficiency;
        }, 0) / totalFemales
      : 0;

    return {
      totalFemales,
      pregnant,
      readyForBreeding,
      needingAttention,
      averageAge,
      productionValue,
      breedingEfficiency
    };
  }
}

export const femaleManagementService = new FemaleManagementService();
