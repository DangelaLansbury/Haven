export interface FormFields {
  sessionId: string;
  data: string;
  revenue: string;
  royalty_rate: string;
}

export const DefaultFormFields: FormFields = {
  sessionId: '',
  data: '',
  revenue: '$25,000,000,000',
  royalty_rate: '95%',
};

export const DefaultExplorerData: FormFields = {
  sessionId: '',
  data: '',
  revenue: '50000000000',
  royalty_rate: '90',
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
  // CAYMAN_ISLANDS: {
  //   name: 'Cayman Islands',
  //   flag: '/assets/images/flags/cayman_islands.svg',
  //   tax_rate: '0.0%',
  //   note: 'No corporate tax, no capital gains tax',
  // },
  // BRITISH_VIRGIN_ISLANDS: {
  //   name: 'British Virgin Islands',
  //   flag: '/assets/images/flags/british_virgin_islands.svg',
  //   tax_rate: '0.0%',
  //   note: 'No corporate tax, no capital gains tax',
  // },
  // UNITED_ARAB_EMIRATES: {
  //   name: 'United Arab Emirates',
  //   flag: '/assets/images/flags/united_arab_emirates.svg',
  //   tax_rate: '0.0%',
  //   note: 'No corporate tax, no income tax',
  // },
};

export const Conduits: Record<string, Country> = {
  NETHERLANDS: {
    name: 'Netherlands',
    flag: '/assets/images/flags/netherlands.svg',
    tax_rate: '0.0',
    note: 'Allows tax-free flow of royalties out of country',
    code: 'NL',
  },
  // LUXEMBOURG: {
  //   name: 'Luxembourg',
  //   flag: '/assets/images/flags/luxembourg.svg',
  //   tax_rate: '0.0%',
  //   note: 'Favorable tax treaties, low effective tax rate',
  // },
  // SWITZERLAND: {
  //   name: 'Switzerland',
  //   flag: '/assets/images/flags/switzerland.svg',
  //   tax_rate: '0.0%',
  //   note: 'Low corporate tax rates, favorable tax treaties',
  // },
  // CYPRUS: {
  //   name: 'Cyprus',
  //   flag: '/assets/images/flags/cyprus.svg',
  //   tax_rate: '0.0%',
  //   note: 'Low corporate tax rate, no withholding tax on dividends',
  // },
};

export const OperatingBases: Record<string, Country> = {
  IRELAND: {
    name: 'Ireland',
    flag: '/assets/images/flags/ireland.svg',
    tax_rate: '12.5',
    note: 'Relatively low corporate tax',
    code: 'IE',
  },
  // SINGAPORE: {
  //   name: 'Singapore',
  //   flag: '/assets/images/flags/singapore.svg',
  //   tax_rate: '17.0%',
  //   note: 'Rate often much lower with incentives',
  // },
  // HONG_KONG: {
  //   name: 'Hong Kong',
  //   flag: '/assets/images/flags/hong_kong.svg',
  //   tax_rate: '16.5%',
  //   note: 'No tax on foreign income, low effective rate',
  // },
  // MAURITIUS: {
  //   name: 'Mauritius',
  //   flag: '/assets/images/flags/mauritius.svg',
  //   tax_rate: '15.0%',
  //   note: 'Rate lowered with credits, no capital gains tax',
  // },
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
