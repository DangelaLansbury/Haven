import React, { useEffect, useState } from 'react';
import styles from '../css/Form.module.css';
import FormInput from './FormInput';

interface TaxFormProps {
  formData: { [key: string]: string };
  setFormData: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}
const TaxForm: React.FC<TaxFormProps> = ({ formData, setFormData }) => {
  return (
    <div className={styles.formContainer}>
      <form className={styles.taxForm}>
        <FormInput label="Gross Income" value={formData.grossIncome || ''} onChange={(value) => setFormData({ ...formData, grossIncome: value })} />
        <FormInput label="General Deductions" value={formData.generalDeductions || ''} onChange={(value) => setFormData({ ...formData, generalDeductions: value })} />
        <FormInput label="Net Income" value={formData.netIncome || ''} onChange={(value) => setFormData({ ...formData, netIncome: value })} />
      </form>
    </div>
  );
};
export default TaxForm;
