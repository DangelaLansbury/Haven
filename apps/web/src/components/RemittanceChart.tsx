import React from 'react';
import chartStyles from '../css/Explorer.module.css';
import { motion } from 'framer-motion';
import { MAX_REVENUE } from '../types';

interface RemittanceChartProps {
  revenue: number;
  taxesDueAtHome: number;
  profit: number;
  taxesPaid: number;
}

export const RemittanceChart: React.FC<RemittanceChartProps> = ({ revenue, taxesDueAtHome, profit, taxesPaid }) => {
  const MAX_HEIGHT = 200;
  const MIN_HEIGHT = 50;

  const revenueHeight = (revenue / MAX_REVENUE) * (MAX_HEIGHT - MIN_HEIGHT) + MIN_HEIGHT;
  const taxesPaidHeight = (taxesPaid / revenue) * revenueHeight;
  const extraKeptHeight = (taxesDueAtHome / revenue) * revenueHeight - taxesPaidHeight;
  const profitHeight = (profit / revenue) * revenueHeight - extraKeptHeight;

  return (
    <>
      <div className={chartStyles.barChart} style={{ width: '100px', height: `${MAX_HEIGHT}px`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <motion.div className={chartStyles.revenueBar} animate={{ height: `${revenueHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <motion.div className={chartStyles.profitBar} animate={{ height: `${profitHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }}></motion.div>
          <motion.div className={chartStyles.taxesDueAtHomeBar} animate={{ height: `${extraKeptHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} />
          <motion.div className={chartStyles.taxesPaidBar} animate={{ height: `${taxesPaidHeight}px` }} transition={{ duration: 0.5, ease: 'easeInOut' }} />
        </motion.div>
      </div>
    </>
  );
};
