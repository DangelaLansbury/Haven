import { useMemo, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { DEFAULT_TAX_REGIME, OptimizationScenario, type ExplorerData, type OptimizationResult } from '../types';
import { SCENARIOS, SCENARIO_LABELS, describeScenario } from '../scenarios';
import { formatDollars } from '../utils';
import { JurisdictionTable } from './JurisdictionTable';
import { RemittanceChart } from './RemittanceChart';
import { WorldMap } from './Map';
import commonStyles from '../css/Common.module.css';
import styles from '../css/Explorer.module.css';

const NUMBER_FLOW_TIMING: EffectTiming = { duration: 300 };
const PERCENT_FORMAT = { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;
const CURRENCY_FORMAT = { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 } as const;
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

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

function CurrencyAmount({ amount, className }: { amount: number; className?: string }) {
  const { value, suffix } = formatDollars(amount);
  return <NumberFlow value={value} suffix={suffix} className={className} locales="en-US" transformTiming={NUMBER_FLOW_TIMING} format={CURRENCY_FORMAT} />;
}

interface ExplorerProps {
  data: ExplorerData;
  profit: number;
  presetBlends: Record<OptimizationScenario, OptimizationResult>;
  selectedScenario: OptimizationScenario;
  onSelectScenario: (scenario: OptimizationScenario) => void;
}

const Explorer = ({ data, profit, presetBlends, selectedScenario, onSelectScenario }: ExplorerProps) => {
  const [previewScenario, setPreviewScenario] = useState<OptimizationScenario | null>(null);
  const activeScenario = previewScenario ?? selectedScenario;
  const blend = presetBlends[activeScenario];
  const { countries, funnelFlows, generatedAllocations, jurisdictionSections, revenue, profitMargin } = data;
  const { taxBreakdown } = blend;
  const isUsOnly = activeScenario === OptimizationScenario.usOnly;
  const hasTopUp = !isUsOnly && taxBreakdown.topUpAmount >= 0.01;
  const hasDomesticAndForeign = blend.domesticTaxAmount > 0 && taxBreakdown.taxableProfit > 0;
  const displayedRate = isUsOnly ? blend.effectiveTaxRate : blend.foreignTaxRate;
  const targetRate = blend.targetRate ?? taxBreakdown.noTopUpForeignRate;
  const highlightedCountries = useMemo(() => blend.allocations.filter(({ share }) => share > 0).map(({ country }) => country), [blend.allocations]);
  const activeFlows = activeScenario === OptimizationScenario.illustrativeFunnel ? funnelFlows : undefined;

  return (
    <motion.div className={`${commonStyles.pageContainer} ${styles.explorerPage}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div variants={mainFormVariants} initial="initial" animate="animate" className={styles.mapPanel}>
        <figure className={styles.mapFigure}>
          <WorldMap width={640} height={330} highlightedCountries={highlightedCountries} candidateCountries={countries} flows={activeFlows} />
          {activeFlows && (
            <figcaption>
              In this illustration, operating companies pay affiliated hubs service fees or royalties for brands and technology. These payments reduce profit in the markets and become income in the hubs. Hubs keep a margin and pay onward
              royalties to a low-tax affiliate, reducing hub profit and booking income at the endpoint.
            </figcaption>
          )}
        </figure>
        <div>
          Revenue: <CurrencyAmount amount={revenue} />
        </div>
        <div>Profit margin: {percent.format(profitMargin)}</div>
        <div>
          Taxable profit: <CurrencyAmount amount={profit} />
        </div>
        <JurisdictionTable sections={jurisdictionSections} generated={generatedAllocations} booked={blend.allocations} />
        {activeScenario === OptimizationScenario.ftcCrossCredit && (
          <p className={styles.modelNote} role="status">
            {blend.targetWasReachable
              ? `The ${percent.format(targetRate)} target is reached through cross-crediting across multiple CFCs under the displayed illustrative constraints.`
              : `The constraints cannot reach the ${percent.format(targetRate)} target; the closest feasible rate is shown.`}
          </p>
        )}
      </motion.div>

      <motion.div variants={sideGraphVariants} initial="initial" animate="animate" className={styles.rightSide}>
        <div className={styles.scenarioControls} role="group" aria-label="Profit allocation scenario">
          {SCENARIOS.map((scenario) => (
            <button
              type="button"
              className={styles.scenarioButton}
              aria-pressed={selectedScenario === scenario}
              data-active={activeScenario === scenario}
              key={scenario}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') setPreviewScenario(scenario);
              }}
              onPointerLeave={() => setPreviewScenario(null)}
              onClick={() => {
                onSelectScenario(selectedScenario === scenario ? OptimizationScenario.economicFootprint : scenario);
                setPreviewScenario(null);
              }}
            >
              {SCENARIO_LABELS[scenario].label}
            </button>
          ))}
        </div>
        <p className={styles.scenarioDescription}>{describeScenario(blend, jurisdictionSections)}</p>
        <RemittanceChart blends={presetBlends} activeScenario={activeScenario} />
        <div className={styles.rateSummary}>
          <NumberFlow value={displayedRate} locales="en-US" transformTiming={NUMBER_FLOW_TIMING} format={PERCENT_FORMAT} />
          <div className={styles.summaryLabel}>{isUsOnly ? 'U.S. corporate tax rate' : 'Blended foreign tax rate'}</div>
        </div>
        <div className={styles.taxSummary}>
          <div className={styles.taxAmount}>
            {hasDomesticAndForeign && (
              <>
                <CurrencyAmount amount={blend.domesticTaxAmount} />
                <span>{' + '}</span>
              </>
            )}
            {(hasTopUp || hasDomesticAndForeign) && <CurrencyAmount amount={taxBreakdown.foreignTaxAmount} />}
            {hasTopUp && (
              <>
                <span className={styles.topupPenalty}>{' + '}</span>
                <CurrencyAmount amount={taxBreakdown.topUpAmount} className={styles.topupPenalty} />
              </>
            )}
            {(hasTopUp || hasDomesticAndForeign) && <span>{' = '}</span>}
            <CurrencyAmount amount={blend.totalTaxAmount} />
          </div>
          <div className={styles.summaryLabel}>
            {hasDomesticAndForeign
              ? hasTopUp
                ? 'U.S. tax + foreign tax + U.S. top-up*'
                : 'U.S. tax + foreign tax'
              : hasTopUp
                ? 'Foreign tax + U.S. top-up*'
                : 'Tax remitted'}
          </div>
          {hasTopUp && (
            <p className={styles.modelNote}>
              *The residual U.S. top-up is the {percent.format(taxBreakdown.usLiabilityRate)} NCTI liability less the usable deemed-paid credit ({percent.format(DEFAULT_TAX_REGIME.deemedPaidCreditRate)} of foreign tax), floored at zero.
              This is a simplified 2026+ model.
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Explorer;
