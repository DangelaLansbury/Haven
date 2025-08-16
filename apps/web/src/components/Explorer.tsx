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
  const initialRevenue = formData.revenue && !isNaN(Number(formData.revenue)) ? parseFloat(formData.revenue) : parseFloat(DefaultExplorerData.revenue);
  const initialRoyaltyRate = formData.royalty_rate && !isNaN(Number(formData.royalty_rate)) ? parseFloat(formData.royalty_rate) : parseFloat(DefaultExplorerData.royalty_rate);
  const [revenue, setRevenue] = React.useState<number>(initialRevenue);
  const [royaltyRate, setRoyaltyRate] = React.useState<number>(initialRoyaltyRate);

  React.useEffect(() => {
    setRevenue(formData.revenue && !isNaN(Number(formData.revenue)) ? Math.max(MIN_REVENUE, Math.min(parseFloat(formData.revenue), MAX_REVENUE)) : parseFloat(DefaultExplorerData.revenue));
    setRoyaltyRate(formData.royalty_rate && !isNaN(Number(formData.royalty_rate)) ? Math.max(MIN_ROYALTY_RATE, Math.min(parseFloat(formData.royalty_rate), MAX_ROYALTY_RATE)) : parseFloat(DefaultExplorerData.royalty_rate));
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
      initial={{ opacity: 0, y: -24 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          opacity: { duration: 0.4, ease: [0.48, 0, 0.62, 1] },
          y: { duration: 0.6, ease: [0.48, 0, 0.62, 1] },
        },
      }}
    >
      <div className={explorerStyles.leftSide} style={{ flex: 2, maxWidth: '30rem' }}>
        <div className={formStyles.formGroup}>
          <label htmlFor="revenue">Revenue</label>
          <input id="revenue" type="range" min={MIN_REVENUE} max={MAX_REVENUE} value={revenue} onChange={(e): void => handleRevenueChange(e.target.value)} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="royaltyRate">Royalty Rate</label>
          <input id="royaltyRate" type="range" min={MIN_ROYALTY_RATE} max={MAX_ROYALTY_RATE} value={royaltyRate} onChange={(e): void => handleRoyaltyRateChange(e.target.value)} />
        </div>
        <div className={explorerStyles.entitiesContainer}>
          <ExplorerEntity name={Entities.operating.display_role} country={Countries.IRELAND.name} keeps={formatDollars(operatingProfit) + ' profit'} pays={formatDollars(operatingTaxPaid) + ' tax paid'} />
          <ExplorerEntity name={Entities.conduit.display_role} country={Countries.NETHERLANDS.name} keeps={'$0 retained'} pays={'$0 tax paid'} />
          <ExplorerEntity name={Entities.licensor.display_role} country={Countries.BERMUDA.name} keeps={formatDollars(totalProfit) + ' profit'} pays={'$0 tax paid'} />
          {/* {Object.entries(Entities).map(([key, entity]) => (
            <div key={key} className={explorerStyles.entityCard}>
              <div>{entity.default_name}</div>
              <div>{entity.description}</div>
            </div>
          ))} */}
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
