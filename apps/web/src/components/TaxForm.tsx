import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';
import { FormTableRow } from './FormInput';
import QRCode from 'qrcode.react';
import { FormFields, Entities } from '../types';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

interface TaxFormProps {
  title?: string;
  description?: string;
  sessionId?: string;
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
  handleBack?: (screen: string) => void;
}

const TaxForm: React.FC<TaxFormProps> = ({ title, description, formData, setFormData, handleBack, sessionId }) => {
  return (
    <div className={commonStyles.pageContainer}>
      <div className={commonStyles.sideCard}>
        <div className={commonStyles.headerContainer}>
          <h1 className={commonStyles.header}>{'Take a picture.'}</h1>
        </div>
        <p className={commonStyles.description}>Capture your tax form using your device's camera.</p>
        <QRCode value={`${window.location.origin}/upload?sessionId=${sessionId}`} fgColor={'#4b4447'} bgColor={'#fefcf6'} />
      </div>

      <div className={commonStyles.mainCard}>
        <h1 className={commonStyles.header}>{title || 'Enter details below'}</h1>
        {description && <p className={commonStyles.description}>{description}</p>}

        <form className={`${formStyles.taxForm} `}>
          <div className={formStyles.formTableRow}>
            <div className={formStyles.formTableCell} style={{ flex: 1 }}>
              <span className={formStyles.cellValue} data-id="revenue">
                {formData.revenue ? `${formData.revenue}` : '$5000'}
              </span>
            </div>
          </div>
          <div className={formStyles.formTableRow}>
            <div className={formStyles.formTableCell} style={{ flex: 1 }}>
              <span className={formStyles.cellValue} data-id="royalty-rate">
                {formData.royalty_rate ? `${formData.royalty_rate}` : '90%'}
              </span>
            </div>
          </div>
          <div className={formStyles.formTable}>
            <div className={formStyles.formTableHeaderRow}>
              <div className={formStyles.formTableHeader} style={{ flex: 1 }}>
                Entity
              </div>
              <div className={formStyles.formTableHeader} style={{ flex: 2 }}>
                Location
              </div>
              <div className={`${formStyles.formTableHeader} ${formStyles.rate}`}>Tax Rate</div>
            </div>

            {Object.keys(Entities).map((role) => {
              const entity = Entities[role];
              return <FormTableRow key={role} entity={entity} newRate={formData[`${role}_rate`] || ''} onRateChange={(rate) => setFormData({ ...formData, [`${role}_rate`]: rate })} />;
            })}
          </div>
        </form>
      </div>
    </div>
  );
};
export default TaxForm;
