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
  // Default values for formData until the user fills them in
  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      parent_rate: prev.parent_rate || '21.07%',
      operating_rate: prev.operating_rate || '12.57%',
      sublicensor_rate: prev.sublicensor_rate || '0.07%',
      licensor_rate: prev.licensor_rate || '0.07%',
    }));
  }, [setFormData]);

  return (
    <div className={commonStyles.pageContainer}>
      <div className={commonStyles.mainCard}>
        <h1 className={commonStyles.header}>{title || 'Enter details below'}</h1>
        {description && <p className={commonStyles.description}>{description}</p>}
        <form className={formStyles.taxForm}>
          <FormInput label="Parent Company" value={formData.parent_rate || ''} placeholder={'21.0%'} onChange={(value) => setFormData({ ...formData, parent_rate: value })} readonly />
          <FormInput label="Operating Company" value={formData.operating_rate || ''} placeholder={'12.5%'} onChange={(value) => setFormData({ ...formData, operating_rate: value })} readonly />
          <FormInput label="Sublicensor" value={formData.sublicensor_rate || ''} placeholder={'0.0%'} onChange={(value) => setFormData({ ...formData, sublicensor_rate: value })} readonly />
          <FormInput label="Licensor" value={formData.licensor_rate || ''} placeholder={'0.0%'} onChange={(value) => setFormData({ ...formData, licensor_rate: value })} readonly />
        </form>
      </div>
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
    </div>
  );
};
export default TaxForm;
