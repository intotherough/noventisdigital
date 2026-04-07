import { Link } from 'react-router-dom'

const serviceTracks = [
  {
    title: 'AI Workflow Design',
    description:
      'Map where automation creates actual margin, then build the workflow layer around it.',
  },
  {
    title: 'Client Portal Systems',
    description:
      'Create private spaces for proposals, PDFs, approvals, delivery packs and project files.',
  },
  {
    title: 'Product And Ops Builds',
    description:
      'Ship internal tools, external products and service infrastructure without dragging in enterprise weight.',
  },
]

const deliveryRhythm = [
  {
    step: 'Signal',
    description:
      'Start from the operational bottleneck, messy handoff or commercial friction point.',
  },
  {
    step: 'Structure',
    description:
      'Turn that into a real system shape: portal, workflow, product surface or document flow.',
  },
  {
    step: 'Ship',
    description:
      'Move quickly into something a team or client can actually use, not just review.',
  },
  {
    step: 'Scale',
    description:
      'Make the system repeatable so delivery gets cleaner as work volume grows.',
  },
]

const platformMarks = [
  'Private document spaces',
  'Proposal and SOW delivery',
  'AI-assisted workflows',
  'Operational buildouts',
]

const portalSignals = [
  'Per-client access control',
  'Hosted PDFs and supporting files',
  'Scope, line items and milestones',
  'Approval and revision handoff',
]

export function HomePage() {
  return (
    <div className="page-shell">
      <header className="site-header container">
        <Link className="brand-lockup" to="/">
          <span className="brand-mark">ND</span>
          <span className="brand-copy">
            <strong>Noventis Digital</strong>
            <span>Digital systems, client portals and AI workflow delivery</span>
          </span>
        </Link>

        <nav className="top-nav" aria-label="Primary">
          <a href="#services">Services</a>
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
            Client portal
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-section container">
          <div className="hero-grid hero-grid--kinetic">
            <div className="hero-copy">
              <p className="eyebrow">Digital infrastructure for service-led businesses</p>
              <h1>Sharper systems. Better delivery. A client area that feels built, not improvised.</h1>
              <p className="hero-text">
                Noventis Digital creates private portals, AI-enabled workflows and
                commercial operating systems for businesses that need clearer
                delivery and stronger client-facing experiences.
              </p>

              <div className="hero-actions">
                <a
                  className="primary-button"
                  href="mailto:hello@noventisdigital.co.uk?subject=Project%20enquiry"
                >
                  Start a project
                </a>
                <Link className="ghost-button" to="/portal">
                  Open the portal
                </Link>
              </div>

              <div className="hero-metrics" aria-label="Platform focus">
                {platformMarks.map((item) => (
                  <div className="metric-card" key={item}>
                    <span className="metric-dot" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-stack hero-stack--kinetic">
              <article className="panel-card signal-card signal-card--wide">
                <p className="card-label">What sits inside the portal</p>
                <h2>Proposal packs, statements of work, delivery notes and live project material.</h2>
                <p>
                  The client area is built to handle real files and structured project
                  detail, not just a list of prices.
                </p>
              </article>

              <div className="signal-board">
                <div className="signal-board-header">
                  <span className="status-pill is-emerald">System map</span>
                  <span>Client-facing layer</span>
                </div>

                <div className="signal-grid">
                  <div className="signal-node">Access</div>
                  <div className="signal-node">Documents</div>
                  <div className="signal-node">Approvals</div>
                  <div className="signal-node">Delivery</div>
                </div>

                <div className="signal-rail">
                  <span>Proposal PDF</span>
                  <span>Statement of work</span>
                  <span>Project pack</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section container">
          <div className="velocity-strip" aria-label="Operating focus">
            <span>Portals</span>
            <span>Automation</span>
            <span>Documents</span>
            <span>Workflow</span>
            <span>Delivery</span>
            <span>Systems</span>
          </div>
        </section>

        <section className="section container" id="services">
          <div className="section-heading">
            <p className="eyebrow">Services</p>
            <h2>Three places Noventis Digital creates the most leverage</h2>
            <p>
              The work sits where commercial flow, software and delivery structure
              overlap. The result is usually a clearer client experience and a
              stronger internal operating model.
            </p>
          </div>

          <div className="service-grid">
            {serviceTracks.map((track) => (
              <article className="service-card service-card--kinetic" key={track.title}>
                <h3>{track.title}</h3>
                <p>{track.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section container portal-preview-section" id="portal">
          <div className="portal-showcase portal-showcase--kinetic">
            <div className="section-heading">
              <p className="eyebrow">Portal layer</p>
              <h2>Move beyond static proposals and give clients a proper working surface.</h2>
              <p>
                The portal is designed to hold the full project pack: pricing,
                milestones, proposal PDFs, statements of work and revision context.
              </p>
            </div>

            <div className="showcase-panel showcase-panel--document">
              <div className="showcase-header">
                <span className="status-pill is-emerald">Document-ready</span>
                <span>What clients can access</span>
              </div>

              <ul className="showcase-list">
                {portalSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>

              <div className="document-stack">
                <div className="document-chip">
                  <strong>PDF</strong>
                  <span>Proposal / SOW</span>
                </div>
                <div className="document-chip">
                  <strong>LINK</strong>
                  <span>Approval action</span>
                </div>
                <div className="document-chip">
                  <strong>PACK</strong>
                  <span>Delivery notes</span>
                </div>
              </div>

              <Link className="primary-button full-width-button" to="/portal">
                Enter the client portal
              </Link>
            </div>
          </div>
        </section>

        <section className="section container" id="approach">
          <div className="section-heading">
            <p className="eyebrow">Approach</p>
            <h2>Built for operators who need movement, not theatre.</h2>
          </div>

          <div className="process-grid process-grid--wide">
            {deliveryRhythm.map((item) => (
              <article className="process-card process-card--kinetic" key={item.step}>
                <span className="step-chip">{item.step}</span>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section container">
          <div className="cta-banner cta-banner--kinetic">
            <div>
              <p className="eyebrow">Next move</p>
              <h2>Use the site as the front door and the portal as the working layer.</h2>
            </div>

            <div className="cta-actions">
              <a
                className="ghost-button"
                href="mailto:hello@noventisdigital.co.uk?subject=Portal%20and%20systems%20project"
              >
                Email Noventis
              </a>
              <Link className="primary-button" to="/portal">
                Open portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer container">
        <p>Noventis Digital</p>
        <div className="footer-links">
          <a href="mailto:hello@noventisdigital.co.uk">hello@noventisdigital.co.uk</a>
          <Link to="/portal">Client portal</Link>
        </div>
      </footer>
    </div>
  )
}
