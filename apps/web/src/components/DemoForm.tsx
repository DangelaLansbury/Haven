import React from 'react';
import demoStyles from '../css/DemoForm.module.css';
import formStyles from '../css/Form.module.css';
import FormInput from './FormInput';

interface DemoFormRowProps {
  label: string;
  value: string;
}

const DemoFormRow: React.FC<DemoFormRowProps> = ({ label, value }) => {
  return (
    <div className={demoStyles.demoFormRow}>
      <div className={demoStyles.demoFormLabel}>{label}</div>
      <div className={demoStyles.demoFormValue}>{value}</div>
    </div>
  );
};

const DemoForm: React.FC = () => {
  const noop = () => {};
  return (
    <>
      <h1 className={formStyles.formHeader}>{'Demo Form'}</h1>
      <p className={demoStyles.formDescription}>{`Use your device to take a picture and populate the Tax Ghost form.`}</p>
      <div className={demoStyles.formContainer}>
        <form className={demoStyles.demoForm}>
          <FormInput label="Gross Income" value={'$50,000'} readonly onChange={noop} />
          <FormInput label="General Deductions" value={'$10,000'} readonly onChange={noop} />
          <FormInput label="Net Income" value={'$40,000'} readonly onChange={noop} />
        </form>
      </div>
    </>
  );
};

export default DemoForm;
