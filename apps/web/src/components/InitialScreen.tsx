import React from 'react';
import formStyles from '../css/Form.module.css';
import { motion } from 'framer-motion';
import commonStyles from '../css/Common.module.css';

interface InitialScreenProps {
  title: string;
  setScreen: (screen: 'manual' | 'ocr') => void;
}

const InitialScreen: React.FC<InitialScreenProps> = ({ title, setScreen }) => {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleExitToOCR = () => {
    setIsExiting(true);
    setTimeout(() => {
      setScreen('ocr');
    }, 800);
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <motion.div
        initial={{ y: '100%' }}
        animate={isExiting ? { y: '100%' } : { y: 0 }}
        transition={{ duration: 0.8, ease: [0.42, 0, 0.58, 1] }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '40%',
          backgroundColor: 'var(--gray-800)',
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <div className={commonStyles.headerContainer}>
          <h1 className={commonStyles.header}>{title || 'haven'}</h1>
        </div>
        <p className={commonStyles.subtitle}>How do you want to enter your tax information?</p>
        <div className={formStyles.formTypeSelectionContainer}>
          <div className={formStyles.formTypeSelector} onClick={() => setScreen('manual')}>
            Enter it manually
          </div>
          <div className={formStyles.formTypeSelector} onClick={handleExitToOCR}>
            Take a picture
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InitialScreen;
