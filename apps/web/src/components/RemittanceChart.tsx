import React from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import chartStyles from '../css/Explorer.module.css';
import { EFF_GILTI_RATE, GILTI_RATE, US_TAX_RATE } from '../types';

interface RemittanceChartProps {
  /** Blended foreign tax rate (not the post-GILTI total tax rate). */
  etr: number;
}

type SegmentKey = 'usedFtc' | 'haircut' | 'topUp' | 'excess';
type StackDatum = Record<SegmentKey, number>;

const SEGMENTS: Array<{ key: SegmentKey; label: string; className: string }> = [
  { key: 'usedFtc', label: 'FTC used', className: chartStyles.chartFtc },
  { key: 'topUp', label: 'GILTI top-up', className: chartStyles.chartTopup },
  { key: 'haircut', label: '20% FTC haircut', className: chartStyles.chartHaircut },
  { key: 'excess', label: 'Excess foreign tax', className: chartStyles.chartExcess },
];

const WIDTH = 240;
const HEIGHT = 300;
const MARGIN = { top: 12, right: 108, bottom: 30, left: 24 };
const BAR_WIDTH = 70;

export const RemittanceChart: React.FC<RemittanceChartProps> = ({ etr = EFF_GILTI_RATE }) => {
  const foreignTaxRate = Math.max(0, Number.isFinite(etr) ? etr : 0);
  const potentialFtc = foreignTaxRate * 0.8;

  // GILTI permits an 80% foreign-tax credit against the 10.5% GILTI liability.
  // 10.5% / 80% = the 13.125% foreign-tax-rate optimization point.
  const datum: StackDatum = {
    usedFtc: Math.min(potentialFtc, GILTI_RATE),
    haircut: foreignTaxRate * 0.2,
    topUp: Math.max(GILTI_RATE - potentialFtc, 0),
    excess: Math.max(potentialFtc - GILTI_RATE, 0),
  };

  const totalBurden = foreignTaxRate + datum.topUp;
  const yMax = Math.max(US_TAX_RATE, totalBurden) * 1.08;
  const y = d3.scaleLinear().domain([0, yMax]).range([HEIGHT - MARGIN.bottom, MARGIN.top]);
  const stack = d3.stack<StackDatum>().keys(SEGMENTS.map(({ key }) => key));
  const layers = stack([datum]);
  const ticks = y.ticks(5);
  const plotRight = MARGIN.left + BAR_WIDTH;

  return (
    <figure className={chartStyles.remittanceFigure}>
      <svg
        className={chartStyles.remittanceChart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`GILTI tax stack. Foreign tax rate ${(foreignTaxRate * 100).toFixed(2)} percent; total tax burden ${(totalBurden * 100).toFixed(2)} percent.`}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line className={chartStyles.gridLine} x1={MARGIN.left} x2={plotRight} y1={y(tick)} y2={y(tick)} />
            <text className={chartStyles.axisLabel} x={MARGIN.left - 2} y={y(tick)} textAnchor="end" dominantBaseline="middle">
              {d3.format('.0%')(tick)}
            </text>
          </g>
        ))}

        <line className={chartStyles.giltiRateLine} x1={MARGIN.left} x2={WIDTH - 2} y1={y(GILTI_RATE)} y2={y(GILTI_RATE)} />
        <text className={chartStyles.referenceLabel} x={plotRight + 6} y={y(GILTI_RATE) - 4}>
          GILTI liability 10.5%
        </text>

        <line className={chartStyles.optimizationLine} x1={MARGIN.left} x2={WIDTH - 2} y1={y(EFF_GILTI_RATE)} y2={y(EFF_GILTI_RATE)} />
        <text className={chartStyles.referenceLabel} x={plotRight + 6} y={y(EFF_GILTI_RATE) - 4}>
          No-top-up FTR 13.125%
        </text>

        <line className={chartStyles.usRateLine} x1={MARGIN.left} x2={WIDTH - 2} y1={y(US_TAX_RATE)} y2={y(US_TAX_RATE)} />
        <text className={chartStyles.referenceLabel} x={plotRight + 6} y={y(US_TAX_RATE) - 4}>
          U.S. rate 21%
        </text>

        {layers.map((layer, index) => {
          const segment = SEGMENTS[index];
          const [start, end] = layer[0];
          const segmentHeight = y(start) - y(end);
          const value = end - start;

          return (
            <g key={segment.key}>
              <motion.rect
                className={segment.className}
                x={MARGIN.left}
                width={BAR_WIDTH}
                initial={false}
                animate={{ y: y(end), height: Math.max(0, segmentHeight) }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <title>
                  {segment.label}: {d3.format('.2%')(value)}
                </title>
              </motion.rect>
              {segmentHeight >= 18 && (
                <motion.text
                  className={chartStyles.segmentLabel}
                  x={MARGIN.left + BAR_WIDTH / 2}
                  textAnchor="middle"
                  initial={false}
                  animate={{ y: y(end) + segmentHeight / 2 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  dominantBaseline="middle"
                >
                  {segment.label} {d3.format('.2%')(value)}
                </motion.text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className={chartStyles.chartCaption}>
        Total burden {d3.format('.2%')(totalBurden)}
      </figcaption>
    </figure>
  );
};
