import { Animal, AnimalCategory } from "@shared/types";
import { dataService } from "./data-service";
import { updateMotherChildRelationship } from "./animal-relationships";

// Weaning configuration
export const WEANING_CONFIG = {
  STANDARD_WEANING_AGE_MONTHS: 3, // Standard weaning age in months
  MIN_WEANING_AGE_MONTHS: 2, // Minimum weaning age
  MAX_WEANING_AGE_MONTHS: 4, // Maximum weaning age
  MIN_WEANING_WEIGHT_KG: 20, // Minimum weight for weaning (kg)
  NOTIFICATION_DAYS_BEFORE: 7, // Days before weaning to notify
};

export interface WeaningCandidate {
  id: string;
  earTagId: string;
  motherEarTagId?: string;
  birthDate: Date;
  currentWeight: number;
  currentAge: number; // in months
  estimatedWeaningDate: Date;
  isReadyForWeaning: boolean;
  reasonsNotReady: string[];
  newCategory: AnimalCategory;
  recommendedBarnId?: string;
}

export interface BreedingTimelineEvent {
  id: string;
  animalId: string;
  eventType:
    | "breeding"
    | "pregnancy_confirmed"
    | "birth"
    | "weaning"
    | "transfer";
  eventDate: Date;
  description: string;
  metadata?: any;
  createdAt: Date;
}

export interface BreedingWorkflowStats {
  totalNewborns: number;
  readyForWeaning: number;
  weaningThisWeek: number;
  weaningThisMonth: number;
  overdue: number;
  averageWeaningAge: number;
}

/**
 * Calculate age in months from birth date
 */
export function calculateAgeInMonths(birthDate: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - birthDate.getTime();
  const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Average month length
  return Math.round(diffMonths * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate estimated weaning date based on birth date
 */
export function calculateEstimatedWeaningDate(birthDate: Date): Date {
  const weaningDate = new Date(birthDate);
  weaningDate.setMonth(
    weaningDate.getMonth() + WEANING_CONFIG.STANDARD_WEANING_AGE_MONTHS,
  );
  return weaningDate;
}

/**
 * Determine appropriate category for weaned animal
 */
export function determineWeaningCategory(animal: Animal): AnimalCategory {
  if (animal.category !== "newborn") {
    throw new Error("Animal must be a newborn to determine weaning category");
  }

  return animal.sex === "male" ? "male" : "female";
}

/**
 * Check if a newborn is ready for weaning
 */
export function isReadyForWeaning(animal: Animal): {
  isReady: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (animal.category !== "newborn") {
    reasons.push("الحيوان ليس من المواليد");
    return { isReady: false, reasons };
  }

  if (!animal.birthDate) {
    reasons.push("تاريخ الميلاد غير محدد");
    return { isReady: false, reasons };
  }

  const ageInMonths = calculateAgeInMonths(animal.birthDate);

  // Check minimum age
  if (ageInMonths < WEANING_CONFIG.MIN_WEANING_AGE_MONTHS) {
    reasons.push(
      `العمر أقل من الحد الأدنى (${WEANING_CONFIG.MIN_WEANING_AGE_MONTHS} شهور)`,
    );
  }

  // Check minimum weight
  if (animal.weight < WEANING_CONFIG.MIN_WEANING_WEIGHT_KG) {
    reasons.push(
      `الوزن أقل من الحد الأدنى (${WEANING_CONFIG.MIN_WEANING_WEIGHT_KG} كيلو)`,
    );
  }

  // Check health status
  if (animal.isIsolated || animal.healthStatus.toLowerCase().includes("مريض")) {
    reasons.push("الحيوان في الحجر الصحي أو مريض");
  }

  return {
    isReady: reasons.length === 0,
    reasons,
  };
}

/**
 * Get all weaning candidates from newborns
 */
export async function getWeaningCandidates(): Promise<WeaningCandidate[]> {
  try {
    const newborns = await dataService.animals.getByCategory("newborn");
    const candidates: WeaningCandidate[] = [];

    for (const newborn of newborns) {
      if (!newborn.birthDate) continue;

      const ageInMonths = calculateAgeInMonths(newborn.birthDate);
      const estimatedWeaningDate = calculateEstimatedWeaningDate(
        newborn.birthDate,
      );
      const readinessCheck = isReadyForWeaning(newborn);
      const newCategory = determineWeaningCategory(newborn);

      candidates.push({
        id: newborn.id,
        earTagId: newborn.earTagId,
        motherEarTagId: newborn.motherEarTagId,
        birthDate: newborn.birthDate,
        currentWeight: newborn.weight,
        currentAge: ageInMonths,
        estimatedWeaningDate,
        isReadyForWeaning: readinessCheck.isReady,
        reasonsNotReady: readinessCheck.reasons,
        newCategory,
        recommendedBarnId: await getRecommendedBarnForCategory(newCategory),
      });
    }

    // Sort by age (oldest first)
    return candidates.sort((a, b) => b.currentAge - a.currentAge);
  } catch (error) {
    console.error("Error getting weaning candidates:", error);
    return [];
  }
}

/**
 * Get recommended barn for a category
 */
async function getRecommendedBarnForCategory(
  category: AnimalCategory,
): Promise<string | undefined> {
  try {
    const barns = await dataService.barns.getAll();
    const availableBarns = barns.filter(
      (barn) =>
        barn.isActive && (barn.type === category || barn.type === "mixed"),
    );

    if (availableBarns.length === 0) return undefined;

    // Simple logic: find barn with most available capacity
    let bestBarn = availableBarns[0];
    let maxAvailableCapacity = 0;

    for (const barn of availableBarns) {
      const animals = await dataService.animals.query([
        { field: "barnId", operator: "==", value: barn.id },
      ]);
      const availableCapacity = barn.capacity - animals.length;

      if (availableCapacity > maxAvailableCapacity) {
        maxAvailableCapacity = availableCapacity;
        bestBarn = barn;
      }
    }

    return bestBarn.id;
  } catch (error) {
    console.error("Error getting recommended barn:", error);
    return undefined;
  }
}

/**
 * Perform automatic weaning transfer for a newborn
 */
export async function performWeaningTransfer(
  newbornId: string,
  options: {
    newBarnId?: string;
    weaningDate?: Date;
    notes?: string;
    recordedBy: string;
  },
): Promise<{ success: boolean; message: string; transferredAnimal?: Animal }> {
  try {
    const newborn = await dataService.animals.getById(newbornId);
    if (!newborn) {
      return { success: false, message: "الحيوان غير موجود" };
    }

    if (newborn.category !== "newborn") {
      return { success: false, message: "الحيوان ليس من المواليد" };
    }

    const readinessCheck = isReadyForWeaning(newborn);
    if (!readinessCheck.isReady) {
      return {
        success: false,
        message: `الحيوان غير جاهز للفطام: ${readinessCheck.reasons.join(", ")}`,
      };
    }

    const newCategory = determineWeaningCategory(newborn);
    const weaningDate = options.weaningDate || new Date();
    const newBarnId =
      options.newBarnId || (await getRecommendedBarnForCategory(newCategory));

    if (!newBarnId) {
      return { success: false, message: "لا توجد حظائر متاحة للفئة الجديدة" };
    }

    // Generate new ear tag ID for the new category
    const newEarTagId = await dataService.animals.getNextEarTagId(newCategory);

    // Update the animal
    const updatedAnimal: Partial<Animal> = {
      category: newCategory,
      earTagId: newEarTagId,
      barnId: newBarnId,
      weaningDate,
      updatedAt: new Date(),
      updatedBy: options.recordedBy,
    };

    await dataService.animals.update(newbornId, updatedAnimal);

    // Record barn movement
    await dataService.barnMovements.create({
      id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      animalId: newbornId,
      fromBarnId: newborn.barnId,
      toBarnId: newBarnId,
      date: weaningDate,
      reason: `فطام وانتقال إلى فئة ${newCategory === "male" ? "الذكور" : "الإناث"}`,
      recordedBy: options.recordedBy,
    });

    // Update mother's offspring count if mother exists
    if (newborn.motherId) {
      await updateMotherOffspringAfterWeaning(newborn.motherId, newbornId);
    }

    // Log breeding timeline event
    await logBreedingEvent({
      animalId: newbornId,
      eventType: "weaning",
      eventDate: weaningDate,
      description: `فطام ${newborn.earTagId} وانتقال إلى ${newEarTagId}`,
      metadata: {
        fromCategory: "newborn",
        toCategory: newCategory,
        fromBarnId: newborn.barnId,
        toBarnId: newBarnId,
        ageAtWeaning: calculateAgeInMonths(newborn.birthDate!),
        weightAtWeaning: newborn.weight,
        notes: options.notes,
      },
    });

    const finalAnimal = await dataService.animals.getById(newbornId);

    return {
      success: true,
      message: `تم فطام ${newborn.earTagId} بنجاح وانتقل إلى ${newEarTagId}`,
      transferredAnimal: finalAnimal || undefined,
    };
  } catch (error) {
    console.error("Error performing weaning transfer:", error);
    return {
      success: false,
      message: `خطأ في عملية الفطام: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}

/**
 * Update mother's offspring information after weaning
 */
async function updateMotherOffspringAfterWeaning(
  motherId: string,
  weanedChildId: string,
): Promise<void> {
  try {
    const mother = await dataService.animals.getById(motherId);
    if (!mother) return;

    // Update offspring count (this will be recalculated, but we can decrement for immediate effect)
    const currentOffspringCount = mother.offspringCount || 0;
    if (currentOffspringCount > 0) {
      await dataService.animals.update(motherId, {
        offspringCount: currentOffspringCount - 1,
        updatedAt: new Date(),
      });
    }

    // The bidirectional relationship will be maintained through the existing system
    // since the weaned animal still has the motherId reference
  } catch (error) {
    console.error("Error updating mother after weaning:", error);
  }
}

/**
 * Get breeding workflow statistics
 */
export async function getBreedingWorkflowStats(): Promise<BreedingWorkflowStats> {
  try {
    const candidates = await getWeaningCandidates();
    const now = new Date();
    const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const readyForWeaning = candidates.filter(
      (c) => c.isReadyForWeaning,
    ).length;
    const weaningThisWeek = candidates.filter(
      (c) => c.estimatedWeaningDate <= oneWeek && c.estimatedWeaningDate >= now,
    ).length;
    const weaningThisMonth = candidates.filter(
      (c) =>
        c.estimatedWeaningDate <= oneMonth && c.estimatedWeaningDate >= now,
    ).length;
    const overdue = candidates.filter(
      (c) => c.estimatedWeaningDate < now,
    ).length;

    const averageWeaningAge =
      candidates.length > 0
        ? candidates.reduce((sum, c) => sum + c.currentAge, 0) /
          candidates.length
        : 0;

    return {
      totalNewborns: candidates.length,
      readyForWeaning,
      weaningThisWeek,
      weaningThisMonth,
      overdue,
      averageWeaningAge: Math.round(averageWeaningAge * 10) / 10,
    };
  } catch (error) {
    console.error("Error getting breeding workflow stats:", error);
    return {
      totalNewborns: 0,
      readyForWeaning: 0,
      weaningThisWeek: 0,
      weaningThisMonth: 0,
      overdue: 0,
      averageWeaningAge: 0,
    };
  }
}

/**
 * Log breeding timeline event
 */
export async function logBreedingEvent(
  event: Omit<BreedingTimelineEvent, "id" | "createdAt">,
): Promise<void> {
  try {
    const timelineEvent: BreedingTimelineEvent = {
      ...event,
      id: `bre_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    // For now, we'll store these as part of the animal's metadata or in a separate collection
    // This would be implemented based on the storage system being used
    console.log("Breeding timeline event:", timelineEvent);
  } catch (error) {
    console.error("Error logging breeding event:", error);
  }
}

/**
 * Auto-scan for animals ready for weaning (to be called periodically)
 */
export async function performAutomaticWeaningCheck(): Promise<{
  scanned: number;
  readyForWeaning: number;
  autoTransferred: number;
  notifications: string[];
}> {
  try {
    const candidates = await getWeaningCandidates();
    const readyCandidates = candidates.filter((c) => c.isReadyForWeaning);
    const notifications: string[] = [];
    let autoTransferred = 0;

    for (const candidate of readyCandidates) {
      // Check if weaning is overdue (more than standard age)
      if (candidate.currentAge >= WEANING_CONFIG.STANDARD_WEANING_AGE_MONTHS) {
        notifications.push(
          `${candidate.earTagId} جاهز للفطام (عمر ${candidate.currentAge} شهر)`,
        );

        // For very overdue cases (more than max age), we could auto-transfer
        if (candidate.currentAge >= WEANING_CONFIG.MAX_WEANING_AGE_MONTHS) {
          const result = await performWeaningTransfer(candidate.id, {
            recordedBy: "system_auto",
            notes: "فطام تلقائي - تجاوز الحد الأقصى للعمر",
          });

          if (result.success) {
            autoTransferred++;
            notifications.push(`تم فطام ${candidate.earTagId} تلقائياً`);
          }
        }
      }
    }

    return {
      scanned: candidates.length,
      readyForWeaning: readyCandidates.length,
      autoTransferred,
      notifications,
    };
  } catch (error) {
    console.error("Error in automatic weaning check:", error);
    return {
      scanned: 0,
      readyForWeaning: 0,
      autoTransferred: 0,
      notifications: ["خطأ في فحص الفطام التلقائي"],
    };
  }
}
