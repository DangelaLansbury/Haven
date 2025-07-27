import React from 'react';
import demoStyles from '../css/DemoForm.module.css';
import commonStyles from '../css/Common.module.css';

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
      <h1 className={commonStyles.header}>{'Demo Form'}</h1>
      <p className={commonStyles.description}>{`Use your device's camera to auto-fill the Haven form.`}</p>
      <div className={demoStyles.formContainer}>
        <form className={demoStyles.demoForm}>
          <DemoFormRow label="Parent Company" value={'21.0%'} />
          <DemoFormRow label="Operating Company" value={'12.5%'} />
          <DemoFormRow label="Sublicensor" value={'0.0%'} />
          <DemoFormRow label="Licensor" value={'0.0%'} />
        </form>
      </div>
    </>
  );
};

export default DemoForm;
