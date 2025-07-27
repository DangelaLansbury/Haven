import React from 'react';
import formStyles from '../css/Form.module.css';
import commonStyles from '../css/Common.module.css';

interface InitialScreenProps {
  title: string;
  setScreen: (screen: 'manual' | 'ocr') => void;
}

const InitialScreen: React.FC<InitialScreenProps> = ({ title, setScreen }) => {
  return (
    <div className={formStyles.initialScreen}>
      <div className={commonStyles.headerContainer}>
        <h1 className={commonStyles.header}>{title || 'haven'}</h1>
      </div>
      <p className={commonStyles.subtitle}>How do you want to enter your tax information?</p>
      <div className={formStyles.formTypeSelectionContainer}>
        <div className={formStyles.formTypeSelector} onClick={() => setScreen('manual')}>
          Enter it manually
        </div>
        <div className={formStyles.formTypeSelector} onClick={() => setScreen('ocr')}>
          Take a picture
        </div>
      </div>
    </div>
  );
};

export default InitialScreen;
