import { useMemo, useState } from 'react';
import Explorer from './components/Explorer';
import WelcomeScreen from './components/Welcome';
import commonStyles from './css/Common.module.css';
import { DefaultMockData, OptimizationResult, OptimizationScenario } from './types';
import { calculateProfit, createAllocationResult, createUsOnlyResult, optimizeFtcBlend } from './utils';

const App = () => {
  const [screen, setScreen] = useState<'initial' | 'explorer'>('initial');
  const [selectedScenario, setSelectedScenario] = useState<OptimizationScenario>(OptimizationScenario.economicFootprint);
  const { funnelAllocations, generatedAllocations, jurisdictionSections, revenue, profitMargin } = DefaultMockData;
  const profit = calculateProfit(revenue, profitMargin);

  const presetBlends = useMemo<Record<OptimizationScenario, OptimizationResult>>(
    () => ({
      [OptimizationScenario.economicFootprint]: createAllocationResult(generatedAllocations, profit, OptimizationScenario.economicFootprint),
      [OptimizationScenario.illustrativeFunnel]: createAllocationResult(funnelAllocations, profit, OptimizationScenario.illustrativeFunnel),
      [OptimizationScenario.ftcCrossCredit]: optimizeFtcBlend(generatedAllocations, jurisdictionSections, profit),
      [OptimizationScenario.usOnly]: createUsOnlyResult(profit),
    }),
    [funnelAllocations, generatedAllocations, jurisdictionSections, profit],
  );

  return (
    <>
      <header className={commonStyles.appHeader}>
        <div className={commonStyles.logoContainer} onClick={() => setScreen('initial')}>
          <img src={`${import.meta.env.BASE_URL}assets/images/HavenBanana.svg`} alt="Haven Logo" />
        </div>
      </header>
      {screen === 'initial' ? (
        <WelcomeScreen setScreen={setScreen} />
      ) : (
        <Explorer
          data={DefaultMockData}
          profit={profit}
          presetBlends={presetBlends}
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
        />
      )}
    </>
  );
};

export default App;
