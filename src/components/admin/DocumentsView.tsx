import type { FormEvent } from 'react'
import { formatDateTime } from '../../lib/formatting.ts'
import type { AdminClientRecord } from '../../types.ts'
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
  onUploadPack: (event: FormEvent<HTMLFormElement>) => void
  onSelectView: (view: AdminView) => void
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
  onUploadPack,
  onSelectView,
}: DocumentsViewProps) {
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

            {selectedClient.packs.length ? (
              <div className="line-item-grid admin-pack-list">
                {selectedClient.packs.map((pack) => (
                  <div className="line-item-card" key={pack.id}>
                    <div>
                      <h4>{pack.title}</h4>
                      <p>{formatDateTime(pack.updatedAt)}</p>
                    </div>
                    <strong>
                      {pack.status} · {pack.documentCount} file(s)
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No packs uploaded for this client yet.</div>
            )}
          </article>

          <form className="detail-card admin-upload-card" onSubmit={onUploadPack}>
            <div className="section-card-heading">
              <div>
                <p className="eyebrow">New upload</p>
                <h3>Attach a pack</h3>
              </div>
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
    </div>
  )
}
