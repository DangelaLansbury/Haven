import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormFields, DefaultMockData, MIN_REVENUE, MAX_REVENUE, BlendingResult, DollarValue, BlendLevels, CountryNames } from '../types';
import { calculateTaxBreakdown, optimizeBlend, formatDollars } from '../utils';
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

  const defaultOptLevel = BlendLevels.lowestTax;
  const [tempOptLevel, setTempOptLevel] = React.useState<BlendLevels | null>(null);
  const [selectedOptLevel, setSelectedOptLevel] = React.useState<BlendLevels | null>(null);

  const selectedCountries = React.useMemo(() => {
    return formData.countries && formData.countries.length > 0 ? formData.countries : [CountryNames.unitedstates];
  }, [formData.countries]);

  function handleCountryChange(country: CountryNames) {
    setFormData((prev: FormFields) => {
      const updatedCountries = prev.countries.includes(country) ? prev.countries.filter((c) => c !== country) : [...prev.countries, country];

      return {
        ...prev,
        countries: updatedCountries,
      };
    });
  }

  React.useEffect(() => {
    if (formData.revenue !== revenue) {
      setRevenue(formData.revenue);
    }
  }, [formData.revenue]);

  console.log(blend);

  const memoizedBlend = React.useMemo(() => {
    if (tempOptLevel !== null) {
      return optimizeBlend(selectedCountries, revenue, { optimizationLevel: tempOptLevel });
    } else if (selectedOptLevel !== null) {
      return optimizeBlend(selectedCountries, revenue, { optimizationLevel: selectedOptLevel });
    }
    return optimizeBlend(selectedCountries, revenue, { optimizationLevel: optLevel });
  }, [selectedCountries, revenue, optLevel, tempOptLevel]);

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

  const foreignTaxRate = blend.totalETR;
  const taxBreakdown = calculateTaxBreakdown(foreignTaxRate, revenue);
  const topUpAmount = taxBreakdown.topUpAmount;
  const isUsOnly = blend.blendComposition[CountryNames.unitedstates] === 1;

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
        {/* Revenue */}
        <div>
          {`Revenue: `}
          <NumberFlow value={formatDollars(revenue).value} duration={300} format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }} suffix={formatDollars(revenue).suffix} />
        </div>

        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={BlendLevels.lowestTax}>
          Lowest current tax
        </button>
        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={BlendLevels.inefficient}>
          Excess foreign tax
        </button>
        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={BlendLevels.topup}>
          NCTI top-up
        </button>
        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={BlendLevels.none}>
          Tax at US Rate
        </button>

        <div>{formData.countries.join(', ')}</div>
        <TaxBlendDonut blend={blend} />
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start' }}>
          {Object.entries(CountryNames).map(([key, value]) => (
            <div key={key} className={explorerStyles.countryCheckbox} style={{ display: 'flex', alignItems: 'center' }}>
              <input id={key} type="checkbox" checked={selectedCountries.includes(value)} onChange={() => handleCountryChange(value)} />
              <label htmlFor={key}>{value}</label>
            </div>
          ))}
          {/* {blend.blendComposition && Object.keys(blend.blendComposition).length > 0 && (
            <ul>
              {Object.entries(blend.blendComposition).map(([country, share]) => (
                <li key={country}>
                  {country}: {share}
                </li>
              ))}
            </ul>
          )} */}
        </div>
      </div>
      <div className={explorerStyles.rightSide}>
        <RemittanceChart etr={foreignTaxRate} isUsOnly={isUsOnly} />
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%', marginTop: '1.5rem' }}>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 600 }}>
            <NumberFlow value={foreignTaxRate} duration={300} format={{ style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
          </div>
          <div style={{ fontSize: 'var(--font-xs)' }}>{isUsOnly ? 'U.S. corporate tax rate' : 'Blended foreign tax rate'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%' }}>
          {taxBreakdown.topUpRate > 0 ? (
            <>
              <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginTop: '0.5rem' }}>
                <NumberFlow value={formatDollars(blend.totalTaxPaid).value} format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }} duration={300} suffix={formatDollars(blend.totalTaxPaid).suffix} />
                <span className={explorerStyles.topupPenalty}>{' + '}</span>
                <NumberFlow
                  value={formatDollars(topUpAmount).value}
                  format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
                  duration={300}
                  suffix={formatDollars(topUpAmount).suffix}
                  className={explorerStyles.topupPenalty}
                />
                <span>{' = '}</span>
                <NumberFlow
                  value={formatDollars(blend.totalTaxPaid + topUpAmount).value}
                  format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
                  duration={300}
                  suffix={formatDollars(blend.totalTaxPaid + topUpAmount).suffix}
                />
              </div>
              <div style={{ fontSize: 'var(--font-xs)' }}>Tax remitted + top-up*</div>
              <div style={{ fontSize: 'var(--font-xxs)', fontStyle: 'italic', marginTop: '1rem' }}>
                {`*The residual U.S. top-up is the 12.6% NCTI liability less the usable deemed-paid credit (90% of foreign tax), floored at zero. This is a simplified 2026+ model.`}
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
