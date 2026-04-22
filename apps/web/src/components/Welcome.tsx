import React from 'react';
import { motion } from 'framer-motion';
import welcomeStyles from '../css/Welcome.module.css';

interface WelcomeProps {
  setScreen: (screen: 'explorer' | 'ocr') => void;
}

const WelcomeScreen: React.FC<WelcomeProps> = ({ title, setScreen }) => {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleExitToOCR = () => {
    setIsExiting(true);
    setTimeout(() => {
      setScreen('ocr');
    }, 300);
  };

  const handleExitToExplorer = () => {
    setIsExiting(true);
    setTimeout(() => {
      setScreen('explorer');
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
          paddingTop: '4rem',
          boxSizing: 'border-box',
        }}
      >
        <div className={welcomeStyles.initCard}>
          <div className={welcomeStyles.headerContainer}>
            <h1 className={welcomeStyles.header}>{`Welcome to Haven — Still in Development`}</h1>
            <div className={welcomeStyles.description}>{`Understanding GILTI optimization and exploring multi-device OCR workflows. (This is still a work in progress.)`}</div>
          </div>
          <div className={welcomeStyles.formTypeSelectionContainer}>
            {/* <div className={`${welcomeStyles.formTypeSelector} ${welcomeStyles.primary}`} onClick={handleExitToOCR}>
              Add your details
            </div> */}
            <div className={`${welcomeStyles.formTypeSelector} ${welcomeStyles.primary}`} onClick={handleExitToExplorer}>
              Get started
            </div>
          </div>
          <div className={welcomeStyles.footer}>
            <div className={welcomeStyles.faq}>{`What is GILTI?`}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
