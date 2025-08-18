import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormFields, Entities, DefaultExplorerData, HOME_TAX_RATE, Countries, MIN_REVENUE, MAX_REVENUE, MIN_ROYALTY_RATE, MAX_ROYALTY_RATE } from '../types';
import { RemittanceChart } from './RemittanceChart';
import explorerStyles from '../css/Explorer.module.css';
import { motion } from 'framer-motion';
import { ExplorerEntity } from './ExplorerEntity';

interface ExplorerProps {
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
}

const Explorer: React.FC<ExplorerProps> = ({ formData, setFormData }: ExplorerProps) => {
  const initialRevenue = formData.revenue && !isNaN(formData.revenue) ? formData.revenue : DefaultExplorerData.revenue;
  const initialRoyaltyRate = formData.royalty_rate && !isNaN(formData.royalty_rate) ? formData.royalty_rate : DefaultExplorerData.royalty_rate;
  const [revenue, setRevenue] = React.useState<number>(initialRevenue);
  const [royaltyRate, setRoyaltyRate] = React.useState<number>(initialRoyaltyRate);

  React.useEffect(() => {
    setRevenue(formData.revenue && !isNaN(formData.revenue) ? Math.max(MIN_REVENUE, Math.min(formData.revenue, MAX_REVENUE)) : DefaultExplorerData.revenue);
    setRoyaltyRate(formData.royalty_rate && !isNaN(formData.royalty_rate) ? Math.max(MIN_ROYALTY_RATE, Math.min(formData.royalty_rate, MAX_ROYALTY_RATE)) : DefaultExplorerData.royalty_rate);
  }, [formData]);

  const safeRevenue = revenue || DefaultExplorerData.revenue;
  const safeRoyaltyRate = royaltyRate || DefaultExplorerData.royalty_rate;

  const royaltyAmount = safeRevenue * (safeRoyaltyRate / 100);
  const operatingProfit = safeRevenue - royaltyAmount;
  const operatingTaxPaid = operatingProfit * (parseFloat(Countries.IRELAND.tax_rate) / 100);

  const totalProfit = royaltyAmount + operatingProfit - operatingTaxPaid;

  const totalTaxPaid = operatingTaxPaid;
  const effectiveTaxRate = (totalTaxPaid / safeRevenue) * 100;

  const taxesDueAtHome = safeRevenue * HOME_TAX_RATE;

  function handleRevenueChange(value: number) {
    setFormData((prev: FormFields) => ({
      ...prev,
      revenue: value,
    }));
  }

  function handleRoyaltyRateChange(value: number) {
    setFormData((prev: FormFields) => ({
      ...prev,
      royalty_rate: value,
    }));
  }

  const formatDollars = (amount: number): string => {
    if (amount > 1000000000) {
      return (
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount / 1000000000) + 'B'
      );
    } else if (amount > 1000000) {
      return (
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount / 1000000) + 'M'
      );
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <motion.div
      className={commonStyles.pageContainer}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: {
          opacity: { duration: 0.4, ease: [0.48, 0, 0.62, 1] },
        },
      }}
    >
      <div className={explorerStyles.leftSide} style={{ flex: 2, maxWidth: '30rem' }}>
        <div className={formStyles.formGroup}>
          <label htmlFor="revenue">Revenue: {formatDollars(revenue)}</label>
          <input id="revenue" type="range" min={MIN_REVENUE} max={MAX_REVENUE} value={revenue} onChange={(e): void => handleRevenueChange(e.target.value)} className={formStyles.rangeInput} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="royaltyRate">Royalty Rate: {formatPercentage(royaltyRate)}</label>
          <input id="royaltyRate" type="range" min={MIN_ROYALTY_RATE} max={MAX_ROYALTY_RATE} value={royaltyRate} onChange={(e): void => handleRoyaltyRateChange(e.target.value)} className={formStyles.rangeInput} />
        </div>
        <div className={explorerStyles.entitiesContainer}>
          <ExplorerEntity name={Entities.operating.display_role} country={Countries.IRELAND.name} keeps={formatDollars(operatingProfit) + ' profit'} pays={formatDollars(operatingTaxPaid) + ' tax paid'} />
          <ExplorerEntity name={Entities.conduit.display_role} country={Countries.NETHERLANDS.name} keeps={'$0 retained'} pays={'$0 tax paid'} />
          <ExplorerEntity name={Entities.licensor.display_role} country={Countries.BERMUDA.name} keeps={formatDollars(royaltyAmount) + ' profit'} pays={'$0 tax paid'} />
        </div>
      </div>
      <div className={explorerStyles.rightSide} style={{ flex: 1, maxWidth: '240px' }}>
        <RemittanceChart revenue={revenue} taxesDueAtHome={taxesDueAtHome} profit={totalProfit} taxesPaid={totalTaxPaid} />
        <div style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginTop: '1.5rem' }}>{formatPercentage(effectiveTaxRate)}</div>
        <div style={{ fontSize: 'var(--font-xs)' }}>Effective Tax Rate</div>
        <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginTop: '1rem' }}>{formatDollars(taxesDueAtHome - totalTaxPaid)}</div>
        <div style={{ fontSize: 'var(--font-xs)' }}>Extra Profit Kept</div>
      </div>
    </motion.div>
  );
};

export default Explorer;
