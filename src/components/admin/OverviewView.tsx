import type { AdminClientRecord, AuditLogRecord } from '../../types.ts'
import type { AdminView } from './types.ts'
import { getClientLastSignInLabel } from './types.ts'
import { ActivityFeed } from './ActivityFeed.tsx'

type OverviewViewProps = {
  clientCount: number
  totalPacks: number
  firstLoginPendingCount: number
  recentEventCount: number
  selectedClient: AdminClientRecord | null
  recentAuditPreview: AuditLogRecord[]
  clientsAwaitingFirstLogin: AdminClientRecord[]
  recentlyUpdatedClients: AdminClientRecord[]
  loadingData: boolean
  onRefresh: () => void
  onSelectView: (view: AdminView) => void
  onSelectClient: (id: string, navigateTo?: AdminView) => void
}

export function OverviewView({
  clientCount,
  totalPacks,
  firstLoginPendingCount,
  recentEventCount,
  selectedClient,
  recentAuditPreview,
  clientsAwaitingFirstLogin,
  recentlyUpdatedClients,
  loadingData,
  onRefresh,
  onSelectView,
  onSelectClient,
}: OverviewViewProps) {
  return (
    <div className="admin-view">
      <div className="admin-stage-header">
        <div className="admin-stage-copy">
          <p className="eyebrow">Overview</p>
          <h1>Control room</h1>
          <p className="admin-stage-note">
            Keep client access, private documents, and portal activity in one place
            without disappearing into raw Supabase tables.
          </p>
        </div>

        <div className="admin-stage-actions">
          <button
            className="ghost-button"
            disabled={loadingData}
            onClick={onRefresh}
            type="button"
          >
            {loadingData ? 'Refreshing...' : 'Refresh data'}
          </button>
          <button
            className="primary-button"
            onClick={() => onSelectView('clients')}
            type="button"
          >
            Create or manage client
          </button>
        </div>
      </div>

      <div className="admin-metric-grid">
        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Client accounts</span>
          <strong className="admin-metric-value">{clientCount}</strong>
          <p className="admin-metric-note">Portal users with private access.</p>
        </article>

        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Private packs</span>
          <strong className="admin-metric-value">{totalPacks}</strong>
          <p className="admin-metric-note">Quotes and collateral in secure storage.</p>
        </article>

        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Awaiting first login</span>
          <strong className="admin-metric-value">{firstLoginPendingCount}</strong>
          <p className="admin-metric-note">Accounts that have not signed in yet.</p>
        </article>

        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Last 24 hours</span>
          <strong className="admin-metric-value">{recentEventCount}</strong>
          <p className="admin-metric-note">Recorded admin or portal events.</p>
        </article>
      </div>

      <div className="admin-overview-layout">
        <article className="detail-card">
          <div className="section-card-heading">
            <h3>Quick actions</h3>
            <span>{selectedClient ? selectedClient.company : 'No client selected'}</span>
          </div>

          <div className="admin-action-grid">
            <button
              className="admin-action-card"
              onClick={() => onSelectView('clients')}
              type="button"
            >
              <span className="eyebrow">Users</span>
              <strong>Create or edit client logins</strong>
              <p>Provision access, update profiles, and reset credentials.</p>
            </button>

            <button
              className="admin-action-card"
              onClick={() => onSelectView('documents')}
              type="button"
            >
              <span className="eyebrow">Documents</span>
              <strong>Upload private packs</strong>
              <p>Send PDF collateral into private storage for the selected client.</p>
            </button>

            <button
              className="admin-action-card"
              onClick={() => onSelectView('audit')}
              type="button"
            >
              <span className="eyebrow">Audit</span>
              <strong>Review activity</strong>
              <p>See who signed in, opened documents, or changed client data.</p>
            </button>
          </div>
        </article>

        <article className="detail-card">
          <div className="section-card-heading">
            <h3>Latest activity</h3>
            <span>{recentAuditPreview.length}</span>
          </div>
          <ActivityFeed items={recentAuditPreview} emptyText="Audit activity will appear here." />
        </article>
      </div>

      <div className="admin-overview-split">
        <article className="detail-card">
          <div className="section-card-heading">
            <h3>Needs first sign-in</h3>
            <span>{clientsAwaitingFirstLogin.length}</span>
          </div>

          {clientsAwaitingFirstLogin.length ? (
            <div className="admin-simple-list">
              {clientsAwaitingFirstLogin.map((client) => (
                <button
                  className="admin-simple-list-item"
                  key={client.id}
                  onClick={() => onSelectClient(client.id, 'clients')}
                  type="button"
                >
                  <span className="admin-simple-list-copy">
                    <strong>{client.company}</strong>
                    <span>
                      {client.name} · {client.email}
                    </span>
                  </span>
                  <span className="document-badge">No sign-in yet</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">No pending first-login accounts.</div>
          )}
        </article>

        <article className="detail-card">
          <div className="section-card-heading">
            <h3>Recently updated clients</h3>
            <span>{recentlyUpdatedClients.length}</span>
          </div>

          {recentlyUpdatedClients.length ? (
            <div className="admin-simple-list">
              {recentlyUpdatedClients.map((client) => (
                <button
                  className="admin-simple-list-item"
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  type="button"
                >
                  <span className="admin-simple-list-copy">
                    <strong>{client.company}</strong>
                    <span>{getClientLastSignInLabel(client)}</span>
                  </span>
                  <span className="document-badge">{client.quoteCount} pack(s)</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">Client accounts will appear here once created.</div>
          )}
        </article>
      </div>
    </div>
  )
}
