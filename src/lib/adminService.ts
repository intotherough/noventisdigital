import type { AuthError, Session } from '@supabase/supabase-js'
import type {
  AdminClientRecord,
  AdminUser,
  AuditLogRecord,
  CreateClientInput,
  ResetClientPasswordInput,
  UpdateClientInput,
  UploadClientPackInput,
} from '../types'
import { hasSupabase, supabase, supabaseUrl } from './supabase'

type AdminFunctionPayload = {
  ok?: boolean
  error?: string
  admin?: AdminUser
  clients?: AdminClientRecord[]
  auditLogs?: AuditLogRecord[]
  client?: AdminClientRecord
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

export function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as AuthError).message)
  }

  return normaliseFunctionError(error)
}
