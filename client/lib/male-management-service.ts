// Male Cattle Management Service
// قواعد وإدارة الذكور في المزرعة

import type { Animal, MaleBusinessRules } from "@shared/types";
import { MALE_BUSINESS_RULES } from "@shared/types";

export interface MaleValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export interface MaleFarmCycleInfo {
  currentAge: number; // months
  timeInFarm: number; // months
  expectedSaleDate: Date;
  weightGain: number; // kg
  averageMonthlyGain: number; // kg/month
  isReadyForSale: boolean;
  cycleStatus: "early" | "optimal" | "extended" | "overdue";
}

export class MaleManagementService {
  private rules: MaleBusinessRules = MALE_BUSINESS_RULES;

  // Validate male at purchase
  validatePurchase(weight: number, ageMonths: number): MaleValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check minimum purchase weight
    if (weight < this.rules.minPurchaseWeight) {
      errors.push(`وزن الشراء أقل من الحد الأدنى (${this.rules.minPurchaseWeight} كج). الوزن الحالي: ${weight} كج`);
    }

    // Check if weight is too high for purchase
    if (weight > this.rules.maxSaleWeight * 0.8) {
      warnings.push(`وزن الشراء مرتفع. قد يكون الذكر قريب من وزن البيع المستهدف (${this.rules.maxSaleWeight} كج)`);
    }

    // Age warnings
    if (ageMonths < 3) {
      warnings.push("العمر صغير جداً. قد يحتاج رعاية خاصة");
    } else if (ageMonths > 12) {
      warnings.push("عمر متقدم للشراء. قد تقل فترة التربية المربحة");
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  // Validate male for sale
  validateSale(animal: Animal): MaleValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const cycleInfo = this.getFarmCycleInfo(animal);

    // Check minimum sale readiness
    if (animal.weight < 35) {
      warnings.push("الوزن أقل من المستوى الأمثل للبيع (35+ كج)");
    }

    // Check maximum weight
    if (animal.weight > this.rules.maxSaleWeight) {
      errors.push(`تجاوز الحد الأقصى لوزن البيع (${this.rules.maxSaleWeight} كج). الوزن الحالي: ${animal.weight} كج`);
    }

    // Check cycle duration
    if (cycleInfo.timeInFarm < this.rules.farmCycleDuration.min) {
      warnings.push(`فترة التربية أقل من المستهدف (${this.rules.farmCycleDuration.min} شهور)`);
    } else if (cycleInfo.timeInFarm > this.rules.farmCycleDuration.max) {
      warnings.push(`فترة التربية تجاوزت المستهدف (${this.rules.farmCycleDuration.max} شهور). التكاليف قد تزيد`);
    }

    // Check weight gain efficiency
    if (cycleInfo.averageMonthlyGain < 6) {
      warnings.push("معدل زيادة الوزن أقل من المتوقع. قد تحتاج مراجعة نظام التغذية");
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  // Get farm cycle information
  getFarmCycleInfo(animal: Animal): MaleFarmCycleInfo {
    const now = new Date();
    const purchaseDate = new Date(animal.purchaseDate);
    const timeInFarm = this.getMonthsDifference(purchaseDate, now);
    
    // Calculate expected sale date (4-5 months from purchase)
    const expectedSaleDate = new Date(purchaseDate);
    expectedSaleDate.setMonth(expectedSaleDate.getMonth() + this.rules.farmCycleDuration.max);

    // Weight gain calculation
    const initialWeight = animal.purchasePrice ? 
      this.estimateInitialWeight(animal.purchasePrice) : 
      this.rules.minPurchaseWeight;
    const weightGain = animal.weight - initialWeight;
    const averageMonthlyGain = timeInFarm > 0 ? weightGain / timeInFarm : 0;

    // Determine cycle status
    let cycleStatus: "early" | "optimal" | "extended" | "overdue";
    if (timeInFarm < this.rules.farmCycleDuration.min) {
      cycleStatus = "early";
    } else if (timeInFarm <= this.rules.farmCycleDuration.max) {
      cycleStatus = "optimal";
    } else if (timeInFarm <= this.rules.farmCycleDuration.max + 1) {
      cycleStatus = "extended";
    } else {
      cycleStatus = "overdue";
    }

    // Ready for sale check
    const isReadyForSale = 
      animal.weight >= 35 && 
      animal.weight <= this.rules.maxSaleWeight &&
      timeInFarm >= this.rules.farmCycleDuration.min;

    return {
      currentAge: animal.ageMonths,
      timeInFarm,
      expectedSaleDate,
      weightGain,
      averageMonthlyGain,
      isReadyForSale,
      cycleStatus
    };
  }

  // Get males ready for sale
  getMalesReadyForSale(males: Animal[]): Animal[] {
    return males.filter(male => {
      if (male.category !== "male") return false;
      const validation = this.validateSale(male);
      const cycleInfo = this.getFarmCycleInfo(male);
      return cycleInfo.isReadyForSale && validation.errors.length === 0;
    });
  }

  // Get males that need attention (overweight, overdue, etc.)
  getMalesNeedingAttention(males: Animal[]): Array<{ animal: Animal; reasons: string[] }> {
    return males
      .filter(male => male.category === "male")
      .map(male => {
        const validation = this.validateSale(male);
        const cycleInfo = this.getFarmCycleInfo(male);
        const reasons: string[] = [];

        if (male.weight > this.rules.maxSaleWeight) {
          reasons.push("تجاوز الوزن الأقصى");
        }
        
        if (cycleInfo.cycleStatus === "overdue") {
          reasons.push("تجاوز مدة التربية المثلى");
        }
        
        if (cycleInfo.averageMonthlyGain < 5) {
          reasons.push("معدل زيادة وزن منخفض");
        }

        if (validation.errors.length > 0) {
          reasons.push(...validation.errors);
        }

        return { animal: male, reasons };
      })
      .filter(item => item.reasons.length > 0);
  }

  // Calculate expected profit for male
  calculateExpectedProfit(animal: Animal, currentMarketPrice: number = 0): {
    totalCost: number;
    expectedRevenue: number;
    profit: number;
    profitMargin: number;
  } {
    const cycleInfo = this.getFarmCycleInfo(animal);
    const feedingCostPerMonth = 300; // EGP - estimated
    const otherCostsPerMonth = 100;  // EGP - vet, utilities, etc.
    
    const totalCost = animal.purchasePrice + 
      (feedingCostPerMonth + otherCostsPerMonth) * cycleInfo.timeInFarm;
    
    const pricePerKg = currentMarketPrice || (animal.currentPrice || 0) / animal.weight;
    const expectedRevenue = animal.weight * pricePerKg;
    const profit = expectedRevenue - totalCost;
    const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return {
      totalCost,
      expectedRevenue,
      profit,
      profitMargin
    };
  }

  // Utility methods
  private getMonthsDifference(startDate: Date, endDate: Date): number {
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    return months + (endDate.getMonth() - startDate.getMonth()) + 
           (endDate.getDate() >= startDate.getDate() ? 0 : -1);
  }

  private estimateInitialWeight(purchasePrice: number): number {
    // Rough estimation based on purchase price
    // This would be more accurate with historical data
    return Math.max(this.rules.minPurchaseWeight, purchasePrice / 50);
  }

  // Get business rules (read-only)
  getBusinessRules(): Readonly<MaleBusinessRules> {
    return { ...this.rules };
  }

  // Format cycle info for display
  formatCycleInfo(cycleInfo: MaleFarmCycleInfo): {
    statusLabel: string;
    statusColor: string;
    timeInFarmLabel: string;
    weightGainLabel: string;
    readinessLabel: string;
  } {
    const statusLabels = {
      early: "مبكر",
      optimal: "مثلى", 
      extended: "ممتدة",
      overdue: "متأخر"
    };

    const statusColors = {
      early: "text-yellow-600",
      optimal: "text-green-600",
      extended: "text-orange-600", 
      overdue: "text-red-600"
    };

    return {
      statusLabel: statusLabels[cycleInfo.cycleStatus],
      statusColor: statusColors[cycleInfo.cycleStatus],
      timeInFarmLabel: `${cycleInfo.timeInFarm.toFixed(1)} شهر`,
      weightGainLabel: `${cycleInfo.weightGain.toFixed(1)} كج (+${cycleInfo.averageMonthlyGain.toFixed(1)} كج/شهر)`,
      readinessLabel: cycleInfo.isReadyForSale ? "جاهز للبيع" : "غير جاهز"
    };
  }
}

// Export singleton instance
export const maleManagementService = new MaleManagementService();

export default maleManagementService;
