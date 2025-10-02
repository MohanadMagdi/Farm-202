/**
 * Arabic and RTL utilities for the Sheep Farm Management System
 */

/**
 * Format currency in Egyptian Pounds (EGP)
 */
export function formatEGP(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount)) {
    return "0 جنيه";
  }
  return `${amount.toLocaleString("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} جنيه`;
}

/**
 * Format weight in kilograms
 */
export function formatWeight(weight: number | undefined | null): string {
  if (weight == null || isNaN(weight)) {
    return "0.0 كيلو";
  }
  return `${weight.toLocaleString("ar-EG", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} كيلو`;
}

/**
 * Format date in Arabic
 */
export function formatArabicDate(date: Date | undefined | null): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "غير محدد";
  }
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format numbers in Arabic numerals
 */
export function formatArabicNumber(num: number | undefined | null): string {
  if (num == null || isNaN(num)) {
    return "0";
  }
  return num.toLocaleString("ar-EG");
}

/**
 * Convert English numbers to Arabic numerals
 */
export function toArabicNumerals(str: string): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return str.replace(/[0-9]/g, (w) => arabicNumerals[+w]);
}

/**
 * Animal type translations
 */
export const animalTypes = {
  male: "ذكور",
  female: "إناث",
  newborn: "صغار",
} as const;

/**
 * Health status translations
 */
export const healthStatus = {
  healthy: "سليم",
  sick: "مريض",
  under_treatment: "تحت العلاج",
  quarantine: "حجر صحي",
} as const;

/**
 * Animal status translations
 */
export const animalStatus = {
  active: "نشط",
  sold: "مُباع",
  dead: "نافق",
} as const;

/**
 * Inventory categories
 */
export const inventoryCategories = {
  feed: "أعلاف",
  medicine: "أدوية",
  medical_supply: "مستلزمات طبية",
  equipment: "معدات",
  maintenance: "صيانة",
} as const;

/**
 * Calculate Average Daily Gain (ADG) for an animal
 */
export function calculateADG(animal: {
  weight: number;
  birthDate?: Date;
  purchaseDate: Date;
}): number {
  const ageInDays = calculateAgeInDays(animal);
  const weightGain = calculateWeightGain(animal);
  return weightGain / ageInDays;
}

/**
 * Calculate total weight gain for an animal
 */
export function calculateWeightGain(animal: {
  weight: number;
  birthDate?: Date;
}): number {
  return Math.max(
    0,
    animal.weight - (animal.birthDate ? 3.5 : animal.weight * 0.7),
  );
}

/**
 * Calculate age in days for an animal
 */
export function calculateAgeInDays(animal: {
  birthDate?: Date;
  purchaseDate: Date;
}): number {
  const referenceDate = animal.birthDate || animal.purchaseDate;
  return Math.max(
    1,
    Math.floor(
      (new Date().getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
}

/**
 * Legacy feed types - use FEED_TYPES from shared/types instead
 * @deprecated Use FEED_TYPES from @shared/types for new code
 */
export const feedTypes = {
  hay: "دريس",
  straw: "تبن",
  concentrate_14: "علف مركز 14%",
  concentrate_16: "علف مركز 16%",
  concentrate_21: "علف مركز 21%",
} as const;
