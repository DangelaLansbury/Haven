import {
  CountryAllocation,
  CountryNames,
  Countries,
  DEFAULT_FTC_BLEND_CONSTRAINTS,
  DEFAULT_TAX_REGIME,
  DollarValue,
  FtcBlendConstraints,
  JurisdictionSection,
  OptimizationResult,
  OptimizationScenario,
  ProfitShare,
  TaxBreakdown,
  TaxRegime,
  withDomesticShare,
} from './types';

export const formatDollars = (amount: number): DollarValue => {
  if (Math.abs(amount) >= 1000000000) {
    return {
      value: amount / 1000000000,
      suffix: 'B',
    };
  } else if (Math.abs(amount) >= 1000000) {
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

export const calculateProfit = (revenue: number, profitMargin: number): number => {
  const safeRevenue = Math.max(0, Number.isFinite(revenue) ? revenue : 0);
  const safeProfitMargin = Math.min(1, Math.max(0, Number.isFinite(profitMargin) ? profitMargin : 0));
  return safeRevenue * safeProfitMargin;
};

export const calculateTaxBreakdown = (foreignTaxRate: number, profit: number, regime: TaxRegime = DEFAULT_TAX_REGIME): TaxBreakdown => {
  validateRegime(regime);
  const safeForeignTaxRate = Math.max(0, Number.isFinite(foreignTaxRate) ? foreignTaxRate : 0);
  const safeProfit = Math.max(0, Number.isFinite(profit) ? profit : 0);
  const usLiabilityRate = regime.corporateRate * (1 - regime.section250DeductionRate);
  const potentialFtcRate = safeForeignTaxRate * regime.deemedPaidCreditRate;
  const usedFtcRate = Math.min(potentialFtcRate, usLiabilityRate);
  const topUpRate = Math.max(usLiabilityRate - potentialFtcRate, 0);
  const haircutRate = safeForeignTaxRate * (1 - regime.deemedPaidCreditRate);
  const excessFtcRate = Math.max(potentialFtcRate - usLiabilityRate, 0);
  const totalTaxRate = safeForeignTaxRate + topUpRate;

  return {
    taxableProfit: safeProfit,
    foreignTaxRate: safeForeignTaxRate,
    foreignTaxAmount: safeForeignTaxRate * safeProfit,
    potentialFtcRate,
    usedFtcRate,
    usedFtcAmount: usedFtcRate * safeProfit,
    haircutRate,
    haircutAmount: haircutRate * safeProfit,
    excessFtcRate,
    excessFtcAmount: excessFtcRate * safeProfit,
    usLiabilityRate,
    topUpRate,
    topUpAmount: topUpRate * safeProfit,
    totalTaxRate,
    totalTaxAmount: totalTaxRate * safeProfit,
    noTopUpForeignRate: usLiabilityRate / regime.deemedPaidCreditRate,
  };
};

const EPSILON = 1e-9;

const validateProfit = (profit: number) => {
  if (!Number.isFinite(profit) || profit <= 0) throw new Error('Profit must be finite and greater than zero.');
};

const validateRegime = (regime: TaxRegime) => {
  const rates = [regime.corporateRate, regime.section250DeductionRate, regime.deemedPaidCreditRate];
  if (rates.some((rate) => !Number.isFinite(rate) || rate < 0 || rate > 1) || regime.deemedPaidCreditRate === 0) {
    throw new Error('Tax regime rates must be between 0 and 100%, with a positive deemed-paid credit rate.');
  }
};

const validateCountry = (country: CountryNames) => {
  if (!Object.hasOwn(Countries, country)) throw new Error(`Unknown jurisdiction: ${country}.`);
};

const toAllocation = ({ country, share }: ProfitShare, regime: TaxRegime): CountryAllocation => ({
  country,
  share,
  taxRate: country === CountryNames.unitedstates ? regime.corporateRate : Countries[country].rate,
});

const normalizeShares = (shares: ProfitShare[]): ProfitShare[] => {
  const countries = new Set<CountryNames>();
  let total = 0;
  for (const { country, share } of shares) {
    validateCountry(country);
    if (countries.has(country)) throw new Error(`Duplicate profit allocation: ${country}.`);
    if (!Number.isFinite(share) || share < 0) throw new Error('Profit shares must be finite and non-negative.');
    countries.add(country);
    total += share;
  }
  if (Math.abs(total - 1) > EPSILON) throw new Error(`Profit shares must total 100%; received ${(total * 100).toFixed(4)}%.`);
  // Normalize rounding error without discarding small, positive allocations.
  return shares.filter(({ share }) => share > 0).map(({ country, share }) => ({ country, share: share / total }));
};

const calculateWeightedRate = (shares: ProfitShare[]): number => shares.reduce((total, { country, share }) => total + share * Countries[country].rate, 0);

export const createAllocationResult = (
  shares: ProfitShare[],
  profit: number,
  scenario: OptimizationScenario,
  regime: TaxRegime = DEFAULT_TAX_REGIME,
): OptimizationResult => {
  validateProfit(profit);
  validateRegime(regime);
  const allocations = normalizeShares(shares).map((share) => toAllocation(share, regime));
  const domesticShare = allocations.find(({ country }) => country === CountryNames.unitedstates)?.share ?? 0;
  const foreignShare = 1 - domesticShare;
  // U.S. profit is taxed directly at the corporate rate; only foreign-booked profit enters NCTI.
  const foreignAllocations = allocations.filter(({ country }) => country !== CountryNames.unitedstates);
  const foreignTaxRate = foreignShare > 0 ? calculateWeightedRate(foreignAllocations) / foreignShare : 0;
  const taxBreakdown = calculateTaxBreakdown(foreignTaxRate, profit * foreignShare, regime);
  const domesticTaxAmount = profit * domesticShare * regime.corporateRate;
  const totalTaxAmount = domesticTaxAmount + taxBreakdown.totalTaxAmount;

  return {
    scenario,
    profit,
    allocations,
    domesticShare,
    domesticTaxAmount,
    foreignTaxRate,
    taxBreakdown,
    totalTaxAmount,
    effectiveTaxRate: totalTaxAmount / profit,
  };
};

export const createUsOnlyResult = (profit: number, regime: TaxRegime = DEFAULT_TAX_REGIME): OptimizationResult =>
  createAllocationResult([{ country: CountryNames.unitedstates, share: 1 }], profit, OptimizationScenario.usOnly, regime);

const indexSections = (sections: JurisdictionSection[]) => {
  const index = new Map<JurisdictionSection['id'], CountryNames[]>();
  const countries = new Set<CountryNames>();
  for (const { id, countries: sectionCountries } of sections) {
    if (index.has(id)) throw new Error(`Duplicate jurisdiction section: ${id}.`);
    for (const country of sectionCountries) {
      validateCountry(country);
      if (countries.has(country)) throw new Error(`Jurisdiction belongs to multiple sections: ${country}.`);
      if (id !== 'parent' && country === CountryNames.unitedstates) throw new Error('The U.S. parent cannot be a foreign jurisdiction.');
      countries.add(country);
    }
    index.set(id, sectionCountries);
  }
  return index;
};

type AllocationBucket = {
  shares: ProfitShare[];
  taxRate: number;
  minimum: number;
  maximum: number;
};

const singleCountryBucket = (country: CountryNames, maximum: number): AllocationBucket => ({
  shares: [{ country, share: 1 }],
  taxRate: Countries[country].rate,
  minimum: 0,
  maximum,
});

// With proportional operations represented as one bucket, filling available
// capacity in rate order finds the exact minimum or maximum feasible rate.
const extremeAllocation = (buckets: AllocationBucket[], direction: 1 | -1): ProfitShare[] => {
  let remaining = 1 - buckets.reduce((total, { minimum }) => total + minimum, 0);
  return [...buckets]
    .sort((a, b) => direction * (a.taxRate - b.taxRate) || a.shares[0].country.localeCompare(b.shares[0].country))
    .flatMap(({ shares, minimum, maximum }) => {
      const additional = Math.min(remaining, maximum - minimum);
      remaining = Math.max(0, remaining - additional);
      const weight = minimum + additional;
      return shares.map(({ country, share }) => ({ country, share: share * weight }));
    });
};

export const optimizeFtcBlend = (
  generatedAllocations: ProfitShare[],
  sections: JurisdictionSection[],
  profit: number,
  constraints: FtcBlendConstraints = DEFAULT_FTC_BLEND_CONSTRAINTS,
  regime: TaxRegime = DEFAULT_TAX_REGIME,
): OptimizationResult => {
  validateProfit(profit);
  validateRegime(regime);
  const generated = normalizeShares(generatedAllocations);
  // U.S. profit stays with the parent; the constraints below apply to the foreign profit pool.
  const domesticShare = generated.find(({ country }) => country === CountryNames.unitedstates)?.share ?? 0;
  const { minimumOperationsShare, maximumLowTaxShare, maximumSingleHubShare } = constraints;
  if ([minimumOperationsShare, maximumLowTaxShare, maximumSingleHubShare].some((share) => !Number.isFinite(share) || share < 0 || share > 1)) {
    throw new Error('FTC blend constraints must be finite shares between 0 and 100%.');
  }

  const sectionCountries = indexSections(sections);
  const operations = new Set(sectionCountries.get('operations') ?? []);
  const hubs = sectionCountries.get('hubs') ?? [];
  const lowTax = [...(sectionCountries.get('low-tax') ?? [])].sort((a, b) => Countries[a].rate - Countries[b].rate || a.localeCompare(b));
  const generatedOperations = generated.filter(({ country }) => operations.has(country));
  const generatedOperationsTotal = generatedOperations.reduce((sum, { share }) => sum + share, 0);
  if (generatedOperationsTotal === 0) throw new Error('FTC blending requires generated profit in substantive operations.');

  const operationShares = generatedOperations.map(({ country, share }) => ({ country, share: share / generatedOperationsTotal }));
  const buckets: AllocationBucket[] = [
    {
      shares: operationShares,
      taxRate: calculateWeightedRate(operationShares),
      minimum: minimumOperationsShare,
      maximum: 1,
    },
    ...hubs.map((country) => singleCountryBucket(country, maximumSingleHubShare)),
  ];
  // A shared low-tax cap needs only its cheapest/costliest jurisdiction at each
  // extreme. Mixing these extremes also respects the combined cap.
  const lowest = extremeAllocation(lowTax.length ? [...buckets, singleCountryBucket(lowTax[0], maximumLowTaxShare)] : buckets, 1);
  const highest = extremeAllocation(lowTax.length ? [...buckets, singleCountryBucket(lowTax[lowTax.length - 1], maximumLowTaxShare)] : buckets, -1);
  const minimumRate = calculateWeightedRate(lowest);
  const maximumRate = calculateWeightedRate(highest);

  const targetRate = (regime.corporateRate * (1 - regime.section250DeductionRate)) / regime.deemedPaidCreditRate;
  const targetWasReachable = targetRate >= minimumRate - EPSILON && targetRate <= maximumRate + EPSILON;
  const rateRange = maximumRate - minimumRate;
  const highWeight = rateRange > 0 ? Math.min(1, Math.max(0, (targetRate - minimumRate) / rateRange)) : 0;
  const shares = new Map<CountryNames, number>();
  for (const [allocations, weight] of [[lowest, 1 - highWeight], [highest, highWeight]] as const) {
    for (const { country, share } of allocations) shares.set(country, (shares.get(country) ?? 0) + share * weight);
  }

  return {
    ...createAllocationResult(
      withDomesticShare([...shares].map(([country, share]) => ({ country, share })), domesticShare),
      profit,
      OptimizationScenario.ftcCrossCredit,
      regime,
    ),
    targetRate,
    targetWasReachable,
  };
};
