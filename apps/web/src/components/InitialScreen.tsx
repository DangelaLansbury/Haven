import React from 'react';
import formStyles from '../css/Form.module.css';

interface InitialScreenProps {
  title: string;
  setScreen: React.Dispatch<React.SetStateAction<'manual' | 'ocr' | 'initial'>>;
}

const InitialScreen: React.FC<InitialScreenProps> = ({ title, setScreen }) => {
  return (
    <div className={formStyles.initialScreen}>
      <h1 className={formStyles.title}>{title}</h1>
      <div className={formStyles.formTypeSelectionContainer}>
        <div className={formStyles.formTypeSelector} onClick={() => setScreen('manual')}>
          Manual Entry
        </div>
        <div className={formStyles.formTypeSelector} onClick={() => setScreen('ocr')}>
          Use OCR
        </div>
      </div>
    </div>
  );
};

export default InitialScreen;
