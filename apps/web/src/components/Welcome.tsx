import React from 'react';
import formStyles from '../css/Form.module.css';
import { motion } from 'framer-motion';
import commonStyles from '../css/Common.module.css';

interface WelcomeProps {
  setScreen: (screen: 'manual' | 'ocr') => void;
}

const WelcomeScreen: React.FC<WelcomeProps> = ({ title, setScreen }) => {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleExitToOCR = () => {
    setIsExiting(true);
    setTimeout(() => {
      setScreen('ocr');
    }, 300);
  };

  const handleExitToManual = () => {
    setIsExiting(true);
    setTimeout(() => {
      setScreen('manual');
    }, 300);
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <div className={commonStyles.headerContainer}>
          <h1 className={commonStyles.header}>Welcome to Haven</h1>
          <div className={commonStyles.subtitle}>{`Understanding GILTI optimization and exploring multi-device OCR workflows. (This is still a work in progress.)`}</div>
        </div>
        <div className={formStyles.formTypeSelectionContainer}>
          <div className={formStyles.formTypeSelector} onClick={handleExitToOCR}>
            Capture tax form
          </div>
          <div className={formStyles.formTypeSelector} onClick={handleExitToManual}>
            Skip to results
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
