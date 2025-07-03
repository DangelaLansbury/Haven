import React from 'react';
import formStyles from '../css/Form.module.css';
import FormInput from './FormInput';

interface TaxFormProps {
  title?: string;
  description?: string;
  formData: { [key: string]: string };
  setFormData: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}
const TaxForm: React.FC<TaxFormProps> = ({ title, description, formData, setFormData }) => {
  return (
    <>
      <h1 className={formStyles.formHeader}>{title || 'Tax Ghost'}</h1>
      {description && <p className={formStyles.formDescription}>{description}</p>}
      <div className={formStyles.formContainer}>
        <form className={formStyles.taxForm}>
          <FormInput label="Gross Income" value={formData.grossIncome || ''} placeholder={'00,000.00'} onChange={(value) => setFormData({ ...formData, grossIncome: value })} />
          <FormInput label="General Deductions" value={formData.generalDeductions || ''} placeholder={'00,000.00'} onChange={(value) => setFormData({ ...formData, generalDeductions: value })} />
          <FormInput label="Net Income" value={formData.netIncome || ''} placeholder={'00,000.00'} onChange={(value) => setFormData({ ...formData, netIncome: value })} />
        </form>
      </div>
    </>
  );
};
export default TaxForm;
