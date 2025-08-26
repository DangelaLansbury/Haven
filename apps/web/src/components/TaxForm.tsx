import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { CountryDecorator, FormTableRow } from './FormInput';
import QRCode from 'qrcode.react';
import { FormFields, DefaultFormFields } from '../types';
import { motion } from 'framer-motion';

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
  handleBack?: (screen: string) => void;
  handleNext?: (screen: string) => void;
}

const TaxForm: React.FC<TaxFormProps> = ({ formData, setFormData, handleBack, handleNext, sessionId }) => {
  return (
    <div className={commonStyles.pageContainer}>
      <motion.div variants={sideCardVariants} initial="initial" animate="animate" className={formStyles.sideCard}>
        <div className={commonStyles.header}>{'Scan the QR code'}</div>
        <div className={commonStyles.description}>We'll populate your tax details automatically.</div>
        <div style={{ padding: '0.5rem' }}>
          <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} fgColor={'#151515'} bgColor={'#fffefb'} />
        </div>
      </motion.div>

      <motion.div variants={mainCardVariants} initial="initial" animate="animate" className={formStyles.mainCard}>
        <div className={commonStyles.header} style={{ padding: '0 0.75rem 0.75rem 0.75rem' }}>
          {'Form 8890-A'}
        </div>
        <form className={`${formStyles.taxFormContainer} `}>
          <div className={formStyles.formTable}>
            <div className={formStyles.formTableHeader}>
              <div className={formStyles.formTableTh}>
                <span className={formStyles.section} style={{ width: '1rem' }}>
                  {'§1'}
                </span>
                {'EARNINGS & EXPENDITURES'}
              </div>
            </div>
            <div className={formStyles.formTableRows}>
              <FormTableRow key="revenue" formIndex="1" label="Revenue" value={DefaultFormFields.revenue} />
            </div>
          </div>
          <div className={formStyles.formTable}>
            <div className={formStyles.formTableHeader}>
              <div className={formStyles.formTableTh}>
                <span className={formStyles.section} style={{ width: '1rem' }}>
                  {'§2'}
                </span>
                {'ENTITIES'}
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
export default TaxForm;
