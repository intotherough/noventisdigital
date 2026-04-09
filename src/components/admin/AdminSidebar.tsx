import type { AdminClientRecord, AdminUser } from '../../types.ts'
import type { AdminView } from './types.ts'
import { adminViews, getClientLastSignInLabel } from './types.ts'

type AdminSidebarProps = {
  admin: AdminUser
  clients: AdminClientRecord[]
  selectedClient: AdminClientRecord | null
  activeView: AdminView
  loadingData: boolean
  onSelectView: (view: AdminView) => void
  onSelectClient: (id: string) => void
}

export function AdminSidebar({
  admin,
  clients,
  selectedClient,
  activeView,
  loadingData,
  onSelectView,
  onSelectClient,
}: AdminSidebarProps) {
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
                className={`quote-list-item ${
                  client.id === selectedClient?.id ? 'is-active' : ''
                }`}
                key={client.id}
                onClick={() => onSelectClient(client.id)}
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
      </div>
    </aside>
  )
}
