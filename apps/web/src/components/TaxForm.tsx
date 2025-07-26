import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import FormInput from './FormInput';
import QRCode from 'qrcode.react';

interface TaxFormProps {
  title?: string;
  description?: string;
  sessionId?: string;
  formData: { [key: string]: string };
  setFormData: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
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
          <FormInput label="Gross Income" value={formData.grossIncome || ''} placeholder={'00,000.00'} onChange={(value) => setFormData({ ...formData, grossIncome: value })} />
          <FormInput label="General Deductions" value={formData.generalDeductions || ''} placeholder={'00,000.00'} onChange={(value) => setFormData({ ...formData, generalDeductions: value })} />
          <FormInput label="Net Income" value={formData.netIncome || ''} placeholder={'00,000.00'} onChange={(value) => setFormData({ ...formData, netIncome: value })} />
        </form>
      </div>
    </div>
  );
};
export default TaxForm;
