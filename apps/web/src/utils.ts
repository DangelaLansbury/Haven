import * as fuzz from 'fuzzball';
import { DEFAULT_TAX_REGIME, EFF_GILTI_RATE, US_TAX_RATE, CountryNames, Countries, BlendingResult, DefaultMockData, DollarValue, BlendLevels, TaxBreakdown, TaxRegime } from './types';

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

export const calculateTaxBreakdown = (foreignTaxRate: number, revenue: number, regime: TaxRegime = DEFAULT_TAX_REGIME): TaxBreakdown => {
  const safeForeignTaxRate = Math.max(0, Number.isFinite(foreignTaxRate) ? foreignTaxRate : 0);
  const safeRevenue = Math.max(0, Number.isFinite(revenue) ? revenue : 0);
  const usLiabilityRate = regime.corporateRate * (1 - regime.section250DeductionRate);
  const potentialFtcRate = safeForeignTaxRate * regime.deemedPaidCreditRate;
  const usedFtcRate = Math.min(potentialFtcRate, usLiabilityRate);
  const topUpRate = Math.max(usLiabilityRate - potentialFtcRate, 0);
  const haircutRate = safeForeignTaxRate * (1 - regime.deemedPaidCreditRate);
  const excessFtcRate = Math.max(potentialFtcRate - usLiabilityRate, 0);
  const totalTaxRate = safeForeignTaxRate + topUpRate;

  return {
    foreignTaxRate: safeForeignTaxRate,
    foreignTaxAmount: safeForeignTaxRate * safeRevenue,
    potentialFtcRate,
    usedFtcRate,
    usedFtcAmount: usedFtcRate * safeRevenue,
    haircutRate,
    haircutAmount: haircutRate * safeRevenue,
    excessFtcRate,
    excessFtcAmount: excessFtcRate * safeRevenue,
    usLiabilityRate,
    topUpRate,
    topUpAmount: topUpRate * safeRevenue,
    totalTaxRate,
    totalTaxAmount: totalTaxRate * safeRevenue,
    noTopUpForeignRate: usLiabilityRate / regime.deemedPaidCreditRate,
  };
};

export const calcTotalETR = (ftr: number): { ftc: number; topUp: number; etr: number } => {
  const result = calculateTaxBreakdown(ftr, 1);
  return { ftc: result.potentialFtcRate, topUp: result.topUpRate, etr: result.totalTaxRate };
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

const allocateToTargetRate = (jurisdictions: CountryNames[], targetRate: number): Record<string, number> => {
  const composition = Object.keys(Countries).reduce(
    (acc, country) => {
      acc[country] = 0;
      return acc;
    },
    {} as Record<string, number>,
  );

  const minPercentage = 0.01; // 1% minimum allocation

  const candidates = [...new Set(jurisdictions)].map((country) => ({ country, rate: Countries[country].rate })).sort((a, b) => a.rate - b.rate);

  if (targetRate <= candidates[0].rate) {
    composition[candidates[0].country] = 1;
    return composition;
  }

  const highest = candidates[candidates.length - 1];
  if (targetRate >= highest.rate) {
    composition[highest.country] = 1;
    return composition;
  }

  const upperIndex = candidates.findIndex(({ rate }) => rate >= targetRate);
  const lower = candidates[upperIndex - 1];
  const upper = candidates[upperIndex];

  if (upper.rate === targetRate) {
    composition[upper.country] = 1;
    return composition;
  }

  const upperShare = (targetRate - lower.rate) / (upper.rate - lower.rate);
  composition[lower.country] = 1 - upperShare;
  composition[upper.country] = upperShare;
  return composition;
};

export const optimizeBlend = (jurisdictions: CountryNames[], revenue: number, options: { optimizationLevel: BlendLevels }, noTopUpForeignRate: number = EFF_GILTI_RATE) => {
  if (jurisdictions.length === 0 || revenue <= 0) {
    console.warn('No valid jurisdictions or revenue provided');
    return makeDefaultBlend();
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

  const selectedRates = jurisdictions.map((country) => Countries[country].rate);
  const targetRate =
    options.optimizationLevel === BlendLevels.lowestTax
      ? Math.min(...selectedRates)
      : options.optimizationLevel === BlendLevels.topup
        ? noTopUpForeignRate * 0.75
        : options.optimizationLevel === BlendLevels.inefficient
          ? Math.min(US_TAX_RATE, noTopUpForeignRate * 1.25)
          : noTopUpForeignRate;

  const blendComposition = allocateToTargetRate(jurisdictions, targetRate);
  const totalETR = Object.entries(blendComposition).reduce((rate, [country, share]) => rate + Countries[country].rate * share, 0);
  const totalTaxPaid = totalETR * revenue;

  return {
    blendComposition: blendComposition as Record<CountryNames, number>,
    totalETR,
    totalTaxPaid,
  };
};

export const makeDefaultBlend = (): BlendingResult => {
  const countries = DefaultMockData.countries;
  const revenue = DefaultMockData.revenue;
  const defaultBlend: BlendingResult = optimizeBlend(countries, revenue, { optimizationLevel: BlendLevels.lowestTax });
  return defaultBlend;
};
