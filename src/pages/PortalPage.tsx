import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { demoCredentials } from '../data/demoPortal'
import { formatCurrency, formatDate } from '../lib/formatting'
import type {
  PortalClient,
  PortalMode,
  QuoteAttachment,
  QuoteDocument,
} from '../types'

type PortalPageProps = {
  client: PortalClient | null
  quotes: QuoteDocument[]
  booting: boolean
  portalMode: PortalMode
  quotesLoading: boolean
  portalError: string | null
  onLogin: (email: string, password: string) => Promise<void>
  onLogout: () => Promise<void>
}

function buildMailtoLink(email: string, subject: string, body: string) {
  const params = new URLSearchParams({
    subject,
    body,
  })

  return `mailto:${email}?${params.toString()}`
}

function isPdf(document: QuoteAttachment) {
  return document.kind === 'pdf' || document.url.toLowerCase().endsWith('.pdf')
}

export function PortalPage({
  client,
  quotes,
  booting,
  portalMode,
  quotesLoading,
  portalError,
  onLogin,
  onLogout,
}: PortalPageProps) {
  const [email, setEmail] = useState(demoCredentials[0]?.email ?? '')
  const [password, setPassword] = useState(demoCredentials[0]?.password ?? '')
  const [localError, setLocalError] = useState<string | null>(null)
  const [authPending, setAuthPending] = useState(false)
  const [signOutPending, setSignOutPending] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!quotes.length) {
      setSelectedQuoteId(null)
      return
    }

    setSelectedQuoteId((current) =>
      current && quotes.some((quote) => quote.id === current)
        ? current
        : quotes[0].id,
    )
  }, [quotes])

  const selectedQuote =
    quotes.find((quote) => quote.id === selectedQuoteId) ?? quotes[0] ?? null

  useEffect(() => {
    if (!selectedQuote?.documents.length) {
      setSelectedDocumentUrl(null)
      return
    }

    setSelectedDocumentUrl((current) =>
      current && selectedQuote.documents.some((document) => document.url === current)
        ? current
        : selectedQuote.documents[0].url,
    )
  }, [selectedQuote])

  const selectedDocument =
    selectedQuote?.documents.find((document) => document.url === selectedDocumentUrl) ??
    selectedQuote?.documents[0] ??
    null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)
    setAuthPending(true)

    try {
      await onLogin(email, password)
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'Unable to sign in right now.',
      )
    } finally {
      setAuthPending(false)
    }
  }

  const handleSignOut = async () => {
    setSignOutPending(true)

    try {
      await onLogout()
    } finally {
      setSignOutPending(false)
    }
  }

  const modeLabel = portalMode === 'live' ? 'Live portal' : 'Demo mode'

  return (
    <div className="portal-shell">
      <header className="portal-header container">
        <Link className="brand-lockup" to="/">
          <span className="brand-mark">ND</span>
          <span className="brand-copy">
            <strong>Noventis Digital</strong>
            <span>Private client workspace</span>
          </span>
        </Link>

        <div className="portal-header-actions">
          <span className="mode-badge">{modeLabel}</span>
          <Link className="ghost-button" to="/">
            Back to site
          </Link>
          {client ? (
            <button
              className="ghost-button"
              disabled={signOutPending}
              onClick={handleSignOut}
              type="button"
            >
              {signOutPending ? 'Signing out...' : 'Sign out'}
            </button>
          ) : null}
        </div>
      </header>

      <main className="container">
        {!client ? (
          <section className="portal-login-grid portal-login-grid--kinetic">
            <div className="portal-login-side">
              <p className="eyebrow">Private client access</p>
              <h1>A portal for proposals, PDFs and delivery material.</h1>
              <p>
                Clients sign in once and get a single private place to review
                project detail, supporting documents and next-step actions.
              </p>

              <div className="portal-value-list">
                <article className="benefit-card benefit-card--kinetic">
                  <h3>Hosted project documents</h3>
                  <p>Attach statements of work, proposals and supporting PDF packs.</p>
                </article>
                <article className="benefit-card benefit-card--kinetic">
                  <h3>Per-client visibility</h3>
                  <p>Each client only sees the material attached to their own account.</p>
                </article>
                <article className="benefit-card benefit-card--kinetic">
                  <h3>Static frontend, secure data layer</h3>
                  <p>GitHub Pages serves the interface while Supabase handles access.</p>
                </article>
              </div>
            </div>

            <div className="portal-login-card portal-login-card--kinetic">
              <div className="login-card-heading">
                <p className="eyebrow">Portal sign in</p>
                <h2>{booting ? 'Checking session...' : 'Open your workspace'}</h2>
              </div>

              {portalMode === 'demo' ? (
                <div className="notice-banner">
                  Demo mode is active. Set `VITE_SUPABASE_URL` and
                  `VITE_SUPABASE_ANON_KEY` to use live client logins.
                </div>
              ) : null}

              {localError ? <div className="error-banner">{localError}</div> : null}
              {portalError ? <div className="error-banner">{portalError}</div> : null}

              <form className="login-form" onSubmit={handleSubmit}>
                <label className="input-group">
                  <span>Email address</span>
                  <input
                    autoComplete="email"
                    className="text-input"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="client@company.com"
                    type="email"
                    value={email}
                  />
                </label>

                <label className="input-group">
                  <span>Password</span>
                  <input
                    autoComplete="current-password"
                    className="text-input"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    type="password"
                    value={password}
                  />
                </label>

                <button
                  className="primary-button full-width-button"
                  disabled={authPending}
                  type="submit"
                >
                  {authPending ? 'Signing in...' : 'Sign in to portal'}
                </button>
              </form>

              {portalMode === 'demo' ? (
                <div className="demo-access">
                  <p className="eyebrow">Demo credentials</p>
                  <div className="demo-chip-list">
                    {demoCredentials.map((credential) => (
                      <button
                        className="demo-chip"
                        key={credential.email}
                        onClick={() => {
                          setEmail(credential.email)
                          setPassword(credential.password)
                        }}
                        type="button"
                      >
                        {credential.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="portal-layout portal-layout--kinetic">
            <aside className="portal-aside">
              <div className="client-card client-card--kinetic">
                <p className="eyebrow">Workspace</p>
                <h2>{client.company}</h2>
                <p>{client.name}</p>
                <p>{client.email}</p>
              </div>

              <div className="list-card list-card--kinetic">
                <div className="list-card-heading">
                  <h3>Project packs</h3>
                  <span>{quotes.length}</span>
                </div>

                {quotesLoading ? (
                  <div className="loading-panel">Loading project packs...</div>
                ) : quotes.length ? (
                  <div className="quote-list">
                    {quotes.map((quote) => (
                      <button
                        className={`quote-list-item ${
                          quote.id === selectedQuote?.id ? 'is-active' : ''
                        }`}
                        key={quote.id}
                        onClick={() => setSelectedQuoteId(quote.id)}
                        type="button"
                      >
                        <span className="quote-list-topline">
                          <span className="quote-list-title">{quote.title}</span>
                          <span className="status-pill is-amber">{quote.status}</span>
                        </span>
                        <span className="quote-list-meta">
                          <strong>{formatCurrency(quote.amount)}</strong>
                          <span>{quote.documents.length} document(s)</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    No project packs have been assigned to this account yet.
                  </div>
                )}
              </div>
            </aside>

            <div className="portal-main">
              {portalError ? <div className="error-banner">{portalError}</div> : null}

              {selectedQuote ? (
                <article className="quote-detail quote-detail--kinetic">
                  <div className="quote-detail-header">
                    <div>
                      <p className="eyebrow">Client pack</p>
                      <h1>{selectedQuote.title}</h1>
                    </div>
                    <span className="status-pill is-amber">{selectedQuote.status}</span>
                  </div>

                  <div className="quote-meta-grid">
                    <div className="meta-tile">
                      <span>Total investment</span>
                      <strong>{formatCurrency(selectedQuote.amount)}</strong>
                    </div>
                    <div className="meta-tile">
                      <span>Timeline</span>
                      <strong>{selectedQuote.timeline}</strong>
                    </div>
                    <div className="meta-tile">
                      <span>Valid until</span>
                      <strong>{formatDate(selectedQuote.validUntil)}</strong>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <section className="detail-card">
                      <h3>Summary</h3>
                      <p>{selectedQuote.summary}</p>
                    </section>

                    <section className="detail-card">
                      <h3>Scope</h3>
                      <ul className="scope-list">
                        {selectedQuote.scope.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  {selectedQuote.documents.length ? (
                    <section className="detail-card">
                      <div className="section-card-heading">
                        <h3>Attached documents</h3>
                        <span>{selectedQuote.documents.length}</span>
                      </div>

                      <div className="document-grid">
                        {selectedQuote.documents.map((document) => (
                          <button
                            className={`document-card ${
                              document.url === selectedDocument?.url ? 'is-active' : ''
                            }`}
                            key={`${document.label}-${document.url}`}
                            onClick={() => setSelectedDocumentUrl(document.url)}
                            type="button"
                          >
                            <span className="document-badge">{document.kind}</span>
                            <strong>{document.label}</strong>
                            {document.description ? <p>{document.description}</p> : null}
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {selectedDocument && isPdf(selectedDocument) ? (
                    <section className="detail-card pdf-preview-card">
                      <div className="section-card-heading">
                        <h3>{selectedDocument.label}</h3>
                        <a
                          className="ghost-button"
                          href={selectedDocument.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open full PDF
                        </a>
                      </div>

                      <div className="pdf-frame-wrap">
                        <iframe src={selectedDocument.url} title={selectedDocument.label} />
                      </div>
                    </section>
                  ) : null}

                  <section className="detail-card">
                    <div className="section-card-heading">
                      <h3>Line items</h3>
                    </div>
                    <div className="line-item-grid">
                      {selectedQuote.items.map((item) => (
                        <div className="line-item-card" key={item.name}>
                          <div>
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                          </div>
                          <strong>{formatCurrency(item.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="detail-card">
                    <div className="section-card-heading">
                      <h3>Delivery milestones</h3>
                    </div>
                    <div className="milestone-list">
                      {selectedQuote.milestones.map((milestone) => (
                        <div className="milestone-card" key={`${milestone.label}-${milestone.due}`}>
                          <span className={`milestone-state is-${milestone.status}`}>
                            {milestone.status}
                          </span>
                          <strong>{milestone.label}</strong>
                          <p>{formatDate(milestone.due)}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="detail-card note-card">
                    <h3>Notes</h3>
                    <p>{selectedQuote.notes}</p>
                  </section>

                  <div className="quote-actions">
                    <a
                      className="primary-button"
                      href={buildMailtoLink(
                        selectedQuote.contactEmail,
                        `Approval: ${selectedQuote.title}`,
                        `Hello,\n\nI'd like to approve ${selectedQuote.title}.\n\nThanks,`,
                      )}
                    >
                      Approve by email
                    </a>
                    <a
                      className="ghost-button"
                      href={buildMailtoLink(
                        selectedQuote.contactEmail,
                        `Feedback: ${selectedQuote.title}`,
                        `Hello,\n\nI have feedback on ${selectedQuote.title}.\n\n`,
                      )}
                    >
                      Request changes
                    </a>
                  </div>
                </article>
              ) : (
                <div className="empty-state large">
                  This client account is active, but there are no project packs to show yet.
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
