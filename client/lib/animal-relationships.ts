/**
 * Animal Relationship Management System
 * Handles dynamic bidirectional relationships between animals
 * Ensures data integrity and proper validation
 */

import type { Animal, AnimalCategory } from "@shared/types";
import { dataService } from "./data-service";

export interface RelationshipValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MotherChildRelationship {
  motherId: string;
  motherEarTagId: string;
  childId: string;
  childEarTagId: string;
  birthDate?: Date;
  weaningDate?: Date;
}

/**
 * Validate mother-child relationship
 */
export function validateMotherChildRelationship(
  motherId: string,
  childCategory: AnimalCategory,
  animals: Animal[],
): RelationshipValidationResult {
  const result: RelationshipValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Find the mother animal
  const mother = animals.find((animal) => animal.id === motherId);

  if (!mother) {
    result.isValid = false;
    result.errors.push("الأم المحددة غير موجودة في النظام");
    return result;
  }

  // Validate mother is female
  if (mother.sex !== "female") {
    result.isValid = false;
    result.errors.push("يجب أن تكون الأم من الإناث");
  }

  // Validate mother category
  if (mother.category !== "female") {
    result.isValid = false;
    result.errors.push("يجب أن تكون الأم مصنفة كأنثى بالغة");
  }

  // Validate child category
  if (childCategory !== "newborn") {
    result.warnings.push("عادة ما يكون المولود الجديد مصنف كمولود");
  }

  // Check if mother is too young
  const motherAge = calculateAnimalAgeInDays(mother);
  if (motherAge < 365) {
    // Less than 1 year
    result.warnings.push("الأم صغيرة السن (أقل من سنة) - قد تحتاج متابعة خاصة");
  }

  // Check mother's health status
  if (mother.isIsolated) {
    result.warnings.push("الأم في حالة عزل - تأكد من حالتها الصحية");
  }

  return result;
}

/**
 * Calculate animal age in days
 */
export function calculateAnimalAgeInDays(animal: Animal): number {
  const birthDate = animal.birthDate || animal.purchaseDate;
  const now = new Date();
  return Math.floor(
    (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Create bidirectional mother-child relationship
 */
export async function createMotherChildRelationship(
  motherId: string,
  childData: Omit<Animal, "id">,
): Promise<{ success: boolean; childId?: string; errors: string[] }> {
  try {
    // Get current animals data
    const animals = await dataService.animals.getAll();

    // Validate the relationship
    const validation = validateMotherChildRelationship(
      motherId,
      childData.category,
      animals,
    );
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const mother = animals.find((animal) => animal.id === motherId);
    if (!mother) {
      return { success: false, errors: ["الأم غير موجودة"] };
    }

    // Create the child with proper mother references
    const childWithMother: Omit<Animal, "id"> = {
      ...childData,
      motherId: mother.id,
      motherEarTagId: mother.earTagId,
      birthDate: childData.birthDate || new Date(),
    };

    // Create the child
    const newChild = await dataService.animals.create(childWithMother);

    // Update mother with offspring reference
    const updatedOffspringIds = [...(mother.offspringIds || []), newChild.id];
    const updatedOffspringCount = (mother.offspringCount || 0) + 1;

    await dataService.animals.update(mother.id, {
      offspringIds: updatedOffspringIds,
      offspringCount: updatedOffspringCount,
      updatedAt: new Date(),
      updatedBy: "system", // TODO: Get from auth context
    });

    return { success: true, childId: newChild.id, errors: [] };
  } catch (error) {
    console.error("Error creating mother-child relationship:", error);
    return { success: false, errors: ["حدث خطأ أثناء إنشاء العلاقة"] };
  }
}

/**
 * Update mother-child relationship
 */
export async function updateMotherChildRelationship(
  childId: string,
  newMotherId: string | null,
  oldMotherId: string | null,
): Promise<{ success: boolean; errors: string[] }> {
  try {
    const animals = await dataService.animals.getAll();
    const child = animals.find((animal) => animal.id === childId);

    if (!child) {
      return { success: false, errors: ["الحيوان غير موجود"] };
    }

    // Remove from old mother if exists
    if (oldMotherId) {
      const oldMother = animals.find((animal) => animal.id === oldMotherId);
      if (oldMother) {
        const updatedOffspringIds = (oldMother.offspringIds || []).filter(
          (id) => id !== childId,
        );
        const updatedOffspringCount = Math.max(
          0,
          (oldMother.offspringCount || 1) - 1,
        );

        await dataService.animals.update(oldMother.id, {
          offspringIds: updatedOffspringIds,
          offspringCount: updatedOffspringCount,
          updatedAt: new Date(),
          updatedBy: "system",
        });
      }
    }

    // Add to new mother if specified
    if (newMotherId) {
      const validation = validateMotherChildRelationship(
        newMotherId,
        child.category,
        animals,
      );
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const newMother = animals.find((animal) => animal.id === newMotherId);
      if (!newMother) {
        return { success: false, errors: ["الأم الجديدة غير موجودة"] };
      }

      // Update child with new mother info
      await dataService.animals.update(child.id, {
        motherId: newMother.id,
        motherEarTagId: newMother.earTagId,
        updatedAt: new Date(),
        updatedBy: "system",
      });

      // Update new mother with offspring reference
      const updatedOffspringIds = [...(newMother.offspringIds || []), child.id];
      const updatedOffspringCount = (newMother.offspringCount || 0) + 1;

      await dataService.animals.update(newMother.id, {
        offspringIds: updatedOffspringIds,
        offspringCount: updatedOffspringCount,
        updatedAt: new Date(),
        updatedBy: "system",
      });
    } else {
      // Remove mother reference from child
      await dataService.animals.update(child.id, {
        motherId: undefined,
        motherEarTagId: undefined,
        updatedAt: new Date(),
        updatedBy: "system",
      });
    }

    return { success: true, errors: [] };
  } catch (error) {
    console.error("Error updating mother-child relationship:", error);
    return { success: false, errors: ["حدث خطأ أثناء تحديث العلاقة"] };
  }
}

/**
 * Delete animal and update relationships
 */
export async function deleteAnimalWithRelationships(
  animalId: string,
): Promise<{ success: boolean; errors: string[] }> {
  try {
    const animals = await dataService.animals.getAll();
    const animal = animals.find((a) => a.id === animalId);

    if (!animal) {
      return { success: false, errors: ["الحيوان غير موجود"] };
    }

    // If deleting a mother, update all her offspring
    if (animal.offspringIds && animal.offspringIds.length > 0) {
      for (const offspringId of animal.offspringIds) {
        await dataService.animals.update(offspringId, {
          motherId: undefined,
          motherEarTagId: undefined,
          updatedAt: new Date(),
          updatedBy: "system",
        });
      }
    }

    // If deleting a child, update the mother
    if (animal.motherId) {
      const mother = animals.find((a) => a.id === animal.motherId);
      if (mother) {
        const updatedOffspringIds = (mother.offspringIds || []).filter(
          (id) => id !== animal.id,
        );
        const updatedOffspringCount = Math.max(
          0,
          (mother.offspringCount || 1) - 1,
        );

        await dataService.animals.update(mother.id, {
          offspringIds: updatedOffspringIds,
          offspringCount: updatedOffspringCount,
          updatedAt: new Date(),
          updatedBy: "system",
        });
      }
    }

    // Delete the animal
    await dataService.animals.delete(animalId);

    return { success: true, errors: [] };
  } catch (error) {
    console.error("Error deleting animal with relationships:", error);
    return { success: false, errors: ["حدث خطأ أثناء حذف الحيوان"] };
  }
}

/**
 * Get all offspring for a mother
 */
export async function getOffspringForMother(
  motherId: string,
): Promise<Animal[]> {
  try {
    const animals = await dataService.animals.getAll();
    return animals.filter((animal) => animal.motherId === motherId);
  } catch (error) {
    console.error("Error getting offspring:", error);
    return [];
  }
}

/**
 * Get mother for a child
 */
export async function getMotherForChild(
  childId: string,
): Promise<Animal | null> {
  try {
    const animals = await dataService.animals.getAll();
    const child = animals.find((animal) => animal.id === childId);

    if (!child || !child.motherId) {
      return null;
    }

    return animals.find((animal) => animal.id === child.motherId) || null;
  } catch (error) {
    console.error("Error getting mother:", error);
    return null;
  }
}

/**
 * Sync all mother-child relationships (repair inconsistencies)
 */
export async function syncAllMotherChildRelationships(): Promise<{
  synced: number;
  errors: string[];
}> {
  try {
    const animals = await dataService.animals.getAll();
    let syncedCount = 0;
    const errors: string[] = [];

    // Update all mothers with correct offspring lists
    const mothers = animals.filter(
      (animal) => animal.sex === "female" && animal.category === "female",
    );

    for (const mother of mothers) {
      const offspring = animals.filter(
        (animal) => animal.motherId === mother.id,
      );
      const offspringIds = offspring.map((child) => child.id);

      // Update mother if offspring data is inconsistent
      if (
        JSON.stringify(mother.offspringIds?.sort()) !==
          JSON.stringify(offspringIds.sort()) ||
        mother.offspringCount !== offspring.length
      ) {
        await dataService.animals.update(mother.id, {
          offspringIds: offspringIds,
          offspringCount: offspring.length,
          updatedAt: new Date(),
          updatedBy: "system_sync",
        });
        syncedCount++;
      }
    }

    // Update all children with correct mother ear tag IDs
    const children = animals.filter((animal) => animal.motherId);

    for (const child of children) {
      const mother = animals.find((animal) => animal.id === child.motherId);
      if (mother && child.motherEarTagId !== mother.earTagId) {
        await dataService.animals.update(child.id, {
          motherEarTagId: mother.earTagId,
          updatedAt: new Date(),
          updatedBy: "system_sync",
        });
        syncedCount++;
      }
    }

    return { synced: syncedCount, errors };
  } catch (error) {
    console.error("Error syncing relationships:", error);
    return { synced: 0, errors: ["حدث خطأ أثناء مزامنة العلاقات"] };
  }
}

/**
 * Validate all relationships in the system
 */
export async function validateAllRelationships(): Promise<{
  isValid: boolean;
  issues: Array<{
    animalId: string;
    earTagId: string;
    issue: string;
    severity: "error" | "warning";
  }>;
}> {
  try {
    const animals = await dataService.animals.getAll();
    const issues: Array<{
      animalId: string;
      earTagId: string;
      issue: string;
      severity: "error" | "warning";
    }> = [];

    // Check all animals with mother references
    for (const animal of animals) {
      if (animal.motherId) {
        const mother = animals.find((a) => a.id === animal.motherId);

        if (!mother) {
          issues.push({
            animalId: animal.id,
            earTagId: animal.earTagId,
            issue: "مرجع الأم غير صحيح - الأم غير موجودة",
            severity: "error",
          });
        } else {
          if (mother.sex !== "female") {
            issues.push({
              animalId: animal.id,
              earTagId: animal.earTagId,
              issue: "الأم المرجعة ليست أنثى",
              severity: "error",
            });
          }

          if (!mother.offspringIds?.includes(animal.id)) {
            issues.push({
              animalId: animal.id,
              earTagId: animal.earTagId,
              issue: "مرجع الأم غير متطابق مع قائمة الصغار",
              severity: "warning",
            });
          }
        }
      }
    }

    return {
      isValid:
        issues.filter((issue) => issue.severity === "error").length === 0,
      issues,
    };
  } catch (error) {
    console.error("Error validating relationships:", error);
    return {
      isValid: false,
      issues: [
        {
          animalId: "system",
          earTagId: "system",
          issue: "حدث خطأ أثناء فحص العلاقات",
          severity: "error",
        },
      ],
    };
  }
}
