import { formatDateTime } from '../../lib/formatting.ts'
import type { AuditLogRecord } from '../../types.ts'
import { getAuditScopeLabel, prettifyEventType } from './types.ts'

type ActivityFeedProps = {
  items: AuditLogRecord[]
  emptyText: string
}

export function ActivityFeed({ items, emptyText }: ActivityFeedProps) {
  if (!items.length) {
    return <div className="empty-state">{emptyText}</div>
  }

  return (
    <div className="admin-feed-list">
      {items.map((log) => (
        <article className="admin-feed-item" key={log.id}>
          <div className="admin-feed-meta">
            <span className="document-badge">{getAuditScopeLabel(log.scope)}</span>
            <strong>{prettifyEventType(log.eventType)}</strong>
            <span>{formatDateTime(log.createdAt)}</span>
          </div>
          <p className="admin-feed-copy">
            {log.actorEmail ?? log.actorName ?? 'Unknown'}
            {log.subjectEmail ? ` -> ${log.subjectEmail}` : ''}
          </p>
          {log.documentPath ? <p className="admin-feed-copy">{log.documentPath}</p> : null}
        </article>
      ))}
    </div>
  )
}
