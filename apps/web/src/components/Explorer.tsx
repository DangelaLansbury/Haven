import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormFields, Entities, DefaultFormFields, HOME_TAX_RATE, Countries, Country } from '../types';
import { RemittanceChart } from './RemittanceChart';
import explorerStyles from '../css/Explorer.module.css';

interface ExplorerProps {
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
}

const Explorer: React.FC<ExplorerProps> = ({ formData, setFormData }: ExplorerProps) => {
  const [revenue, setRevenue] = React.useState<number>(parseFloat(DefaultFormFields.revenue));
  const [royaltyRate, setRoyaltyRate] = React.useState<number>(parseFloat(DefaultFormFields.royalty_rate));
  const [operatingCountry, setOperatingCountry] = React.useState<Country>(Countries.IRELAND);
  // const [operatingRate, setOperatingRate] = React.useState<number>(0);

  React.useEffect(() => {
    setRevenue(formData.revenue && parseFloat(formData.revenue));
    setRoyaltyRate(formData.royalty_rate && parseFloat(formData.royalty_rate));
    setOperatingCountry(formData.operating_country && Countries[formData.operating_country]);
    // setOperatingRate(parseFloat(Countries[operatingCountry].tax_rate));
    // setOperatingRate(formData.operating_rate ? parseFloat(formData.operating_rate) : DefaultFormFields.operating_rate);
    // setLicensorRate(formData.licensor_rate ? parseFloat(formData.licensor_rate) : DefaultFormFields.licensor_rate);
  }, [formData]);

  const royaltyAmount = revenue * (royaltyRate / 100);
  const operatingProfit = revenue - royaltyAmount;
  const operatingTaxPaid = operatingProfit * (parseFloat(operatingCountry.tax_rate) / 100);

  const totalProfit = royaltyAmount + operatingProfit - operatingTaxPaid;

  const totalTaxPaid = operatingTaxPaid;
  const effectiveTaxRate = (totalTaxPaid / revenue) * 100;

  const taxesDueAtHome = revenue * HOME_TAX_RATE;
  const effectiveVsHomeTaxRate = (totalTaxPaid / taxesDueAtHome) * 100;

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
          <input id="revenue" type="range" min={100000000} max={100000000000} value={revenue} onChange={(e): void => handleRevenueChange(e.target.value)} />
        </div>
        <div className={formStyles.formGroup}>
          <label htmlFor="royaltyRate">Royalty Rate</label>
          <input id="royaltyRate" type="range" min={80} max={100} value={royaltyRate} onChange={(e): void => handleRoyaltyRateChange(e.target.value)} />
        </div>
        <div className={explorerStyles.entitiesContainer}>
          {Object.entries(Entities).map(([key, entity]) => (
            <div key={key} className={explorerStyles.entityCard}>
              {/* <div className={explorerStyles.entityStats}>

              </div> */}
              <div>{entity.default_name}</div>
              <div>{entity.description}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={commonStyles.rightSide} style={{ flex: 1, maxWidth: '240px' }}>
        <RemittanceChart revenue={revenue} taxesDueAtHome={taxesDueAtHome} profit={totalProfit} taxesPaid={totalTaxPaid} />
        <h2>Preview</h2>
        <p>Revenue: {formData.revenue}</p>
        <p>Royalties: {formData.royalty_rate}</p>
        <p>Taxes Paid: {totalTaxPaid}</p>
        <p>Taxes Due if Home Tax Rate Applied: {taxesDueAtHome}</p>
        <p>Profit with double irish: {totalProfit}</p>
        <p>Profit without double irish: {totalProfit - taxesDueAtHome}</p>
        <p>Effective Tax Rate: {effectiveTaxRate}</p>
      </div>
    </div>
  );
};

export default Explorer;
