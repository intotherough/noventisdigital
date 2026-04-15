import type { DragEvent, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  downloadPackDocumentBlob,
  listClientPacksForUser,
} from '../../lib/adminService.ts'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/formatting.ts'
import type { AdminClientRecord, AdminPackRecord, QuoteAttachment } from '../../types.ts'
import { ClientInvoicesPanel } from './ClientInvoicesPanel.tsx'
import type { AdminView } from './types.ts'

type DocumentsViewProps = {
  selectedClient: AdminClientRecord | null
  uploadPending: boolean
  packTitle: string
  packSummary: string
  packStatus: string
  packValidUntil: string
  packTimeline: string
  packNotes: string
  packAmount: string
  packScope: string
  packLabel: string
  packDescription: string
  packFile: File | null
  onPackTitleChange: (value: string) => void
  onPackSummaryChange: (value: string) => void
  onPackStatusChange: (value: string) => void
  onPackValidUntilChange: (value: string) => void
  onPackTimelineChange: (value: string) => void
  onPackNotesChange: (value: string) => void
  onPackAmountChange: (value: string) => void
  onPackScopeChange: (value: string) => void
  onPackLabelChange: (value: string) => void
  onPackDescriptionChange: (value: string) => void
  onPackFileChange: (file: File | null) => void
  onPackLabelAutoFill: (label: string) => void
  onUploadPack: (event: FormEvent<HTMLFormElement>) => void
  onSelectView: (view: AdminView) => void
  onNavigateToInvoice: (invoiceId: string) => void
}

export function DocumentsView({
  selectedClient,
  uploadPending,
  packTitle,
  packSummary,
  packStatus,
  packValidUntil,
  packTimeline,
  packNotes,
  packAmount,
  packScope,
  packLabel,
  packDescription,
  packFile,
  onPackTitleChange,
  onPackSummaryChange,
  onPackStatusChange,
  onPackValidUntilChange,
  onPackTimelineChange,
  onPackNotesChange,
  onPackAmountChange,
  onPackScopeChange,
  onPackLabelChange,
  onPackDescriptionChange,
  onPackFileChange,
  onPackLabelAutoFill,
  onUploadPack,
  onSelectView,
  onNavigateToInvoice,
}: DocumentsViewProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [packs, setPacks] = useState<AdminPackRecord[]>([])
  const [packsLoading, setPacksLoading] = useState(false)
  const [packsError, setPacksError] = useState<string | null>(null)
  const [activeDocumentKey, setActiveDocumentKey] = useState<string | null>(null)
  const [activeDocumentUrl, setActiveDocumentUrl] = useState<string | null>(null)
  const [documentLoadingKey, setDocumentLoadingKey] = useState<string | null>(null)

  const allDocuments = useMemo(
    () =>
      packs.flatMap((pack) =>
        pack.documents.map((document, index) => ({
          pack,
          document,
          key: `${pack.id}:${index}:${document.url}`,
        })),
      ),
    [packs],
  )

  const activeDocument =
    allDocuments.find((entry) => entry.key === activeDocumentKey) ?? allDocuments[0] ?? null

  useEffect(() => {
    let cancelled = false

    async function loadPacks() {
      if (!selectedClient) {
        setPacks([])
        setPacksError(null)
        setPacksLoading(false)
        return
      }

      setPacksLoading(true)
      setPacksError(null)

      try {
        const nextPacks = await listClientPacksForUser(selectedClient.id)
        if (!cancelled) {
          setPacks(nextPacks)
        }
      } catch (caught) {
        if (!cancelled) {
          setPacks([])
          setPacksError(
            caught instanceof Error
              ? caught.message
              : 'Unable to load client packs right now.',
          )
        }
      } finally {
        if (!cancelled) {
          setPacksLoading(false)
        }
      }
    }

    void loadPacks()

    return () => {
      cancelled = true
    }
  }, [selectedClient])

  useEffect(() => {
    if (!activeDocument && activeDocumentUrl) {
      URL.revokeObjectURL(activeDocumentUrl)
      setActiveDocumentUrl(null)
    }
  }, [activeDocument, activeDocumentUrl])

  useEffect(() => {
    if (!activeDocument) {
      setActiveDocumentKey(null)
      return
    }

    setActiveDocumentKey((current) => current ?? activeDocument.key)
  }, [activeDocument])

  useEffect(() => {
    let cancelled = false

    async function loadDocumentPreview(entry: {
      key: string
      document: QuoteAttachment
    }) {
      if (entry.document.kind !== 'pdf') {
        setActiveDocumentUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current)
          }
          return null
        })
        return
      }

      setDocumentLoadingKey(entry.key)

      try {
        const blob = await downloadPackDocumentBlob(entry.document.url)
        if (cancelled) {
          return
        }
        const nextUrl = URL.createObjectURL(blob)
        setActiveDocumentUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current)
          }
          return nextUrl
        })
      } catch {
        if (!cancelled) {
          setActiveDocumentUrl((current) => {
            if (current) {
              URL.revokeObjectURL(current)
            }
            return null
          })
        }
      } finally {
        if (!cancelled) {
          setDocumentLoadingKey(null)
        }
      }
    }

    if (activeDocument) {
      void loadDocumentPreview(activeDocument)
    }

    return () => {
      cancelled = true
    }
  }, [activeDocument])

  useEffect(() => {
    return () => {
      if (activeDocumentUrl) {
        URL.revokeObjectURL(activeDocumentUrl)
      }
    }
  }, [activeDocumentUrl])

  const handleDocumentDownload = async (attachment: QuoteAttachment, fileName: string) => {
    const downloadKey = `download:${attachment.url}`
    setDocumentLoadingKey(downloadKey)
    setPacksError(null)

    try {
      const blob = await downloadPackDocumentBlob(attachment.url)
      const url = URL.createObjectURL(blob)
      const anchor = window.document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      window.document.body.appendChild(anchor)
      anchor.click()
      window.document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (caught) {
      setPacksError(
        caught instanceof Error ? caught.message : 'Unable to download this pack file.',
      )
    } finally {
      setDocumentLoadingKey(null)
    }
  }

  const handleDragOver = (event: DragEvent<HTMLFormElement>) => {
    if (!selectedClient) {
      return
    }
    if (Array.from(event.dataTransfer.items).some((item) => item.kind === 'file')) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (event: DragEvent<HTMLFormElement>) => {
    if (event.currentTarget === event.target) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    if (!selectedClient) {
      return
    }

    const file = event.dataTransfer.files?.[0]
    if (!file) {
      return
    }

    if (file.type && file.type !== 'application/pdf') {
      return
    }

    onPackFileChange(file)
    const bareName = file.name.replace(/\.pdf$/i, '')
    if (bareName) {
      onPackLabelAutoFill(bareName)
    }
  }

  return (
    <div className="admin-view">
      <div className="admin-stage-header">
        <div className="admin-stage-copy">
          <p className="eyebrow">Documents</p>
          <h1>Private client packs</h1>
          <p className="admin-stage-note">
            Upload PDF material into the private bucket and attach it to the selected
            client without exposing anything through the public site.
          </p>
        </div>

        <div className="admin-stage-actions">
          {selectedClient ? (
            <button
              className="ghost-button"
              onClick={() => onSelectView('clients')}
              type="button"
            >
              Back to client profile
            </button>
          ) : null}
        </div>
      </div>

      {selectedClient ? (
        <div className="admin-stage-grid admin-stage-grid--documents">
          <article className="detail-card">
            <div className="section-card-heading">
              <div>
                <p className="eyebrow">Selected client</p>
                <h3>{selectedClient.company}</h3>
              </div>
              <span className="document-badge">{selectedClient.quoteCount} pack(s)</span>
            </div>

            <p className="admin-stage-note">
              Files uploaded here are stored in private Supabase Storage and are only
              served back to authenticated portal users at runtime.
            </p>

            {packsError ? <div className="error-banner">{packsError}</div> : null}

            {packsLoading ? (
              <div className="loading-panel">Loading client packs...</div>
            ) : packs.length ? (
              <div className="admin-pack-stack">
                {packs.map((pack) => (
                  <section className="line-item-card admin-pack-card" key={pack.id}>
                    <div className="admin-pack-card-header">
                      <div>
                        <h4>{pack.title}</h4>
                        <p>{formatDateTime(pack.updatedAt)}</p>
                      </div>
                      <strong>
                        {pack.status} · {pack.documents.length} file(s)
                      </strong>
                    </div>

                    <div className="admin-pack-meta">
                      <span>{formatCurrency(pack.amount)}</span>
                      <span>{pack.timeline || 'Timeline TBC'}</span>
                      <span>
                        {pack.validUntil ? `Valid until ${formatDate(pack.validUntil)}` : 'No expiry'}
                      </span>
                    </div>

                    {pack.summary ? <p>{pack.summary}</p> : null}

                    {pack.documents.length ? (
                      <div className="document-grid admin-pack-document-grid">
                        {pack.documents.map((document, index) => {
                          const documentKey = `${pack.id}:${index}:${document.url}`
                          const loading =
                            documentLoadingKey === documentKey ||
                            documentLoadingKey === `download:${document.url}`
                          const fileName =
                            document.url.split('/').pop()?.split('?')[0] ||
                            `${document.label}.pdf`

                          return (
                            <div className="document-card admin-pack-document-card" key={documentKey}>
                              <span className="document-badge">{document.kind}</span>
                              <strong>{document.label}</strong>
                              {document.description ? <p>{document.description}</p> : null}
                              <div className="admin-pack-document-actions">
                                <button
                                  className="ghost-button"
                                  disabled={loading}
                                  onClick={() => setActiveDocumentKey(documentKey)}
                                  type="button"
                                >
                                  {documentLoadingKey === documentKey
                                    ? 'Opening...'
                                    : document.kind === 'pdf'
                                      ? 'Preview'
                                      : 'Open'}
                                </button>
                                <button
                                  className="ghost-button"
                                  disabled={loading}
                                  onClick={() => void handleDocumentDownload(document, fileName)}
                                  type="button"
                                >
                                  {documentLoadingKey === `download:${document.url}`
                                    ? 'Downloading...'
                                    : 'Download'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="admin-stage-note">No files are attached to this pack yet.</p>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <div className="empty-state">No packs uploaded for this client yet.</div>
            )}
          </article>

          {activeDocument ? (
            <article className="detail-card pdf-preview-card">
              <div className="section-card-heading">
                <div>
                  <p className="eyebrow">Pack preview</p>
                  <h3>{activeDocument.document.label}</h3>
                </div>
                {activeDocumentUrl ? (
                  <a
                    className="ghost-button"
                    href={activeDocumentUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open in new tab
                  </a>
                ) : null}
              </div>

              {activeDocument.document.description ? (
                <p>{activeDocument.document.description}</p>
              ) : null}

              {activeDocument.document.kind === 'pdf' ? (
                activeDocumentUrl ? (
                  <div className="pdf-frame-wrap">
                    <iframe src={activeDocumentUrl} title={activeDocument.document.label} />
                  </div>
                ) : (
                  <div className="loading-panel">Preparing document preview...</div>
                )
              ) : (
                <p className="admin-stage-note">
                  This attachment is not a PDF preview. Use Open or Download above.
                </p>
              )}
            </article>
          ) : null}

          <form
            className={`detail-card admin-upload-card admin-upload-dropzone ${
              isDragOver ? 'is-drag-over' : ''
            } ${packFile ? 'has-file' : ''}`}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onSubmit={onUploadPack}
          >
            <div className="section-card-heading">
              <div>
                <p className="eyebrow">New upload</p>
                <h3>Attach a pack</h3>
              </div>
              <span className="admin-dropzone-hint">
                {packFile ? `Ready: ${packFile.name}` : 'Drop a PDF anywhere on this card'}
              </span>
            </div>

            <div className="admin-form-grid">
              <label className="input-group">
                <span>Pack title</span>
                <input
                  className="text-input"
                  onChange={(event) => onPackTitleChange(event.target.value)}
                  type="text"
                  value={packTitle}
                />
              </label>

              <label className="input-group">
                <span>Status</span>
                <select
                  className="text-input"
                  onChange={(event) => onPackStatusChange(event.target.value)}
                  value={packStatus}
                >
                  <option>Awaiting approval</option>
                  <option>Draft</option>
                  <option>Approved</option>
                  <option>In delivery</option>
                </select>
              </label>

              <label className="input-group">
                <span>Valid until</span>
                <input
                  className="text-input"
                  onChange={(event) => onPackValidUntilChange(event.target.value)}
                  type="date"
                  value={packValidUntil}
                />
              </label>

              <label className="input-group">
                <span>Timeline</span>
                <input
                  className="text-input"
                  onChange={(event) => onPackTimelineChange(event.target.value)}
                  type="text"
                  value={packTimeline}
                />
              </label>

              <label className="input-group">
                <span>Amount</span>
                <input
                  className="text-input"
                  min="0"
                  onChange={(event) => onPackAmountChange(event.target.value)}
                  step="1"
                  type="number"
                  value={packAmount}
                />
              </label>

              <label className="input-group">
                <span>PDF file</span>
                <input
                  className="text-input"
                  onChange={(event) => onPackFileChange(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>

              <label className="input-group admin-span-2">
                <span>Summary</span>
                <textarea
                  className="text-input text-area-input"
                  onChange={(event) => onPackSummaryChange(event.target.value)}
                  rows={4}
                  value={packSummary}
                />
              </label>

              <label className="input-group admin-span-2">
                <span>Notes</span>
                <textarea
                  className="text-input text-area-input"
                  onChange={(event) => onPackNotesChange(event.target.value)}
                  rows={3}
                  value={packNotes}
                />
              </label>

              <label className="input-group admin-span-2">
                <span>Scope items</span>
                <textarea
                  className="text-input text-area-input"
                  onChange={(event) => onPackScopeChange(event.target.value)}
                  placeholder="One per line or comma separated"
                  rows={3}
                  value={packScope}
                />
              </label>

              <label className="input-group">
                <span>Document label</span>
                <input
                  className="text-input"
                  onChange={(event) => onPackLabelChange(event.target.value)}
                  type="text"
                  value={packLabel}
                />
              </label>

              <label className="input-group">
                <span>Document description</span>
                <input
                  className="text-input"
                  onChange={(event) => onPackDescriptionChange(event.target.value)}
                  type="text"
                  value={packDescription}
                />
              </label>
            </div>

            <button
              className="primary-button"
              disabled={uploadPending || !packFile}
              type="submit"
            >
              {uploadPending ? 'Uploading...' : 'Upload pack'}
            </button>
          </form>
        </div>
      ) : (
        <div className="empty-state large">
          Select a client from the directory before uploading private collateral.
        </div>
      )}

      {selectedClient ? (
        <ClientInvoicesPanel
          clientId={selectedClient.id}
          onNavigateToInvoice={onNavigateToInvoice}
        />
      ) : null}
    </div>
  )
}
