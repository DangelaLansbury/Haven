import React from 'react';
import chartStyles from '../css/Explorer.module.css';
import { motion } from 'framer-motion';
import { MAX_REVENUE, GILTI_RATE, EFF_GILTI_RATE } from '../types';

interface RemittanceChartProps {
  ftr: number;
}

export const RemittanceChart: React.FC<RemittanceChartProps> = ({ ftr = EFF_GILTI_RATE }) => {
  const TOTAL_HEIGHT = 1440;
  const PARENT_HEIGHT = 0.15 * TOTAL_HEIGHT;
  const EFF_GILTI_HEIGHT = EFF_GILTI_RATE * TOTAL_HEIGHT;

  const ftrHeight = ftr * TOTAL_HEIGHT;
  const ftcHeight = 0.8 * ftrHeight;
  const topoffHeight = Math.max((EFF_GILTI_HEIGHT - ftrHeight) * TOTAL_HEIGHT);
  const ineffHeight = Math.max((ftr - 0.15) * TOTAL_HEIGHT, 0);

  return (
    <>
      <div className={chartStyles.barChart} style={{ width: '100%', height: `${PARENT_HEIGHT}px`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
        {ineffHeight !== 0 && (
          <motion.div className={chartStyles.barSection} animate={{ height: `${ineffHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <div className={chartStyles.ineff}></div>
            <div className={chartStyles.barLabel}></div>
          </motion.div>
        )}
        <motion.div className={chartStyles.effGILTI} animate={{ height: `${EFF_GILTI_HEIGHT}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {ftr < EFF_GILTI_RATE && (
            <motion.div className={chartStyles.barSection} animate={{ height: `${topoffHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ marginBottom: 'auto' }}>
              <div className={chartStyles.topoff}></div>
              <div className={chartStyles.barLabel}>GILTI Top-off</div>
            </motion.div>
          )}
          <motion.div className={chartStyles.barSection} animate={{ height: `${ftrHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <div className={chartStyles.ftr} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <motion.div className={chartStyles.ftc} animate={{ height: `${ftcHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} />
            </div>
            <div className={chartStyles.barLabel}>Blended Foreign Tax Rate</div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};
