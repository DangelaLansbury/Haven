export interface ExplorerData {
  revenue: number;
  countries: CountryNames[];
}

export interface FormFields {
  sessionId: string;
  data: string;
  revenue: number;
  countries?: CountryNames[];
}

export interface Country {
  name: string;
  rate: number;
}

export enum OptimizationScenario {
  unconstrained = 'unconstrained',
  ftcEfficient = 'ftcEfficient',
  usOnly = 'usOnly',
}

export enum CountryNames {
  australia = 'Australia',
  barbados = 'Barbados',
  cyprus = 'Cyprus',
  germany = 'Germany',
  hungary = 'Hungary',
  ireland = 'Ireland',
  japan = 'Japan',
  luxembourg = 'Luxembourg',
  netherlands = 'Netherlands',
  singapore = 'Singapore',
  switzerland = 'Switzerland',
  unitedkingdom = 'United Kingdom',
  unitedstates = 'United States',
  caymanislands = 'Cayman Islands',
}

export const Countries: Record<CountryNames, Country> = {
  [CountryNames.australia]: { name: 'australia', rate: 0.3 },
  [CountryNames.barbados]: { name: 'barbados', rate: 0.055 },
  [CountryNames.cyprus]: { name: 'cyprus', rate: 0.15 },
  [CountryNames.caymanislands]: { name: 'caymanislands', rate: 0.001 },
  [CountryNames.germany]: { name: 'germany', rate: 0.299 },
  [CountryNames.hungary]: { name: 'hungary', rate: 0.09 },
  [CountryNames.ireland]: { name: 'ireland', rate: 0.125 },
  [CountryNames.japan]: { name: 'japan', rate: 0.297 },
  [CountryNames.luxembourg]: { name: 'luxembourg', rate: 0.249 },
  [CountryNames.netherlands]: { name: 'netherlands', rate: 0.258 },
  [CountryNames.singapore]: { name: 'singapore', rate: 0.17 },
  [CountryNames.switzerland]: { name: 'switzerland', rate: 0.14 },
  [CountryNames.unitedkingdom]: { name: 'unitedkingdom', rate: 0.25 },
  [CountryNames.unitedstates]: { name: 'unitedstates', rate: 0.21 },
};

export const DefaultMockData: ExplorerData = {
  revenue: 250000000000, // $250 billion
  countries: [CountryNames.caymanislands, CountryNames.germany, CountryNames.japan, CountryNames.unitedkingdom, CountryNames.singapore, CountryNames.australia, CountryNames.hungary, CountryNames.barbados, CountryNames.unitedstates],
};

export const DefaultFormFields = {
  sessionId: '',
  data: '',
  revenue: '250,000,000,000.00',
  countries: [CountryNames.switzerland, CountryNames.japan, CountryNames.ireland, CountryNames.unitedkingdom, CountryNames.caymanislands, CountryNames.netherlands],
};

export interface CountryAllocation {
  country: CountryNames;
  share: number;
  taxRate: number;
}

export interface OptimizationResult {
  scenario: OptimizationScenario;
  allocations: CountryAllocation[];
  foreignTaxRate: number;
  taxBreakdown: TaxBreakdown;
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
