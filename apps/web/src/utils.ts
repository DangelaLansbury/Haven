import * as fuzz from 'fuzzball';
import { EFF_GILTI_RATE, GILTI_RATE, US_TAX_RATE, CountryNames, Countries, BlendingResult, DefaultMockData, DollarValue } from './types';

export const formatPercentage = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const formatDollars = (amount: number): DollarValue => {
  if (amount > 1000000000) {
    return {
      value: amount / 1000000000,
      suffix: 'B',
    };
  } else if (amount > 1000000) {
    return {
      value: amount / 1000000,
      suffix: 'M',
    };
  } else {
    return {
      value: amount,
      suffix: '',
    };
  }
};

export const calcTotalETR = (ftr: number): { ftc: number; topUp: number; etr: number } => {
  const ftc = ftr * 0.8;
  const topUp = Math.max(GILTI_RATE - ftc, 0);
  const etr = ftr + topUp;
  return { ftc, topUp, etr };
};

// export const calcNetUSTaxOwed = (revenue: number, etr: number): number => {
//   if (revenue <= 0 || etr <= 0) return 0;
//   const netRate = EFF_GILTI_RATE - etr;
//   const netUSTaxOwed = netRate * revenue;
//   return netUSTaxOwed;
// };

// export const calcExtraTaxOwed = (revenue: number, etr: number, rateToUse: number): number => {
//   if (revenue <= 0 || etr <= 0) return 0;
//   const netRate = rateToUse - etr;
//   const extraTaxOwed = netRate * revenue;
//   return extraTaxOwed;
// };

export function matchToCountryEnum(countryString: string): CountryNames | null {
  const normString = countryString.trim().toLowerCase();
  const threshold = 80;
  for (const key of Object.keys(CountryNames)) {
    const enumValue = CountryNames[key as keyof typeof CountryNames];
    const match = fuzz.ratio(enumValue, normString);
    if (match >= threshold) {
      return enumValue as CountryNames;
    }
  }
  return null;
}

export const optimizeBlend = (jurisdictions: CountryNames[], revenue: number, options: { optimizationLevel: 'optimal' | 'inefficient' | 'topup' | 'none' }, giltiFloor: number = EFF_GILTI_RATE) => {
  if (jurisdictions.length === 0 || revenue <= 0) {
    console.warn('No valid jurisdictions or revenue provided');
    return makeDefaultBlend();
  }

  const blendComposition: Record<string, number> = Object.keys(Countries).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<string, number>);

  // Step 2: Extract only selected country tax rates
  const taxRates = jurisdictions.map((key) => Countries[key].rate);

  if (options.optimizationLevel === 'inefficient') {
    // Inefficient: Allocate in a way that results in overpaying foreign tax (ETR > giltiFloor)
    // Use randomized weights for added complexity and cap the effective tax rate

    const maxETR = Math.min(1, giltiFloor * 1.25);
    const ascendingRates = taxRates.map((rate, i) => ({ rate, index: i }));
    ascendingRates.sort((a, b) => a.rate - b.rate);

    let allocations = new Array(taxRates.length).fill(0);
    let normalizedWeights: number[] = [];
    let totalTaxPaid = 0;
    let actualETR = 0;

    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const weights = new Array(taxRates.length).fill(0).map(() => Math.random());
      const weightSum = weights.reduce((sum, w) => sum + w, 0);
      normalizedWeights = weights.map((w) => w / weightSum);

      allocations = new Array(taxRates.length).fill(0);
      totalTaxPaid = 0;

      normalizedWeights.forEach((w, i) => {
        const amt = w * revenue;
        allocations[i] = amt;
        totalTaxPaid += amt * taxRates[i];
      });

      actualETR = totalTaxPaid / revenue;

      if (actualETR > giltiFloor && actualETR <= maxETR) {
        break;
      }

      attempts++;
    }

    allocations.forEach((amt, i) => {
      const countryKey = jurisdictions[i];
      blendComposition[countryKey] = amt / revenue;
    });

    return {
      blendComposition,
      totalETR: actualETR,
      totalTaxPaid,
    };
  }

  if (options.optimizationLevel === 'topup') {
    // Top-up: Allocate in a way that results in an ETR below GILTI floor, triggering additional US tax
    const targetETR = giltiFloor * 0.75;

    const indexedRates = taxRates.map((rate, i) => ({ rate, index: i }));
    indexedRates.sort((a, b) => a.rate - b.rate);

    const allocations = new Array(taxRates.length).fill(0);
    let totalTaxPaid = 0;
    let remainingRevenue = revenue;

    // Distribute small base allocation to all selected countries
    const baseAllocation = revenue * 0.05;
    for (let i = 0; i < taxRates.length; i++) {
      const amt = Math.min(baseAllocation, remainingRevenue);
      allocations[i] = amt;
      totalTaxPaid += amt * taxRates[i];
      remainingRevenue -= amt;
    }

    for (const { rate, index } of indexedRates) {
      if (remainingRevenue <= 0) break;

      const maxAtThisRate = Math.max(0, (targetETR * revenue - totalTaxPaid) / rate);
      const incomeHere = Math.min(remainingRevenue, maxAtThisRate);

      allocations[index] += incomeHere;
      totalTaxPaid += incomeHere * rate;
      remainingRevenue -= incomeHere;
    }

    if (remainingRevenue > 0) {
      const lowest = indexedRates[0].index;
      allocations[lowest] += remainingRevenue;
      totalTaxPaid += remainingRevenue * taxRates[lowest];
    }

    const actualETR = totalTaxPaid / revenue;

    allocations.forEach((amt, i) => {
      const countryKey = jurisdictions[i];
      blendComposition[countryKey] = amt / revenue;
    });

    return {
      blendComposition,
      totalETR: actualETR,
      totalTaxPaid,
    };
  }

  if (options.optimizationLevel === 'none') {
    const USOnlyComposition: Record<string, number> = {};
    USOnlyComposition[CountryNames.unitedstates] = 1;
    const totalETR = US_TAX_RATE;
    const totalTaxPaid = totalETR * revenue;

    return {
      blendComposition: USOnlyComposition,
      totalETR,
      totalTaxPaid,
    };
  }

  // Step 3: Sort by descending rate
  const indexedRates = taxRates.map((rate, i) => ({ rate, index: i }));
  indexedRates.sort((a, b) => b.rate - a.rate);

  let allocations = new Array(taxRates.length).fill(0);
  let totalTaxPaid = 0;
  let remainingRevenue = revenue;

  indexedRates.sort((a, b) => b.rate - a.rate);

  for (const { rate, index } of indexedRates) {
    if (remainingRevenue <= 0) break;

    const maxAtThisRate = Math.max(0, (giltiFloor * revenue - totalTaxPaid) / rate);
    const incomeHere = Math.min(remainingRevenue, maxAtThisRate);

    allocations[index] = incomeHere;
    totalTaxPaid += incomeHere * rate;
    remainingRevenue -= incomeHere;
  }

  if (remainingRevenue > 0) {
    const lowest = indexedRates[indexedRates.length - 1].index;
    allocations[lowest] += remainingRevenue;
    totalTaxPaid += remainingRevenue * taxRates[lowest];
  }

  const actualETR = totalTaxPaid / revenue;
  if (Math.abs(actualETR - giltiFloor) > 0.001) {
    console.warn('Blend failed to converge to GILTI floor. Got:', actualETR);
  }

  // Add to blendComposition
  allocations.forEach((amt, i) => {
    const countryKey = jurisdictions[i];
    blendComposition[countryKey] = amt / revenue;
  });

  const totalETR = totalTaxPaid / revenue;

  return {
    blendComposition,
    totalETR,
    totalTaxPaid,
  };
};

export const makeDefaultBlend = (): BlendingResult => {
  const countries = DefaultMockData.countries;
  const revenue = DefaultMockData.revenue;
  const defaultBlend: BlendingResult = optimizeBlend(countries, revenue, { optimizationLevel: 'optimal' });
  return defaultBlend;
};
