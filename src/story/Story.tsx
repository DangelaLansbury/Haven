import StoryGlobe from './StoryGlobe';
import { steps } from './steps';
import { useActiveStep } from './useActiveStep';

const stepIds = steps.map((step) => step.id);

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
          </div>

          <span className="stage-edition">A field guide to tax havens</span>
        </header>
        <div className="stage-visual">
          <StoryGlobe scene={step.scene} />
        </div>
        <div className="stage-summary">
          <p className="stage-label">{step.scene.label}</p>
          <p className="stage-amount">{step.scene.amount}</p>
          <p className="stage-caption">{step.scene.caption}</p>
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
            {index === 0 && (
              <p className="story-subtitle">
                The Double Irish
                <br />
                with a Dutch Sandwich
              </p>
            )}
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
