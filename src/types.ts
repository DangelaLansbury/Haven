export interface ExplorerData {
  revenue: number;
  profitMargin: number;
  countries: CountryNames[];
  jurisdictionSections: JurisdictionSection[];
  generatedAllocations: ProfitShare[];
  funnelAllocations: ProfitShare[];
  funnelFlows: JurisdictionFlow[];
}

export interface FormFields {
  sessionId: string;
  data: string;
  revenue: number;
  profitMargin?: number;
  countries?: CountryNames[];
}

export interface Country {
  name: string;
  rate: number;
}

export interface JurisdictionSection {
  id: 'parent' | 'operations' | 'hubs' | 'low-tax';
  label: string;
  countries: CountryNames[];
}

export interface ProfitShare {
  country: CountryNames;
  share: number;
}

export interface JurisdictionFlow {
  from: CountryNames;
  to: CountryNames;
}

export interface FtcBlendConstraints {
  minimumOperationsShare: number;
  maximumLowTaxShare: number;
  maximumSingleHubShare: number;
}

export enum OptimizationScenario {
  economicFootprint = 'economicFootprint',
  illustrativeFunnel = 'illustrativeFunnel',
  ftcCrossCredit = 'ftcCrossCredit',
  usOnly = 'usOnly',
}

export enum CountryNames {
  australia = 'Australia',
  barbados = 'Barbados',
  canada = 'Canada',
  china = 'China',
  cyprus = 'Cyprus',
  germany = 'Germany',
  hungary = 'Hungary',
  india = 'India',
  ireland = 'Ireland',
  japan = 'Japan',
  luxembourg = 'Luxembourg',
  mexico = 'Mexico',
  netherlands = 'Netherlands',
  singapore = 'Singapore',
  switzerland = 'Switzerland',
  unitedkingdom = 'United Kingdom',
  unitedstates = 'United States',
  caymanislands = 'Cayman Islands',
}

export const Countries: Record<CountryNames, Country> = {
  [CountryNames.australia]: { name: 'australia', rate: 0.3 },
  [CountryNames.barbados]: { name: 'barbados', rate: 0.09 },
  [CountryNames.canada]: { name: 'canada', rate: 0.265 },
  [CountryNames.china]: { name: 'china', rate: 0.25 },
  [CountryNames.cyprus]: { name: 'cyprus', rate: 0.15 },
  [CountryNames.caymanislands]: { name: 'caymanislands', rate: 0.0 },
  [CountryNames.germany]: { name: 'germany', rate: 0.299 },
  [CountryNames.hungary]: { name: 'hungary', rate: 0.09 },
  [CountryNames.india]: { name: 'india', rate: 0.2517 },
  [CountryNames.ireland]: { name: 'ireland', rate: 0.125 },
  [CountryNames.japan]: { name: 'japan', rate: 0.297 },
  [CountryNames.luxembourg]: { name: 'luxembourg', rate: 0.249 },
  [CountryNames.mexico]: { name: 'mexico', rate: 0.3 },
  [CountryNames.netherlands]: { name: 'netherlands', rate: 0.258 },
  [CountryNames.singapore]: { name: 'singapore', rate: 0.17 },
  [CountryNames.switzerland]: { name: 'switzerland', rate: 0.14 },
  [CountryNames.unitedkingdom]: { name: 'unitedkingdom', rate: 0.25 },
  [CountryNames.unitedstates]: { name: 'unitedstates', rate: 0.21 },
};

export const DefaultJurisdictionSections: JurisdictionSection[] = [
  {
    id: 'parent',
    label: 'Parent company',
    countries: [CountryNames.unitedstates],
  },
  {
    id: 'operations',
    label: 'Substantive operations',
    countries: [CountryNames.canada, CountryNames.mexico, CountryNames.unitedkingdom, CountryNames.germany, CountryNames.india, CountryNames.china, CountryNames.japan, CountryNames.australia],
  },
  {
    id: 'hubs',
    label: 'Regional & investment hubs',
    countries: [CountryNames.ireland, CountryNames.netherlands, CountryNames.luxembourg, CountryNames.singapore, CountryNames.switzerland],
  },
  {
    id: 'low-tax',
    label: 'Illustrative low-tax endpoint',
    countries: [CountryNames.caymanislands],
  },
];

/** Share of group sales made to U.S. customers, in line with large U.S.-parented multinationals (roughly 40-50%). */
export const DEFAULT_US_SALES_SHARE = 0.45;

/** Where the remaining foreign sales are made, as shares of foreign sales. */
export const DefaultForeignSalesMix: ProfitShare[] = [
  { country: CountryNames.unitedkingdom, share: 0.26 },
  { country: CountryNames.germany, share: 0.19 },
  { country: CountryNames.canada, share: 0.14 },
  { country: CountryNames.japan, share: 0.12 },
  { country: CountryNames.china, share: 0.12 },
  { country: CountryNames.mexico, share: 0.08 },
  { country: CountryNames.australia, share: 0.06 },
  { country: CountryNames.india, share: 0.03 },
];

/** Foreign profit booking when operating companies earn limited-risk distributor returns and residual profit moves to hubs. */
export const DefaultFunnelForeignBooking: ProfitShare[] = [
  ...DefaultForeignSalesMix.map(({ country, share }) => ({ country, share: share * 0.35 })),
  { country: CountryNames.ireland, share: 0.35 },
  { country: CountryNames.singapore, share: 0.1 },
  { country: CountryNames.switzerland, share: 0.07 },
  { country: CountryNames.netherlands, share: 0.02 },
  { country: CountryNames.luxembourg, share: 0.01 },
  { country: CountryNames.caymanislands, share: 0.1 },
];

/** Combines U.S. profit with foreign shares (expressed as shares of foreign profit) into shares of total profit. */
export const withDomesticShare = (foreignShares: ProfitShare[], domesticShare: number): ProfitShare[] => [
  { country: CountryNames.unitedstates, share: domesticShare },
  ...foreignShares.map(({ country, share }) => ({ country, share: share * (1 - domesticShare) })),
];

export const DefaultGeneratedAllocations = withDomesticShare(DefaultForeignSalesMix, DEFAULT_US_SALES_SHARE);

export const DefaultFunnelAllocations = withDomesticShare(DefaultFunnelForeignBooking, DEFAULT_US_SALES_SHARE);

export const DefaultFunnelFlows: JurisdictionFlow[] = [
  { from: CountryNames.canada, to: CountryNames.ireland },
  { from: CountryNames.mexico, to: CountryNames.ireland },
  { from: CountryNames.unitedkingdom, to: CountryNames.netherlands },
  { from: CountryNames.germany, to: CountryNames.netherlands },
  { from: CountryNames.india, to: CountryNames.singapore },
  { from: CountryNames.china, to: CountryNames.singapore },
  { from: CountryNames.japan, to: CountryNames.singapore },
  { from: CountryNames.australia, to: CountryNames.singapore },
  { from: CountryNames.ireland, to: CountryNames.caymanislands },
  { from: CountryNames.netherlands, to: CountryNames.caymanislands },
  { from: CountryNames.singapore, to: CountryNames.caymanislands },
];

export const DEFAULT_FTC_BLEND_CONSTRAINTS: FtcBlendConstraints = {
  minimumOperationsShare: 0.2,
  maximumLowTaxShare: 0.15,
  maximumSingleHubShare: 0.4,
};

export const DefaultMockData: ExplorerData = {
  revenue: 250000000000, // $250 billion
  profitMargin: 0.2, // Illustrative 20% margin: $50 billion of profit
  countries: DefaultJurisdictionSections.flatMap(({ countries }) => countries),
  jurisdictionSections: DefaultJurisdictionSections,
  generatedAllocations: DefaultGeneratedAllocations,
  funnelAllocations: DefaultFunnelAllocations,
  funnelFlows: DefaultFunnelFlows,
};

export interface CountryAllocation {
  country: CountryNames;
  share: number;
  taxRate: number;
}

export interface OptimizationResult {
  scenario: OptimizationScenario;
  profit: number;
  /** Shares of total profit, including profit booked by the U.S. parent. */
  allocations: CountryAllocation[];
  /** Share of total profit booked and taxed in the United States. */
  domesticShare: number;
  domesticTaxAmount: number;
  /** Blended rate on foreign-booked profit, which drives the NCTI calculation. */
  foreignTaxRate: number;
  /** NCTI breakdown for foreign-booked profit only. */
  taxBreakdown: TaxBreakdown;
  totalTaxAmount: number;
  /** Total tax (foreign, U.S. top-up and U.S. domestic) as a share of total profit. */
  effectiveTaxRate: number;
  targetRate?: number;
  targetWasReachable?: boolean;
}

export interface TaxRegime {
  id: 'legacy-gilti' | '2026-ncti';
  label: string;
  effectiveYear: number;
  corporateRate: number;
  section250DeductionRate: number;
  deemedPaidCreditRate: number;
}

export interface TaxBreakdown {
  taxableProfit: number;
  foreignTaxRate: number;
  foreignTaxAmount: number;
  potentialFtcRate: number;
  usedFtcRate: number;
  usedFtcAmount: number;
  haircutRate: number;
  haircutAmount: number;
  excessFtcRate: number;
  excessFtcAmount: number;
  usLiabilityRate: number;
  topUpRate: number;
  topUpAmount: number;
  totalTaxRate: number;
  totalTaxAmount: number;
  noTopUpForeignRate: number;
}

export const US_TAX_RATE = Countries[CountryNames.unitedstates].rate;

export interface DollarValue {
  value: number;
  suffix: string;
}

export const CURRENT_NCTI_REGIME: TaxRegime = {
  id: '2026-ncti',
  label: 'NCTI (2026+)',
  effectiveYear: 2026,
  corporateRate: US_TAX_RATE,
  section250DeductionRate: 0.4,
  deemedPaidCreditRate: 0.9,
};

export const DEFAULT_TAX_REGIME = CURRENT_NCTI_REGIME;

/** U.S. effective rate on NCTI after the section 250 deduction: 21% × 60% = 12.6%. */
export const GILTI_RATE = DEFAULT_TAX_REGIME.corporateRate * (1 - DEFAULT_TAX_REGIME.section250DeductionRate);

/** Foreign rate at which 90% deemed-paid credits equal the 12.6% U.S. liability: 14%. */
export const EFF_GILTI_RATE = GILTI_RATE / DEFAULT_TAX_REGIME.deemedPaidCreditRate;
