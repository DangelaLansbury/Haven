export interface FormFields {
  sessionId: string;
  data: string;
  revenue: number;
  ftr: number;
  countries?: CountryNames[];
}

export interface Country {
  name: string;
  rate: number;
}

export enum CountryNames {
  australia = 'Australia',
  barbados = 'Barbados',
  cypress = 'Cypress',
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

export const Countries: Record<string, Country> = {
  [CountryNames.australia]: { name: 'australia', rate: 0.3 },
  [CountryNames.barbados]: { name: 'barbados', rate: 0.055 },
  [CountryNames.cypress]: { name: 'cypress', rate: 0.001 },
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

export const DefaultFormFields = {
  sessionId: '',
  data: '',
  revenue: '$250,000,000,000', // $250 billion
  ftr: '13.125%',
  countries: [CountryNames.switzerland, CountryNames.australia],
};

export const DefaultMockData: FormFields = {
  sessionId: '',
  data: '',
  revenue: 150000000000, // $150 billion
  ftr: 0.13125, // 13.125%
  countries: [
    CountryNames.ireland,
    CountryNames.germany,
    CountryNames.japan,
    CountryNames.luxembourg,
    CountryNames.unitedkingdom,
    CountryNames.singapore,
    CountryNames.australia,
    CountryNames.switzerland,
    CountryNames.hungary,
    CountryNames.cypress,
    CountryNames.barbados,
  ],
};

export interface BlendingResult {
  blendComposition: Record<CountryNames, number>;
  totalETR: number;
  totalTaxPaid: number;
  netUSTaxOwed: number;
}

export const HOME_TAX_RATE = Countries[CountryNames.unitedstates].rate;

export const MIN_REVENUE = 500000000; // $500 million
export const MAX_REVENUE = 350000000000; // $350 billion
export const MIN_FTR = 0; // 0%
export const MAX_FTR = 1; // 100%

export const GILTI_RATE = 0.105; // 10.5%
export const EFF_GILTI_RATE = 0.13125; // 13.125%
