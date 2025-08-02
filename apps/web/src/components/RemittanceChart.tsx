import React from 'react';
import { FormFields, Countries } from 'src/types';
import chartStyles from '../css/Chart.module.css';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

const HOME_TAX_RATE = 12.5 / 100;

interface RemittanceChartProps {
  data: FormFields;
}

export const RemittanceChart: React.FC<RemittanceChartProps> = ({ data }) => {
  const [revenue, setRevenue] = React.useState<number>(100000000);
  const [royaltyRate, setRoyaltyRate] = React.useState<number>(90);
  const [operatingRate, setOperatingRate] = React.useState<number>(12.5);
  const [licensorRate, setLicensorRate] = React.useState<number>();

  React.useEffect(() => {
    if (!data) return;
    setRevenue(data.revenue ? parseFloat(data.revenue) : 100000000);
    setRoyaltyRate(data.royalty_rate ? parseFloat(data.royalty_rate) : 90);
    setOperatingRate(data.operating_rate ? parseFloat(data.operating_rate) : 12.5);
    setLicensorRate(data.licensor_rate ? parseFloat(data.licensor_rate) : 0);
  }, [data]);

  const royaltyAmount = revenue * (royaltyRate / 100);
  const operating = revenue - royaltyAmount;
  const operatingTaxPaid = operating * (operatingRate / 100);

  const licensorProfit = royaltyAmount;
  const licensorTaxPaid = licensorProfit * (licensorRate / 100);

  const totalTaxPaid = operatingTaxPaid;
  const effectiveTaxRate = (totalTaxPaid / revenue) * 100;

  const taxesDueAtHome = revenue * HOME_TAX_RATE;
  const effectiveVsHomeTaxRate = (totalTaxPaid / taxesDueAtHome) * 100;

  return (
    <>
      <div className={chartStyles.chartContainer} style={{ width: '120px' }}>
        <div className={chartStyles.chartTotal} style={{ height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', backgroundColor: 'lightgray' }}>
          <motion.div className={chartStyles.effectiveTaxRateBar} animate={{ height: `${effectiveVsHomeTaxRate}%`, minHeight: '8px' }} transition={{ duration: 0.5, ease: 'easeInOut' }} style={{ backgroundColor: 'blue' }} />
        </div>
      </div>
    </>
  );
};
