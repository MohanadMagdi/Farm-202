/**
 * Weight Tracking Calculation Utilities
 * Handles weight history analysis, ADG calculations, and barn aggregations
 */

export interface WeightEntry {
  date: string; // YYYY-MM-DD format
  weightKg: number;
  id?: string; // for deletion purposes
}

export interface AnimalWeightHistory {
  earTagId: string;
  category: "male" | "female" | "newborn";
  birthDate?: string;
  purchaseDate?: string;
  barnId: string;
  weightHistory: WeightEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WeightInterval {
  index: number;
  w1Date: string;
  w1: number;
  w2Date: string;
  w2: number;
  deltaW: number; // W2 - W1
  deltaD: number; // days difference
  adg: number; // average daily gain
}

export interface CumulativeWeight {
  index: number;
  date: string;
  weight: number;
  cumDeltaW: number; // from first weight
  cumDeltaD: number; // from first date
  cumADG: number; // cumulative ADG
}

export interface AnimalWeightReport {
  earTagId: string;
  birthOrPurchaseDate: string | null;
  barnId: string;
  category: string;
  intervals: WeightInterval[];
  cumulative: CumulativeWeight[];
  lastWeight?: number;
  lastWeightDate?: string;
  totalWeightGain?: number;
  overallADG?: number;
}

export interface BarnKPIs {
  barnId: string;
  barnName: string;
  totalAnimals: number;
  totalAnimalsMeasured: number;
  totalCurrentWeight: number;
  meanADG: number;
  totalFeedIssued?: number;
  feedPerAnimal?: number;
  feedingEfficiency?: number;
  feedByType?: Record<string, number>;
}

/**
 * Sort weight entries by date ascending
 */
export function sortWeightHistory(weightHistory: WeightEntry[]): WeightEntry[] {
  return [...weightHistory]
    .filter(entry => entry.date && entry.weightKg > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calculate days difference between two dates (UTC midnight)
 */
export function calculateDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00Z');
  const d2 = new Date(date2 + 'T00:00:00Z');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Build interval metrics (for each consecutive pair of weights)
 */
export function buildIntervals(weightHistory: WeightEntry[]): WeightInterval[] {
  const sortedHistory = sortWeightHistory(weightHistory);
  const intervals: WeightInterval[] = [];

  for (let i = 1; i < sortedHistory.length; i++) {
    const w1 = sortedHistory[i - 1];
    const w2 = sortedHistory[i];
    
    const deltaW = w2.weightKg - w1.weightKg;
    const deltaD = calculateDaysDifference(w1.date, w2.date);
    const adg = deltaD > 0 ? Math.round((deltaW / deltaD) * 1000) / 1000 : 0;

    intervals.push({
      index: i,
      w1Date: w1.date,
      w1: w1.weightKg,
      w2Date: w2.date,
      w2: w2.weightKg,
      deltaW,
      deltaD,
      adg,
    });
  }

  return intervals;
}

/**
 * Build cumulative metrics (from first weight to each subsequent weight)
 */
export function buildCumulative(weightHistory: WeightEntry[]): CumulativeWeight[] {
  const sortedHistory = sortWeightHistory(weightHistory);
  const cumulative: CumulativeWeight[] = [];

  if (sortedHistory.length === 0) return cumulative;

  const firstWeight = sortedHistory[0];

  sortedHistory.forEach((entry, index) => {
    const cumDeltaW = entry.weightKg - firstWeight.weightKg;
    const cumDeltaD = index === 0 ? 0 : calculateDaysDifference(firstWeight.date, entry.date);
    const cumADG = cumDeltaD > 0 ? Math.round((cumDeltaW / cumDeltaD) * 1000) / 1000 : 0;

    cumulative.push({
      index: index + 1,
      date: entry.date,
      weight: entry.weightKg,
      cumDeltaW,
      cumDeltaD,
      cumADG,
    });
  });

  return cumulative;
}

/**
 * Generate complete animal weight report
 */
export function generateAnimalWeightReport(
  animal: AnimalWeightHistory,
  dateFrom?: string,
  dateTo?: string
): AnimalWeightReport {
  let weightHistory = animal.weightHistory;

  // Filter by date range if provided
  if (dateFrom || dateTo) {
    weightHistory = weightHistory.filter(entry => {
      const entryDate = entry.date;
      if (dateFrom && entryDate < dateFrom) return false;
      if (dateTo && entryDate > dateTo) return false;
      return true;
    });
  }

  const intervals = buildIntervals(weightHistory);
  const cumulative = buildCumulative(weightHistory);
  const sortedHistory = sortWeightHistory(weightHistory);

  const lastWeight = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;
  const firstWeight = sortedHistory.length > 0 ? sortedHistory[0] : null;

  const totalWeightGain = lastWeight && firstWeight ? lastWeight.weightKg - firstWeight.weightKg : 0;
  const totalDays = lastWeight && firstWeight ? calculateDaysDifference(firstWeight.date, lastWeight.date) : 0;
  const overallADG = totalDays > 0 ? Math.round((totalWeightGain / totalDays) * 1000) / 1000 : 0;

  return {
    earTagId: animal.earTagId,
    birthOrPurchaseDate: animal.birthDate || animal.purchaseDate || null,
    barnId: animal.barnId,
    category: animal.category,
    intervals,
    cumulative,
    lastWeight: lastWeight?.weightKg,
    lastWeightDate: lastWeight?.date,
    totalWeightGain,
    overallADG,
  };
}

/**
 * Compute barn KPIs and aggregations
 */
export function computeBarnKPIs(
  animals: AnimalWeightHistory[],
  feedingRecords?: any[],
  dateFrom?: string,
  dateTo?: string
): BarnKPIs {
  const barnId = animals.length > 0 ? animals[0].barnId : '';
  const barnName = `حظيرة ${barnId}`;

  let totalAnimals = animals.length;
  let totalAnimalsMeasured = 0;
  let totalCurrentWeight = 0;
  let totalADG = 0;
  let animalCount = 0;

  // Process each animal
  animals.forEach(animal => {
    const report = generateAnimalWeightReport(animal, dateFrom, dateTo);
    
    if (report.lastWeight) {
      totalAnimalsMeasured++;
      totalCurrentWeight += report.lastWeight;
    }

    if (report.overallADG && report.overallADG > 0) {
      totalADG += report.overallADG;
      animalCount++;
    }
  });

  const meanADG = animalCount > 0 ? Math.round((totalADG / animalCount) * 1000) / 1000 : 0;

  // Calculate feeding metrics if feeding records are provided
  let totalFeedIssued: number | undefined;
  let feedPerAnimal: number | undefined;
  let feedingEfficiency: number | undefined;
  let feedByType: Record<string, number> | undefined;

  if (feedingRecords && feedingRecords.length > 0) {
    // Filter feeding records by date range
    let filteredFeeding = feedingRecords.filter(record => {
      if (dateFrom && record.date < dateFrom) return false;
      if (dateTo && record.date > dateTo) return false;
      return true;
    });

    totalFeedIssued = filteredFeeding.reduce((sum, record) => sum + (record.qtyKg || 0), 0);
    feedPerAnimal = totalAnimalsMeasured > 0 ? totalFeedIssued / totalAnimalsMeasured : 0;
    feedingEfficiency = meanADG > 0 && feedPerAnimal > 0 ? 
      Math.round((feedPerAnimal / meanADG) * 1000) / 1000 : 0;

    // Group by feed type
    feedByType = filteredFeeding.reduce((acc, record) => {
      const feedType = record.feedItemId || 'غير محدد';
      acc[feedType] = (acc[feedType] || 0) + (record.qtyKg || 0);
      return acc;
    }, {} as Record<string, number>);
  }

  return {
    barnId,
    barnName,
    totalAnimals,
    totalAnimalsMeasured,
    totalCurrentWeight: Math.round(totalCurrentWeight * 1000) / 1000,
    meanADG,
    totalFeedIssued,
    feedPerAnimal: feedPerAnimal ? Math.round(feedPerAnimal * 1000) / 1000 : undefined,
    feedingEfficiency,
    feedByType,
  };
}

/**
 * Validate weight entry
 */
export function validateWeightEntry(date: string, weightKg: number): string[] {
  const errors: string[] = [];

  if (!date) {
    errors.push('التاريخ مطلوب');
  } else if (isNaN(Date.parse(date))) {
    errors.push('تاريخ غير صالح');
  }

  if (!weightKg || weightKg <= 0) {
    errors.push('الوزن يجب أن يكون أكبر من صفر');
  } else if (weightKg > 200) {
    errors.push('الوزن يبدو غير منطقي (أكبر من 200 كيلو)');
  }

  return errors;
}

/**
 * Check for duplicate weight entries on the same date
 */
export function checkDuplicateDate(
  weightHistory: WeightEntry[], 
  newDate: string, 
  excludeId?: string
): boolean {
  return weightHistory.some(entry => 
    entry.date === newDate && entry.id !== excludeId
  );
}

/**
 * Format weight for display (3 decimal places for ADG, 1 for weights)
 */
export function formatWeight(weight: number, isADG = false): string {
  const decimals = isADG ? 3 : 1;
  return weight.toFixed(decimals);
}

/**
 * Format date for Arabic display
 */
export function formatArabicDate(dateString: string): string {
  const date = new Date(dateString);
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  return `${date.getDate()} ${arabicMonths[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Export helper - convert report data to Excel-ready format
 */
export function prepareExcelData(reports: AnimalWeightReport[]): any[] {
  const excelData: any[] = [];

  reports.forEach(report => {
    if (report.intervals.length === 0 && report.cumulative.length > 0) {
      // Only one weight entry
      const cum = report.cumulative[0];
      excelData.push({
        'رقم الأذن': report.earTagId,
        'تاريخ وزن 1': cum.date,
        'الوزن 1': formatWeight(cum.weight),
        'تاريخ وزن 2': '',
        'الوزن 2': '',
        'الفرق بين الوزنين': '',
        'الفرق بالأيام': '',
        'الزيادة اليومية (ADG)': '',
        'الزيادة التراكمية': '',
        'ADG التراكمي': '',
      });
    } else {
      // Multiple weights - show intervals
      report.intervals.forEach((interval, index) => {
        const cumulative = report.cumulative[index + 1];
        excelData.push({
          'رقم الأذن': index === 0 ? report.earTagId : '',
          'تاريخ وزن 1': interval.w1Date,
          'الوزن 1': formatWeight(interval.w1),
          'تاريخ وزن 2': interval.w2Date,
          'الوزن 2': formatWeight(interval.w2),
          'الفرق بين الوزنين': formatWeight(interval.deltaW),
          'الفرق بالأيام': interval.deltaD.toString(),
          'الزيادة اليومية (ADG)': formatWeight(interval.adg, true),
          'الزيادة التراكمية': formatWeight(cumulative?.cumDeltaW || 0),
          'ADG التراكمي': formatWeight(cumulative?.cumADG || 0, true),
        });
      });
    }
  });

  return excelData;
}
