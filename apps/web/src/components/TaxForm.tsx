import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormTableCellInput, FormTableRow } from './FormInput';
import QRCode from 'qrcode.react';
import { FormFields } from '../types';

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
        {/* {handleBack && (
          <div className={formStyles.backButtonContainer}>
            <button className={formStyles.backButton} onClick={(): void => handleBack('initial')}>
              Back
            </button>
          </div>
        )} */}
        <div className={commonStyles.headerContainer}>
          <h1 className={commonStyles.header}>{'Take a picture.'}</h1>
        </div>
        <p className={commonStyles.description}>Capture your tax form using your device's camera.</p>
        <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} fgColor={'#4b4447'} bgColor={'#fefcf6'} />
      </div>
      <div className={commonStyles.mainCard}>
        <h1 className={commonStyles.header}>{title || 'Enter details below'}</h1>
        {description && <p className={commonStyles.description}>{description}</p>}
        <form className={formStyles.taxForm}>
          <div className={formStyles.formTable}>
            <div className={formStyles.formTableHeaderRow}>
              <div className={formStyles.formTableHeader} style={{ flex: 1 }}>
                Entity
              </div>
              <div className={formStyles.formTableHeader} style={{ flex: 2 }}>
                Residence
              </div>
              <div className={`${formStyles.formTableHeader} ${formStyles.rate}`}>Tax Rate</div>
            </div>
            <FormTableRow entity="Parent" roleDescription="Owns everything" country={'USA'} rate={formData.parent_rate || '21.07%'} role="parent" onRateChange={(value) => setFormData({ ...formData, parent_rate: value })} />
            <FormTableRow
              entity="Operating Co."
              roleDescription="Books sales"
              country={'Ireland'}
              countryNote="Relatively low corporate tax"
              rate={formData.operating_rate || '12.57%'}
              role="operating"
              onRateChange={(value) => setFormData({ ...formData, operating_rate: value })}
            />
            <FormTableRow
              entity="Sublicensor"
              roleDescription="Passthrough for royalties"
              country={'Netherlands'}
              countryNote="Allows tax-free flow of royalties out of country"
              rate={formData.sublicensor_rate || '0.07%'}
              role="sublicensor"
              onRateChange={(value) => setFormData({ ...formData, sublicensor_rate: value })}
            />
            <FormTableRow
              entity="Licensor"
              roleDescription="Holds IP"
              country={'Bermuda'}
              countryNote={`"Manage" business from here with no corporate tax`}
              rate={formData.licensor_rate || '0.07%'}
              role="licensor"
              onRateChange={(value) => setFormData({ ...formData, licensor_rate: value })}
            />
          </div>
          {/* <FormTableCellInput label="Parent Company" value={formData.parent_rate || ''} placeholder={'21.0%'} onChange={(value) => setFormData({ ...formData, parent_rate: value })} readonly />
          <FormTableCellInput label="Operating Company" value={formData.operating_rate || ''} placeholder={'12.5%'} onChange={(value) => setFormData({ ...formData, operating_rate: value })} readonly />
          <FormTableCellInput label="Sublicensor" value={formData.sublicensor_rate || ''} placeholder={'0.0%'} onChange={(value) => setFormData({ ...formData, sublicensor_rate: value })} readonly />
          <FormTableCellInput label="Licensor" value={formData.licensor_rate || ''} placeholder={'0.0%'} onChange={(value) => setFormData({ ...formData, licensor_rate: value })} readonly /> */}
        </form>
      </div>
    </div>
  );
};
export default TaxForm;
