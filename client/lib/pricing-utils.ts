/**
 * Pricing calculation utilities for the Sheep Farm Management System
 * Handles formula-based pricing, manual pricing, and market rate calculations
 */

import type { Animal, PricingFormula, AnimalCategory } from "@shared/types";

// Default pricing formulas for different animal categories
export const DEFAULT_PRICING_FORMULAS: Record<AnimalCategory, PricingFormula> =
  {
    male: {
      id: "male_default",
      name: "تسعير الذكور الأساسي",
      description:
        "تسعير الذكور بناءً على الوزن والعمر (سعر أساسي + وزن × سعر الكيلو)",
      animalCategory: "male",
      basePrice: 1500, // EGP - minimum price
      pricePerKg: 45, // EGP per kg
      minWeight: 15, // kg
      maxWeight: 100, // kg
      ageMultiplier: 1.02, // 2% increase per month for young males
      qualityMultiplier: 1.0, // Quality grade multiplier
      seasonalMultiplier: 1.0, // Seasonal market multiplier
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
    },
    female: {
      id: "female_default",
      name: "تسعير الإناث الأساسي",
      description: "تسعير الإناث بناءً على الوزن وقدرة الإنتاج",
      animalCategory: "female",
      basePrice: 2000, // EGP - higher base for breeding females
      pricePerKg: 50, // EGP per kg
      minWeight: 20, // kg
      maxWeight: 80, // kg
      ageMultiplier: 1.01, // 1% increase per month
      qualityMultiplier: 1.2, // 20% bonus for breeding quality
      seasonalMultiplier: 1.0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
    },
    newborn: {
      id: "newborn_default",
      name: "تسعير المواليد الأساسي",
      description: "تسعير المواليد بناءً على الوزن والنمو المتوقع",
      animalCategory: "newborn",
      basePrice: 500, // EGP - lower base for newborns
      pricePerKg: 80, // EGP per kg - higher per kg for growth potential
      minWeight: 2, // kg
      maxWeight: 15, // kg
      ageMultiplier: 1.05, // 5% increase per month for growth
      qualityMultiplier: 1.0,
      seasonalMultiplier: 1.0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
    },
  };

/**
 * Calculate animal price using formula-based method
 */
export function calculateFormulaPrice(
  animal: Animal,
  formula?: PricingFormula,
): number {
  const activeFormula = formula || DEFAULT_PRICING_FORMULAS[animal.category];

  if (!activeFormula || !activeFormula.isActive) {
    return animal.purchasePrice; // Fallback to purchase price
  }

  // Base calculation: Base Price + (Weight × Price per Kg)
  let calculatedPrice =
    activeFormula.basePrice + animal.weight * activeFormula.pricePerKg;

  // Apply weight bounds
  if (animal.weight < activeFormula.minWeight) {
    calculatedPrice = activeFormula.basePrice; // Use minimum price
  }

  if (activeFormula.maxWeight && animal.weight > activeFormula.maxWeight) {
    calculatedPrice =
      activeFormula.basePrice +
      activeFormula.maxWeight * activeFormula.pricePerKg;
  }

  // Apply age multiplier (if birth date available)
  if (activeFormula.ageMultiplier && animal.birthDate) {
    const ageInMonths = calculateAgeInMonths(animal.birthDate);
    const ageMultiplier = Math.pow(
      activeFormula.ageMultiplier,
      Math.min(ageInMonths, 24),
    ); // Cap at 24 months
    calculatedPrice *= ageMultiplier;
  }

  // Apply quality multiplier
  if (activeFormula.qualityMultiplier) {
    calculatedPrice *= activeFormula.qualityMultiplier;
  }

  // Apply seasonal multiplier
  if (activeFormula.seasonalMultiplier) {
    calculatedPrice *= activeFormula.seasonalMultiplier;
  }

  return Math.round(calculatedPrice); // Round to nearest EGP
}

/**
 * Calculate age in months from birth date
 */
export function calculateAgeInMonths(birthDate: Date | string): number {
  const now = new Date();
  const birthDateObj =
    typeof birthDate === "string" ? new Date(birthDate) : birthDate;

  // Validate date
  if (isNaN(birthDateObj.getTime())) {
    return 0; // Return 0 if invalid date
  }

  const diffTime = Math.abs(now.getTime() - birthDateObj.getTime());
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // Approximate months
  return diffMonths;
}

/**
 * Get market-based price (could integrate with external APIs)
 */
export function getMarketPrice(animal: Animal): number {
  // For now, use a simple market rate calculation
  // In production, this could integrate with livestock market APIs
  const marketRates = {
    male: 42, // EGP per kg
    female: 48, // EGP per kg
    newborn: 75, // EGP per kg
  };

  const baseMarketPrice =
    animal.weight *
    marketRates[
      animal.category === "male"
        ? "male"
        : animal.category === "female"
          ? "female"
          : "newborn"
    ];

  // Add 10% markup for farm premium
  return Math.round(baseMarketPrice * 1.1);
}

/**
 * Calculate current price based on pricing method
 */
export function calculateCurrentPrice(
  animal: Animal,
  customFormula?: PricingFormula,
): number {
  switch (animal.pricingMethod) {
    case "formula":
      return calculateFormulaPrice(animal, customFormula);
    case "market_rate":
      return getMarketPrice(animal);
    case "manual":
    default:
      return animal.currentPrice || animal.purchasePrice;
  }
}

/**
 * Get pricing breakdown for transparency
 */
export interface PricingBreakdown {
  basePrice: number;
  weightPrice: number;
  ageBonus: number;
  qualityBonus: number;
  seasonalAdjustment: number;
  totalPrice: number;
  formula: string;
}

export function getPricingBreakdown(
  animal: Animal,
  formula?: PricingFormula,
): PricingBreakdown {
  const activeFormula = formula || DEFAULT_PRICING_FORMULAS[animal.category];

  const basePrice = activeFormula.basePrice;
  const weightPrice = animal.weight * activeFormula.pricePerKg;

  let ageBonus = 0;
  if (activeFormula.ageMultiplier && animal.birthDate) {
    const ageInMonths = calculateAgeInMonths(animal.birthDate);
    const ageMultiplier = Math.pow(
      activeFormula.ageMultiplier,
      Math.min(ageInMonths, 24),
    );
    ageBonus = (basePrice + weightPrice) * (ageMultiplier - 1);
  }

  const qualityBonus =
    (basePrice + weightPrice) * ((activeFormula.qualityMultiplier || 1) - 1);
  const seasonalAdjustment =
    (basePrice + weightPrice + ageBonus + qualityBonus) *
    ((activeFormula.seasonalMultiplier || 1) - 1);

  const totalPrice = calculateFormulaPrice(animal, formula);

  return {
    basePrice,
    weightPrice,
    ageBonus,
    qualityBonus,
    seasonalAdjustment,
    totalPrice,
    formula: `${basePrice} + (${animal.weight} × ${activeFormula.pricePerKg}) + تعديلات`,
  };
}

/**
 * Format price in Egyptian Pounds
 */
export function formatEGP(amount: number): string {
  return `${amount.toLocaleString("ar-EG")} جنيه`;
}

/**
 * Update all animals' prices based on their pricing method
 */
export function recalculateAllPrices(animals: Animal[]): Animal[] {
  return animals.map((animal) => ({
    ...animal,
    currentPrice: calculateCurrentPrice(animal),
  }));
}
