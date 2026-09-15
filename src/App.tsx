import { useMemo, useState } from 'react';
import Explorer from './components/Explorer';
import WelcomeScreen from './components/Welcome';
import commonStyles from './css/Common.module.css';
import { CountryNames, DefaultMockData, OptimizationResult, OptimizationScenario } from './types';
import { calculateProfit, optimizeBlend } from './utils';

const App = () => {
  const [screen, setScreen] = useState<'initial' | 'explorer'>('initial');
  const [optLevel, setOptLevel] = useState<OptimizationScenario>(OptimizationScenario.unconstrained);
  const { countries, revenue, profitMargin } = DefaultMockData;
  const profit = calculateProfit(revenue, profitMargin);

  const presetBlends = useMemo<Record<OptimizationScenario, OptimizationResult>>(
    () => ({
      [OptimizationScenario.unconstrained]: optimizeBlend(countries, profit, OptimizationScenario.unconstrained),
      [OptimizationScenario.ftcEfficient]: optimizeBlend(countries, profit, OptimizationScenario.ftcEfficient),
      [OptimizationScenario.usOnly]: optimizeBlend([CountryNames.unitedstates], profit, OptimizationScenario.usOnly),
    }),
    [countries, profit],
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
        <Explorer countries={countries} revenue={revenue} profit={profit} profitMargin={profitMargin} presetBlends={presetBlends} optLevel={optLevel} setOptLevel={setOptLevel} />
      )}
    </>
  );
};

export default App;
