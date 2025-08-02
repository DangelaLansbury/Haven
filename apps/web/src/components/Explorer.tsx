import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormFields } from '../types';
import { RemittanceChart } from './RemittanceChart';

interface ExplorerProps {
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
}

const Explorer: React.FC<ExplorerProps> = ({ formData, setFormData }: ExplorerProps) => {
  function handleRevenueChange(value: string) {
    setFormData((prev: FormFields) => ({
      ...prev,
      revenue: value,
    }));
  }

  function handleRoyaltyRateChange(value: string) {
    setFormData((prev: FormFields) => ({
      ...prev,
      royalty_rate: value,
    }));
  }

  return (
    <div className={commonStyles.pageContainer}>
      <div className={commonStyles.leftSide} style={{ flex: 2, maxWidth: '560px' }}>
        <div className={formStyles.formGroup}>
          <label htmlFor="revenue">Revenue</label>
          <input id="revenue" type="range" value={parseFloat(formData.revenue).toFixed(2)} onChange={(e): void => handleRevenueChange(e.target.value)} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="royaltyRate">Royalty Rate</label>
          <input id="royaltyRate" type="range" value={parseFloat(formData.royalty_rate).toFixed(2)} onChange={(e): void => handleRoyaltyRateChange(e.target.value)} />
        </div>
      </div>
      <div className={commonStyles.rightSide} style={{ flex: 1, maxWidth: '320px' }}>
        <RemittanceChart data={formData} />
        <h2>Preview</h2>
        <p>Revenue: {formData.revenue}</p>
        <p>Royalty Rate: {formData.royalty_rate}</p>
      </div>
    </div>
  );
};

export default Explorer;
