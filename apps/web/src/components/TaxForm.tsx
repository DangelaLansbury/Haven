import React from 'react';
import formStyles from '../css/Form.module.css';
import FormInput from './FormInput';

interface TaxFormProps {
  formData: { [key: string]: string };
  setFormData: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}
const TaxForm: React.FC<TaxFormProps> = ({ formData, setFormData }) => {
  return (
    <div className={formStyles.formContainer}>
      <form className={formStyles.taxForm}>
        <FormInput label="Gross Income" value={formData.grossIncome || ''} placeholder={'$00,000.00'} onChange={(value) => setFormData({ ...formData, grossIncome: value })} />
        <FormInput label="General Deductions" value={formData.generalDeductions || ''} placeholder={'$00,000.00'} onChange={(value) => setFormData({ ...formData, generalDeductions: value })} />
        <FormInput label="Net Income" value={formData.netIncome || ''} placeholder={'$00,000.00'} onChange={(value) => setFormData({ ...formData, netIncome: value })} />
      </form>
    </div>
  );
};
export default TaxForm;
