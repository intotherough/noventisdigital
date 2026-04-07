import { Link } from 'react-router-dom'

const capabilities = [
  {
    title: 'AI workflow design',
    description:
      'Map the handoffs, bottlenecks, and repetitive decisions that should be automated first.',
  },
  {
    title: 'Private client portals',
    description:
      'Create a secure surface for proposals, PDFs, statements of work, approvals, and delivery material.',
  },
  {
    title: 'Internal tools and delivery systems',
    description:
      'Build the operating layer behind premium services so teams can move faster without looking improvised.',
  },
]

const portalSignals = [
  'Per-client authentication',
  'Hosted PDFs and project files',
  'Scope, milestones, and commercial detail',
  'Clear next steps and approval routes',
]

const principles = [
  {
    title: 'Minimal outside',
    description:
      'The interface should feel calm, assured, and expensive rather than overloaded with components.',
  },
  {
    title: 'Serious underneath',
    description:
      'The product layer still has to solve authentication, file access, workflow structure, and delivery friction.',
  },
  {
    title: 'Built for use',
    description:
      'Everything should help a client move through a project more clearly, not just admire the site.',
  },
]

const ledgerItems = [
  'Private portals',
  'PDF delivery',
  'AI-assisted workflow',
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
            <p className="eyebrow">AI systems, client portals, delivery infrastructure</p>
            <h1>Operational software for businesses that sell expertise.</h1>
            <p className="hero-text">
              Noventis Digital builds the layer behind premium client work:
              private portals, AI-enabled workflows, and internal tools that make
              delivery cleaner, faster, and more defensible.
            </p>

            <div className="hero-actions">
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

            <div aria-label="Core offer" className="hero-ledger">
              {ledgerItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="section container intro-section">
          <div className="intro-grid">
            <div>
              <p className="eyebrow">What Noventis builds</p>
              <h2>Not brochure sites. Working systems.</h2>
            </div>

            <div className="body-stack">
              <p>
                The problem is rarely the service itself. It is usually the
                surface clients move through: proposal delivery, scattered files,
                weak approval flows, inconsistent handover, or internal process
                held together with email and memory.
              </p>
              <p>
                Noventis Digital focuses on that layer. The outcome is a cleaner
                client experience and a more deliberate operating model behind it.
              </p>
            </div>
          </div>
        </section>

        <section className="section container" id="services">
          <div className="section-heading">
            <p className="eyebrow">Capabilities</p>
            <h2>Three areas where better software changes the quality of delivery.</h2>
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
              <h2>A private surface for proposals, PDFs, statements of work, and delivery material.</h2>
              <p>
                Instead of scattering documents across inboxes, the portal gives
                each client a single authenticated place to review project
                material and respond cleanly.
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
                <span>Live documents</span>
              </div>

              <div className="preview-surface">
                <div className="preview-document-list">
                  <button className="preview-document is-active" type="button">
                    Watson proposal PDF
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
                    <span className="preview-sheet-label">PDF</span>
                    <strong>Watson Proposal SOW</strong>
                    <p>Commercial scope, timing, and delivery structure in one hosted document.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section container" id="approach">
          <div className="section-heading">
            <p className="eyebrow">Approach</p>
            <h2>Minimal externally. Serious under the hood.</h2>
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
            <h2>If the service is premium, the operating layer should be too.</h2>
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
