import { Link } from 'react-router-dom'

const engagements = [
  {
    kicker: 'Fixed scope. Defined deliverable.',
    title: 'Audit & Roadmap',
    description:
      "I look at what you've built, what you're paying for, and where AI would actually move the needle. You get a written roadmap, an honest read on your current stack and vendors, and a prioritised plan any competent engineer could pick up and run.",
    bestFor:
      "Leadership teams who suspect they're spending money in the wrong places and want a second opinion that isn't trying to sell them a platform.",
    image: '/images/ai-strategy-visual.svg',
    alt: 'Abstract AI strategy visual with luminous network lines and flowing motion.',
  },
  {
    kicker: 'Sprint or ongoing.',
    title: 'Build',
    description:
      "Hands-on engineering for the work your team can't get to. Production AI features, internal tools, integrations, evaluation harnesses, and the unglamorous infrastructure that makes AI products actually work in front of real users.",
    bestFor:
      'Companies with a clear thing they need built and no one available to build it properly.',
    image: '/images/portal-systems-visual.svg',
    alt: 'Abstract leadership visual with layered interface geometry and directional movement.',
  },
  {
    kicker: 'Ongoing retainer.',
    title: 'Support & Evolve',
    description:
      "A few days a month of senior technical judgment. Architecture reviews, hiring help, vendor decisions, board prep, and being the person your team can call when something is on fire at 9pm.",
    bestFor:
      "Founders or leadership teams who need a CTO in the room but don't yet need one on payroll.",
    image: '/images/transformation-visual.svg',
    alt: 'Abstract business transformation visual with layered signals and upward movement.',
  },
]

const principles = [
  {
    title: 'Build before deck',
    description:
      'Prototypes tell the truth faster than slides. Most engagements have something running inside the first week. Strategy documents that are not grounded in working code tend to age badly.',
  },
  {
    title: 'Own more than you rent',
    description:
      "Most companies are paying monthly for tools they could have built once. I'll tell you which ones, and which ones to keep paying for. Subscription sprawl is the most common waste I find.",
  },
  {
    title: 'Boring infrastructure first',
    description:
      'The interesting AI work only matters if the plumbing underneath it is solid. Logging, evals, deployment, observability, cost control. The stuff nobody puts on the homepage.',
  },
]

const ledgerItems = [
  'Audit & Roadmap',
  'Build',
  'Support & Evolve',
  'Fractional CTO',
]

const introSignals = ['CTO', 'Build', 'AI']

const workSignals = ['Audit', 'Build', 'Support']

const approachSignals = ['Ship', 'Own', 'Stabilise']

export function HomePage() {
  return (
    <div className="page-shell">
      <header className="site-header container">
        <Link className="brand-lockup" to="/">
          <span aria-hidden="true" className="brand-mark" />
          <span className="brand-copy">
            <strong>NOVENTIS</strong>
            <span>Fractional CTO and AI build partner.</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="top-nav">
          <a href="#work">Work</a>
          <a href="#approach">Approach</a>
          <a href="#contact">Contact</a>
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
        <section className="hero-section hero-section--glass">
          <div className="container hero-column">
            <div aria-hidden="true" className="hero-aura">
              <span className="hero-orbit hero-orbit--outer" />
              <span className="hero-orbit hero-orbit--inner" />
              <span className="hero-comet hero-comet--one">Plan</span>
              <span className="hero-comet hero-comet--two">Build</span>
              <span className="hero-comet hero-comet--three">Run</span>
            </div>

            <p className="eyebrow motion-reveal motion-reveal--1">
              Fractional CTO. AI strategy. Hands-on build.
            </p>
            <h1 className="hero-title" aria-label="Most AI pilots never reach production. I'm the person you call when yours has to.">
              <span className="hero-title-line">
                <span className="motion-clip motion-clip--1">Most AI pilots</span>
              </span>
              <span className="hero-title-line">
                <span className="motion-clip motion-clip--2">never reach production.</span>
              </span>
              <span className="hero-title-line">
                <span className="motion-clip motion-clip--3">I'm the person you call</span>
              </span>
              <span className="hero-title-line">
                <span className="motion-clip motion-clip--4">when yours has to.</span>
              </span>
            </h1>
            <p className="hero-text motion-reveal motion-reveal--3">
              Senior technical leadership, AI architecture, and engineering
              delivery for companies that need both the judgment of a CTO and
              someone who can still open the editor.
            </p>

            <div className="hero-actions motion-reveal motion-reveal--4">
              <a
                className="primary-button"
                href="mailto:hello@noventisdigital.co.uk?subject=Book%20a%2030-minute%20call"
              >
                Book a 30-minute call
              </a>
              <Link className="ghost-button" to="/portal">
                Client portal
              </Link>
            </div>

            <div aria-label="Core offer" className="hero-ledger motion-reveal motion-reveal--5">
              {ledgerItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="section container intro-section">
          <div className="intro-shell">
            <div className="intro-copy">
              <div className="intro-lead">
                <p className="eyebrow">About</p>
                <h2 className="section-title-wide intro-title">
                  Built in production.
                </h2>
              </div>

              <div className="body-stack">
                <p>
                  I&apos;ve spent the last few years putting AI into production
                  inside a real business, not a lab. Noventis is where I do the
                  same work for a small number of outside clients.
                </p>
                <p>
                  That gap is what I close. Sometimes that means a written
                  roadmap and an honest read on your current vendors. Sometimes
                  it means showing up and building the thing. Sometimes it means
                  being the senior technical voice in the room when the decisions
                  actually get made.
                </p>
              </div>
            </div>

            <div aria-hidden="true" className="ambient-panel ambient-panel--intro">
              <span className="ambient-orbit ambient-orbit--large" />
              <span className="ambient-orbit ambient-orbit--small" />
              <span className="ambient-pulse ambient-pulse--one" />
              <span className="ambient-pulse ambient-pulse--two" />
              {introSignals.map((signal, index) => (
                <span className={`ambient-chip ambient-chip--${index + 1}`} key={signal}>
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section container" id="work">
          <div className="section-heading section-heading--split section-heading--ambient">
            <div aria-hidden="true" className="section-aura section-aura--services">
              <span className="section-aura-ring section-aura-ring--outer" />
              <span className="section-aura-ring section-aura-ring--inner" />
              {workSignals.map((signal, index) => (
                <span className={`section-aura-chip section-aura-chip--${index + 1}`} key={signal}>
                  {signal}
                </span>
              ))}
            </div>
            <div>
              <p className="eyebrow">Engagements</p>
              <h2 className="section-title-wide">Three solutions. Pick the one that fits where you are.</h2>
            </div>
            <p className="section-deck">
              The work is intentionally narrow: a clear diagnosis, a clean build,
              or ongoing senior technical judgment where it actually matters.
            </p>
          </div>

          <div className="capability-grid">
            {engagements.map((engagement, index) => (
              <article className="capability-card" key={engagement.title}>
                <div className="capability-image-wrap">
                  <img
                    alt={engagement.alt}
                    className="capability-image"
                    loading="lazy"
                    src={engagement.image}
                  />
                  <span className="capability-index">{`0${index + 1}`}</span>
                </div>
                <div className="capability-copy">
                  <p className="eyebrow">{engagement.kicker}</p>
                  <h3>{engagement.title}</h3>
                  <p>{engagement.description}</p>
                  <p className="capability-best-for">
                    <span>Best for</span>
                    {engagement.bestFor}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section container" id="approach">
          <div className="section-heading section-heading--ambient section-heading--approach">
            <div aria-hidden="true" className="section-aura section-aura--approach">
              <span className="section-aura-ring section-aura-ring--outer" />
              <span className="section-aura-ring section-aura-ring--inner" />
              {approachSignals.map((signal, index) => (
                <span className={`section-aura-chip section-aura-chip--${index + 1}`} key={signal}>
                  {signal}
                </span>
              ))}
            </div>
            <p className="eyebrow">How I work</p>
            <h2 className="section-title-wide section-title-clearance">
              Three principles. Everything else is detail.
            </h2>
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

        <section className="section container" id="contact">
          <div className="closing-block">
            <div className="closing-stage">
              <div className="closing-copy">
                <p className="eyebrow">Get in touch</p>
                <h2 className="section-title-wide">If this sounds like the right fit, send a note.</h2>
                <p className="closing-text">
                  A short message about where you are and what&apos;s stuck is
                  enough to start. First call is 30 minutes, free, and either
                  ends with a clear next step or an honest &quot;this isn&apos;t for
                  me, here&apos;s who you should talk to instead.&quot;
                </p>
                <div className="hero-actions">
                  <a
                    className="primary-button"
                    href="mailto:hello@noventisdigital.co.uk?subject=Noventis%20Digital%20enquiry"
                  >
                    hello@noventisdigital.co.uk
                  </a>
                  <a
                    className="ghost-button"
                    href="mailto:hello@noventisdigital.co.uk?subject=Book%20a%2030-minute%20call"
                  >
                    Book a call
                  </a>
                </div>
              </div>

              <div className="closing-panel">
                <p className="closing-panel-label">Operating focus</p>
                <div className="closing-panel-lines">
                  <span>Audit &amp; Roadmap</span>
                  <span>Build</span>
                  <span>Support &amp; Evolve</span>
                </div>
              </div>

              <div aria-hidden="true" className="closing-wordmark">
                NOVENTIS
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer container">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <p className="site-footer-mark">NOVENTIS DIGITAL</p>
            <p>
              Fractional CTO and AI build partner. Based in the UK, working with
              teams everywhere.
            </p>
          </div>

          <div className="footer-links">
            <a href="mailto:hello@noventisdigital.co.uk">hello@noventisdigital.co.uk</a>
            <Link to="/portal">Client portal</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
