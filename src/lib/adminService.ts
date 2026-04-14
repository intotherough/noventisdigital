import type { AuthError, Session } from '@supabase/supabase-js'
import type {
  AdminClientRecord,
  AdminUser,
  AuditLogRecord,
  ClientUpload,
  CreateClientInput,
  CreateInvoiceInput,
  Invoice,
  ResetClientPasswordInput,
  ToggleInvoiceVisibilityInput,
  UpdateClientInput,
  UpdateInvoiceStatusInput,
  UploadClientPackInput,
} from '../types'
import { hasSupabase, supabase, supabaseUrl } from './supabase'

const CLIENT_UPLOADS_BUCKET = 'client-uploads'

type ClientUploadRow = {
  id: string
  auth_user_id: string
  quote_id: string | null
  file_path: string
  file_name: string
  file_size: number | null
  content_type: string | null
  notes: string | null
  created_at: string
}

function mapAdminUploadRow(row: ClientUploadRow): ClientUpload {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    quoteId: row.quote_id,
    filePath: row.file_path,
    fileName: row.file_name,
    fileSize: row.file_size,
    contentType: row.content_type,
    notes: row.notes ?? '',
    createdAt: row.created_at,
  }
}

type AdminFunctionPayload = {
  ok?: boolean
  error?: string
  admin?: AdminUser
  clients?: AdminClientRecord[]
  auditLogs?: AuditLogRecord[]
  client?: AdminClientRecord
  invoices?: Invoice[]
  invoice?: Invoice
}

function getAdminNameFromSession(session: Session) {
  return (
    session.user.user_metadata.full_name ??
    session.user.user_metadata.name ??
    session.user.email?.split('@')[0] ??
    'Admin'
  )
}

function getFunctionUrl() {
  if (!hasSupabase || !supabase) {
    throw new Error('Supabase is not configured for admin access.')
  }

  if (!supabaseUrl) {
    throw new Error('Supabase URL is not configured for admin access.')
  }

  return `${new URL(supabaseUrl).origin}/functions/v1/portal-admin`
}

function normaliseFunctionError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'The admin function returned an unexpected error.'
}

async function requireSession() {
  if (!supabase) {
    throw new Error('Supabase is not configured for admin access.')
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  if (!session) {
    throw new Error('You must be signed in to access the admin console.')
  }

  return session
}

async function invokeAdminAction<T extends AdminFunctionPayload>(
  action: string,
  payload: Record<string, unknown> = {},
) {
  const session = await requireSession()
  const response = await fetch(getFunctionUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      ...payload,
    }),
  })

  const result = (await response
    .json()
    .catch(() => null)) as T | null

  if (!response.ok || !result?.ok) {
    throw new Error(result?.error ?? 'Admin action failed.')
  }

  return result
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  if (!hasSupabase || !supabase) {
    return null
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  if (!session?.user) {
    return null
  }

  const { data: adminRow, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', session.user.id)
    .maybeSingle()

  if (adminError) {
    throw adminError
  }

  if (!adminRow) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: getAdminNameFromSession(session),
  }
}

export async function signInAdmin(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured for admin access.')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  const admin = await getCurrentAdmin()

  if (!admin) {
    await supabase.auth.signOut()
    throw new Error('That account is not authorised for the admin console.')
  }

  return admin
}

export async function signOutAdmin() {
  if (!supabase) {
    return
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function listAdminClients() {
  const result = await invokeAdminAction<{ ok: true; clients: AdminClientRecord[] }>(
    'listClients',
  )

  return result.clients ?? []
}

export async function listAuditLogs(limit = 80) {
  const result = await invokeAdminAction<{ ok: true; auditLogs: AuditLogRecord[] }>(
    'listAuditLogs',
    { limit },
  )

  return result.auditLogs ?? []
}

export async function createClient(input: CreateClientInput) {
  const result = await invokeAdminAction<{ ok: true; client: AdminClientRecord }>(
    'createClient',
    input,
  )

  return result.client
}

export async function updateClient(input: UpdateClientInput) {
  const result = await invokeAdminAction<{ ok: true; client: AdminClientRecord }>(
    'updateClient',
    input,
  )

  return result.client
}

export async function resetClientPassword(input: ResetClientPasswordInput) {
  await invokeAdminAction('resetClientPassword', input)
}

export async function deleteClient(userId: string) {
  await invokeAdminAction('deleteClient', { userId })
}

export async function uploadClientPack(input: UploadClientPackInput) {
  const session = await requireSession()
  const formData = new FormData()

  formData.set('action', 'uploadClientPack')
  formData.set('userId', input.userId)
  formData.set('title', input.title)
  formData.set('summary', input.summary)
  formData.set('status', input.status)
  formData.set('validUntil', input.validUntil)
  formData.set('timeline', input.timeline)
  formData.set('notes', input.notes)
  formData.set('totalAmount', String(input.totalAmount))
  formData.set('scope', JSON.stringify(input.scope))
  formData.set('documentLabel', input.documentLabel)
  formData.set('documentDescription', input.documentDescription)
  formData.set('file', input.file)

  const response = await fetch(getFunctionUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'x-region': 'eu-west-2',
    },
    body: formData,
  })

  const result = (await response.json().catch(() => null)) as AdminFunctionPayload | null

  if (!response.ok || !result?.ok) {
    throw new Error(result?.error ?? 'Pack upload failed.')
  }
}

export async function listInvoices(): Promise<Invoice[]> {
  const result = await invokeAdminAction<{ ok: true; invoices: Invoice[] }>(
    'listInvoices',
  )
  return result.invoices ?? []
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const result = await invokeAdminAction<{ ok: true; invoice: Invoice }>(
    'createInvoice',
    input as unknown as Record<string, unknown>,
  )
  if (!result.invoice) {
    throw new Error('Invoice was not returned by the admin function.')
  }
  return result.invoice
}

export async function updateInvoiceStatus(
  input: UpdateInvoiceStatusInput,
): Promise<Invoice> {
  const result = await invokeAdminAction<{ ok: true; invoice: Invoice }>(
    'updateInvoiceStatus',
    input as unknown as Record<string, unknown>,
  )
  if (!result.invoice) {
    throw new Error('Invoice was not returned by the admin function.')
  }
  return result.invoice
}

export async function toggleInvoiceVisibility(
  input: ToggleInvoiceVisibilityInput,
): Promise<Invoice> {
  const result = await invokeAdminAction<{ ok: true; invoice: Invoice }>(
    'toggleInvoiceVisibility',
    input as unknown as Record<string, unknown>,
  )
  if (!result.invoice) {
    throw new Error('Invoice was not returned by the admin function.')
  }
  return result.invoice
}

export async function listClientUploadsForUser(userId: string): Promise<ClientUpload[]> {
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('client_uploads')
    .select(
      'id, auth_user_id, quote_id, file_path, file_name, file_size, content_type, notes, created_at',
    )
    .eq('auth_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapAdminUploadRow(row as ClientUploadRow))
}

export async function downloadClientUploadAsBlob(filePath: string): Promise<Blob> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.storage
    .from(CLIENT_UPLOADS_BUCKET)
    .download(filePath)

  if (error) {
    throw error
  }

  return data
}

export function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as AuthError).message)
  }

  return normaliseFunctionError(error)
}
