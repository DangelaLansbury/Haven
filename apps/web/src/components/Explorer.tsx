import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormFields, DefaultExplorerData, HOME_TAX_RATE, MIN_REVENUE, MAX_REVENUE, MIN_FTR, MAX_FTR, GILTI_RATE } from '../types';
import { calcTotalETR, calcNetUSTaxOwed } from '../utils';
import { RemittanceChart } from './RemittanceChart';
import explorerStyles from '../css/Explorer.module.css';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';

interface ExplorerProps {
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
  setNetUSTaxOwed?: React.Dispatch<React.SetStateAction<number | null>>;
}

const Explorer: React.FC<ExplorerProps> = ({ formData, setFormData, setNetUSTaxOwed }: ExplorerProps) => {
  const initialRevenue = formData.revenue && !isNaN(formData.revenue) ? formData.revenue : DefaultExplorerData.revenue;
  const initialFTR = formData.ftr && !isNaN(formData.ftr) ? formData.ftr : DefaultExplorerData.ftr;
  const initialETR = calcTotalETR(initialFTR).etr;
  const [revenue, setRevenue] = React.useState<number>(initialRevenue);
  const [foreignTaxRate, setForeignTaxRate] = React.useState<number>(initialFTR);
  const [effectiveTaxRate, setEffectiveTaxRate] = React.useState<number>(initialETR);

  React.useEffect(() => {
    setRevenue(formData.revenue && !isNaN(formData.revenue) ? Math.max(MIN_REVENUE, Math.min(formData.revenue, MAX_REVENUE)) : DefaultExplorerData.revenue);
    setForeignTaxRate(formData.ftr && !isNaN(formData.ftr) ? Math.max(MIN_FTR, Math.min(formData.ftr, MAX_FTR)) : DefaultExplorerData.ftr);
    setEffectiveTaxRate(calcTotalETR(foreignTaxRate).etr);
    setNetUSTaxOwed(calcNetUSTaxOwed(revenue, effectiveTaxRate));
  }, [formData, effectiveTaxRate, foreignTaxRate, revenue]);

  const revenue_safe = revenue || DefaultExplorerData.revenue;
  const ftr_safe = foreignTaxRate || DefaultExplorerData.ftr;

  const topUp = calcTotalETR(ftr_safe).topUp;

  const foreignTaxPaid = revenue * ftr_safe;
  const taxesPaid = foreignTaxPaid + Math.max(topUp * revenue, 0);

  const taxesDueAtHome = revenue_safe * HOME_TAX_RATE;
  const extraProfitKept = taxesDueAtHome - taxesPaid;

  // const royaltyAmount = safeRevenue * (safeFtr / 100);
  // const operatingProfit = safeRevenue - royaltyAmount;
  // const operatingTaxPaid = operatingProfit * (parseFloat(Countries.IRELAND.tax_rate) / 100);

  // const totalProfit = royaltyAmount + operatingProfit - operatingTaxPaid;

  // const totalTaxPaid = operatingTaxPaid;
  // const effectiveTaxRate = (totalTaxPaid / safeRevenue) * 100;

  function handleRevenueChange(value: number) {
    setFormData((prev: FormFields) => ({
      ...prev,
      revenue: value,
    }));
  }

  function handleRoyaltyRateChange(value: number) {
    setFormData((prev: FormFields) => ({
      ...prev,
      ftr: value,
    }));
  }

  const formatDollars = (amount: number): { value: number; suffix: string } => {
    if (amount > 1000000000) {
      return {
        value: amount / 1000000000,
        suffix: 'B',
      };
    } else if (amount > 1000000) {
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

  // const formatPercentage = (value: number): number => {
  //   return (value * 100) / 100;
  // };

  const [tempRevenue, setTempRevenue] = React.useState<number>(initialRevenue);
  const [tempFTR, setTempFTR] = React.useState<number>(initialFTR);

  function handleHover() {
    setTempRevenue(revenue);
    setTempFTR(foreignTaxRate);
    // setForeignTaxRate(0.08);
    setRevenue(DefaultExplorerData.revenue);
    setFormData((prev: FormFields) => ({
      ...prev,
      revenue: DefaultExplorerData.revenue,
      ftr: 0.08,
    }));
  }

  function handleHoverEnd() {
    setRevenue(tempRevenue);
    setForeignTaxRate(tempFTR);
    setFormData((prev: FormFields) => ({
      ...prev,
      revenue: tempRevenue,
      ftr: tempFTR,
    }));
  }

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
          <label htmlFor="revenue">Revenue: {formatDollars(revenue).value}</label>
          <input id="revenue" type="range" min={MIN_REVENUE} max={MAX_REVENUE} value={revenue} onChange={(e): void => handleRevenueChange(e.target.value)} className={formStyles.rangeInput} />
        </div>
        {/* <div className={formStyles.formGroup}>
          <label htmlFor="royaltyRate">Royalty Rate: {formatPercentage(ftr_safe)}</label>
          <input id="royaltyRate" type="range" min={MIN_FTR} max={MAX_FTR} value={ftr_safe} onChange={(e): void => handleRoyaltyRateChange(e.target.value)} className={formStyles.rangeInput} />
        </div> */}

        <div style={{ marginTop: '2rem' }}>
          <button onMouseEnter={handleHover} onMouseLeave={handleHoverEnd}>
            Hover over for defaults
          </button>
        </div>

        {/* <div className={explorerStyles.entitiesContainer}>
          <ExplorerEntity name={Entities.operating.display_role} country={Countries.IRELAND.name} keeps={formatDollars(operatingProfit).value + ' profit'} pays={formatDollars(operatingTaxPaid).value + ' tax paid'} />
          <ExplorerEntity name={Entities.conduit.display_role} country={Countries.NETHERLANDS.name} keeps={'$0 retained'} pays={'$0 tax paid'} />
          <ExplorerEntity name={Entities.licensor.display_role} country={Countries.BERMUDA.name} keeps={formatDollars(royaltyAmount).value + ' profit'} pays={'$0 tax paid'} />
          <button onMouseEnter={handleHover} onMouseLeave={handleHoverEnd}>
            Hover over for defaults
          </button>
        </div> */}
      </div>
      <div className={explorerStyles.rightSide}>
        <RemittanceChart ftr={foreignTaxRate} />
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%', marginTop: '1.5rem' }}>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 600 }}>
            <NumberFlow value={effectiveTaxRate} duration={300} format={{ style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
          </div>
          <div style={{ fontSize: 'var(--font-xs)' }}>Effective Tax Rate</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%' }}>
          <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginTop: '0.5rem' }}>
            <NumberFlow value={formatDollars(extraProfitKept).value} format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }} duration={300} suffix={formatDollars(extraProfitKept).suffix} />
          </div>
          <div style={{ fontSize: 'var(--font-xs)' }}>Extra Profit Kept</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%' }}>
          <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginTop: '0.5rem' }}>
            <NumberFlow value={formatDollars(extraProfitKept).value} format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }} duration={300} suffix={formatDollars(extraProfitKept).suffix} />
          </div>
          <div style={{ fontSize: 'var(--font-xs)' }}>You owe</div>
        </div>
      </div>
    </motion.div>
  );
};

export default Explorer;
