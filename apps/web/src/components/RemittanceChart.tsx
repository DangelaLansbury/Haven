import React from 'react';
import chartStyles from '../css/Explorer.module.css';
import { motion } from 'framer-motion';

interface RemittanceChartProps {
  revenue: number;
  taxesDueAtHome: number;
  profit: number;
  taxesPaid: number;
}

export const RemittanceChart: React.FC<RemittanceChartProps> = ({ revenue, taxesDueAtHome, profit, taxesPaid }) => {
  const maxHeight = 200;
  const minHeight = 120;
  const maxRevenue = 100000000000;

  const revenueHeight = (revenue / maxRevenue) * (maxHeight - minHeight) + minHeight;
  const taxesPaidHeight = (taxesPaid / revenue) * revenueHeight;
  const taxesDueAtHomeHeight = (taxesDueAtHome / revenue) * revenueHeight - taxesPaidHeight;
  // const homeProfitHeight = ((revenue - taxesDueAtHome) / revenue) * revenueHeight;
  const profitHeight = (profit / revenue) * revenueHeight - taxesDueAtHomeHeight;

  return (
    <>
      <div className={chartStyles.barChart} style={{ width: '100px', height: `${maxHeight}px`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <motion.div className={chartStyles.revenueBar} animate={{ height: `${revenueHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <motion.div
            className={chartStyles.profitBar}
            animate={{ height: `${profitHeight}px` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ backgroundColor: '#39796B', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          >
            {/* <motion.div className={chartStyles.barLabel} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }} style={{ backgroundColor: '#639452', color: 'white', padding: '2px 4px', fontSize: '0.75rem' }}>
              Profit ${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </motion.div> */}
          </motion.div>
          {/* <motion.div className={chartStyles.homeProfitBar} animate={{ height: `${homeProfitHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ backgroundColor: '#74A762', width: '100%', marginTop: '2px' }} /> */}
          <motion.div className={chartStyles.taxesDueAtHomeBar} animate={{ height: `${taxesDueAtHomeHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ backgroundColor: '#74A197', width: '100%', marginTop: '2px' }} />
          <motion.div
            className={chartStyles.taxesPaidBar}
            animate={{ height: `${taxesPaidHeight}px` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ backgroundColor: '#7C75C4', width: '100%', marginTop: '2px', borderBottom: '2px solid #7C75C4' }}
          />
        </motion.div>
      </div>
    </>
  );
};
