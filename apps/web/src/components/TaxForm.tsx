import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormTableRow } from './FormInput';
import QRCode from 'qrcode.react';
import { FormFields, EntityRoles } from '../types';

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
                Location
              </div>
              <div className={`${formStyles.formTableHeader} ${formStyles.rate}`}>Tax Rate</div>
            </div>
            {Object.keys(EntityRoles).map((role) => {
              const entity = EntityRoles[role];
              return <FormTableRow key={role} entity={entity} onRateChange={(rate) => setFormData({ ...formData, [`${role}_rate`]: rate })} />;
            })}
            {/* <FormTableRow entity="Parent" entity_name="Owns everything" country={'USA'} rate={formData.parent_rate || '21.07%'} role="parent" onRateChange={(value) => setFormData({ ...formData, parent_rate: value })} />
            <FormTableRow
              entity="Operating Co."
              entity_name="Pirate Holdings Limited"
              country={'Ireland'}
              note_keyword="Relatively low corporate tax"
              rate={formData.operating_rate || '12.57%'}
              role="operating"
              onRateChange={(value) => setFormData({ ...formData, operating_rate: value })}
            />
            <FormTableRow
              entity="Sublicensor"
              entity_name="Pirate Holdings BV"
              country={'Netherlands'}
              note_keyword="Allows tax-free flow of royalties out of country"
              rate={formData.sublicensor_rate || '0.07%'}
              role="sublicensor"
              onRateChange={(value) => setFormData({ ...formData, sublicensor_rate: value })}
            />
            <FormTableRow
              entity="Licensor"
              entity_name="Pirate Holdings Ireland"
              country={'Bermuda'}
              note_keyword={`"Manage" business from here with no corporate tax`}
              rate={formData.licensor_rate || '0.07%'}
              role="licensor"
              onRateChange={(value) => setFormData({ ...formData, licensor_rate: value })}
            /> */}
          </div>
        </form>
      </div>
    </div>
  );
};
export default TaxForm;
