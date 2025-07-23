import React from 'react';
import demoStyles from '../css/DemoForm.module.css';
import formStyles from '../css/Form.module.css';

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
  return (
    <>
      <h1 className={formStyles.formHeader}>{'Demo Form'}</h1>
      <p className={demoStyles.formDescription}>{`Use your device's camera to auto-fill the Tax Ghost form.`}</p>
      <div className={demoStyles.formContainer}>
        <form className={demoStyles.demoForm}>
          <DemoFormRow label="Gross Income" value={'$50,000'} />
          <DemoFormRow label="General Deductions" value={'$10,000'} />
          <DemoFormRow label="Net Income" value={'$40,000'} />
        </form>
      </div>
    </>
  );
};

export default DemoForm;
