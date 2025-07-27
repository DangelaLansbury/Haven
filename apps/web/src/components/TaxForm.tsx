import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import FormInput from './FormInput';
import QRCode from 'qrcode.react';
import { FormFields } from '../../types';

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
      <div className={commonStyles.sideContainer}>
        {handleBack && (
          <div className={formStyles.backButtonContainer}>
            <button className={formStyles.backButton} onClick={(): void => handleBack('initial')}>
              Back
            </button>
          </div>
        )}
        <h1 className={commonStyles.header}>{title || 'Haven'}</h1>
        <p className={commonStyles.description}>Capture your tax form using your device's camera.</p>
        <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} fgColor={'#4b4447'} bgColor={'#fefcf6'} />
      </div>
      <div className={commonStyles.mainContainer}>
        <h1 className={commonStyles.header}>{'Enter details below'}</h1>
        {description && <p className={commonStyles.description}>{description}</p>}
        <form className={formStyles.taxForm}>
          <FormInput label="Parent Company" value={formData.parent_rate || ''} placeholder={'21.0%'} onChange={(value) => setFormData({ ...formData, parent_rate: value })} />
          <FormInput label="Operating Company" value={formData.operating_rate || ''} placeholder={'12.5%'} onChange={(value) => setFormData({ ...formData, operating_rate: value })} />
          <FormInput label="Sublicensor" value={formData.sublicensor_rate || ''} placeholder={'0.0%'} onChange={(value) => setFormData({ ...formData, sublicensor_rate: value })} />
          <FormInput label="Licensor" value={formData.licensor_rate || ''} placeholder={'0.0%'} onChange={(value) => setFormData({ ...formData, licensor_rate: value })} />
        </form>
      </div>
    </div>
  );
};
export default TaxForm;
