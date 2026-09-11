import React from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import chartStyles from '../css/Explorer.module.css';
import { DEFAULT_TAX_REGIME, EFF_GILTI_RATE, GILTI_RATE, OptimizationResult, OptimizationScenario, US_TAX_RATE } from '../types';

interface RemittanceChartProps {
  blends: Record<OptimizationScenario, OptimizationResult>;
  activeScenario: OptimizationScenario;
}

type SegmentKey = 'usedFtc' | 'haircut' | 'topUp' | 'excess' | 'domestic';
type StackDatum = Record<SegmentKey, number>;

const SEGMENTS: Array<{ key: SegmentKey; label: string; className: string }> = [
  { key: 'usedFtc', label: 'FTC used', className: chartStyles.chartFtc },
  { key: 'topUp', label: 'NCTI top-up', className: chartStyles.chartTopup },
  { key: 'haircut', label: '10% FTC haircut', className: chartStyles.chartHaircut },
  { key: 'excess', label: 'Excess foreign tax', className: chartStyles.chartExcess },
  { key: 'domestic', label: 'U.S. corporate tax', className: chartStyles.chartDomestic },
];

const WIDTH = 400;
const HEIGHT = 300;
const MARGIN = { top: 12, right: 108, bottom: 30, left: 24 };
const INACTIVE_OPACITY = 0.15;
const SCENARIOS = [OptimizationScenario.unconstrained, OptimizationScenario.ftcEfficient, OptimizationScenario.usOnly];
const SCENARIO_LABELS: Record<OptimizationScenario, string> = {
  [OptimizationScenario.unconstrained]: 'Lowest tax',
  [OptimizationScenario.ftcEfficient]: 'FTC-efficient',
  [OptimizationScenario.usOnly]: 'U.S. rate',
};

export const RemittanceChart: React.FC<RemittanceChartProps> = ({ blends, activeScenario }) => {
  const activeBlend = blends[activeScenario];
  const activeBreakdown = activeBlend.taxBreakdown;
  const activeIsUsOnly = activeScenario === OptimizationScenario.usOnly;
  const activeTotalBurden = activeIsUsOnly ? US_TAX_RATE : activeBreakdown.totalTaxRate;
  const yMax = Math.max(US_TAX_RATE, ...SCENARIOS.map((scenario) => (scenario === OptimizationScenario.usOnly ? US_TAX_RATE : blends[scenario].taxBreakdown.totalTaxRate))) * 1.08;
  const y = d3
    .scaleLinear()
    .domain([0, yMax])
    .range([HEIGHT - MARGIN.bottom, MARGIN.top]);
  const stack = d3.stack<StackDatum>().keys(SEGMENTS.map(({ key }) => key));
  const ticks = y.ticks(5);
  const plotRight = WIDTH - MARGIN.right;
  const x = d3.scaleBand<OptimizationScenario>().domain(SCENARIOS).range([MARGIN.left, plotRight]).padding(0.18);

  const scenarioStacks = SCENARIOS.map((scenario) => {
    const breakdown = blends[scenario].taxBreakdown;
    const isUsOnly = scenario === OptimizationScenario.usOnly;
    const datum: StackDatum = {
      usedFtc: isUsOnly ? 0 : breakdown.usedFtcRate,
      haircut: isUsOnly ? 0 : breakdown.haircutRate,
      topUp: isUsOnly ? 0 : breakdown.topUpRate,
      excess: isUsOnly ? 0 : breakdown.excessFtcRate,
      domestic: isUsOnly ? US_TAX_RATE : 0,
    };

    return { scenario, layers: stack([datum]) };
  });

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
          <g key={tick}>
            <line className={chartStyles.gridLine} x1={MARGIN.left} x2={plotRight} y1={y(tick)} y2={y(tick)} />
            <text className={chartStyles.axisLabel} x={MARGIN.left - 2} y={y(tick)} textAnchor="end" dominantBaseline="middle">
              {d3.format('.0%')(tick)}
            </text>
          </g>
        ))}

        {scenarioStacks.map(({ scenario, layers }) => {
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
              {layers.map((layer, index) => {
                const segment = SEGMENTS[index];
                const [start, end] = layer[0];
                const segmentHeight = y(start) - y(end);
                const value = end - start;

                return (
                  <g key={segment.key}>
                    <rect className={segment.className} x={0} y={y(end)} width={x.bandwidth()} height={Math.max(0, segmentHeight)}>
                      <title>{`${segment.label}: ${d3.format('.2%')(value)}`}</title>
                    </rect>
                  </g>
                );
              })}
            </motion.g>
          );
        })}

        <line className={chartStyles.giltiRateLine} x1={MARGIN.left} x2={WIDTH - 2} y1={y(GILTI_RATE)} y2={y(GILTI_RATE)} />
        <text className={chartStyles.referenceLabel} x={plotRight + 6} y={y(GILTI_RATE) - 4}>
          NCTI liability {d3.format('.1%')(GILTI_RATE)}
        </text>

        <line className={chartStyles.optimizationLine} x1={MARGIN.left} x2={WIDTH - 2} y1={y(EFF_GILTI_RATE)} y2={y(EFF_GILTI_RATE)} />
        <text className={chartStyles.referenceLabel} x={plotRight + 6} y={y(EFF_GILTI_RATE) - 4}>
          No-top-up FTR {d3.format('.1%')(EFF_GILTI_RATE)}
        </text>

        <line className={chartStyles.usRateLine} x1={MARGIN.left} x2={WIDTH - 2} y1={y(US_TAX_RATE)} y2={y(US_TAX_RATE)} />
        <text className={chartStyles.referenceLabel} x={plotRight + 6} y={y(US_TAX_RATE) - 4}>
          U.S. rate 21%
        </text>

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
            {SCENARIO_LABELS[scenario]}
          </motion.text>
        ))}
      </svg>
      <figcaption className={chartStyles.chartCaption}>
        Total burden {d3.format('.2%')(activeTotalBurden)} · {DEFAULT_TAX_REGIME.label}
      </figcaption>
    </figure>
  );
};
