import { CountryAllocation, CountryNames, Countries, DEFAULT_TAX_REGIME, DollarValue, OptimizationResult, OptimizationScenario, TaxBreakdown, TaxRegime } from './types';

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

export function matchToCountryEnum(countryString: string): CountryNames | null {
  const normalizedInput = countryString.toLowerCase().replace(/[^a-z0-9]/g, '');
  return Object.values(CountryNames).find((country) => country.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedInput) ?? null;
}

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

type Candidate = { country: CountryNames; taxRate: number };

const prepareCandidates = (jurisdictions: CountryNames[]): Candidate[] =>
  [...new Set(jurisdictions)]
    .filter((country) => country !== CountryNames.unitedstates)
    .map((country) => ({ country, taxRate: Countries[country].rate }))
    .sort((a, b) => a.taxRate - b.taxRate || a.country.localeCompare(b.country));

const toAllocation = (candidate: Candidate, share: number): CountryAllocation => ({
  country: candidate.country,
  share,
  taxRate: candidate.taxRate,
});

const calculateWeightedRate = (allocations: CountryAllocation[]): number => allocations.reduce((total, allocation) => total + allocation.share * allocation.taxRate, 0);

const allocateUnconstrained = (candidates: Candidate[]): CountryAllocation[] => [toAllocation(candidates[0], 1)];

const allocateFtcEfficient = (candidates: Candidate[], targetRate: number): { allocations: CountryAllocation[]; targetWasReachable: boolean } => {
  const exact = candidates.find(({ taxRate }) => Math.abs(taxRate - targetRate) < 1e-10);
  if (exact) return { allocations: [toAllocation(exact, 1)], targetWasReachable: true };

  const lower = [...candidates].reverse().find(({ taxRate }) => taxRate < targetRate);
  const upper = candidates.find(({ taxRate }) => taxRate > targetRate);

  if (!lower || !upper) {
    const closest = candidates.reduce((best, candidate) => (Math.abs(candidate.taxRate - targetRate) < Math.abs(best.taxRate - targetRate) ? candidate : best));
    return { allocations: [toAllocation(closest, 1)], targetWasReachable: false };
  }

  const upperShare = (targetRate - lower.taxRate) / (upper.taxRate - lower.taxRate);
  return {
    allocations: [toAllocation(lower, 1 - upperShare), toAllocation(upper, upperShare)],
    targetWasReachable: true,
  };
};

const createUsOnlyResult = (revenue: number, regime: TaxRegime): OptimizationResult => {
  const taxRate = regime.corporateRate;
  const taxAmount = taxRate * revenue;
  return {
    scenario: OptimizationScenario.usOnly,
    allocations: [toAllocation({ country: CountryNames.unitedstates, taxRate }, 1)],
    foreignTaxRate: 0,
    taxBreakdown: {
      foreignTaxRate: 0,
      foreignTaxAmount: 0,
      potentialFtcRate: 0,
      usedFtcRate: 0,
      usedFtcAmount: 0,
      haircutRate: 0,
      haircutAmount: 0,
      excessFtcRate: 0,
      excessFtcAmount: 0,
      usLiabilityRate: taxRate,
      topUpRate: taxRate,
      topUpAmount: taxAmount,
      totalTaxRate: taxRate,
      totalTaxAmount: taxAmount,
      noTopUpForeignRate: 0,
    },
  };
};

export const optimizeBlend = (jurisdictions: CountryNames[], revenue: number, scenario: OptimizationScenario, regime: TaxRegime = DEFAULT_TAX_REGIME): OptimizationResult => {
  if (!Number.isFinite(revenue) || revenue <= 0) throw new Error('Revenue must be greater than zero.');
  if (scenario === OptimizationScenario.usOnly) return createUsOnlyResult(revenue, regime);

  const candidates = prepareCandidates(jurisdictions);
  if (candidates.length === 0) return createUsOnlyResult(revenue, regime);

  const usLiabilityRate = regime.corporateRate * (1 - regime.section250DeductionRate);
  const noTopUpRate = usLiabilityRate / regime.deemedPaidCreditRate;
  let allocations: CountryAllocation[];
  let targetRate: number | undefined;
  let targetWasReachable: boolean | undefined;

  if (scenario === OptimizationScenario.unconstrained) {
    allocations = allocateUnconstrained(candidates);
  } else {
    targetRate = noTopUpRate;
    const result = allocateFtcEfficient(candidates, targetRate);
    allocations = result.allocations;
    targetWasReachable = result.targetWasReachable;
  }

  const foreignTaxRate = calculateWeightedRate(allocations);
  return {
    scenario,
    allocations,
    foreignTaxRate,
    taxBreakdown: calculateTaxBreakdown(foreignTaxRate, revenue, regime),
    targetRate,
    targetWasReachable,
  };
};
