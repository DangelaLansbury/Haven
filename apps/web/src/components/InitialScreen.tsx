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
      <p className={formStyles.subtitle}>How do you want to enter your tax information?</p>
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
