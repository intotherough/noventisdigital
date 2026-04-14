import type { DragEvent, FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { demoCredentials } from '../data/demoPortal'
import { formatCurrency, formatDate, formatDateTime } from '../lib/formatting'
import {
  downloadClientInvoicePdfBlob,
  getDocumentStoragePath,
  listClientInvoices,
  listClientUploads,
  logPortalAuditEvent,
  portalMode as resolvedPortalMode,
  resolveDocumentAssetUrl,
  uploadClientFile,
} from '../lib/portalService'
import type {
  ClientUpload,
  Invoice,
  PortalClient,
  PortalMode,
  QuoteAttachment,
  QuoteDocument,
} from '../types'

function formatFileSize(size: number | null) {
  if (size === null || size === undefined) {
    return ''
  }
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

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

function getDocumentKey(document: QuoteAttachment) {
  return `${document.kind}:${document.url}:${document.label}`
}

function parsePortalLocation(pathname: string): {
  quoteIdFromUrl: string | null
  docIndexFromUrl: number | null
} {
  const trimmed = pathname.replace(/^\/portal\/?/, '').replace(/\/$/, '')
  if (!trimmed) {
    return { quoteIdFromUrl: null, docIndexFromUrl: null }
  }

  const parts = trimmed.split('/')
  if (parts[0] !== 'quotes' || !parts[1]) {
    return { quoteIdFromUrl: null, docIndexFromUrl: null }
  }

  const quoteId = decodeURIComponent(parts[1])

  if (parts[2] === 'docs' && parts[3] !== undefined) {
    const parsed = Number.parseInt(parts[3], 10)
    return {
      quoteIdFromUrl: quoteId,
      docIndexFromUrl: Number.isFinite(parsed) ? parsed : null,
    }
  }

  return { quoteIdFromUrl: quoteId, docIndexFromUrl: null }
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
  const location = useLocation()
  const navigate = useNavigate()

  const { quoteIdFromUrl, docIndexFromUrl } = useMemo(
    () => parsePortalLocation(location.pathname),
    [location.pathname],
  )

  const [email, setEmail] = useState(
    portalMode === 'demo' ? (demoCredentials[0]?.email ?? '') : '',
  )
  const [password, setPassword] = useState(
    portalMode === 'demo' ? (demoCredentials[0]?.password ?? '') : '',
  )
  const [localError, setLocalError] = useState<string | null>(null)
  const [authPending, setAuthPending] = useState(false)
  const [signOutPending, setSignOutPending] = useState(false)
  const [selectedDocumentAssetUrl, setSelectedDocumentAssetUrl] = useState<string | null>(
    null,
  )
  const [documentLoading, setDocumentLoading] = useState(false)
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [clientUploads, setClientUploads] = useState<ClientUpload[]>([])
  const [uploadsLoading, setUploadsLoading] = useState(false)
  const [uploadPending, setUploadPending] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadsDragOver, setUploadsDragOver] = useState(false)
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [invoicesError, setInvoicesError] = useState<string | null>(null)
  const [invoiceDownloadId, setInvoiceDownloadId] = useState<string | null>(null)
  const viewedQuoteIdsRef = useRef(new Set<string>())
  const viewedDocumentKeysRef = useRef(new Set<string>())

  const selectedQuote = useMemo(
    () =>
      (quoteIdFromUrl && quotes.find((quote) => quote.id === quoteIdFromUrl)) ||
      quotes[0] ||
      null,
    [quotes, quoteIdFromUrl],
  )

  const selectedDocument = useMemo(() => {
    if (!selectedQuote?.documents.length) {
      return null
    }
    if (docIndexFromUrl !== null && selectedQuote.documents[docIndexFromUrl]) {
      return selectedQuote.documents[docIndexFromUrl]
    }
    return selectedQuote.documents[0]
  }, [selectedQuote, docIndexFromUrl])

  const activeDocumentKey = selectedDocument ? getDocumentKey(selectedDocument) : null

  const navigateToQuote = useCallback(
    (quoteId: string) => {
      navigate(`/portal/quotes/${encodeURIComponent(quoteId)}`)
    },
    [navigate],
  )

  const navigateToDocument = useCallback(
    (quoteId: string, docIndex: number) => {
      navigate(
        `/portal/quotes/${encodeURIComponent(quoteId)}/docs/${docIndex}`,
      )
    },
    [navigate],
  )

  const refreshClientUploads = useCallback(async () => {
    if (!client || resolvedPortalMode !== 'live') {
      setClientUploads([])
      return
    }

    setUploadsLoading(true)
    try {
      const uploads = await listClientUploads(client.id)
      setClientUploads(uploads)
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Unable to load your uploads.',
      )
    } finally {
      setUploadsLoading(false)
    }
  }, [client])

  useEffect(() => {
    void refreshClientUploads()
  }, [refreshClientUploads])

  const refreshClientInvoices = useCallback(async () => {
    if (!client || resolvedPortalMode !== 'live') {
      setClientInvoices([])
      return
    }

    setInvoicesLoading(true)
    setInvoicesError(null)
    try {
      const invoices = await listClientInvoices()
      setClientInvoices(invoices)
    } catch (error) {
      setInvoicesError(
        error instanceof Error ? error.message : 'Unable to load your invoices.',
      )
    } finally {
      setInvoicesLoading(false)
    }
  }, [client])

  useEffect(() => {
    void refreshClientInvoices()
  }, [refreshClientInvoices])

  const handleInvoiceDownload = useCallback(async (invoice: Invoice) => {
    if (!invoice.pdfPath) {
      setInvoicesError('This invoice does not have a downloadable PDF yet.')
      return
    }
    setInvoiceDownloadId(invoice.id)
    setInvoicesError(null)
    try {
      const blob = await downloadClientInvoicePdfBlob(invoice.pdfPath)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${invoice.invoiceNumber}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      void logPortalAuditEvent('invoice_downloaded', {
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      })
    } catch (error) {
      setInvoicesError(
        error instanceof Error ? error.message : 'Unable to download invoice.',
      )
    } finally {
      setInvoiceDownloadId(null)
    }
  }, [])

  const handleClientFileUpload = useCallback(
    async (file: File) => {
      if (!client || !selectedQuote) {
        return
      }

      setUploadError(null)
      setUploadPending(true)

      try {
        await uploadClientFile({
          clientId: client.id,
          quoteId: selectedQuote.id,
          file,
        })
        await refreshClientUploads()
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : 'Unable to upload that file.',
        )
      } finally {
        setUploadPending(false)
      }
    },
    [client, selectedQuote, refreshClientUploads],
  )

  const handleUploadsDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer.items).some((item) => item.kind === 'file')) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setUploadsDragOver(true)
  }

  const handleUploadsDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      setUploadsDragOver(false)
    }
  }

  const handleUploadsDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setUploadsDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      void handleClientFileUpload(file)
    }
  }

  const uploadsForSelectedQuote = useMemo(
    () =>
      selectedQuote
        ? clientUploads.filter((upload) => upload.quoteId === selectedQuote.id)
        : [],
    [clientUploads, selectedQuote],
  )

  useEffect(() => {
    let isActive = true
    let objectUrlToRevoke: string | null = null

    if (!selectedDocument) {
      setSelectedDocumentAssetUrl(null)
      setDocumentError(null)
      setDocumentLoading(false)
      return () => {}
    }

    setDocumentLoading(true)
    setDocumentError(null)
    setSelectedDocumentAssetUrl(null)

    void resolveDocumentAssetUrl(selectedDocument)
      .then((asset) => {
        if (!isActive) {
          if (asset.revokeOnDispose) {
            URL.revokeObjectURL(asset.url)
          }

          return
        }

        objectUrlToRevoke = asset.revokeOnDispose ? asset.url : null
        setSelectedDocumentAssetUrl(asset.url)
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        setSelectedDocumentAssetUrl(null)
        setDocumentError(
          error instanceof Error
            ? error.message
            : 'Unable to load that document right now.',
        )
      })
      .finally(() => {
        if (isActive) {
          setDocumentLoading(false)
        }
      })

    return () => {
      isActive = false

      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke)
      }
    }
  }, [selectedDocument])

  useEffect(() => {
    if (!client || !selectedQuote) {
      return
    }

    if (viewedQuoteIdsRef.current.has(selectedQuote.id)) {
      return
    }

    viewedQuoteIdsRef.current.add(selectedQuote.id)

    void logPortalAuditEvent('quote_viewed', {
      quoteId: selectedQuote.id,
      metadata: {
        quoteTitle: selectedQuote.title,
        company: selectedQuote.company,
      },
    })
  }, [client, selectedQuote])

  useEffect(() => {
    if (
      !client ||
      !selectedQuote ||
      !selectedDocument ||
      !selectedDocumentAssetUrl ||
      documentLoading ||
      documentError
    ) {
      return
    }

    const documentKey = getDocumentKey(selectedDocument)

    if (viewedDocumentKeysRef.current.has(documentKey)) {
      return
    }

    viewedDocumentKeysRef.current.add(documentKey)

    void logPortalAuditEvent('document_viewed', {
      quoteId: selectedQuote.id,
      documentPath: getDocumentStoragePath(selectedDocument),
      metadata: {
        documentLabel: selectedDocument.label,
        documentKind: selectedDocument.kind,
      },
    })
  }, [
    client,
    documentError,
    documentLoading,
    selectedDocument,
    selectedDocumentAssetUrl,
    selectedQuote,
  ])

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
          <span aria-hidden="true" className="brand-mark" />
          <span className="brand-copy">
            <strong>NOVENTIS</strong>
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
            <div className="portal-login-copy">
              <p className="eyebrow">Private client access</p>
              <h1>Private project material. One secure surface.</h1>
              <p>
                The portal is designed for proposals, PDFs, statements of work,
                and delivery notes without the usual email sprawl.
              </p>
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

            <div className="portal-value-list">
              <article className="benefit-card benefit-card--kinetic">
                <h3>Private project documents</h3>
                <p>Statements of work, proposals and PDF packs stay behind portal auth.</p>
              </article>
              <article className="benefit-card benefit-card--kinetic">
                <h3>Per-client visibility</h3>
                <p>Each client only sees the material attached to their own account.</p>
              </article>
              <article className="benefit-card benefit-card--kinetic">
                <h3>Static frontend, private storage</h3>
                <p>GitHub Pages serves the interface while Supabase handles auth and files.</p>
              </article>
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
                        onClick={() => navigateToQuote(quote.id)}
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

              {resolvedPortalMode === 'live' ? (
                <div className="list-card list-card--kinetic portal-invoices-card">
                  <div className="list-card-heading">
                    <h3>Invoices</h3>
                    <span>{clientInvoices.length}</span>
                  </div>

                  {invoicesError ? (
                    <div className="error-banner">{invoicesError}</div>
                  ) : null}

                  {invoicesLoading ? (
                    <div className="loading-panel">Loading invoices...</div>
                  ) : clientInvoices.length ? (
                    <ul className="portal-invoice-list">
                      {clientInvoices.map((invoice) => (
                        <li className="portal-invoice-item" key={invoice.id}>
                          <div className="portal-invoice-meta">
                            <strong>{invoice.invoiceNumber}</strong>
                            <span>
                              {formatCurrency(invoice.totalAmount)} · due{' '}
                              {formatDate(invoice.dueDate)}
                            </span>
                            <span className={`status-pill is-${invoice.status}`}>
                              {invoice.status}
                            </span>
                          </div>
                          <button
                            className="ghost-button"
                            disabled={
                              invoiceDownloadId === invoice.id || !invoice.pdfPath
                            }
                            onClick={() => void handleInvoiceDownload(invoice)}
                            type="button"
                          >
                            {invoiceDownloadId === invoice.id
                              ? 'Downloading...'
                              : 'Download PDF'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="empty-state">
                      No invoices to show yet.
                    </div>
                  )}
                </div>
              ) : null}
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
                        {selectedQuote.documents.map((document, index) => (
                          <button
                            className={`document-card ${
                              getDocumentKey(document) === activeDocumentKey
                                ? 'is-active'
                                : ''
                            }`}
                            key={getDocumentKey(document)}
                            onClick={() => navigateToDocument(selectedQuote.id, index)}
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
                        {selectedDocumentAssetUrl ? (
                          <a
                            className="ghost-button"
                            href={selectedDocumentAssetUrl}
                            onClick={() => {
                              void logPortalAuditEvent('document_opened', {
                                quoteId: selectedQuote.id,
                                documentPath: getDocumentStoragePath(selectedDocument),
                                metadata: {
                                  documentLabel: selectedDocument.label,
                                  documentKind: selectedDocument.kind,
                                },
                              })
                            }}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Open full PDF
                          </a>
                        ) : null}
                      </div>

                      <div className="pdf-frame-wrap">
                        {documentLoading ? (
                          <div className="loading-panel">Loading document...</div>
                        ) : documentError ? (
                          <div className="error-banner">{documentError}</div>
                        ) : selectedDocumentAssetUrl ? (
                          <iframe
                            src={selectedDocumentAssetUrl}
                            title={selectedDocument.label}
                          />
                        ) : (
                          <div className="empty-state">
                            This document is attached, but could not be loaded yet.
                          </div>
                        )}
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

                  {resolvedPortalMode === 'live' ? (
                    <section
                      className={`detail-card portal-upload-card ${
                        uploadsDragOver ? 'is-drag-over' : ''
                      }`}
                      onDragEnter={handleUploadsDragOver}
                      onDragLeave={handleUploadsDragLeave}
                      onDragOver={handleUploadsDragOver}
                      onDrop={handleUploadsDrop}
                    >
                      <div className="section-card-heading">
                        <div>
                          <h3>Send files to Noventis</h3>
                          <p className="portal-upload-hint">
                            Drop a file here or use the button. PDFs, images, and
                            common documents up to 25&nbsp;MB.
                          </p>
                        </div>
                        <label className="ghost-button portal-upload-pick">
                          {uploadPending ? 'Uploading...' : 'Choose file'}
                          <input
                            accept="application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv"
                            disabled={uploadPending}
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (file) {
                                void handleClientFileUpload(file)
                              }
                              event.target.value = ''
                            }}
                            style={{ display: 'none' }}
                            type="file"
                          />
                        </label>
                      </div>

                      {uploadError ? (
                        <div className="error-banner">{uploadError}</div>
                      ) : null}

                      {uploadsLoading ? (
                        <div className="loading-panel">Loading your uploads...</div>
                      ) : uploadsForSelectedQuote.length ? (
                        <ul className="portal-upload-list">
                          {uploadsForSelectedQuote.map((upload) => (
                            <li className="portal-upload-item" key={upload.id}>
                              <div>
                                <strong>{upload.fileName}</strong>
                                <span>
                                  {formatDateTime(upload.createdAt)}
                                  {upload.fileSize
                                    ? ` · ${formatFileSize(upload.fileSize)}`
                                    : ''}
                                </span>
                              </div>
                              <span className="document-badge">Sent</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-state">
                          No files sent for this pack yet. Drop one to share it with
                          Noventis.
                        </p>
                      )}
                    </section>
                  ) : null}

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
