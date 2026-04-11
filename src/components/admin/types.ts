import type { AdminClientRecord, CreateClientInput } from '../../types.ts'
import { formatDateTime } from '../../lib/formatting.ts'
import type { AuditLogRecord } from '../../types.ts'

export type AdminView =
  | 'overview'
  | 'clients'
  | 'documents'
  | 'audit'
  | 'email-preview'
export type AuditScopeFilter = 'all' | 'client_portal' | 'admin_console'
export type AuditSubjectFilter = 'all' | 'selected'

export const defaultCreateForm: CreateClientInput = {
  email: '',
  password: '',
  fullName: '',
  company: '',
  role: 'Client',
  sendWelcomeEmail: false,
}

export const adminViews: Array<{
  id: AdminView
  label: string
  title: string
  detail: string
}> = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'Operations dashboard',
    detail: 'High-level health, recent movement, and shortcuts.',
  },
  {
    id: 'clients',
    label: 'Clients',
    title: 'Client directory',
    detail: 'Create, edit, reset, and remove portal access.',
  },
  {
    id: 'documents',
    label: 'Documents',
    title: 'Private packs',
    detail: 'Upload and track authenticated client material.',
  },
  {
    id: 'audit',
    label: 'Audit',
    title: 'Activity log',
    detail: 'Portal behaviour and admin changes in one timeline.',
  },
  {
    id: 'email-preview',
    label: 'Email preview',
    title: 'Transactional templates',
    detail: 'Local rendering of client emails. Nothing is sent.',
  },
]

export function prettifyEventType(value: string) {
  return value.replace(/_/g, ' ')
}

export function getAuditScopeLabel(scope: AuditLogRecord['scope']) {
  return scope === 'admin_console' ? 'Admin' : 'Portal'
}

export function getClientLastSignInLabel(client: AdminClientRecord) {
  return client.lastSignInAt ? formatDateTime(client.lastSignInAt) : 'No sign-in yet'
}
