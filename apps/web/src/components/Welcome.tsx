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
    }, 400);
  };

  const handleExitToManual = () => {
    setIsExiting(true);
    setTimeout(() => {
      setScreen('manual');
    }, 400);
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <motion.div
        initial={{ y: '100%' }}
        animate={isExiting ? { y: '100%' } : { y: 0 }}
        transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
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
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <div className={commonStyles.headerContainer}>
          <h1 className={commonStyles.header}>Welcome to Haven</h1>
          <div className={commonStyles.subtitle}>Understanding the mechanisms behind the "Double Irish & a Dutch Sandwich" tax avoidance scheme.</div>
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
