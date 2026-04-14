import type { Session } from '@supabase/supabase-js'
import { demoClients, demoQuotes } from '../data/demoPortal'
import type {
  ClientUpload,
  Invoice,
  InvoiceLineItem,
  Milestone,
  PortalClient,
  PortalMode,
  QuoteAttachment,
  QuoteDocument,
  QuoteItem,
} from '../types'
import { hasSupabase, supabase } from './supabase'

const CLIENT_UPLOADS_BUCKET = 'client-uploads'
const CLIENT_DOCUMENTS_BUCKET = 'client-documents'

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
  documents: QuoteAttachment[] | null
  total_amount: number | null
}

type ClientProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  company: string | null
  role: string | null
}

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

function mapUploadRow(row: ClientUploadRow): ClientUpload {
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

function sanitiseFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file'
}

type InvoiceRow = {
  id: string
  invoice_number: string
  invoice_sequence: number
  auth_user_id: string | null
  client_name: string
  client_company: string
  client_email: string
  billing_email: string | null
  issue_date: string
  due_date: string
  line_items: unknown
  notes: string | null
  terms: string | null
  subtotal: string | number | null
  total_amount: string | number | null
  currency: string | null
  status: string
  visible_to_client: boolean
  pdf_path: string | null
  sent_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

function normaliseInvoiceLineItems(raw: unknown): InvoiceLineItem[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((entry) => {
    const record = entry as Record<string, unknown>
    const quantity = Number(record.quantity ?? 0) || 0
    const unitPrice = Number(record.unitPrice ?? 0) || 0
    const amount =
      record.amount !== undefined && record.amount !== null && record.amount !== ''
        ? Number(record.amount) || 0
        : Number((quantity * unitPrice).toFixed(2))
    return {
      description: String(record.description ?? ''),
      quantity,
      unitPrice,
      amount,
    }
  })
}

function mapInvoiceRow(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    invoiceSequence: row.invoice_sequence,
    authUserId: row.auth_user_id,
    clientName: row.client_name,
    clientCompany: row.client_company,
    clientEmail: row.client_email,
    billingEmail: row.billing_email,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    lineItems: normaliseInvoiceLineItems(row.line_items),
    notes: row.notes ?? '',
    terms: row.terms ?? '',
    subtotal: Number(row.subtotal ?? 0) || 0,
    totalAmount: Number(row.total_amount ?? 0) || 0,
    currency: row.currency ?? 'GBP',
    status: row.status as Invoice['status'],
    visibleToClient: Boolean(row.visible_to_client),
    pdfPath: row.pdf_path,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const portalMode: PortalMode = hasSupabase ? 'live' : 'demo'

type ResolvedDocumentAsset = {
  url: string
  revokeOnDispose: boolean
}

type PortalAuditInput = {
  actorUserId?: string
  subjectUserId?: string | null
  scope?: 'client_portal' | 'admin_console'
  route?: string | null
  quoteId?: string | null
  documentPath?: string | null
  metadata?: Record<string, unknown>
}

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

function normaliseDocuments(documents: QuoteAttachment[] | null | undefined) {
  if (!Array.isArray(documents)) {
    return []
  }

  return documents.map((document) => ({
    label: document.label,
    url: document.url,
    kind:
      document.kind === 'pdf' || document.kind === 'doc' || document.kind === 'link'
        ? document.kind
        : 'link',
    description: document.description,
  }))
}

function parseStorageDocumentUrl(url: string) {
  if (!url.startsWith('storage://')) {
    return null
  }

  const reference = url.slice('storage://'.length)
  const slashIndex = reference.indexOf('/')

  if (slashIndex === -1) {
    return null
  }

  const bucket = reference.slice(0, slashIndex)
  const path = reference.slice(slashIndex + 1)

  if (!bucket || !path) {
    return null
  }

  return { bucket, path }
}

function getDefaultRoute() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.location.pathname
}

async function insertPortalAuditEvent(
  eventType: string,
  input: PortalAuditInput = {},
) {
  if (!supabase) {
    return
  }

  let actorUserId = input.actorUserId

  if (!actorUserId) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    actorUserId = session?.user.id
  }

  if (!actorUserId) {
    return
  }

  const { error } = await supabase.from('portal_audit_logs').insert({
    actor_user_id: actorUserId,
    subject_user_id: input.subjectUserId ?? actorUserId,
    scope: input.scope ?? 'client_portal',
    event_type: eventType,
    route: input.route ?? getDefaultRoute(),
    quote_id: input.quoteId ?? null,
    document_path: input.documentPath ?? null,
    metadata: input.metadata ?? {},
  })

  if (error) {
    throw error
  }
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
    documents: normaliseDocuments(row.documents),
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

    void insertPortalAuditEvent('portal_signed_in', {
      actorUserId: data.session?.user.id,
      metadata: {
        email: client.email,
      },
    }).catch((error) => {
      console.error('Failed to write portal sign-in audit event', error)
    })

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
    const {
      data: { session },
    } = await supabase.auth.getSession()

    void insertPortalAuditEvent('portal_signed_out', {
      actorUserId: session?.user.id,
      metadata: {
        route: getDefaultRoute(),
      },
    }).catch((error) => {
      console.error('Failed to write portal sign-out audit event', error)
    })

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
        'id, auth_user_id, client_name, client_company, client_email, title, summary, status, valid_until, timeline, notes, contact_email, scope, line_items, milestones, documents, total_amount',
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

export async function resolveDocumentAssetUrl(
  document: QuoteAttachment,
): Promise<ResolvedDocumentAsset> {
  const storageReference = parseStorageDocumentUrl(document.url)

  if (storageReference) {
    if (!supabase) {
      throw new Error('Secure document access is not available right now.')
    }

    const { data, error } = await supabase.storage
      .from(storageReference.bucket)
      .download(storageReference.path)

    if (error) {
      throw error
    }

    return {
      url: URL.createObjectURL(data),
      revokeOnDispose: true,
    }
  }

  return {
    url: document.url,
    revokeOnDispose: false,
  }
}

export async function logPortalAuditEvent(
  eventType: string,
  input: PortalAuditInput = {},
) {
  try {
    await insertPortalAuditEvent(eventType, input)
  } catch (error) {
    console.error(`Failed to write audit event: ${eventType}`, error)
  }
}

export function getDocumentStoragePath(document: QuoteAttachment) {
  const reference = parseStorageDocumentUrl(document.url)

  return reference?.path ?? document.url
}

export async function listClientUploads(
  clientId: string,
  quoteId?: string | null,
): Promise<ClientUpload[]> {
  if (!hasSupabase || !supabase) {
    return []
  }

  let query = supabase
    .from('client_uploads')
    .select(
      'id, auth_user_id, quote_id, file_path, file_name, file_size, content_type, notes, created_at',
    )
    .eq('auth_user_id', clientId)
    .order('created_at', { ascending: false })

  if (quoteId) {
    query = query.eq('quote_id', quoteId)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapUploadRow(row as ClientUploadRow))
}

export async function uploadClientFile(input: {
  clientId: string
  quoteId: string | null
  file: File
  notes?: string
}): Promise<ClientUpload> {
  if (!hasSupabase || !supabase) {
    throw new Error('Uploads are only available once the portal is connected to Supabase.')
  }

  const timestamp = Date.now()
  const safeName = sanitiseFileName(input.file.name)
  const filePath = `${input.clientId}/${timestamp}-${safeName}`

  const { error: storageError } = await supabase.storage
    .from(CLIENT_UPLOADS_BUCKET)
    .upload(filePath, input.file, {
      contentType: input.file.type || 'application/octet-stream',
      upsert: false,
    })

  if (storageError) {
    throw storageError
  }

  const { data, error } = await supabase
    .from('client_uploads')
    .insert({
      auth_user_id: input.clientId,
      quote_id: input.quoteId,
      file_path: filePath,
      file_name: input.file.name,
      file_size: input.file.size,
      content_type: input.file.type || null,
      notes: input.notes ?? '',
    })
    .select(
      'id, auth_user_id, quote_id, file_path, file_name, file_size, content_type, notes, created_at',
    )
    .single()

  if (error || !data) {
    await supabase.storage
      .from(CLIENT_UPLOADS_BUCKET)
      .remove([filePath])
      .catch(() => {})
    throw error ?? new Error('Upload metadata could not be saved.')
  }

  void insertPortalAuditEvent('client_file_uploaded', {
    quoteId: input.quoteId ?? undefined,
    documentPath: filePath,
    metadata: {
      fileName: input.file.name,
      fileSize: input.file.size,
      contentType: input.file.type,
    },
  }).catch((error) => {
    console.error('Failed to write client_file_uploaded audit event', error)
  })

  return mapUploadRow(data as ClientUploadRow)
}

export async function resolveClientUploadAssetUrl(
  upload: ClientUpload,
): Promise<{ url: string; revokeOnDispose: boolean }> {
  if (!supabase) {
    throw new Error('Secure upload access is not available right now.')
  }

  const { data, error } = await supabase.storage
    .from(CLIENT_UPLOADS_BUCKET)
    .download(upload.filePath)

  if (error) {
    throw error
  }

  return {
    url: URL.createObjectURL(data),
    revokeOnDispose: true,
  }
}

export async function listClientInvoices(): Promise<Invoice[]> {
  if (!hasSupabase || !supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('invoices')
    .select(
      'id, invoice_number, invoice_sequence, auth_user_id, client_name, client_company, client_email, billing_email, issue_date, due_date, line_items, notes, terms, subtotal, total_amount, currency, status, visible_to_client, pdf_path, sent_at, paid_at, created_at, updated_at',
    )
    .order('invoice_sequence', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapInvoiceRow(row as InvoiceRow))
}

export async function downloadClientInvoicePdfBlob(path: string): Promise<Blob> {
  if (!supabase) {
    throw new Error('Secure invoice access is not available right now.')
  }

  const { data, error } = await supabase.storage
    .from(CLIENT_DOCUMENTS_BUCKET)
    .download(path)

  if (error) {
    throw error
  }

  return data
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
