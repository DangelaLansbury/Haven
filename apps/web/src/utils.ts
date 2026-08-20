import * as fuzz from 'fuzzball';
import { CountryAllocation, CountryNames, Countries, DEFAULT_TAX_REGIME, DefaultMockData, DollarValue, OptimizationConstraints, OptimizationResult, OptimizationScenario, TaxBreakdown, TaxRegime } from './types';

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

type Candidate = { country: CountryNames; statutoryRate: number };

const CONSTRAINED_MODEL: OptimizationConstraints = {
  maximumCountryShare: 0.25,
  minimumEffectiveRate: 0.01,
};

const prepareCandidates = (jurisdictions: CountryNames[]): Candidate[] =>
  [...new Set(jurisdictions)]
    .filter((country) => country !== CountryNames.unitedstates)
    .map((country) => ({ country, statutoryRate: Countries[country].rate }))
    .sort((a, b) => a.statutoryRate - b.statutoryRate || a.country.localeCompare(b.country));

const toAllocation = (candidate: Candidate, share: number, modeledRate: number = candidate.statutoryRate): CountryAllocation => ({
  country: candidate.country,
  share,
  statutoryRate: candidate.statutoryRate,
  modeledRate,
});

const calculateWeightedRate = (allocations: CountryAllocation[], rateKey: 'statutoryRate' | 'modeledRate'): number => allocations.reduce((total, allocation) => total + allocation.share * allocation[rateKey], 0);

const allocateUnconstrained = (candidates: Candidate[]): CountryAllocation[] => [toAllocation(candidates[0], 1)];

const allocateFtcEfficient = (candidates: Candidate[], targetRate: number): { allocations: CountryAllocation[]; targetWasReachable: boolean } => {
  const exact = candidates.find(({ statutoryRate }) => Math.abs(statutoryRate - targetRate) < 1e-10);
  if (exact) return { allocations: [toAllocation(exact, 1)], targetWasReachable: true };

  const lower = [...candidates].reverse().find(({ statutoryRate }) => statutoryRate < targetRate);
  const upper = candidates.find(({ statutoryRate }) => statutoryRate > targetRate);

  if (!lower || !upper) {
    const closest = candidates.reduce((best, candidate) => (Math.abs(candidate.statutoryRate - targetRate) < Math.abs(best.statutoryRate - targetRate) ? candidate : best));
    return { allocations: [toAllocation(closest, 1)], targetWasReachable: false };
  }

  const upperShare = (targetRate - lower.statutoryRate) / (upper.statutoryRate - lower.statutoryRate);
  return {
    allocations: [toAllocation(lower, 1 - upperShare), toAllocation(upper, upperShare)],
    targetWasReachable: true,
  };
};

const allocateConstrained = (candidates: Candidate[], constraints: OptimizationConstraints): { allocations: CountryAllocation[]; constraintsSatisfied: boolean } => {
  const requiredCountries = Math.ceil(1 / constraints.maximumCountryShare);
  const constraintsSatisfied = candidates.length >= requiredCountries;
  const maximumShare = constraintsSatisfied ? constraints.maximumCountryShare : 1 / candidates.length;
  const ranked = candidates
    .map((candidate) => ({ ...candidate, modeledRate: Math.max(candidate.statutoryRate, constraints.minimumEffectiveRate) }))
    // When several countries are lifted to the same 15% modeled floor, prefer
    // the statutory rates closest to that floor rather than the lowest havens.
    .sort((a, b) => a.modeledRate - b.modeledRate || b.statutoryRate - a.statutoryRate || a.country.localeCompare(b.country));

  const allocations: CountryAllocation[] = [];
  let remainingShare = 1;
  for (const candidate of ranked) {
    if (remainingShare <= 1e-10) break;
    const share = Math.min(maximumShare, remainingShare);
    allocations.push(toAllocation(candidate, share, candidate.modeledRate));
    remainingShare -= share;
  }

  return { allocations, constraintsSatisfied };
};

const createUsOnlyResult = (revenue: number, regime: TaxRegime): OptimizationResult => {
  const taxRate = regime.corporateRate;
  const taxAmount = taxRate * revenue;
  return {
    scenario: OptimizationScenario.usOnly,
    allocations: [toAllocation({ country: CountryNames.unitedstates, statutoryRate: taxRate }, 1)],
    statutoryForeignRate: 0,
    modeledForeignRate: 0,
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
  let constraints: OptimizationConstraints | undefined;
  let constraintsSatisfied: boolean | undefined;

  if (scenario === OptimizationScenario.unconstrained) {
    allocations = allocateUnconstrained(candidates);
  } else if (scenario === OptimizationScenario.ftcEfficient) {
    targetRate = noTopUpRate;
    const result = allocateFtcEfficient(candidates, targetRate);
    allocations = result.allocations;
    targetWasReachable = result.targetWasReachable;
  } else {
    constraints = CONSTRAINED_MODEL;
    const result = allocateConstrained(candidates, constraints);
    allocations = result.allocations;
    constraintsSatisfied = result.constraintsSatisfied;
  }

  const statutoryForeignRate = calculateWeightedRate(allocations, 'statutoryRate');
  const modeledForeignRate = calculateWeightedRate(allocations, 'modeledRate');
  return {
    scenario,
    allocations,
    statutoryForeignRate,
    modeledForeignRate,
    taxBreakdown: calculateTaxBreakdown(modeledForeignRate, revenue, regime),
    targetRate,
    targetWasReachable,
    constraints,
    constraintsSatisfied,
  };
};

export const makeDefaultBlend = (): OptimizationResult => optimizeBlend(DefaultMockData.countries ?? [], DefaultMockData.revenue, OptimizationScenario.unconstrained);
