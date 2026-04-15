import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { submitPublicContactForm } from '../lib/publicSiteService'

const engagements = [
  {
    kicker: 'Fixed scope. Defined deliverable.',
    title: 'Audit & Roadmap',
    description:
      "I look at what you've built, what you're paying for, and where AI would actually move the needle. You get a written roadmap, an honest read on your current stack and vendors, and a prioritised plan any competent engineer could pick up and run.",
    bestFor:
      "Leadership teams who suspect they're spending money in the wrong places and want a second opinion that isn't trying to sell them a platform.",
  },
  {
    kicker: 'Sprint or ongoing.',
    title: 'Build',
    description:
      "Hands-on engineering for the work your team can't get to. Production AI features, internal tools, integrations, evaluation harnesses, and the unglamorous infrastructure that makes AI products actually work in front of real users.",
    bestFor:
      'Companies with a clear thing they need built and no one available to build it properly.',
  },
  {
    kicker: 'Ongoing retainer.',
    title: 'Support & Evolve',
    description:
      "A few days a month of senior technical judgment. Architecture reviews, hiring help, vendor decisions, board prep, and being the person your team can call when something is on fire at 9pm.",
    bestFor:
      "Founders or leadership teams who need a CTO in the room but don't yet need one on payroll.",
  },
  {
    kicker: 'Embedded. Ongoing.',
    title: 'Fractional Technology Lead',
    description:
      'A continuous relationship where I own technology direction alongside your leadership team. Strategy, roadmap, AI adoption, infrastructure and security posture, and the team enablement that turns tools into day-to-day fluency. One person accountable, working a defined number of days per month.',
    bestFor:
      'Organisations ready to treat technology as strategy rather than a ticket queue, where a full-time Head of IT or CTO is not yet justified but the capability is needed now.',
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

const teamPrinciples = [
  {
    title: 'Plain language for leadership',
    description:
      'If a technology decision cannot be explained to a CEO or a board in plain language, it is usually wrong or hiding something. My job includes translation, not just judgment.',
  },
  {
    title: 'Fluency beats prototypes',
    description:
      'One clever AI pilot matters less than a team that uses AI well every day. Coaching and hands-on enablement raise the floor of what everyone can do, which is where the compound returns live.',
  },
  {
    title: 'IT as enabler, not obstacle',
    description:
      'Onboarding, operations, and day-to-day tooling should feel invisible to the people using them. If the team is losing half a day a week to something that should be automated, that is the thing to fix before anything more interesting.',
  },
]

const ledgerItems = [
  'Audit & Roadmap',
  'Build',
  'Support & Evolve',
  'Fractional CTO',
]

const introSignals = ['CTO', 'Build', 'AI', 'Audit', 'Consulting', 'Programming', 'Security', 'Deployment', 'CI/CD', 'TDD', 'Coding']


const approachSignals = ['Ship', 'Own', 'Stabilise']

export function HomePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [formStatus, setFormStatus] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitPending, setSubmitPending] = useState(false)

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormStatus(null)
    setFormError(null)
    setSubmitPending(true)

    try {
      await submitPublicContactForm({
        name,
        email,
        company,
        message,
        website,
      })
      setName('')
      setEmail('')
      setCompany('')
      setMessage('')
      setWebsite('')
      setFormStatus('Message sent. I’ll reply from hello@noventisdigital.co.uk.')
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to send your message right now.',
      )
    } finally {
      setSubmitPending(false)
    }
  }

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
            href="https://www.linkedin.com/in/jmbyrne/"
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
          <a className="primary-button" href="#contact">Send a note</a>
        </div>
      </header>

      <main>
        <section className="hero-section hero-section--glass">
          <div className="container hero-column">
            <div aria-hidden="true" className="hero-aura">
              <span className="hero-orbit hero-orbit--outer" />
              <span className="hero-orbit hero-orbit--inner" />
              <span
                className="hero-comet hero-comet--one"
                onClick={(e) => {
                  const el = e.currentTarget
                  el.classList.remove('is-popped')
                  void el.offsetWidth
                  el.classList.add('is-popped')
                }}
              >
                Plan
              </span>
              <span
                className="hero-comet hero-comet--two"
                onClick={(e) => {
                  const el = e.currentTarget
                  el.classList.remove('is-popped')
                  void el.offsetWidth
                  el.classList.add('is-popped')
                }}
              >
                Build
              </span>
              <span
                className="hero-comet hero-comet--three"
                onClick={(e) => {
                  const el = e.currentTarget
                  el.classList.remove('is-popped')
                  void el.offsetWidth
                  el.classList.add('is-popped')
                }}
              >
                Run
              </span>
            </div>

            <p className="eyebrow motion-reveal motion-reveal--1">
              Fractional CTO. AI strategy. Hands-on build.
            </p>
            <h1 className="hero-title" aria-label="Most AI consultants ship slides. I ship software.">
              <span className="hero-title-line">
                <span className="motion-clip motion-clip--1">Most AI consultants</span>
              </span>
              <span className="hero-title-line">
                <span className="motion-clip motion-clip--2">ship slides.</span>
              </span>
              <span className="hero-title-line">
                <span className="motion-clip motion-clip--3">I ship software.</span>
              </span>
            </h1>
            <p className="hero-text motion-reveal motion-reveal--3">
              Senior technical leadership, AI architecture, and engineering
              delivery for companies that need both the judgment of a CTO and
              someone who can still open the editor.
            </p>

            <div className="hero-actions motion-reveal motion-reveal--4">
              <a className="primary-button" href="#contact">
                Send a note
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
                <span
                  className={`ambient-chip ambient-chip--${index + 1}`}
                  key={signal}
                  onClick={(e) => {
                    const el = e.currentTarget
                    el.classList.remove('is-popped')
                    void el.offsetWidth
                    el.classList.add('is-popped')
                  }}
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section container" id="work">
          <div className="section-heading section-heading--stacked">
            <p className="eyebrow">Engagements</p>
            <h2 className="section-title-wide">Four ways in. Pick the one that fits where you are.</h2>
            <p className="section-deck">
              Diagnosis, delivery, or ongoing technical leadership. Scoped tight
              and pointed at the work that actually matters.
            </p>
          </div>

          <div className="capability-grid">
            {engagements.map((engagement, index) => (
              <article className="capability-card" key={engagement.title}>
                <div className="capability-hero-panel">
                  <span className="capability-hero-number">{`0${index + 1}`}</span>
                  <span className="capability-hero-label">{engagement.title}</span>
                </div>
                <p className="eyebrow">{engagement.kicker}</p>
                <h3>{engagement.title}</h3>
                <p className="capability-description">{engagement.description}</p>
                <p className="capability-best-for">
                  <span>Best for</span>
                  {engagement.bestFor}
                </p>
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
                <span
                  className={`section-aura-chip section-aura-chip--${index + 1}`}
                  key={signal}
                  onClick={(e) => {
                    const el = e.currentTarget
                    el.classList.remove('is-popped')
                    void el.offsetWidth
                    el.classList.add('is-popped')
                  }}
                >
                  {signal}
                </span>
              ))}
            </div>
            <p className="eyebrow">How I work</p>
            <h2 className="section-title-wide section-title-clearance">
              Six principles. Everything else is detail.
            </h2>
          </div>

          <div className="principle-groups">
            <div className="principle-group">
              <p className="principle-group-label">Building</p>
              <div className="principle-grid">
                {principles.map((principle) => (
                  <article className="principle-card" key={principle.title}>
                    <h3>{principle.title}</h3>
                    <p>{principle.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="principle-group">
              <p className="principle-group-label">Working together</p>
              <div className="principle-grid">
                {teamPrinciples.map((principle) => (
                  <article className="principle-card" key={principle.title}>
                    <h3>{principle.title}</h3>
                    <p>{principle.description}</p>
                  </article>
                ))}
              </div>
            </div>
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
                  enough to start. No obligations, and it either
                  ends with a clear next step or an honest &quot;this isn&apos;t for
                  me, here&apos;s who you should talk to instead.&quot;
                </p>
                <p className="closing-trust-line">
                  Or email{' '}
                  <a href="mailto:hello@noventisdigital.co.uk">hello@noventisdigital.co.uk</a>{' '}
                  directly, or see{' '}
                  <a
                    href="https://www.linkedin.com/in/jmbyrne/"
                    rel="noreferrer"
                    target="_blank"
                  >
                    LinkedIn
                  </a>
                  .
                </p>
              </div>

              <form className="closing-form" onSubmit={handleContactSubmit}>
                <div className="closing-form-grid">
                  <label className="input-group">
                    <span>Name</span>
                    <input
                      className="text-input"
                      onChange={(event) => setName(event.target.value)}
                      required
                      type="text"
                      value={name}
                    />
                  </label>

                  <label className="input-group">
                    <span>Email</span>
                    <input
                      className="text-input"
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      type="email"
                      value={email}
                    />
                  </label>

                  <label className="input-group closing-form-span-2">
                    <span>Company</span>
                    <input
                      className="text-input"
                      onChange={(event) => setCompany(event.target.value)}
                      type="text"
                      value={company}
                    />
                  </label>

                  <label className="input-group closing-form-hidden" aria-hidden="true">
                    <span>Website</span>
                    <input
                      autoComplete="off"
                      className="text-input"
                      onChange={(event) => setWebsite(event.target.value)}
                      tabIndex={-1}
                      type="text"
                      value={website}
                    />
                  </label>

                  <label className="input-group closing-form-span-2">
                    <span>What do you need help with?</span>
                    <textarea
                      className="text-input text-area-input"
                      onChange={(event) => setMessage(event.target.value)}
                      required
                      rows={5}
                      value={message}
                    />
                  </label>
                </div>

                {formError ? <div className="error-banner">{formError}</div> : null}
                {formStatus ? <div className="notice-banner">{formStatus}</div> : null}

                <div className="closing-form-actions">
                  <button className="primary-button" disabled={submitPending} type="submit">
                    {submitPending ? 'Sending...' : 'Send message'}
                  </button>
                  <p className="closing-form-note">
                    By sending this form, you agree that I can use your details to
                    respond to your enquiry. See the{' '}
                    <Link to="/privacy">privacy policy</Link>.
                  </p>
                </div>
              </form>

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
            <a href="https://www.linkedin.com/in/jmbyrne/" rel="noreferrer" target="_blank">
              LinkedIn
            </a>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/portal">Client portal</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
