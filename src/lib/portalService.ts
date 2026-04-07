import type { Session } from '@supabase/supabase-js'
import { demoClients, demoQuotes } from '../data/demoPortal'
import type {
  Milestone,
  PortalClient,
  PortalMode,
  QuoteDocument,
  QuoteItem,
} from '../types'
import { hasSupabase, supabase } from './supabase'

const demoSessionKey = 'noventis-digital-demo-session'

type QuoteRow = {
  id: string
  auth_user_id: string
  client_name: string | null
  client_company: string | null
  client_email: string | null
  title: string
  summary: string | null
  status: string | null
  valid_until: string | null
  timeline: string | null
  notes: string | null
  contact_email: string | null
  scope: string[] | null
  line_items: QuoteItem[] | null
  milestones: Milestone[] | null
  total_amount: number | null
}

type ClientProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  company: string | null
  role: string | null
}

export const portalMode: PortalMode = hasSupabase ? 'live' : 'demo'

function deriveNameFromEmail(email: string | undefined) {
  if (!email) {
    return 'Client'
  }

  const localPart = email.split('@')[0] ?? 'client'

  return localPart
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mapSessionToFallbackClient(session: Session | null): PortalClient | null {
  if (!session?.user) {
    return null
  }

  const name =
    session.user.user_metadata.full_name ??
    session.user.user_metadata.name ??
    deriveNameFromEmail(session.user.email)

  const company =
    session.user.user_metadata.company ?? session.user.user_metadata.organisation

  return {
    id: session.user.id,
    name,
    company: company ?? 'Client account',
    email: session.user.email ?? '',
    role: 'Client',
  }
}

function mapProfileToClient(
  profile: ClientProfileRow,
  fallback: PortalClient,
): PortalClient {
  return {
    id: profile.id,
    name: profile.full_name ?? fallback.name,
    company: profile.company ?? fallback.company,
    email: profile.email ?? fallback.email,
    role: profile.role ?? fallback.role,
  }
}

async function getLiveClientFromSession(
  session: Session | null,
): Promise<PortalClient | null> {
  const fallback = mapSessionToFallbackClient(session)

  if (!fallback || !supabase) {
    return fallback
  }

  const { data, error } = await supabase
    .from('client_profiles')
    .select('id, email, full_name, company, role')
    .eq('id', fallback.id)
    .maybeSingle()

  if (error || !data) {
    return fallback
  }

  return mapProfileToClient(data as ClientProfileRow, fallback)
}

function normaliseItems(items: QuoteItem[] | null | undefined) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => ({
    name: item.name,
    description: item.description,
    amount: Number(item.amount) || 0,
  }))
}

function normaliseMilestones(milestones: Milestone[] | null | undefined) {
  if (!Array.isArray(milestones)) {
    return []
  }

  return milestones.map((milestone) => ({
    label: milestone.label,
    due: milestone.due,
    status:
      milestone.status === 'done' ||
      milestone.status === 'current' ||
      milestone.status === 'next'
        ? milestone.status
        : 'next',
  }))
}

function normaliseQuote(row: QuoteRow): QuoteDocument {
  return {
    id: row.id,
    clientId: row.auth_user_id,
    title: row.title,
    company: row.client_company ?? 'Client account',
    summary: row.summary ?? '',
    status: row.status ?? 'Draft',
    amount: Number(row.total_amount) || 0,
    validUntil: row.valid_until ?? '',
    timeline: row.timeline ?? 'TBC',
    notes: row.notes ?? '',
    contactEmail: row.contact_email ?? 'hello@noventisdigital.co.uk',
    scope: Array.isArray(row.scope) ? row.scope : [],
    items: normaliseItems(row.line_items),
    milestones: normaliseMilestones(row.milestones),
  }
}

export async function getCurrentClient(): Promise<PortalClient | null> {
  if (hasSupabase && supabase) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    return getLiveClientFromSession(session)
  }

  if (typeof window === 'undefined') {
    return null
  }

  const savedClientId = window.localStorage.getItem(demoSessionKey)

  return demoClients.find((client) => client.id === savedClientId) ?? null
}

export async function signInClient(
  email: string,
  password: string,
): Promise<PortalClient> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    const client = await getLiveClientFromSession(data.session)

    if (!client) {
      throw new Error('Unable to load that client account.')
    }

    return client
  }

  const client = demoClients.find(
    (entry) =>
      entry.email.toLowerCase() === email.trim().toLowerCase() &&
      entry.password === password,
  )

  if (!client) {
    throw new Error('Those credentials did not match a client account.')
  }

  window.localStorage.setItem(demoSessionKey, client.id)
  return client
}

export async function signOutClient(): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    return
  }

  window.localStorage.removeItem(demoSessionKey)
}

export async function getQuotesForClient(
  clientId: string,
): Promise<QuoteDocument[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from('quotes')
      .select(
        'id, auth_user_id, client_name, client_company, client_email, title, summary, status, valid_until, timeline, notes, contact_email, scope, line_items, milestones, total_amount',
      )
      .eq('auth_user_id', clientId)
      .order('updated_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => normaliseQuote(row as QuoteRow))
  }

  return demoQuotes.filter((quote) => quote.clientId === clientId)
}

export function subscribeToAuth(
  callback: (client: PortalClient | null) => void | Promise<void>,
) {
  if (!hasSupabase || !supabase) {
    return () => {}
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    void (async () => {
      const client = await getLiveClientFromSession(session)
      await callback(client)
    })()
  })

  return () => {
    subscription.unsubscribe()
  }
}
