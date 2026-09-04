import React from 'react';
import { motion } from 'framer-motion';
import welcomeStyles from '../css/Welcome.module.css';

interface WelcomeProps {
  setScreen: (screen: 'explorer') => void;
}

const WelcomeScreen: React.FC<WelcomeProps> = ({ setScreen }) => {
  const [isExiting, setIsExiting] = React.useState(false);
  const [isNCTIInfoExpanded, setIsNCTIInfoExpanded] = React.useState(false);

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
            <h1 className={welcomeStyles.header}>{`Welcome to Haven`}</h1>
            <div className={welcomeStyles.description}>{`Visualizing the effects of NCTI optimization`}</div>
          </div>
          <div className={welcomeStyles.formTypeSelectionContainer}>
            <div className={`${welcomeStyles.formTypeSelector} ${welcomeStyles.primary}`} onClick={handleExitToExplorer}>
              Get started
            </div>
          </div>
          <div className={welcomeStyles.footer}>
            <div className={welcomeStyles.faq} onClick={() => setIsNCTIInfoExpanded(!isNCTIInfoExpanded)}>
              {`What is NCTI?`}
              {isNCTIInfoExpanded && <div className={welcomeStyles.faqContent}>{`NCTI (Net Cash Tax Impact) is a metric used to evaluate the financial impact of tax optimizations.`}</div>}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
