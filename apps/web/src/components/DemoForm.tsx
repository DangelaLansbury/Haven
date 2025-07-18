import React from 'react';
import demoStyles from '../css/Form.module.css';
import FormInput from './FormInput';

const DemoForm: React.FC = () => {
  const noop = () => {};
  return (
    <>
      <h1 className={demoStyles.formHeader}>{'Demo Form'}</h1>
      <p className={demoStyles.formDescription}>{`Use the QR code in your browser to take a picture of this form with your mobile device.`}</p>
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
