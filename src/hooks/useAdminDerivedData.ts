import { useMemo } from 'react'
import type { AdminClientRecord, AuditLogRecord } from '../types.ts'

export function useAdminDerivedData(
  clients: AdminClientRecord[],
  auditLogs: AuditLogRecord[],
  selectedClient: AdminClientRecord | null,
) {
  const totalPacks = useMemo(
    () => clients.reduce((sum, client) => sum + client.quoteCount, 0),
    [clients],
  )

  const firstLoginPendingCount = useMemo(
    () => clients.filter((client) => !client.lastSignInAt).length,
    [clients],
  )

  const recentEventCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000

    return auditLogs.filter((log) => {
      const parsed = Date.parse(log.createdAt)
      return Number.isFinite(parsed) && parsed >= cutoff
    }).length
  }, [auditLogs])

  const portalEventCount = useMemo(
    () => auditLogs.filter((log) => log.scope === 'client_portal').length,
    [auditLogs],
  )

  const adminEventCount = useMemo(
    () => auditLogs.filter((log) => log.scope === 'admin_console').length,
    [auditLogs],
  )

  const recentAuditPreview = useMemo(() => auditLogs.slice(0, 6), [auditLogs])

  const clientsAwaitingFirstLogin = useMemo(
    () => clients.filter((client) => !client.lastSignInAt).slice(0, 5),
    [clients],
  )

  const recentlyUpdatedClients = useMemo(() => clients.slice(0, 5), [clients])

  const selectedClientActivity = useMemo(() => {
    if (!selectedClient) {
      return []
    }

    return auditLogs
      .filter(
        (log) =>
          log.subjectUserId === selectedClient.id || log.actorUserId === selectedClient.id,
      )
      .slice(0, 6)
  }, [auditLogs, selectedClient])

  return {
    totalPacks,
    firstLoginPendingCount,
    recentEventCount,
    portalEventCount,
    adminEventCount,
    recentAuditPreview,
    clientsAwaitingFirstLogin,
    recentlyUpdatedClients,
    selectedClientActivity,
  }
}
