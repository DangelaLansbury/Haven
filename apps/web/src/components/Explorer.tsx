import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormFields, DefaultMockData, MIN_REVENUE, MAX_REVENUE, BlendingResult, DollarValue, EFF_GILTI_RATE, BlendLevels } from '../types';
import { optimizeBlend, formatDollars } from '../utils';
import { RemittanceChart } from './RemittanceChart';
import explorerStyles from '../css/Explorer.module.css';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { RadialTaxBlendChart, TaxBlendDonut } from './PieChart';

interface ExplorerProps {
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
  blend: BlendingResult;
  setBlend: React.Dispatch<React.SetStateAction<BlendingResult>>;
  optLevel: BlendLevels;
  setOptLevel: React.Dispatch<React.SetStateAction<BlendLevels>>;
}

const Explorer: React.FC<ExplorerProps> = ({ formData, setFormData, blend, setBlend, optLevel, setOptLevel }: ExplorerProps) => {
  const initialRevenue = formData.revenue && !isNaN(formData.revenue) ? formData.revenue : DefaultMockData.revenue;
  const [revenue, setRevenue] = React.useState<number>(initialRevenue);

  const defaultOptLevel = BlendLevels.optimal;
  const [tempOptLevel, setTempOptLevel] = React.useState<BlendLevels | null>(null);
  const [selectedOptLevel, setSelectedOptLevel] = React.useState<BlendLevels | null>(null);

  console.log(blend);

  const memoizedBlend = React.useMemo(() => {
    if (tempOptLevel !== null) {
      return optimizeBlend(formData.countries, revenue, { optimizationLevel: tempOptLevel });
    } else if (selectedOptLevel !== null) {
      return optimizeBlend(formData.countries, revenue, { optimizationLevel: selectedOptLevel });
    }
    return optimizeBlend(formData.countries, revenue, { optimizationLevel: optLevel });
  }, [formData.countries, revenue, optLevel, tempOptLevel]);

  React.useEffect(() => {
    setBlend(memoizedBlend);
  }, [memoizedBlend, setBlend]);

  function handleRevenueChange(value: number) {
    setFormData((prev: FormFields) => ({
      ...prev,
      revenue: value,
    }));
  }

  function handleOptLevelMouseEnter(event: React.MouseEvent<HTMLButtonElement>) {
    const level = event.currentTarget.value as BlendLevels;
    setTempOptLevel(level);
  }

  function handleOptLevelMouseLeave() {
    if (selectedOptLevel === null) {
      setOptLevel(defaultOptLevel);
      setTempOptLevel(null);
    } else {
      setOptLevel(selectedOptLevel);
      setTempOptLevel(null);
    }
  }

  function handleOptLevelClick(event: React.MouseEvent<HTMLButtonElement>) {
    const level = event.currentTarget.value as BlendLevels;

    if (selectedOptLevel && selectedOptLevel === level) {
      setSelectedOptLevel(null);
    } else {
      setSelectedOptLevel(level);
    }
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
          <label htmlFor="revenue">Revenue: {formatDollars(revenue).value + formatDollars(revenue).suffix}</label>
          <input id="revenue" type="range" min={MIN_REVENUE} max={MAX_REVENUE} value={revenue} onChange={(e): void => handleRevenueChange(e.target.value)} className={formStyles.rangeInput} />
        </div>

        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={BlendLevels.optimal}>
          Optimal
        </button>
        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={BlendLevels.inefficient}>
          Inefficient
        </button>
        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={BlendLevels.topup}>
          GILTI Top-up
        </button>
        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={BlendLevels.none}>
          Tax at US Rate
        </button>

        <div>{formData.countries.join(', ')}</div>
        <TaxBlendDonut blend={blend} />
        <div>
          {blend.blendComposition && Object.keys(blend.blendComposition).length > 0 && (
            <ul>
              {Object.entries(blend.blendComposition).map(([country, share]) => (
                <li key={country}>
                  {country}: {share}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className={explorerStyles.rightSide}>
        <RemittanceChart etr={blend.totalETR} />
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%', marginTop: '1.5rem' }}>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 600 }}>
            <NumberFlow value={blend.totalETR} duration={300} format={{ style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
          </div>
          <div style={{ fontSize: 'var(--font-xs)' }}>Effective Tax Rate</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%' }}>
          {/* <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginTop: '0.5rem' }}>
            <NumberFlow value={formatDollars(blend.totalTaxPaid).value} format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }} duration={300} suffix={formatDollars(blend.totalTaxPaid).suffix} />
          </div>
          <div style={{ fontSize: 'var(--font-xs)' }}>You pay</div> */}
          {blend.totalETR < EFF_GILTI_RATE ? (
            <>
              <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginTop: '0.5rem' }}>
                <NumberFlow value={formatDollars(blend.totalTaxPaid).value} format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }} duration={300} suffix={formatDollars(blend.totalTaxPaid).suffix} />
                <span className={explorerStyles.topupPenalty}>{' + '}</span>
                <NumberFlow
                  value={formatDollars((EFF_GILTI_RATE - blend.totalETR) * revenue).value}
                  format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
                  duration={300}
                  suffix={formatDollars((EFF_GILTI_RATE - blend.totalETR) * revenue).suffix}
                  className={explorerStyles.topupPenalty}
                />
              </div>
              <div style={{ fontSize: 'var(--font-xs)' }}>Tax remitted + top-up penalty*</div>
              <div style={{ fontSize: 'var(--font-xxs)', fontStyle: 'italic', marginTop: '1rem' }}>
                {`*Top-up penalties cover any gap between FETR and the eff. GILTI rate (13.125%). Unlike foreign taxes, they are not creditable against U.S. tax liability, with no ability to recover, defer, or carry forward.`}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginTop: '0.5rem' }}>
                <NumberFlow value={formatDollars(blend.totalTaxPaid).value} format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }} duration={300} suffix={formatDollars(blend.totalTaxPaid).suffix} />
              </div>
              <div style={{ fontSize: 'var(--font-xs)' }}>Tax remitted</div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Explorer;
