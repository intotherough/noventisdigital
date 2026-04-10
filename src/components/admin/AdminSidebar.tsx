import type { DragEvent } from 'react'
import { useState } from 'react'
import type { AdminClientRecord, AdminUser } from '../../types.ts'
import type { AdminView } from './types.ts'
import { adminViews, getClientLastSignInLabel } from './types.ts'

type AdminSidebarProps = {
  admin: AdminUser
  clients: AdminClientRecord[]
  selectedClient: AdminClientRecord | null
  activeView: AdminView
  loadingData: boolean
  quickUploadPending: boolean
  onSelectView: (view: AdminView) => void
  onSelectClient: (id: string) => void
  onDropFile: (clientId: string, file: File) => void
}

export function AdminSidebar({
  admin,
  clients,
  selectedClient,
  activeView,
  loadingData,
  quickUploadPending,
  onSelectView,
  onSelectClient,
  onDropFile,
}: AdminSidebarProps) {
  const [dragTargetId, setDragTargetId] = useState<string | null>(null)

  const handleClientDragOver = (
    event: DragEvent<HTMLButtonElement>,
    clientId: string,
  ) => {
    if (!Array.from(event.dataTransfer.items).some((item) => item.kind === 'file')) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDragTargetId(clientId)
  }

  const handleClientDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    if (event.currentTarget === event.target) {
      setDragTargetId(null)
    }
  }

  const handleClientDrop = (
    event: DragEvent<HTMLButtonElement>,
    clientId: string,
  ) => {
    event.preventDefault()
    setDragTargetId(null)

    const file = event.dataTransfer.files?.[0]
    if (!file) {
      return
    }
    if (file.type && file.type !== 'application/pdf') {
      return
    }

    onDropFile(clientId, file)
  }

  return (
    <aside className="admin-rail">
      <article className="detail-card admin-session-card">
        <p className="eyebrow">Admin session</p>
        <div className="admin-session-meta">
          <h1>{admin.name}</h1>
          <p>{admin.email}</p>
        </div>
      </article>

      <article className="detail-card">
        <p className="eyebrow">Workspace</p>
        <div className="admin-view-nav">
          {adminViews.map((view) => (
            <button
              className={`admin-view-button ${
                activeView === view.id ? 'is-active' : ''
              }`}
              key={view.id}
              onClick={() => onSelectView(view.id)}
              type="button"
            >
              <strong>{view.label}</strong>
              <span>{view.detail}</span>
            </button>
          ))}
        </div>
      </article>

      <article className="detail-card admin-current-client-card">
        <p className="eyebrow">Current client</p>
        {selectedClient ? (
          <>
            <div className="admin-client-context">
              <h3>{selectedClient.company}</h3>
              <p>
                {selectedClient.name} · {selectedClient.role}
              </p>
              <p>{selectedClient.email}</p>
            </div>

            <div className="admin-rail-actions">
              <button
                className="ghost-button"
                onClick={() => onSelectView('clients')}
                type="button"
              >
                Edit account
              </button>
              <button
                className="ghost-button"
                onClick={() => onSelectView('documents')}
                type="button"
              >
                Manage packs
              </button>
            </div>
          </>
        ) : (
          <p>Select a client from the directory to start editing.</p>
        )}
      </article>

      <div className="list-card admin-directory-card">
        <div className="list-card-heading">
          <h3>Client directory</h3>
          <span>{loadingData ? '...' : clients.length}</span>
        </div>

        {loadingData ? (
          <div className="loading-panel">Refreshing admin data...</div>
        ) : clients.length ? (
          <div className="quote-list">
            {clients.map((client) => (
              <button
                className={`quote-list-item admin-client-drop-target ${
                  client.id === selectedClient?.id ? 'is-active' : ''
                } ${dragTargetId === client.id ? 'is-drag-over' : ''}`}
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                onDragEnter={(event) => handleClientDragOver(event, client.id)}
                onDragLeave={handleClientDragLeave}
                onDragOver={(event) => handleClientDragOver(event, client.id)}
                onDrop={(event) => handleClientDrop(event, client.id)}
                type="button"
              >
                <span className="quote-list-topline">
                  <span className="quote-list-title">{client.company}</span>
                  <span className="status-pill is-amber">{client.quoteCount} pack(s)</span>
                </span>
                <span className="quote-list-meta">
                  <strong>{client.name}</strong>
                  <span>{getClientLastSignInLabel(client)}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">No client accounts exist yet.</div>
        )}

        <p className="admin-directory-hint">
          {quickUploadPending
            ? 'Uploading dropped PDF...'
            : 'Tip: drop a PDF onto a client to upload it instantly.'}
        </p>
      </div>
    </aside>
  )
}
