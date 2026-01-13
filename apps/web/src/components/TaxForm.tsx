import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormTableRow } from './FormInput';
import QRCode from 'qrcode.react';
import { FormFields, DefaultFormFields } from '../types';
import { motion } from 'framer-motion';
import { matchToCountryEnum } from '../utils';

// duration: 0.3, ease: [0.48, 0, 0.62, 1]

const mainCardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.3, ease: [0.48, 0, 0.62, 1] },
      y: { duration: 1, ease: [0.25, 1, 0.5, 1] },
    },
  },
};

const sideCardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.3, ease: [0.48, 0, 0.62, 1] },
      y: { duration: 0.4, ease: [0.48, 0, 0.62, 1] },
    },
  },
};

interface TaxFormProps {
  title?: string;
  sessionId?: string;
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
  setScreen?: (screen: string) => void;
}

const TaxForm: React.FC<TaxFormProps> = ({ formData, setFormData, setScreen, sessionId }) => {
  return (
    <div className={commonStyles.pageContainer}>
      <motion.div variants={sideCardVariants} initial="initial" animate="animate" className={formStyles.sideCard}>
        <div className={commonStyles.header}>{'Scan the QR code'}</div>
        <div className={commonStyles.description}>We'll populate your tax details automatically.</div>
        <div style={{ padding: '2rem 0.25rem' }}>
          <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} fgColor={'#151515'} bgColor={'#fffefb'} size={144} />
        </div>
        <div>
          <button className={commonStyles.secondaryButton} style={{ width: '100%' }} onClick={() => setScreen && setScreen('explorer')}>
            Skip to results
          </button>
        </div>
      </motion.div>

      <motion.div variants={mainCardVariants} initial="initial" animate="animate" className={formStyles.mainCard}>
        <div className={commonStyles.header} style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
          {'Form 1313-G'}
        </div>
        <form className={`${formStyles.taxFormContainer} `}>
          <div className={formStyles.formTable}>
            <div className={formStyles.formTableHeader}>
              <div className={formStyles.formTableTh}>
                <span className={formStyles.section} style={{ width: '1rem', textAlign: 'center' }}>
                  {'§1'}
                </span>
                {'INCOME'}
              </div>
            </div>
            <div className={formStyles.formTableRows}>
              <FormTableRow key="income" formIndex="$" label="Income" value={DefaultFormFields.revenue} />
            </div>
          </div>
          <div className={formStyles.formTable}>
            <div className={formStyles.formTableHeader}>
              <div className={formStyles.formTableTh}>
                <span className={formStyles.section} style={{ width: '1rem' }}>
                  {'§2'}
                </span>
                {'COUNTRIES OF OPERATION'}
              </div>
            </div>
            <div className={formStyles.formTableRows}>
              {DefaultFormFields.countries.map((country, index) => (
                <FormTableRow key={`${matchToCountryEnum(country)}`} formIndex={`${index + 1}`} value={`${matchToCountryEnum(country)}`} />
              ))}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
export default TaxForm;
