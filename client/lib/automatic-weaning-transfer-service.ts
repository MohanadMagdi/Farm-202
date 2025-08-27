import { Animal, Barn } from '@shared/types';
import { dataService } from './data-service';
import { newbornManagementService } from './newborn-management-service';

export interface WeaningTransferResult {
  success: boolean;
  transferredAnimal?: Animal;
  previousCategory: string;
  newCategory: string;
  previousBarn?: string;
  newBarn?: string;
  errors: string[];
  warnings: string[];
}

export interface AutomaticTransferBatch {
  readyAnimals: Animal[];
  transferResults: WeaningTransferResult[];
  totalTransferred: number;
  errors: string[];
}

class AutomaticWeaningTransferService {
  
  // تحديد الفئة الجديدة بعد الفطام
  private determineNewCategory(weanedAnimal: Animal): 'male' | 'female' {
    return weanedAnimal.sex === 'male' ? 'male' : 'female';
  }

  // البحث عن أفضل حظيرة للنقل
  private async findBestBarnForTransfer(
    weanedAnimal: Animal, 
    targetCategory: 'male' | 'female',
    availableBarns: Barn[]
  ): Promise<string | null> {
    
    // فلترة الحظائر المناسبة للفئة الجديدة
    const suitableBarns = availableBarns.filter(barn => 
      barn.isActive && 
      (barn.type === targetCategory || barn.type === 'mixed')
    );

    if (suitableBarns.length === 0) {
      return null;
    }

    // تفضيل الحظائر الأقل ازدحاماً
    const barnsWithCapacity = await Promise.all(
      suitableBarns.map(async barn => {
        const barnAnimals = await dataService.animals.getByBarn(barn.id);
        const currentCapacity = barnAnimals.length;
        const availableSpace = (barn.capacity || 50) - currentCapacity;
        
        return {
          barn,
          currentCapacity,
          availableSpace,
          utilizationRate: currentCapacity / (barn.capacity || 50)
        };
      })
    );

    // ترتيب حسب المساحة المتاحة والاستخدام
    const sortedBarns = barnsWithCapacity
      .filter(b => b.availableSpace > 0)
      .sort((a, b) => {
        // تفضيل الحظائر الأقل استخداماً
        if (a.utilizationRate !== b.utilizationRate) {
          return a.utilizationRate - b.utilizationRate;
        }
        // ثم الأكبر مساحة متاحة
        return b.availableSpace - a.availableSpace;
      });

    return sortedBarns.length > 0 ? sortedBarns[0].barn.id : null;
  }

  // نقل مولود واحد بعد الفطام
  async transferWeanedAnimal(
    weanedAnimal: Animal,
    availableBarns: Barn[],
    manualBarnId?: string
  ): Promise<WeaningTransferResult> {
    
    try {
      // التحقق من أن الحيوان مولود ومفطوم
      if (weanedAnimal.category !== 'newborn') {
        return {
          success: false,
          previousCategory: weanedAnimal.category,
          newCategory: weanedAnimal.category,
          errors: ['الحيوان ليس مولوداً'],
          warnings: []
        };
      }

      if (!newbornManagementService.isWeaned(weanedAnimal)) {
        return {
          success: false,
          previousCategory: weanedAnimal.category,
          newCategory: weanedAnimal.category,
          errors: ['المولود لم يتم فطامه بعد'],
          warnings: []
        };
      }

      const newCategory = this.determineNewCategory(weanedAnimal);
      const previousBarn = weanedAnimal.barnId;
      
      // تحديد الحظيرة الجديدة
      const newBarnId = manualBarnId || await this.findBestBarnForTransfer(
        weanedAnimal, 
        newCategory, 
        availableBarns
      );

      if (!newBarnId) {
        return {
          success: false,
          previousCategory: weanedAnimal.category,
          newCategory,
          errors: [`لا توجد حظائر متاحة لنقل ${newCategory === 'male' ? 'الذكور' : 'الإناث'}`],
          warnings: []
        };
      }

      // إنشاء البيانات المحدثة
      const transferredAnimal: Animal = {
        ...weanedAnimal,
        category: newCategory,
        barnId: newBarnId,
        // إضافة علامة الإنتاج الداخلي إذا كان له أم محددة
        internalProduction: !!(weanedAnimal.motherId && weanedAnimal.motherId !== 'none'),
        transferDate: new Date(),
        transferReason: 'automatic_weaning_transfer',
        previousCategory: 'newborn',
        updatedAt: new Date(),
        updatedBy: 'system_auto_transfer'
      };

      // تحديث البيانات في قاعدة البيانات
      await dataService.animals.update(weanedAnimal.id, transferredAnimal);

      // إنشاء سجل النقل
      await this.createTransferLog(weanedAnimal, transferredAnimal, newBarnId, previousBarn);

      return {
        success: true,
        transferredAnimal,
        previousCategory: 'newborn',
        newCategory,
        previousBarn,
        newBarn: newBarnId,
        errors: [],
        warnings: []
      };

    } catch (error) {
      console.error('Error transferring weaned animal:', error);
      return {
        success: false,
        previousCategory: weanedAnimal.category,
        newCategory: this.determineNewCategory(weanedAnimal),
        errors: [`خطأ في نقل المولود: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`],
        warnings: []
      };
    }
  }

  // نقل دفعة من المواليد المفطومة
  async batchTransferWeanedAnimals(
    weanedAnimals: Animal[],
    availableBarns: Barn[]
  ): Promise<AutomaticTransferBatch> {
    
    const readyAnimals = weanedAnimals.filter(animal => 
      animal.category === 'newborn' && newbornManagementService.isWeaned(animal)
    );

    if (readyAnimals.length === 0) {
      return {
        readyAnimals: [],
        transferResults: [],
        totalTransferred: 0,
        errors: ['لا توجد مواليد جاهزة للنقل']
      };
    }

    const transferResults: WeaningTransferResult[] = [];
    let totalTransferred = 0;
    const batchErrors: string[] = [];

    // نقل كل مولود على حدة
    for (const animal of readyAnimals) {
      try {
        const result = await this.transferWeanedAnimal(animal, availableBarns);
        transferResults.push(result);
        
        if (result.success) {
          totalTransferred++;
        } else {
          batchErrors.push(`${animal.earTagId}: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        batchErrors.push(`${animal.earTagId}: خطأ في النقل`);
      }
    }

    return {
      readyAnimals,
      transferResults,
      totalTransferred,
      errors: batchErrors
    };
  }

  // البحث عن المواليد الجاهزة للنقل التلقائي
  async findAnimalsReadyForAutoTransfer(): Promise<Animal[]> {
    try {
      const allAnimals = await dataService.animals.getAll();
      
      return allAnimals.filter(animal => {
        // مولود مفطوم ولم يتم نقله بعد
        return (
          animal.category === 'newborn' &&
          newbornManagementService.isWeaned(animal) &&
          !animal.transferDate
        );
      });
    } catch (error) {
      console.error('Error finding animals ready for transfer:', error);
      return [];
    }
  }

  // تشغيل النقل التلقائي للمواليد المفطومة
  async runAutomaticTransfer(): Promise<AutomaticTransferBatch> {
    try {
      const [readyAnimals, availableBarns] = await Promise.all([
        this.findAnimalsReadyForAutoTransfer(),
        dataService.barns.getAll()
      ]);

      const activeBarns = availableBarns.filter(barn => barn.isActive);
      
      return await this.batchTransferWeanedAnimals(readyAnimals, activeBarns);
      
    } catch (error) {
      console.error('Error running automatic transfer:', error);
      return {
        readyAnimals: [],
        transferResults: [],
        totalTransferred: 0,
        errors: [`خطأ في النقل التلقائي: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`]
      };
    }
  }

  // إنشاء سجل النقل
  private async createTransferLog(
    originalAnimal: Animal,
    transferredAnimal: Animal,
    newBarnId: string,
    previousBarnId?: string
  ): Promise<void> {
    
    const transferLog = {
      animalId: originalAnimal.id,
      earTagId: originalAnimal.earTagId,
      transferType: 'automatic_weaning_transfer',
      previousCategory: 'newborn',
      newCategory: transferredAnimal.category,
      previousBarnId,
      newBarnId,
      transferDate: new Date(),
      weaningDate: originalAnimal.weaningDate,
      birthDate: originalAnimal.birthDate,
      motherId: originalAnimal.motherId,
      ageAtTransfer: newbornManagementService.calculateAgeDays(originalAnimal),
      weightAtTransfer: originalAnimal.weight,
      transferReason: 'completed_weaning_period',
      isInternalProduction: true,
      createdAt: new Date(),
      createdBy: 'system_auto_transfer'
    };

    // حفظ سجل النقل (يمكن إضافة جدول منفصل لسجلات النقل)
    console.log('Transfer log created:', transferLog);
    
    // TODO: حفظ في جدول منفصل لسجلات النقل
    // await dataService.transferLogs.create(transferLog);
  }

  // الحصول على إحصائيات النقل التلقائي
  async getTransferStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalTransferred: number;
    malesTransferred: number;
    femalesTransferred: number;
    averageTransferAge: number;
    successRate: number;
    commonDestinationBarns: { barnId: string; count: number; barnName: string }[];
  }> {
    
    try {
      const allAnimals = await dataService.animals.getAll();
      const [allBarns] = await Promise.all([
        dataService.barns.getAll()
      ]);

      // فلترة الحيوانات المنقولة تلقائياً
      const transferredAnimals = allAnimals.filter(animal => {
        const hasTransferDate = animal.transferDate;
        const isInternalProduction = animal.internalProduction;
        const isTransferredFromNewborn = animal.previousCategory === 'newborn';
        
        let inDateRange = true;
        if (startDate && endDate && animal.transferDate) {
          const transferDate = new Date(animal.transferDate);
          inDateRange = transferDate >= startDate && transferDate <= endDate;
        }

        return hasTransferDate && isInternalProduction && isTransferredFromNewborn && inDateRange;
      });

      const totalTransferred = transferredAnimals.length;
      const malesTransferred = transferredAnimals.filter(a => a.sex === 'male').length;
      const femalesTransferred = transferredAnimals.filter(a => a.sex === 'female').length;

      // حساب متوسط عمر النقل
      const totalAge = transferredAnimals.reduce((sum, animal) => {
        if (animal.birthDate && animal.transferDate) {
          const ageAtTransfer = Math.floor(
            (new Date(animal.transferDate).getTime() - new Date(animal.birthDate).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          return sum + ageAtTransfer;
        }
        return sum;
      }, 0);

      const averageTransferAge = totalTransferred > 0 ? Math.round(totalAge / totalTransferred) : 0;

      // حساب الحظائر الأكثر استقبالاً
      const barnCounts = transferredAnimals.reduce((acc, animal) => {
        if (animal.barnId) {
          acc[animal.barnId] = (acc[animal.barnId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const commonDestinationBarns = Object.entries(barnCounts)
        .map(([barnId, count]) => ({
          barnId,
          count,
          barnName: allBarns.find(b => b.id === barnId)?.name || 'حظيرة غير معروفة'
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // أعلى 5 حظائر

      return {
        totalTransferred,
        malesTransferred,
        femalesTransferred,
        averageTransferAge,
        successRate: 100, // نسبة النجاح (يمكن تحسينها لاحقاً)
        commonDestinationBarns
      };

    } catch (error) {
      console.error('Error getting transfer statistics:', error);
      return {
        totalTransferred: 0,
        malesTransferred: 0,
        femalesTransferred: 0,
        averageTransferAge: 0,
        successRate: 0,
        commonDestinationBarns: []
      };
    }
  }

  // فحص دوري للمواليد التي تحتاج نقل تلقائي
  async checkForPendingTransfers(): Promise<{
    pendingCount: number;
    overdueCount: number;
    readyAnimals: Animal[];
    recommendedAction: string;
  }> {
    
    try {
      const readyAnimals = await this.findAnimalsReadyForAutoTransfer();
      
      // تصنيف المواليد حسب عمر الفطام
      const overdueAnimals = readyAnimals.filter(animal => {
        const ageDays = newbornManagementService.calculateAgeDays(animal);
        return ageDays > 75; // متأخر عن الفطام المثالي
      });

      const pendingCount = readyAnimals.length;
      const overdueCount = overdueAnimals.length;

      let recommendedAction = '';
      if (overdueCount > 0) {
        recommendedAction = `يوجد ${overdueCount} مولود متأخر عن الفطام - يجب النقل فوراً`;
      } else if (pendingCount > 0) {
        recommendedAction = `يوجد ${pendingCount} مولود جاهز للنقل التلقائي`;
      } else {
        recommendedAction = 'لا توجد مواليد تحتاج نقل حالياً';
      }

      return {
        pendingCount,
        overdueCount,
        readyAnimals,
        recommendedAction
      };

    } catch (error) {
      console.error('Error checking pending transfers:', error);
      return {
        pendingCount: 0,
        overdueCount: 0,
        readyAnimals: [],
        recommendedAction: 'خطأ في فحص النقل المطلوب'
      };
    }
  }

  // معاينة النقل قبل التنفيذ
  async previewTransfer(animalIds: string[]): Promise<{
    transfers: Array<{
      animal: Animal;
      currentBarn: string;
      targetCategory: 'male' | 'female';
      recommendedBarn: string | null;
      warnings: string[];
    }>;
    summary: {
      totalAnimals: number;
      maleTransfers: number;
      femaleTransfers: number;
      barnsAffected: number;
    };
  }> {
    
    try {
      const [allAnimals, allBarns] = await Promise.all([
        dataService.animals.getAll(),
        dataService.barns.getAll()
      ]);

      const animalsToTransfer = allAnimals.filter(a => animalIds.includes(a.id));
      const transfers = [];

      for (const animal of animalsToTransfer) {
        const targetCategory = this.determineNewCategory(animal);
        const recommendedBarn = await this.findBestBarnForTransfer(animal, targetCategory, allBarns);
        const warnings: string[] = [];

        // تحذيرات محتملة
        if (!recommendedBarn) {
          warnings.push('لا توجد حظائر متاحة');
        }

        const ageDays = newbornManagementService.calculateAgeDays(animal);
        if (ageDays < 60) {
          warnings.push('فطام مبكر - أقل من 60 يوم');
        } else if (ageDays > 75) {
          warnings.push('فطام متأخر - أكثر من 75 يوم');
        }

        transfers.push({
          animal,
          currentBarn: animal.barnId || 'غير محدد',
          targetCategory,
          recommendedBarn,
          warnings
        });
      }

      const maleTransfers = transfers.filter(t => t.targetCategory === 'male').length;
      const femaleTransfers = transfers.filter(t => t.targetCategory === 'female').length;
      const barnsAffected = new Set(transfers.map(t => t.recommendedBarn).filter(Boolean)).size;

      return {
        transfers,
        summary: {
          totalAnimals: transfers.length,
          maleTransfers,
          femaleTransfers,
          barnsAffected
        }
      };

    } catch (error) {
      console.error('Error previewing transfer:', error);
      return {
        transfers: [],
        summary: {
          totalAnimals: 0,
          maleTransfers: 0,
          femaleTransfers: 0,
          barnsAffected: 0
        }
      };
    }
  }

  // جدولة النقل التلقائي (يمكن استدعاؤها دورياً)
  async scheduleAutomaticTransfers(): Promise<{
    executed: boolean;
    results: AutomaticTransferBatch;
    nextCheckTime: Date;
  }> {
    
    const results = await this.runAutomaticTransfer();
    
    // الجدولة القادمة (كل 24 ساعة)
    const nextCheckTime = new Date();
    nextCheckTime.setHours(nextCheckTime.getHours() + 24);

    return {
      executed: true,
      results,
      nextCheckTime
    };
  }

  // البحث عن جميع الحيوانات من الإنتاج الداخلي
  async getInternalProductionAnimals(): Promise<Animal[]> {
    try {
      const allAnimals = await dataService.animals.getAll();
      return allAnimals.filter(animal => animal.internalProduction === true);
    } catch (error) {
      console.error('Error getting internal production animals:', error);
      return [];
    }
  }

  // إحصائيات الإنتاج الداخلي
  async getInternalProductionStats(): Promise<{
    totalCount: number;
    maleCount: number;
    femaleCount: number;
    byCategory: Record<string, number>;
    averageAge: number;
    totalWeight: number;
  }> {
    try {
      const internalAnimals = await this.getInternalProductionAnimals();
      
      const stats = {
        totalCount: internalAnimals.length,
        maleCount: internalAnimals.filter(a => a.sex === 'male').length,
        femaleCount: internalAnimals.filter(a => a.sex === 'female').length,
        byCategory: {} as Record<string, number>,
        averageAge: 0,
        totalWeight: 0
      };

      // حساب الإحصائيات حسب الفئة
      internalAnimals.forEach(animal => {
        stats.byCategory[animal.category] = (stats.byCategory[animal.category] || 0) + 1;
        stats.totalWeight += animal.weight || 0;
      });

      // حساب متوسط العمر
      if (internalAnimals.length > 0) {
        const totalAge = internalAnimals.reduce((sum, animal) => sum + (animal.ageMonths || 0), 0);
        stats.averageAge = totalAge / internalAnimals.length;
      }

      return stats;
    } catch (error) {
      console.error('Error calculating internal production stats:', error);
      return {
        totalCount: 0,
        maleCount: 0,
        femaleCount: 0,
        byCategory: {},
        averageAge: 0,
        totalWeight: 0
      };
    }
  }
}

// إنشاء مثيل واحد من الخدمة
export const automaticWeaningTransferService = new AutomaticWeaningTransferService();
