import { Link } from 'react-router-dom'

export function PrivacyPage() {
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

        <div className="header-actions">
          <Link className="ghost-button" to="/">
            Back to site
          </Link>
        </div>
      </header>

      <main className="container policy-layout">
        <div className="policy-card">
          <p className="eyebrow">Privacy policy</p>
          <h1>Privacy policy for Noventis Digital</h1>
          <p className="policy-meta">Last updated: 15 April 2026</p>

          <section className="policy-section">
            <h2>Who is responsible for your data</h2>
            <p>
              Noventis Digital is operated by John Byrne. If you have any questions
              about this policy or how your information is handled, contact{' '}
              <a href="mailto:hello@noventisdigital.co.uk">hello@noventisdigital.co.uk</a>.
            </p>
          </section>

          <section className="policy-section">
            <h2>What information is collected</h2>
            <p>
              If you contact Noventis Digital through the website form or by email,
              the information you provide may include your name, email address,
              company name, and the contents of your message.
            </p>
            <p>
              Basic technical data such as IP address, browser details, and request
              metadata may also be processed by the hosting and infrastructure
              providers used to run the site and contact form.
            </p>
          </section>

          <section className="policy-section">
            <h2>How your information is used</h2>
            <p>Your information is used to:</p>
            <ul className="policy-list">
              <li>respond to enquiries</li>
              <li>assess whether there is a potential fit for a project or engagement</li>
              <li>keep a record of relevant business communications</li>
              <li>protect the site and contact channel from spam or abuse</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>Legal basis</h2>
            <p>
              For business enquiries, the main legal bases relied on are legitimate
              interests and, where appropriate, steps taken at your request before
              entering into a contract.
            </p>
          </section>

          <section className="policy-section">
            <h2>Who data may be shared with</h2>
            <p>
              Your data may be processed by service providers used to operate the
              website and communications, including:
            </p>
            <ul className="policy-list">
              <li>GitHub Pages for site hosting</li>
              <li>Supabase for application infrastructure and serverless functions</li>
              <li>Resend for email delivery</li>
              <li>Google Workspace for inbox handling and business email</li>
            </ul>
            <p>
              Information is not sold. It is only shared where needed to run the
              site, handle enquiries, or comply with legal obligations.
            </p>
          </section>

          <section className="policy-section">
            <h2>How long data is kept</h2>
            <p>
              Enquiry emails and contact form submissions are kept only for as long
              as reasonably needed to manage the conversation, assess potential work,
              maintain business records, and deal with follow-up matters.
            </p>
          </section>

          <section className="policy-section">
            <h2>Cookies and tracking</h2>
            <p>
              At the time of writing, the public site does not use analytics or
              advertising cookies. If that changes, this policy should be updated to
              reflect it.
            </p>
          </section>

          <section className="policy-section">
            <h2>Your rights</h2>
            <p>
              Depending on your location and the circumstances, you may have rights
              to request access to your personal data, ask for it to be corrected or
              erased, object to certain processing, or ask for processing to be
              restricted.
            </p>
            <p>
              To make a request, email{' '}
              <a href="mailto:hello@noventisdigital.co.uk">hello@noventisdigital.co.uk</a>.
            </p>
          </section>

          <section className="policy-section">
            <h2>Changes to this policy</h2>
            <p>
              This page may be updated from time to time to reflect changes to the
              site, services, or legal requirements. The latest version will always
              be published on this page.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
