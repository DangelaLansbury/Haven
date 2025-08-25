export interface FormFields {
  sessionId: string;
  data: string;
  revenue: number;
  ftr: number;
}

export const DefaultFormFields = {
  sessionId: '',
  data: '',
  revenue: '$250,000,000,000', // $250 billion
  ftr: '13.125%',
};

export const DefaultExplorerData: FormFields = {
  sessionId: '',
  data: '',
  revenue: 150000000000, // $150 billion
  ftr: 0.13125, // 13.125%
};

export interface Country {
  name: string;
  flag: string;
  tax_rate: string;
  note?: string;
  code: string;
}

export const TaxHavens: Record<string, Country> = {
  BERMUDA: {
    name: 'Bermuda',
    flag: '/assets/images/flags/bermuda.svg',
    tax_rate: '0.0',
    note: 'Manage business from here with no corporate tax',
    code: 'BM',
  },
};

export const Conduits: Record<string, Country> = {
  NETHERLANDS: {
    name: 'Netherlands',
    flag: '/assets/images/flags/netherlands.svg',
    tax_rate: '0.0',
    note: 'Allows tax-free flow of royalties out of country',
    code: 'NL',
  },
};

export const OperatingBases: Record<string, Country> = {
  IRELAND: {
    name: 'Ireland',
    flag: '/assets/images/flags/ireland.svg',
    tax_rate: '12.5',
    note: 'Relatively low corporate tax',
    code: 'IE',
  },
};

export const Countries: Record<string, Country> = {
  ...TaxHavens,
  ...Conduits,
  ...OperatingBases,
  USA: {
    name: 'United States',
    flag: '/assets/images/flags/usa.svg',
    tax_rate: '21.0',
    note: 'Federal corporate tax rate',
    code: 'US',
  },
};

export const HOME_TAX_RATE = parseFloat(Countries.USA.tax_rate) / 100 || 0.21;

export interface Entity {
  role: string;
  display_role: string;
  default_name: string;
  description: string;
  default_country?: Country;
  countries?: Record<string, Country>;
  formIndex: string;
  OCRKeyword: string;
}

export const Entities: Record<string, Entity> = {
  operating: {
    role: 'operating',
    display_role: 'Operating Base',
    default_name: 'Acme Ireland Limited',
    description: 'Books sales (front-end)',
    default_country: OperatingBases.IRELAND,
    countries: OperatingBases,
    formIndex: '2a',
    OCRKeyword: 'operating',
  },
  conduit: {
    role: 'conduit',
    display_role: 'Conduit',
    default_name: 'Acme Netherlands Holdings BV',
    description: 'Passthrough for royalties',
    default_country: Conduits.NETHERLANDS,
    countries: Conduits,
    formIndex: '2b',
    OCRKeyword: 'conduit',
  },
  licensor: {
    role: 'licensor',
    display_role: 'Licensor',
    default_name: 'Acme Ireland Holdings',
    description: 'Holds IP and receives royalties',
    default_country: TaxHavens.BERMUDA,
    countries: TaxHavens,
    formIndex: '2c',
    OCRKeyword: 'licensor',
  },
  parent: {
    role: 'parent',
    display_role: 'Parent Company',
    default_name: 'Acme Corporation',
    description: 'Owns and controls all entities',
    default_country: Countries.USA,
    countries: Countries,
    formIndex: '2d',
    OCRKeyword: 'parent',
  },
};

export const MIN_REVENUE = 500000000; // $500 million
export const MAX_REVENUE = 350000000000; // $350 billion
export const MIN_FTR = 0; // 0%
export const MAX_FTR = 1; // 100%

export const GILTI_RATE = 0.105; // 10.5%
export const EFF_GILTI_RATE = 0.13125; // 13.125%
