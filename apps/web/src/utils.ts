import * as fuzz from 'fuzzball';
import { EFF_GILTI_RATE, GILTI_RATE, CountryNames, Countries, BlendingResult, DefaultMockData } from './types';

export const formatPercentage = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const formatDollars = (amount: number): { value: number; suffix: string } => {
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

export const calcNetUSTaxOwed = (revenue: number, etr: number): number => {
  if (revenue <= 0 || etr <= 0) return 0;
  const netRate = EFF_GILTI_RATE - etr;
  const netUSTaxOwed = netRate * revenue;
  return netUSTaxOwed;
};

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

export const optimizeBlend = (juris: CountryNames[], revenue: number, giltiFloor = EFF_GILTI_RATE): BlendingResult => {
  if (juris.length === 0 || revenue <= 0) {
    console.warn('No valid jurisdictions or revenue provided');
    return makeDefaultBlend();
  }

  const blendComposition: Record<string, number> = Object.keys(Countries).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<string, number>);

  // Step 2: Extract only selected country tax rates
  const taxRates = juris.map((key) => Countries[key].rate);

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
    const countryKey = juris[i];
    blendComposition[countryKey] = amt / revenue;
  });

  const totalETR = totalTaxPaid / revenue;
  const netUSTaxOwed = Math.max(calcNetUSTaxOwed(revenue, totalETR), 0);

  return {
    blendComposition,
    totalETR,
    totalTaxPaid,
    netUSTaxOwed,
  };
};

export const makeDefaultBlend = (): BlendingResult => {
  const countries = DefaultMockData.countries;
  const revenue = DefaultMockData.revenue;
  const defaultBlend: BlendingResult = optimizeBlend(countries, revenue);
  return defaultBlend;
};
