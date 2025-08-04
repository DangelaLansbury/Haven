import React from 'react';
import { FormFields, Countries } from 'src/types';
import chartStyles from '../css/Explorer.module.css';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

interface RemittanceChartProps {
  revenue: number;
  taxesDueAtHome: number;
  profit: number;
  taxesPaid: number;
}

export const RemittanceChart: React.FC<RemittanceChartProps> = ({ revenue, taxesDueAtHome, profit, taxesPaid }) => {
  const maxHeight = 240;
  const minHeight = 160;
  const maxRevenue = 100000000000; // $100 billion

  const revenueHeight = (revenue / maxRevenue) * (maxHeight - minHeight) + minHeight;
  const taxesDueAtHomeHeight = (taxesDueAtHome / revenue) * revenueHeight;
  const taxesPaidHeight = (taxesPaid / revenue) * revenueHeight;
  const homeProfitHeight = ((revenue - taxesDueAtHome) / revenue) * revenueHeight;
  const profitHeight = (profit / revenue) * revenueHeight - homeProfitHeight;

  return (
    <>
      <div className={chartStyles.chartContainer} style={{ width: '140px', height: `${maxHeight + 2}px`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <motion.div className={chartStyles.revenueBar} animate={{ height: `${revenueHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <motion.div
            className={chartStyles.profitBar}
            animate={{ height: `${profitHeight}px` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ backgroundColor: 'green', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          ></motion.div>
          <motion.div className={chartStyles.homeProfitBar} animate={{ height: `${homeProfitHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ backgroundColor: 'blue', width: '100%', marginTop: '2px' }} />
          {/* <motion.div className={chartStyles.homeProfitBar} animate={{ height: `${homeProfitHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ backgroundColor: 'blue', width: '100%', marginTop: '2px' }} /> */}
          <motion.div className={chartStyles.taxesDueAtHomeBar} animate={{ height: `${taxesDueAtHomeHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ backgroundColor: 'orange', width: '100%', marginTop: '2px' }} />
          <motion.div
            className={chartStyles.taxesPaidBar}
            animate={{ height: `${taxesPaidHeight}px` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ backgroundColor: 'red', width: '100%', marginTop: '2px', borderBottom: '4px solid red' }}
          />
        </motion.div>
      </div>
    </>
  );
};

{
  /* <motion.div
          className={chartStyles.revenueBar}
          animate={{ height: `${revenueHeight}px` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ backgroundColor: 'gray', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
        >
          
          
        </motion.div> */
}
