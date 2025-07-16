import React from 'react';
import formStyles from '../css/Form.module.css';
import FormInput from './FormInput';

const DemoForm: React.FC = () => {
  const noop = () => {};
  return (
    <>
      <h1 className={formStyles.formHeader}>{'Demo Form'}</h1>
      <p className={formStyles.formDescription}>{`Take a picture of this example form to populate your Tax Ghost wizard.`}</p>
      <div className={formStyles.formContainer}>
        <form className={formStyles.taxForm}>
          <FormInput label="Gross Income" value={'$50,000'} readonly onChange={noop} />
          <FormInput label="General Deductions" value={'$10,000'} readonly onChange={noop} />
          <FormInput label="Net Income" value={'$40,000'} onChange={noop} readonly />
        </form>
      </div>
    </>
  );
};

export default DemoForm;
