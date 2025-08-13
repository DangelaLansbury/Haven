import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormFields, Entities, DefaultExplorerData, HOME_TAX_RATE, Countries, Country } from '../types';
import { RemittanceChart } from './RemittanceChart';
import explorerStyles from '../css/Explorer.module.css';

interface ExplorerProps {
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
}

const Explorer: React.FC<ExplorerProps> = ({ formData, setFormData }: ExplorerProps) => {
  const initialRevenue = formData.revenue && !isNaN(Number(formData.revenue)) ? parseFloat(formData.revenue) : parseFloat(DefaultExplorerData.revenue);
  const initialRoyaltyRate = formData.royalty_rate && !isNaN(Number(formData.royalty_rate)) ? parseFloat(formData.royalty_rate) : parseFloat(DefaultExplorerData.royalty_rate);
  const [revenue, setRevenue] = React.useState<number>(initialRevenue);
  const [royaltyRate, setRoyaltyRate] = React.useState<number>(initialRoyaltyRate);

  React.useEffect(() => {
    setRevenue(formData.revenue && !isNaN(Number(formData.revenue)) ? Math.max(10000000, Math.min(parseFloat(formData.revenue), 100000000000)) : parseFloat(DefaultExplorerData.revenue));
    setRoyaltyRate(formData.royalty_rate && !isNaN(Number(formData.royalty_rate)) ? Math.max(3, Math.min(parseFloat(formData.royalty_rate), 100)) : parseFloat(DefaultExplorerData.royalty_rate));
  }, [formData]);

  const safeRevenue = revenue || parseFloat(DefaultExplorerData.revenue);
  const safeRoyaltyRate = royaltyRate || parseFloat(DefaultExplorerData.royalty_rate);

  const royaltyAmount = safeRevenue * (safeRoyaltyRate / 100);
  const operatingProfit = safeRevenue - royaltyAmount;
  const operatingTaxPaid = operatingProfit * (parseFloat(Countries.IRELAND.tax_rate) / 100);

  const totalProfit = royaltyAmount + operatingProfit - operatingTaxPaid;

  const totalTaxPaid = operatingTaxPaid;
  const effectiveTaxRate = (totalTaxPaid / safeRevenue) * 100;

  const taxesDueAtHome = safeRevenue * HOME_TAX_RATE;

  function handleRevenueChange(value: string) {
    setFormData((prev: FormFields) => ({
      ...prev,
      revenue: value,
    }));
  }

  function handleRoyaltyRateChange(value: string) {
    setFormData((prev: FormFields) => ({
      ...prev,
      royalty_rate: value,
    }));
  }

  const formatDollars = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className={commonStyles.pageContainer}>
      <div className={commonStyles.leftSide} style={{ flex: 2, maxWidth: '560px' }}>
        <div className={formStyles.formGroup}>
          <label htmlFor="revenue">Revenue</label>
          <input id="revenue" type="range" min={10000000} max={100000000000} value={revenue} onChange={(e): void => handleRevenueChange(e.target.value)} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="royaltyRate">Royalty Rate</label>
          <input id="royaltyRate" type="range" min={3} max={100} value={royaltyRate} onChange={(e): void => handleRoyaltyRateChange(e.target.value)} />
        </div>
        <div className={explorerStyles.entitiesContainer}>
          {Object.entries(Entities).map(([key, entity]) => (
            <div key={key} className={explorerStyles.entityCard}>
              {/* <div className={explorerStyles.entityStats}>

              </div> */}
              <div>{entity.default_name}</div>
              <div>{entity.description}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={commonStyles.rightSide} style={{ flex: 1, maxWidth: '240px' }}>
        <RemittanceChart revenue={revenue} taxesDueAtHome={taxesDueAtHome} profit={totalProfit} taxesPaid={totalTaxPaid} />
        <p>Effective Tax Rate: {formatPercentage(effectiveTaxRate)}</p>
        <p>Extra Profit Kept: {formatDollars(taxesDueAtHome)}</p>
      </div>
    </div>
  );
};

export default Explorer;
