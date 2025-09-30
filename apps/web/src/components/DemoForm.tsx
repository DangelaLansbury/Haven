import React from 'react';
import demoStyles from '../css/DemoForm.module.css';
import commonStyles from '../css/Common.module.css';
import { FormFields } from 'src/types';
import { DefaultFormFields } from 'src/types';

interface DemoFormBoxProps {
  id?: string;
  label: string;
  value?: string;
  footnote?: string;
  onMouseEnter?: (id: string) => void;
  onMouseLeave?: () => void;
  className?: string;
}

export function DemoFormBox({ id, label, value, footnote, onMouseEnter, onMouseLeave, className }: DemoFormBoxProps) {
  const handleMouseEnter = () => {
    if (id && onMouseEnter) {
      onMouseEnter(id);
    }
  };

  const handleMouseLeave = () => {
    if (onMouseLeave) {
      onMouseLeave();
    }
  };

  return (
    <div className={`${demoStyles.demoFormBox} ${className}`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className={demoStyles.BoxLabel}>{label}</div>
      <div className={demoStyles.BoxValue}>{value || ''}</div>
      {footnote && <div className={demoStyles.inputDesc}>{footnote}</div>}
    </div>
  );
}

interface DemoFormProps {
  formData: FormFields;
  setFormData: React.Dispatch<React.SetStateAction<FormFields>>;
}

export const DemoForm: React.FC<DemoFormProps> = ({ formData, setFormData }: DemoFormProps) => {
  const [highlighted, setHighlighted] = React.useState<string>('');
  const currentYear = new Date().getFullYear();

  return (
    <div className={demoStyles.demoForm}>
      <div className={demoStyles.topBar}>
        <div className={demoStyles.year}>{currentYear}</div>
        <div>
          <span className={demoStyles.formTitle}>Statement of Income Realization Deferral</span>
          <span className={demoStyles.formSubtitle}>Form 8890-A</span>
        </div>
        <div className={demoStyles.filingStatus}>For demonstration purposes only. Not for actual filing.</div>
      </div>
      <h1 className={commonStyles.header} style={{ marginBottom: '0.5rem' }}>
        {'Demo Form'}
      </h1>
      <p className={commonStyles.description} style={{ marginBottom: '1.5rem', maxWidth: '400px', textAlign: 'center' }}>
        {'Explore how different revenue and royalty rate inputs affect your tax outcomes.'}
      </p>
      <div className={demoStyles.demoFormGrid}></div>
    </div>
  );
};
