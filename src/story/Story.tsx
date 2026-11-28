import StoryGlobe from './StoryGlobe';
import { INITIAL_REVENUE, steps } from './steps';
import { useActiveStep } from './useActiveStep';
import { motion, type Variants } from 'framer-motion';
import NumberFlow from '@number-flow/react';

const stepIds = steps.map((step) => step.id);
const NUMBER_FLOW_TIMING: EffectTiming = { duration: 300 };
const PERCENT_FORMAT = { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;
const CURRENCY_FORMAT = { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 } as const;

export default function Story() {
  const active = useActiveStep(stepIds);
  const step = steps[active];

  return (
    <main className="story-layout">
      <a className="skip-link" href="#chapters">
        Skip to the explanation
      </a>
      <aside className="story-stage" aria-label="Globe accompanying the explanation">
        <header className="stage-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={`${import.meta.env.BASE_URL}assets/images/HavenBanana.svg`} alt="Haven Logo" />
            <span className="story-wordmark">Haven</span>
          </div>
        </header>
        <div className="stage-visual">
          <StoryGlobe scene={step.scene} />
        </div>
        <div className="stage-summary" aria-live="polite" aria-atomic="true">
          <div className="tracker-stat">
            <p className="stage-label">Initial revenue</p>
            <p className="stage-amount">
              <NumberFlow value={INITIAL_REVENUE} format={CURRENCY_FORMAT} locales="en-US" transformTiming={NUMBER_FLOW_TIMING} />
            </p>
            <p className="stage-caption">{'Sale of goods'}</p>
          </div>
          <div className="tracker-stat">
            <p className="stage-label">Money remaining</p>
            <p className="stage-amount">
              <NumberFlow value={parseFloat(step.scene.tracker.money.replace('$', ''))} format={CURRENCY_FORMAT} locales="en-US" transformTiming={NUMBER_FLOW_TIMING} />
            </p>
            <p className="stage-caption">{step.scene.tracker.moneyCaption}</p>
          </div>
          <div className="tracker-stat">
            <p className="stage-label">Profit</p>
            <p className="stage-amount">
              <NumberFlow value={parseFloat(step.scene.tracker.profit.replace('$', ''))} format={CURRENCY_FORMAT} locales="en-US" transformTiming={NUMBER_FLOW_TIMING} />
            </p>
            <p className="stage-caption">{step.scene.tracker.profitCaption}</p>
          </div>
        </div>
        <footer className="stage-footer">
          <span>
            {String(active + 1).padStart(2, '0')} <span className="muted">/ {String(steps.length).padStart(2, '0')}</span>
          </span>
          <nav className="step-navigation" aria-label="Story chapters">
            {steps.map((item, index) => (
              <a key={item.id} href={`#${item.id}`} aria-label={item.title} aria-current={index === active ? 'step' : undefined}>
                <span className={index <= active ? 'is-reached' : ''} />
              </a>
            ))}
          </nav>
          <span className="stage-scroll-hint">Scroll to explore ↓</span>
        </footer>
      </aside>

      <article id="chapters" className="story-chapters" tabIndex={-1}>
        {steps.map((item, index) => (
          <section id={item.id} key={item.id} className={`story-chapter ${index === 0 ? 'story-intro' : ''}`} aria-labelledby={`${item.id}-heading`} data-active={index === active}>
            <p className="chapter-kicker">{item.kicker}</p>
            {index === 0 ? <h1 id={`${item.id}-heading`}>{item.title}</h1> : <h2 id={`${item.id}-heading`}>{item.title}</h2>}
            {index === 0 && <p className="story-subtitle">Understanding the Double Irish with a Dutch Sandwich</p>}
            <div className="chapter-copy">
              {item.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="chapter-note">{item.note}</p>
            {index === 0 && (
              <a className="start-link" href="#companies">
                Follow the money <span aria-hidden="true">↓</span>
              </a>
            )}
            {index === steps.length - 1 && (
              <div className="story-sources">
                <h3>Read further</h3>
                <a href="https://www.bea.gov/system/files/papers/WP2018-8_0.pdf">US Bureau of Economic Analysis · Appendix B ↗</a>
                <a href="https://www.bancaditalia.it/pubblicazioni/qef/2023-0799/QEF_799_23.pdf">Banca d’Italia · Annex 2 ↗</a>
                <a href="https://www.revenue.ie/en/tax-professionals/tdm/income-tax-capital-gains-tax-corporation-tax/part-02/02-02-03.pdf">Irish Revenue · Company residence ↗</a>
                <a className="restart-link" href="#intro">
                  Back to the beginning ↑
                </a>
              </div>
            )}
          </section>
        ))}
        <footer className="story-colophon">A historical explainer · All euro amounts are illustrative.</footer>
      </article>
    </main>
  );
}
