import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormFields, DefaultMockData, OptimizationResult, OptimizationScenario, CountryNames } from '../types';
import { optimizeBlend, formatDollars } from '../utils';
import { RemittanceChart } from './RemittanceChart';
import explorerStyles from '../css/Explorer.module.css';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { RadialTaxBlendChart, TaxBlendDonut } from './PieChart';

interface ExplorerProps {
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
  blend: OptimizationResult;
  setBlend: React.Dispatch<React.SetStateAction<OptimizationResult>>;
  optLevel: OptimizationScenario;
  setOptLevel: React.Dispatch<React.SetStateAction<OptimizationScenario>>;
}

const Explorer: React.FC<ExplorerProps> = ({ formData, setFormData, blend, setBlend, optLevel, setOptLevel }: ExplorerProps) => {
  const initialRevenue = formData.revenue && !isNaN(formData.revenue) ? formData.revenue : DefaultMockData.revenue;
  const [revenue, setRevenue] = React.useState<number>(initialRevenue);

  const defaultOptLevel = OptimizationScenario.unconstrained;
  const [tempOptLevel, setTempOptLevel] = React.useState<OptimizationScenario | null>(null);
  const [selectedOptLevel, setSelectedOptLevel] = React.useState<OptimizationScenario | null>(null);

  const selectedCountries = React.useMemo(() => {
    return formData.countries && formData.countries.length > 0 ? formData.countries : [CountryNames.unitedstates];
  }, [formData.countries]);

  React.useEffect(() => {
    if (formData.revenue !== revenue) {
      setRevenue(formData.revenue);
    }
  }, [formData.revenue]);

  const memoizedBlend = React.useMemo(() => {
    if (tempOptLevel !== null) {
      return optimizeBlend(selectedCountries, revenue, tempOptLevel);
    } else if (selectedOptLevel !== null) {
      return optimizeBlend(selectedCountries, revenue, selectedOptLevel);
    }
    return optimizeBlend(selectedCountries, revenue, optLevel);
  }, [selectedCountries, revenue, optLevel, tempOptLevel, selectedOptLevel]);

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
    const level = event.currentTarget.value as OptimizationScenario;
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
    const level = event.currentTarget.value as OptimizationScenario;

    if (selectedOptLevel && selectedOptLevel === level) {
      setSelectedOptLevel(null);
    } else {
      setSelectedOptLevel(level);
    }
  }

  const foreignTaxRate = blend.foreignTaxRate;
  const taxBreakdown = blend.taxBreakdown;
  const topUpAmount = taxBreakdown.topUpAmount;
  const isUsOnly = blend.scenario === OptimizationScenario.usOnly;
  const displayedRate = isUsOnly ? taxBreakdown.totalTaxRate : foreignTaxRate;

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

        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={OptimizationScenario.unconstrained}>
          Lowest current tax
        </button>
        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={OptimizationScenario.ftcEfficient}>
          FTC-efficient 14% blend
        </button>
        <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={OptimizationScenario.usOnly}>
          Tax at US Rate
        </button>

        <div>{formData.countries.join(', ')}</div>
        <TaxBlendDonut blend={blend} />
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start' }}>
          {blend.allocations.length > 0 && (
            <ul>
              {blend.allocations.map(({ country, share, taxRate }) => (
                <li key={country}>
                  {country}: {(share * 100).toFixed(1)}% at {(taxRate * 100).toFixed(1)}%
                </li>
              ))}
            </ul>
          )}
          {!isUsOnly && (
            <div style={{ fontSize: 'var(--font-xxs)' }}>
              A company in {blend.allocations[0].country} would own the IP and sell it to companies operating in other jurisdictions, which would pay royalties to the IP owner. The royalties are taxed at the statutory rate of the IP owner's
              jurisdiction, and the U.S. parent company pays a top-up tax on the difference between the U.S. corporate rate and the foreign tax credit.
            </div>
          )}
          {blend.scenario === OptimizationScenario.ftcEfficient && blend.targetWasReachable === false && (
            <div style={{ fontSize: 'var(--font-xxs)' }}>The selected jurisdictions cannot reach the 14% target; the closest available rate is shown.</div>
          )}
        </div>
      </div>
      <div className={explorerStyles.rightSide}>
        <RemittanceChart breakdown={taxBreakdown} isUsOnly={isUsOnly} />
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%', marginTop: '1.5rem' }}>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 600 }}>
            <NumberFlow value={displayedRate} duration={300} format={{ style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
          </div>
          <div style={{ fontSize: 'var(--font-xs)' }}>{isUsOnly ? 'U.S. corporate tax rate' : 'Blended foreign tax rate'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%' }}>
          {!isUsOnly && taxBreakdown.topUpRate > 0 ? (
            <>
              <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginTop: '0.5rem' }}>
                <NumberFlow
                  value={formatDollars(taxBreakdown.foreignTaxAmount).value}
                  format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
                  duration={300}
                  suffix={formatDollars(taxBreakdown.foreignTaxAmount).suffix}
                />
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
                  value={formatDollars(taxBreakdown.totalTaxAmount).value}
                  format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
                  duration={300}
                  suffix={formatDollars(taxBreakdown.totalTaxAmount).suffix}
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
                <NumberFlow
                  value={formatDollars(taxBreakdown.totalTaxAmount).value}
                  format={{ style: 'currency', currency: 'USD', trailingZeroDisplay: 'stripIfInteger' }}
                  duration={300}
                  suffix={formatDollars(taxBreakdown.totalTaxAmount).suffix}
                />
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
