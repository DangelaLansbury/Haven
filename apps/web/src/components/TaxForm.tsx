import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { CountryDecorator, FormTableRow } from './FormInput';
import QRCode from 'qrcode.react';
import { FormFields, Entities, DefaultFormFields } from '../types';
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
}

const TaxForm: React.FC<TaxFormProps> = ({ formData, setFormData, handleBack, sessionId }) => {
  return (
    <div className={commonStyles.pageContainer}>
      <motion.div variants={sideCardVariants} initial="initial" animate="animate" className={formStyles.sideCard}>
        <h1 className={commonStyles.header}>{'Take a picture'}</h1>
        <p className={commonStyles.description}>Capture your tax form using your device's camera.</p>
        <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} fgColor={'#4b4447'} bgColor={'#fefcf6'} />
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
              <FormTableRow key="royalty_rate" formIndex="2" label={'Royalties & IP Fees'} value={DefaultFormFields.royalty_rate} valueNote="of earnings" />
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
            <div className={formStyles.formTableRows}>
              {Object.keys(Entities).map((role) => {
                const entity = Entities[role];
                return <FormTableRow key={role} formIndex={entity.formIndex} label={entity.display_role} value={entity.default_country.name} decorator={<CountryDecorator country={entity.default_country} text={entity.default_name} />} />;
              })}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
export default TaxForm;

// entity={entity} newRate={formData[`${role}_rate`] || ''} onRateChange={(rate) => setFormData({ ...formData, [`${role}_rate`]: rate })}
