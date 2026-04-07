import { Link } from 'react-router-dom'

const capabilities = [
  {
    title: 'AI strategy and workflow design',
    description:
      'Find where AI can remove friction, improve decision flow, and create measurable operational leverage.',
  },
  {
    title: 'Digital products and client portals',
    description:
      'Design and build the client-facing and internal software surfaces that make delivery feel intentional.',
  },
  {
    title: 'Business transformation delivery',
    description:
      'Translate digital strategy into working systems, clearer operations, and better execution across the business.',
  },
]

const portalSignals = [
  'Per-client authentication',
  'Controlled document access',
  'Scope, milestones, and commercial detail',
  'Clear next steps and approval routes',
]

const principles = [
  {
    title: 'Experienced digital judgment',
    description:
      'The work is shaped by senior thinking across product, delivery, operations, and commercial reality.',
  },
  {
    title: 'AI with commercial discipline',
    description:
      'AI is used where it genuinely improves throughput, clarity, or client experience, not as decoration.',
  },
  {
    title: 'Transformation that lands',
    description:
      'Strategy only matters if it changes the way the business actually works day to day.',
  },
]

const ledgerItems = [
  'AI strategy',
  'Digital transformation',
  'Client portals',
  'Operational software',
]

const ribbonItems = [
  'AI strategy',
  'Business transformation',
  'Digital products',
  'Client experience',
  'Automation design',
  'Operational software',
]

export function HomePage() {
  return (
    <div className="page-shell">
      <header className="site-header container">
        <Link className="brand-lockup" to="/">
          <span aria-hidden="true" className="brand-mark" />
          <span className="brand-copy">
            <strong>NOVENTIS</strong>
            <span>Digital systems and client infrastructure</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="top-nav">
          <a href="#services">Capabilities</a>
          <a href="#portal">Portal</a>
          <a href="#approach">Approach</a>
        </nav>

        <div className="header-actions">
          <a
            className="ghost-button"
            href="mailto:hello@noventisdigital.co.uk?subject=Noventis%20Digital%20enquiry"
          >
            hello@noventisdigital.co.uk
          </a>
          <Link className="primary-button" to="/portal">
            Open portal
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-section hero-section--glass">
          <div className="container hero-column">
            <div aria-hidden="true" className="hero-aura">
              <span className="hero-orbit hero-orbit--outer" />
              <span className="hero-orbit hero-orbit--inner" />
              <span className="hero-comet hero-comet--one">AI</span>
              <span className="hero-comet hero-comet--two">Ops</span>
              <span className="hero-comet hero-comet--three">DX</span>
            </div>

            <p className="eyebrow motion-reveal motion-reveal--1">
              Experienced digital leadership across AI, software, and transformation
            </p>
            <h1 className="motion-reveal motion-reveal--2">
              Digital, AI, and transformation work that changes how the business runs.
            </h1>
            <p className="hero-text motion-reveal motion-reveal--3">
              Noventis Digital brings senior digital expertise to AI adoption,
              software delivery, and business transformation. The focus is practical:
              clearer operations, stronger client experiences, and systems teams can
              actually use.
            </p>

            <div className="hero-actions motion-reveal motion-reveal--4">
              <a
                className="primary-button"
                href="mailto:hello@noventisdigital.co.uk?subject=Project%20enquiry"
              >
                Start a conversation
              </a>
              <Link className="ghost-button" to="/portal">
                View client portal
              </Link>
            </div>

            <div aria-label="Core offer" className="hero-ledger motion-reveal motion-reveal--5">
              {ledgerItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--flush">
          <div className="marquee-shell">
            <div className="marquee-track">
              {[...ribbonItems, ...ribbonItems].map((item, index) => (
                <span className="marquee-item" key={`${item}-${index}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section container intro-section">
          <div className="intro-grid">
            <div>
              <p className="eyebrow">Ethos</p>
              <h2>Senior digital thinking, applied to real operating problems.</h2>
            </div>

            <div className="body-stack">
              <p>
                Some businesses need software. Some need AI. Most need experienced
                judgment across process, product, delivery, and commercial reality.
              </p>
              <p>
                Noventis Digital works at that intersection, helping organisations
                modernise how they operate, serve clients, and turn digital change
                into something concrete.
              </p>
            </div>
          </div>
        </section>

        <section className="section container" id="services">
          <div className="section-heading">
            <p className="eyebrow">Capabilities</p>
            <h2>Three areas where experienced digital work creates real leverage.</h2>
          </div>

          <div className="capability-list">
            {capabilities.map((capability, index) => (
              <article className="capability-row" key={capability.title}>
                <span className="capability-index">{`0${index + 1}`}</span>
                <div>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section container" id="portal">
          <div className="portal-frame">
            <div className="portal-frame-copy">
              <p className="eyebrow">Client workspace</p>
              <h2>A private surface for proposals, documents, statements of work, and delivery material.</h2>
              <p>
                The portal is one part of a broader delivery philosophy:
                structured communication, controlled access, and a better client
                experience from first proposal to final handover.
              </p>

              <ul className="signal-list">
                {portalSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>

              <Link className="primary-button" to="/portal">
                Enter the portal
              </Link>
            </div>

            <div className="portal-preview">
              <div className="preview-topline">
                <span>Client portal</span>
                <span>Private workspace</span>
              </div>

              <div className="preview-surface">
                <div aria-hidden="true" className="preview-pulse" />
                <div className="preview-document-list">
                  <button className="preview-document is-active" type="button">
                    Project overview
                  </button>
                  <button className="preview-document" type="button">
                    Statement of work
                  </button>
                  <button className="preview-document" type="button">
                    Delivery notes
                  </button>
                </div>

                <div className="preview-canvas">
                  <div className="preview-sheet">
                    <span className="preview-sheet-label">Workspace</span>
                    <strong>Client project pack</strong>
                    <p>Scope, timing, documents, and next steps held in one controlled working surface.</p>
                    <div className="preview-progress">
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section container" id="approach">
          <div className="section-heading">
            <p className="eyebrow">Approach</p>
            <h2>Calm presentation. Serious delivery underneath.</h2>
          </div>

          <div className="principle-grid">
            {principles.map((principle) => (
              <article className="principle-card" key={principle.title}>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section container">
          <div className="closing-block">
            <p className="eyebrow">Contact</p>
            <h2>For businesses that want experienced help across digital, AI, and transformation.</h2>
            <div className="hero-actions">
              <a
                className="primary-button"
                href="mailto:hello@noventisdigital.co.uk?subject=Portal%20and%20systems%20project"
              >
                hello@noventisdigital.co.uk
              </a>
              <Link className="ghost-button" to="/portal">
                Open client portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer container">
        <p>NOVENTIS DIGITAL</p>
        <div className="footer-links">
          <a href="mailto:hello@noventisdigital.co.uk">hello@noventisdigital.co.uk</a>
          <Link to="/portal">Client portal</Link>
        </div>
      </footer>
    </div>
  )
}
