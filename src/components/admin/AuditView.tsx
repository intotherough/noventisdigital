import { useMemo, useState } from 'react'
import { formatDateTime } from '../../lib/formatting.ts'
import type { AdminClientRecord, AuditLogRecord } from '../../types.ts'
import type { AuditScopeFilter, AuditSubjectFilter } from './types.ts'
import { getAuditScopeLabel, prettifyEventType } from './types.ts'

type AuditViewProps = {
  auditLogs: AuditLogRecord[]
  selectedClient: AdminClientRecord | null
  loadingData: boolean
  portalEventCount: number
  adminEventCount: number
  onRefresh: () => void
}

export function AuditView({
  auditLogs,
  selectedClient,
  loadingData,
  portalEventCount,
  adminEventCount,
  onRefresh,
}: AuditViewProps) {
  const [auditScope, setAuditScope] = useState<AuditScopeFilter>('all')
  const [auditSubjectFilter, setAuditSubjectFilter] =
    useState<AuditSubjectFilter>('all')

  const visibleAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditScope !== 'all' && log.scope !== auditScope) {
        return false
      }

      if (auditSubjectFilter === 'selected' && selectedClient) {
        return (
          log.subjectUserId === selectedClient.id || log.actorUserId === selectedClient.id
        )
      }

      return true
    })
  }, [auditLogs, auditScope, auditSubjectFilter, selectedClient])

  return (
    <div className="admin-view">
      <div className="admin-stage-header">
        <div className="admin-stage-copy">
          <p className="eyebrow">Audit</p>
          <h1>Recorded activity</h1>
          <p className="admin-stage-note">
            Follow portal sign-ins, quote views, document access, and every admin-side
            change from a single timeline.
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
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-filter-group">
          <button
            className={`admin-filter-button ${auditScope === 'all' ? 'is-active' : ''}`}
            onClick={() => setAuditScope('all')}
            type="button"
          >
            All activity
          </button>
          <button
            className={`admin-filter-button ${
              auditScope === 'client_portal' ? 'is-active' : ''
            }`}
            onClick={() => setAuditScope('client_portal')}
            type="button"
          >
            Portal only
          </button>
          <button
            className={`admin-filter-button ${
              auditScope === 'admin_console' ? 'is-active' : ''
            }`}
            onClick={() => setAuditScope('admin_console')}
            type="button"
          >
            Admin only
          </button>
        </div>

        {selectedClient ? (
          <div className="admin-filter-group">
            <button
              className={`admin-filter-button ${
                auditSubjectFilter === 'all' ? 'is-active' : ''
              }`}
              onClick={() => setAuditSubjectFilter('all')}
              type="button"
            >
              All subjects
            </button>
            <button
              className={`admin-filter-button ${
                auditSubjectFilter === 'selected' ? 'is-active' : ''
              }`}
              onClick={() => setAuditSubjectFilter('selected')}
              type="button"
            >
              {selectedClient.company}
            </button>
          </div>
        ) : null}
      </div>

      <div className="admin-audit-summary">
        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Portal events</span>
          <strong className="admin-metric-value">{portalEventCount}</strong>
          <p className="admin-metric-note">Client-side sign-ins and document activity.</p>
        </article>

        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Admin events</span>
          <strong className="admin-metric-value">{adminEventCount}</strong>
          <p className="admin-metric-note">Creates, updates, resets, uploads, and deletions.</p>
        </article>

        <article className="detail-card admin-metric-card">
          <span className="admin-metric-label">Visible timeline</span>
          <strong className="admin-metric-value">{visibleAuditLogs.length}</strong>
          <p className="admin-metric-note">
            After the current scope and subject filters are applied.
          </p>
        </article>
      </div>

      <article className="detail-card admin-audit-feed-card">
        <div className="section-card-heading">
          <h3>Audit timeline</h3>
          <span>{visibleAuditLogs.length}</span>
        </div>

        {visibleAuditLogs.length ? (
          <div className="admin-audit-list">
            {visibleAuditLogs.map((log) => (
              <div className="admin-audit-item" key={log.id}>
                <div className="admin-audit-meta">
                  <span className="document-badge">{getAuditScopeLabel(log.scope)}</span>
                  <strong>{prettifyEventType(log.eventType)}</strong>
                  <span>{formatDateTime(log.createdAt)}</span>
                </div>

                <div className="admin-audit-details">
                  <p>
                    Actor: {log.actorEmail ?? log.actorName ?? 'Unknown'}
                    {log.subjectEmail ? ` -> ${log.subjectEmail}` : ''}
                  </p>
                  {log.route ? <p>Route: {log.route}</p> : null}
                  {log.documentPath ? <p>Document: {log.documentPath}</p> : null}
                  {log.quoteId ? <p>Quote: {log.quoteId}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No audit events match the current filters.</div>
        )}
      </article>
    </div>
  )
}
