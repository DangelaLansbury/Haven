export interface FormFields {
  sessionId: string;
  data: string;
  revenue: string;
  royalty_rate: string;
  operating_rate: string;
  sublicensor_rate: string;
  licensor_rate: string;
}

export interface Country {
  name: string;
  flag: string;
  tax_rate: string;
  note?: string;
}

export const Countries: Record<string, Country> = {
  USA: {
    name: 'United States',
    flag: '/assets/images/flags/usa.svg',
    tax_rate: '21.0%',
    note: '',
  },
  IRELAND: {
    name: 'Ireland',
    flag: '/assets/images/flags/ireland.svg',
    tax_rate: '12.5%',
    note: 'Relatively low corporate tax',
  },
  NETHERLANDS: {
    name: 'Netherlands',
    flag: '/assets/images/flags/netherlands.svg',
    tax_rate: '~0.0%',
    note: 'Allows tax-free flow of royalties out of country',
  },
  BERMUDA: {
    name: 'Bermuda',
    flag: '/assets/images/flags/bermuda.svg',
    tax_rate: '0.0%',
    note: 'Manage business from here with no corporate tax',
  },
};

export interface Entity {
  role: string;
  name: string;
  description: string;
  country: Country;
}

export const EntityRoles: Record<string, Entity> = {
  operating: {
    role: 'operating',
    name: 'Haven Holdings Ltd',
    description: 'Books sales (front-end)',
    country: Countries.IRELAND,
  },
  sublicensor: {
    role: 'sublicensor',
    name: 'Haven Holdings BV',
    description: 'Passthrough for royalties',
    country: Countries.NETHERLANDS,
  },
  licensor: {
    role: 'licensor',
    name: 'Haven Holdings Ireland',
    description: 'Holds IP and receives royalties',
    country: Countries.BERMUDA,
  },
  parent: {
    role: 'parent',
    name: 'Haven Corp',
    description: 'Owns and controls all entities',
    country: Countries.USA,
  },
};
