import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { CountryDecorator, FormTableRow } from './FormInput';
import QRCode from 'qrcode.react';
import { FormFields, Entities } from '../types';

interface TaxFormProps {
  title?: string;
  description?: string;
  sessionId?: string;
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
  handleBack?: (screen: string) => void;
}

const TaxForm: React.FC<TaxFormProps> = ({ title, description, formData, setFormData, handleBack, sessionId }) => {
  return (
    <div className={commonStyles.pageContainer}>
      <div className={commonStyles.sideCard}>
        <div className={commonStyles.headerContainer}>
          <h1 className={commonStyles.header}>{'Take a picture.'}</h1>
        </div>
        <p className={commonStyles.description}>Capture your tax form using your device's camera.</p>
        <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} fgColor={'#4b4447'} bgColor={'#fefcf6'} />
      </div>

      <div className={commonStyles.mainCard}>
        <form className={`${formStyles.taxFormContainer} `}>
          <div className={formStyles.formTable}>
            <div className={formStyles.formTableHeader}>
              <div className={formStyles.formTableTh}>
                <span className={formStyles.section}>{'§1.1'}</span>
                {'Earnings and Expenditures'}
              </div>
            </div>
            <div className={formStyles.formTableRows}>
              <FormTableRow key="revenue" label="Revenue" value={formData.revenue || '$10,000,000'} />
              <FormTableRow key="royalty_rate" label={'Royalties & IP Fees'} value={formData.royalty_rate || '90%'} valueNote="As a percentage of revenue" />
            </div>
          </div>
          <div className={formStyles.formTable}>
            <div className={formStyles.formTableHeader}>
              <div className={formStyles.formTableTh}>
                <span className={formStyles.section}>{'§2.1'}</span>
                {'Business Entities'}
              </div>
              <div className={`${formStyles.formTableTh} ${formStyles.rightAligned}`}>{'Corp. Tax Rate'}</div>
            </div>
            <div className={formStyles.formTableRows}>
              {Object.keys(Entities).map((role) => {
                const entity = Entities[role];
                return (
                  <FormTableRow
                    key={role}
                    label={entity.display_role}
                    value={entity.default_country.tax_rate}
                    decorator={<CountryDecorator country={entity.default_country} text={`${entity.default_name} (${entity.default_country.code})`} />}
                  />
                );
              })}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default TaxForm;

// entity={entity} newRate={formData[`${role}_rate`] || ''} onRateChange={(rate) => setFormData({ ...formData, [`${role}_rate`]: rate })}
