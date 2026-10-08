import React from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import chartStyles from '../css/Explorer.module.css';
import { DEFAULT_TAX_REGIME, type OptimizationResult, OptimizationScenario } from '../types';
import { SCENARIOS, SCENARIO_LABELS } from '../scenarios';

interface RemittanceChartProps {
  blends: Record<OptimizationScenario, OptimizationResult>;
  activeScenario: OptimizationScenario;
}

type SegmentKey = 'usedFtc' | 'haircut' | 'topUp' | 'excess' | 'domestic';
type StackDatum = Record<SegmentKey, number>;

const SEGMENTS: Array<{ key: SegmentKey; label: string; className: string }> = [
  { key: 'domestic', label: 'U.S. tax on U.S. profit', className: chartStyles.chartDomestic },
  { key: 'usedFtc', label: 'FTC used', className: chartStyles.chartFtc },
  { key: 'topUp', label: 'NCTI top-up', className: chartStyles.chartTopup },
  { key: 'haircut', label: '10% FTC haircut', className: chartStyles.chartHaircut },
  { key: 'excess', label: 'Excess foreign tax', className: chartStyles.chartExcess },
];

const WIDTH = 340;
const HEIGHT = 200;
const MARGIN = { top: 12, right: 8, bottom: 30, left: 24 };
const INACTIVE_OPACITY = 0.15;
const PLOT_RIGHT = WIDTH - MARGIN.right;
const x = d3.scaleBand<OptimizationScenario>().domain(SCENARIOS).range([MARGIN.left, PLOT_RIGHT]).padding(0.18);
const formatAxisRate = d3.format('.0%');
const formatTaxRate = d3.format('.2%');

export const RemittanceChart: React.FC<RemittanceChartProps> = ({ blends, activeScenario }) => {
  const activeBlend = blends[activeScenario];
  const activeBreakdown = activeBlend.taxBreakdown;
  const activeIsUsOnly = activeScenario === OptimizationScenario.usOnly;
  const activeTotalBurden = activeBlend.effectiveTaxRate;
  const { ticks, scenarioStacks } = React.useMemo(() => {
    const yMax = Math.max(...SCENARIOS.map((scenario) => blends[scenario].effectiveTaxRate)) * 1.08;
    const y = d3
      .scaleLinear()
      .domain([0, yMax || 1])
      .range([HEIGHT - MARGIN.bottom, MARGIN.top]);
    const stack = d3.stack<StackDatum>().keys(SEGMENTS.map(({ key }) => key));
    const scenarioStacks = SCENARIOS.map((scenario) => {
      const { taxBreakdown: breakdown, domesticShare, domesticTaxAmount, profit } = blends[scenario];
      // Breakdown rates apply to foreign profit; scale them to shares of total profit.
      const foreignShare = 1 - domesticShare;
      const datum: StackDatum = {
        domestic: domesticTaxAmount / profit,
        usedFtc: breakdown.usedFtcRate * foreignShare,
        haircut: breakdown.haircutRate * foreignShare,
        topUp: breakdown.topUpRate * foreignShare,
        excess: breakdown.excessFtcRate * foreignShare,
      };

      const segments = stack([datum]).map((layer, index) => {
        const segment = SEGMENTS[index];
        const [start, end] = layer[0];
        return {
          ...segment,
          y: y(end),
          height: Math.max(0, y(start) - y(end)),
          title: `${segment.label}: ${formatTaxRate(end - start)}`,
        };
      });
      return { scenario, segments };
    });

    return {
      scenarioStacks,
      ticks: y.ticks(5).map((value) => ({ value, y: y(value), label: formatAxisRate(value) })),
    };
  }, [blends]);

  return (
    <figure className={chartStyles.remittanceFigure}>
      <svg
        className={chartStyles.remittanceChart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={
          activeIsUsOnly
            ? `U.S.-only corporate tax burden ${(activeTotalBurden * 100).toFixed(2)} percent.`
            : `2026 NCTI tax stack. Foreign tax rate ${(activeBreakdown.foreignTaxRate * 100).toFixed(2)} percent; total tax burden ${(activeTotalBurden * 100).toFixed(2)} percent.`
        }
      >
        {ticks.map((tick) => (
          <g key={tick.value}>
            <line className={chartStyles.gridLine} x1={MARGIN.left} x2={PLOT_RIGHT} y1={tick.y} y2={tick.y} />
            <text className={chartStyles.axisLabel} x={MARGIN.left - 2} y={tick.y} textAnchor="end" dominantBaseline="middle">
              {tick.label}
            </text>
          </g>
        ))}

        {scenarioStacks.map(({ scenario, segments }) => {
          const isActive = scenario === activeScenario;

          return (
            <motion.g
              key={scenario}
              transform={`translate(${x(scenario) ?? MARGIN.left}, 0)`}
              initial={false}
              animate={{ opacity: isActive ? 1 : INACTIVE_OPACITY }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
            >
              {segments.map((segment) => (
                <rect key={segment.key} className={segment.className} x={0} y={segment.y} width={x.bandwidth()} height={segment.height}>
                  <title>{segment.title}</title>
                </rect>
              ))}
            </motion.g>
          );
        })}

        {SCENARIOS.map((scenario) => (
          <motion.text
            key={`${scenario}-label`}
            className={chartStyles.scenarioLabel}
            x={(x(scenario) ?? MARGIN.left) + x.bandwidth() / 2}
            y={HEIGHT - 10}
            textAnchor="middle"
            initial={false}
            animate={{ opacity: scenario === activeScenario ? 1 : 0.45 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {SCENARIO_LABELS[scenario].chartLabel}
          </motion.text>
        ))}
      </svg>
      <figcaption className={chartStyles.chartCaption}>
        Total burden {formatTaxRate(activeTotalBurden)} · {DEFAULT_TAX_REGIME.label}
      </figcaption>
    </figure>
  );
};
