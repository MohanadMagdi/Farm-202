// Newborn Cost Center Service
// خدمة إدارة مراكز التكلفة للمواليد

import type { Animal } from "@shared/types";
import { newbornManagementService } from "./newborn-management-service";

export interface CostCenter {
  id: string;
  name: string;
  type: 'mother' | 'females' | 'general_revenue';
  description?: string;
}

export interface CostCenterAllocation {
  costCenter: CostCenter;
  amount: number;
  reason: string;
  allocation_date: Date;
}

export interface NewbornFinancialReport {
  costCenterBreakdown: Array<{
    costCenter: CostCenter;
    newborns: Animal[];
    totals: {
      productionCost: number;
      currentValue: number;
      count: number;
    };
  }>;
  totalProductionCost: number;
  totalCurrentValue: number;
  totalNewborns: number;
}

export class NewbornCostCenterService {
  private costCenters: CostCenter[] = [
    {
      id: 'mothers',
      name: 'مراكز تكلفة الأمهات',
      type: 'mother',
      description: 'تكاليف المواليد المخصصة لمراكز تكلفة الأمهات'
    },
    {
      id: 'females_general',
      name: 'مركز تكلفة الإناث العام',
      type: 'females',
      description: 'تكاليف المواليد المخصصة لمركز الإناث العام'
    },
    {
      id: 'general_revenue',
      name: 'الإيرادات العامة',
      type: 'general_revenue',
      description: 'تكاليف المواليد المحولة للإيرادات العامة'
    }
  ];

  // تحديد مركز التكلفة للمولود
  determineCostCenter(newborn: Animal, mother?: Animal): CostCenter {
    const status = newbornManagementService.getNewbornStatus(newborn, mother);
    const financials = newbornManagementService.calculateNewbornFinancials(newborn, mother);
    
    switch (financials.revenueAllocation) {
      case 'mother':
        return this.costCenters.find(cc => cc.type === 'mother')!;
      case 'females':
        return this.costCenters.find(cc => cc.type === 'females')!;
      case 'general_revenue':
        return this.costCenters.find(cc => cc.type === 'general_revenue')!;
      default:
        return this.costCenters.find(cc => cc.type === 'females')!;
    }
  }

  // إنشاء تخصيص مركز التكلفة
  createCostAllocation(
    newborn: Animal, 
    mother?: Animal
  ): CostCenterAllocation {
    const costCenter = this.determineCostCenter(newborn, mother);
    const financials = newbornManagementService.calculateNewbornFinancials(newborn, mother);
    
    let reason = "";
    if (!newbornManagementService.isWeaned(newborn)) {
      reason = mother 
        ? `تكلفة المولود ${newborn.earTagId} مخصصة لمركز تكلفة الأم ${mother.earTagId}`
        : `تكلفة المولود ${newborn.earTagId} مخصصة لمركز الإناث العام`;
    } else {
      reason = `تكلفة المولود ${newborn.earTagId} محولة لمركز الإناث العام بعد الفطام`;
    }

    return {
      costCenter,
      amount: financials.productionCost,
      reason,
      allocation_date: new Date()
    };
  }

  // تحديث تخصيص مركز التكلفة عند الفطام
  updateCostAllocationOnWeaning(
    newborn: Animal,
    weaningDate: Date,
    mother?: Animal
  ): {
    previousAllocation: CostCenterAllocation;
    newAllocation: CostCenterAllocation;
  } {
    // التخصيص قبل الفطام
    const tempNewbornBeforeWeaning = { ...newborn, weaningDate: undefined };
    const previousAllocation = this.createCostAllocation(tempNewbornBeforeWeaning, mother);
    
    // التخصيص بعد الفطام
    const newbornAfterWeaning = { ...newborn, weaningDate };
    const newAllocation = this.createCostAllocation(newbornAfterWeaning, mother);
    
    return {
      previousAllocation,
      newAllocation
    };
  }

  // إنشاء تقرير مالي شامل للمواليد
  generateNewbornFinancialReport(
    newborns: Animal[], 
    mothers: Animal[] = []
  ): NewbornFinancialReport {
    const newbornAnimals = newborns.filter(animal => animal.category === 'newborn');
    
    // تجميع حسب مراكز التكلفة
    const costCenterMap = new Map<string, {
      costCenter: CostCenter;
      newborns: Animal[];
      totals: {
        productionCost: number;
        currentValue: number;
        count: number;
      };
    }>();

    newbornAnimals.forEach(newborn => {
      const mother = mothers.find(m => m.id === newborn.motherId);
      const costCenter = this.determineCostCenter(newborn, mother);
      const financials = newbornManagementService.calculateNewbornFinancials(newborn, mother);
      
      if (!costCenterMap.has(costCenter.id)) {
        costCenterMap.set(costCenter.id, {
          costCenter,
          newborns: [],
          totals: {
            productionCost: 0,
            currentValue: 0,
            count: 0
          }
        });
      }
      
      const entry = costCenterMap.get(costCenter.id)!;
      entry.newborns.push(newborn);
      entry.totals.productionCost += financials.productionCost;
      entry.totals.currentValue += financials.currentValue;
      entry.totals.count += 1;
    });

    const costCenterBreakdown = Array.from(costCenterMap.values());
    
    const totalProductionCost = costCenterBreakdown.reduce(
      (sum, entry) => sum + entry.totals.productionCost, 0
    );
    
    const totalCurrentValue = costCenterBreakdown.reduce(
      (sum, entry) => sum + entry.totals.currentValue, 0
    );

    return {
      costCenterBreakdown,
      totalProductionCost: Math.round(totalProductionCost),
      totalCurrentValue: Math.round(totalCurrentValue),
      totalNewborns: newbornAnimals.length
    };
  }

  // تنسيق معلومات مركز التكلفة للعرض
  formatCostCenterInfo(costCenter: CostCenter): {
    displayName: string;
    description: string;
    color: string;
  } {
    let color = "";
    
    switch (costCenter.type) {
      case 'mother':
        color = "bg-blue-100 text-blue-800";
        break;
      case 'females':
        color = "bg-green-100 text-green-800";
        break;
      case 'general_revenue':
        color = "bg-purple-100 text-purple-800";
        break;
    }

    return {
      displayName: costCenter.name,
      description: costCenter.description || '',
      color
    };
  }

  // الحصول على جميع مراكز التكلفة
  getAllCostCenters(): CostCenter[] {
    return [...this.costCenters];
  }

  // محاكاة تغيير مركز التكلفة
  simulateCostCenterChange(
    newborn: Animal,
    newAllocation: 'mother' | 'females' | 'general_revenue',
    mother?: Animal
  ): {
    currentAllocation: CostCenterAllocation;
    newAllocation: CostCenterAllocation;
    impact: {
      costDifference: number;
      allocationChange: string;
    };
  } {
    // التخصيص الحالي
    const currentAllocation = this.createCostAllocation(newborn, mother);
    
    // التخصيص الجديد المحاكى
    const mockRules = { 
      ...newbornManagementService.getBusinessRules(),
      costAllocation: {
        beforeWeaning: newAllocation,
        afterWeaning: newAllocation
      }
    };
    
    // إنشاء تخصيص جديد بناءً على القواعد المحدثة
    const targetCostCenter = this.costCenters.find(cc => cc.type === newAllocation)!;
    const financials = newbornManagementService.calculateNewbornFinancials(newborn, mother);
    
    const simulatedAllocation: CostCenterAllocation = {
      costCenter: targetCostCenter,
      amount: financials.productionCost,
      reason: `تخصيص محاكى لمركز ${targetCostCenter.name}`,
      allocation_date: new Date()
    };

    return {
      currentAllocation,
      newAllocation: simulatedAllocation,
      impact: {
        costDifference: simulatedAllocation.amount - currentAllocation.amount,
        allocationChange: `من ${currentAllocation.costCenter.name} إلى ${simulatedAllocation.costCenter.name}`
      }
    };
  }
}

// إنشاء مثيل واحد من الخدمة
export const newbornCostCenterService = new NewbornCostCenterService();
