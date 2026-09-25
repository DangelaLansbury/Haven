import React from 'react';
import commonStyles from '../css/Common.module.css';
import { Countries, CountryNames, OptimizationResult, OptimizationScenario } from '../types';
import { formatDollars } from '../utils';
import { RemittanceChart } from './RemittanceChart';
import explorerStyles from '../css/Explorer.module.css';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { WorldMap } from './Map';
import formStyles from '../css/Form.module.css';
import type { Variants } from 'framer-motion';

const NUMBER_FLOW_TIMING: EffectTiming = { duration: 300 };

const sideGraphVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.3, ease: [0.48, 0, 0.62, 1] },
      y: { duration: 1, ease: [0.5, 1, 0.5, 1] },
    },
  },
};

const mainFormVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.3, ease: [0.48, 0, 0.62, 1] },
      y: { duration: 0.4, ease: [0.48, 0, 0.62, 1] },
    },
  },
};

interface ExplorerProps {
  countries: CountryNames[];
  revenue: number;
  profit: number;
  profitMargin: number;
  presetBlends: Record<OptimizationScenario, OptimizationResult>;
  optLevel: OptimizationScenario;
  setOptLevel: React.Dispatch<React.SetStateAction<OptimizationScenario>>;
}

const Explorer: React.FC<ExplorerProps> = ({ countries, revenue, profit, profitMargin, presetBlends, optLevel, setOptLevel }: ExplorerProps) => {
  const defaultOptLevel = OptimizationScenario.unconstrained;
  const [tempOptLevel, setTempOptLevel] = React.useState<OptimizationScenario | null>(null);
  const [selectedOptLevel, setSelectedOptLevel] = React.useState<OptimizationScenario | null>(null);

  const activeOptLevel = tempOptLevel ?? selectedOptLevel ?? optLevel;
  const blend = presetBlends[activeOptLevel];

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
  const isUsOnly = React.useMemo(() => blend.scenario === OptimizationScenario.usOnly, [blend.scenario]);
  const displayedRate = isUsOnly ? taxBreakdown.totalTaxRate : foreignTaxRate;
  const highlightedCountries = React.useMemo(() => blend.allocations.map(({ country }) => country), [blend.allocations]);
  const candidateCountries = React.useMemo(() => countries, [countries]);

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
      <motion.div variants={mainFormVariants} initial="initial" animate="animate" className={explorerStyles.leftSide} style={{ flex: 2, maxWidth: '32rem' }}>
        <figure className={explorerStyles.mapPanel}>
          <WorldMap width={640} height={330} highlightedCountries={highlightedCountries} candidateCountries={candidateCountries} />
        </figure>
        <div>
          {`Revenue: `}
          <NumberFlow value={formatDollars(revenue).value} transformTiming={NUMBER_FLOW_TIMING} format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }} suffix={formatDollars(revenue).suffix} />
        </div>
        <div>
          {`Profit margin: `}
          <NumberFlow value={profitMargin} transformTiming={NUMBER_FLOW_TIMING} format={{ style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 }} />
        </div>
        <div>
          {`Taxable profit: `}
          <NumberFlow value={formatDollars(profit).value} transformTiming={NUMBER_FLOW_TIMING} format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }} suffix={formatDollars(profit).suffix} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start' }}>
          {blend.allocations.length > 0 && (
            <div className={formStyles.formSection}>
              {countries.map((country) => {
                const allocation = blend.allocations.find((allocation) => allocation.country === country);
                const share = allocation ? allocation.share : 0;
                const taxRate = allocation ? allocation.taxRate : Countries[country].rate;

                return (
                  <div className={formStyles.formGroup} key={country}>
                    {country}: {(share * 100).toFixed(1)}% of profit at {(taxRate * 100).toFixed(1)}%
                  </div>
                );
              })}
            </div>
          )}
          {blend.scenario === OptimizationScenario.ftcEfficient && blend.targetWasReachable === false && (
            <div style={{ fontSize: 'var(--font-xxs)', marginTop: '0.5rem' }}>The selected jurisdictions cannot reach the 14% target; the closest available rate is shown.</div>
          )}
        </div>
      </motion.div>

      <motion.div variants={sideGraphVariants} initial="initial" animate="animate" className={explorerStyles.rightSide}>
        <div style={{ display: 'flex', flexDirection: 'row', alignContent: 'flex-start', gap: '0.5rem', width: '100%', marginBottom: '0.75rem' }}>
          <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={OptimizationScenario.unconstrained}>
            Lowest current tax
          </button>
          <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={OptimizationScenario.ftcEfficient}>
            FTC-efficient 14% blend
          </button>
          <button onMouseEnter={handleOptLevelMouseEnter} onMouseLeave={handleOptLevelMouseLeave} onClick={handleOptLevelClick} value={OptimizationScenario.usOnly}>
            Tax at US Rate
          </button>
        </div>
        <RemittanceChart blends={presetBlends} activeScenario={activeOptLevel} />
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%', marginTop: '1.5rem' }}>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 600 }}>
            <NumberFlow value={displayedRate} transformTiming={NUMBER_FLOW_TIMING} format={{ style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
          </div>
          <div style={{ fontSize: 'var(--font-xs)' }}>{isUsOnly ? 'U.S. corporate tax rate' : 'Blended foreign tax rate'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignContent: 'flex-start', width: '100%' }}>
          {!isUsOnly && taxBreakdown.topUpRate > 0 ? (
            <>
              <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginTop: '0.5rem' }}>
                <NumberFlow
                  value={formatDollars(taxBreakdown.foreignTaxAmount).value}
                  format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }}
                  transformTiming={NUMBER_FLOW_TIMING}
                  suffix={formatDollars(taxBreakdown.foreignTaxAmount).suffix}
                />
                <span className={explorerStyles.topupPenalty}>{' + '}</span>
                <NumberFlow
                  value={formatDollars(topUpAmount).value}
                  format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }}
                  transformTiming={NUMBER_FLOW_TIMING}
                  suffix={formatDollars(topUpAmount).suffix}
                  className={explorerStyles.topupPenalty}
                />
                <span>{' = '}</span>
                <NumberFlow
                  value={formatDollars(taxBreakdown.totalTaxAmount).value}
                  format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }}
                  transformTiming={NUMBER_FLOW_TIMING}
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
                  format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }}
                  transformTiming={NUMBER_FLOW_TIMING}
                  suffix={formatDollars(taxBreakdown.totalTaxAmount).suffix}
                />
              </div>
              <div style={{ fontSize: 'var(--font-xs)' }}>Tax remitted</div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Explorer;
