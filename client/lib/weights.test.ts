/**
 * Weight Reports Tests
 * Validates the exact calculations matching the provided spreadsheet format
 */

import { describe, test, expect } from 'vitest';
import {
  buildIntervals,
  buildCumulative,
  validateWeightEntry,
  type WeightEntry,
} from './weights';

describe('Weight Tracking Calculations', () => {
  // Sample weight data matching your requirements
  const sampleWeights: WeightEntry[] = [
    { date: '2023-08-01', weightKg: 45.0 },
    { date: '2023-09-01', weightKg: 52.5 },
    { date: '2023-10-01', weightKg: 58.2 },
    { date: '2023-11-01', weightKg: 65.8 },
    { date: '2023-12-01', weightKg: 71.3 },
  ];

  test('should validate weight entries correctly', () => {
    // Valid entry
    const validEntry = { date: '2023-08-01', weightKg: 45.0 };
    const validResult = validateWeightEntry(validEntry);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // Invalid weight (negative)
    const invalidWeight = { date: '2023-08-01', weightKg: -5 };
    const invalidResult = validateWeightEntry(invalidWeight);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toContain('الوزن يجب أن يكون أكبر من صفر');

    // Invalid date format
    const invalidDate = { date: 'invalid-date', weightKg: 45.0 };
    const invalidDateResult = validateWeightEntry(invalidDate);
    expect(invalidDateResult.isValid).toBe(false);
    expect(invalidDateResult.errors).toContain('تاريخ غير صحيح');
  });

  test('should calculate intervals correctly matching spreadsheet format', () => {
    const intervals = buildIntervals(sampleWeights);

    // First interval (W1 to W2): Aug 1 to Sep 1
    const firstInterval = intervals[0];
    expect(firstInterval.w1).toBe(45.0);
    expect(firstInterval.w2).toBe(52.5);
    expect(firstInterval.deltaW).toBe(7.5); // 52.5 - 45.0
    expect(firstInterval.deltaD).toBe(31); // Days between Aug 1 and Sep 1
    expect(firstInterval.adg).toBeCloseTo(0.242, 3); // 7.5 / 31 ≈ 0.242

    // Second interval (W2 to W3): Sep 1 to Oct 1  
    const secondInterval = intervals[1];
    expect(secondInterval.w1).toBe(52.5);
    expect(secondInterval.w2).toBe(58.2);
    expect(secondInterval.deltaW).toBe(5.7); // 58.2 - 52.5
    expect(secondInterval.deltaD).toBe(30); // Days between Sep 1 and Oct 1
    expect(secondInterval.adg).toBeCloseTo(0.19, 3); // 5.7 / 30

    // Verify all intervals
    expect(intervals).toHaveLength(4); // 5 weights = 4 intervals
  });

  test('should calculate cumulative metrics correctly', () => {
    const cumulative = buildCumulative(sampleWeights);

    // First weight (baseline)
    const first = cumulative[0];
    expect(first.cumDeltaW).toBe(0); // No change from itself
    expect(first.cumDeltaD).toBe(0); // No days from itself
    expect(first.cumADG).toBe(0); // No ADG for single point

    // Second weight (first interval cumulative)
    const second = cumulative[1];
    expect(second.cumDeltaW).toBe(7.5); // 52.5 - 45.0
    expect(second.cumDeltaD).toBe(31); // Days from Aug 1 to Sep 1
    expect(second.cumADG).toBeCloseTo(0.242, 3); // 7.5 / 31

    // Last weight (total cumulative)
    const last = cumulative[cumulative.length - 1];
    expect(last.cumDeltaW).toBe(26.3); // 71.3 - 45.0
    expect(last.cumDeltaD).toBe(122); // Days from Aug 1 to Dec 1
    expect(last.cumADG).toBeCloseTo(0.216, 3); // 26.3 / 122

    expect(cumulative).toHaveLength(5); // Same as number of weights
  });

  test('should handle edge cases correctly', () => {
    // Single weight
    const singleWeight = [{ date: '2023-08-01', weightKg: 45.0 }];
    const singleIntervals = buildIntervals(singleWeight);
    const singleCumulative = buildCumulative(singleWeight);
    
    expect(singleIntervals).toHaveLength(0); // No intervals with single weight
    expect(singleCumulative).toHaveLength(1);
    expect(singleCumulative[0].cumADG).toBe(0);

    // Same day weights (should not happen in practice but handle gracefully)
    const sameDayWeights = [
      { date: '2023-08-01', weightKg: 45.0 },
      { date: '2023-08-01', weightKg: 46.0 },
    ];
    const sameDayIntervals = buildIntervals(sameDayWeights);
    expect(sameDayIntervals[0].deltaD).toBe(0);
    expect(sameDayIntervals[0].adg).toBe(0); // Should handle division by zero

    // Decreasing weight (weight loss)
    const decreasingWeights = [
      { date: '2023-08-01', weightKg: 50.0 },
      { date: '2023-09-01', weightKg: 45.0 },
    ];
    const decreasingIntervals = buildIntervals(decreasingWeights);
    expect(decreasingIntervals[0].deltaW).toBe(-5.0);
    expect(decreasingIntervals[0].adg).toBeLessThan(0);
  });

  test('should match exact spreadsheet column format', () => {
    // Test data that matches your spreadsheet example
    const testAnimal = {
      earTagId: 'M001',
      category: 'male' as const,
      barnId: 'barn_001',
      weightHistory: [
        { date: '2023-08-01', weightKg: 45.0 }, // First Weigh Date, First Weight
        { date: '2023-09-01', weightKg: 52.5 }, // Second Weigh Date, Second Weight
        { date: '2023-10-01', weightKg: 58.2 },
      ]
    };

    const intervals = buildIntervals(testAnimal.weightHistory);
    const cumulative = buildCumulative(testAnimal.weightHistory);

    // Spreadsheet Row Verification:
    // رقم الأذن الحيوان = M001
    expect(testAnimal.earTagId).toBe('M001');
    
    // تاريخ الوزن 1 = 2023-08-01
    expect(testAnimal.weightHistory[0].date).toBe('2023-08-01');
    
    // الوزن 1 = 45.0
    expect(testAnimal.weightHistory[0].weightKg).toBe(45.0);
    
    // تاريخ الوزن 2 = 2023-09-01
    expect(testAnimal.weightHistory[1].date).toBe('2023-09-01');
    
    // الوزن 2 = 52.5
    expect(testAnimal.weightHistory[1].weightKg).toBe(52.5);
    
    // الفرق بين الوزنين = 7.5
    expect(intervals[0].deltaW).toBe(7.5);
    
    // الفرق بالأيام = 31
    expect(intervals[0].deltaD).toBe(31);
    
    // الزيادة اليومية = 0.242
    expect(intervals[0].adg).toBeCloseTo(0.242, 3);

    // Cumulative from first to last weight
    const lastCumulative = cumulative[cumulative.length - 1];
    expect(lastCumulative.cumDeltaW).toBe(13.2); // 58.2 - 45.0
    expect(lastCumulative.cumDeltaD).toBe(61); // Days from Aug 1 to Oct 1
    expect(lastCumulative.cumADG).toBeCloseTo(0.216, 3); // 13.2 / 61
  });

  test('should handle Arabic number formatting requirements', () => {
    // Verify ADG is rounded to 3 decimal places as specified
    const testWeights = [
      { date: '2023-08-01', weightKg: 45.0 },
      { date: '2023-09-01', weightKg: 52.7 }, // Creates a non-terminating decimal
    ];

    const intervals = buildIntervals(testWeights);
    const adg = intervals[0].adg;
    
    // Should be rounded to exactly 3 decimal places
    expect(Number(adg.toFixed(3))).toBe(adg);
    
    // Verify it's calculated correctly: 7.7 / 31 = 0.248387...
    expect(adg).toBeCloseTo(0.248, 3);
  });

  test('should handle barn aggregation calculations', () => {
    // Mock barn with multiple animals
    const barnAnimals = [
      {
        earTagId: 'M001',
        weightHistory: [
          { date: '2023-08-01', weightKg: 45.0 },
          { date: '2023-09-01', weightKg: 52.5 },
        ]
      },
      {
        earTagId: 'M002', 
        weightHistory: [
          { date: '2023-08-01', weightKg: 38.5 },
          { date: '2023-09-01', weightKg: 47.2 },
        ]
      }
    ];

    // Calculate individual ADGs
    const adg1 = buildIntervals(barnAnimals[0].weightHistory)[0].adg;
    const adg2 = buildIntervals(barnAnimals[1].weightHistory)[0].adg;
    
    // Barn aggregates
    const totalAnimals = barnAnimals.length;
    const totalLastWeight = 52.5 + 47.2; // Sum of last weights
    const averageWeight = totalLastWeight / totalAnimals;
    const averageADG = (adg1 + adg2) / totalAnimals;

    expect(totalAnimals).toBe(2);
    expect(totalLastWeight).toBe(99.7);
    expect(averageWeight).toBeCloseTo(49.85, 2);
    expect(averageADG).toBeCloseTo(0.23, 2); // Average of both ADGs
  });
});

// Export test utilities for use in integration tests
export {
  sampleWeights: [
    { date: '2023-08-01', weightKg: 45.0 },
    { date: '2023-09-01', weightKg: 52.5 },
    { date: '2023-10-01', weightKg: 58.2 },
    { date: '2023-11-01', weightKg: 65.8 },
    { date: '2023-12-01', weightKg: 71.3 },
  ]
};
