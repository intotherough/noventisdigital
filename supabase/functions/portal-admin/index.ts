import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  renderInvoiceEmail,
  renderWelcomeEmail,
} from '../_shared/emailTemplates.ts'
import { buildInvoicePdf } from '../_shared/invoicePdf.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
const emailFromAddress =
  Deno.env.get('EMAIL_FROM_ADDRESS') ?? 'onboarding@resend.dev'

type SendEmailResult = {
  ok: boolean
  error?: string
}

async function sendEmail(input: {
  to: string
  subject: string
  text: string
  html: string
  attachments?: Array<{ filename: string; content: string }>
}): Promise<SendEmailResult> {
  if (!resendApiKey) {
    return { ok: false, error: 'Email provider is not configured.' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFromAddress,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
        ...(input.attachments?.length ? { attachments: input.attachments } : {}),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return { ok: false, error: errorText || `Resend responded ${response.status}` }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Email send failed.',
    }
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function formatInvoiceDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

function formatInvoiceCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

const PAYMENT_DETAILS = {
  accountName: 'JM BYRNE',
  bank: 'NatWest',
  sortCode: '54-21-50',
  accountNumber: '37479903',
}

type ClientProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  company: string | null
  role: string | null
  created_at: string
  updated_at: string
}

type QuoteRow = {
  id: string
  auth_user_id: string
  title: string
  status: string | null
  updated_at: string
  documents: Array<{ url?: string | null }> | null
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function errorResponse(message: string, status = 400) {
  return jsonResponse(
    {
      ok: false,
      error: message,
    },
    status,
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function toSafeNumber(value: string | null) {
  const parsed = Number(value ?? '0')

  return Number.isFinite(parsed) ? parsed : 0
}

function parseScopeList(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(value)

    return Array.isArray(parsed)
      ? parsed.map((entry) => String(entry).trim()).filter(Boolean)
      : []
  } catch {
    return []
  }
}

async function getRequestUser(req: Request) {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    throw new Error('Missing Authorization header.')
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token)

  if (error || !user) {
    throw new Error('Unable to verify the current user.')
  }

  return user
}

function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function assertAdmin(adminClient: ReturnType<typeof createAdminClient>, userId: string) {
  const { data, error } = await adminClient
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('That account is not authorised for the admin console.')
  }
}

async function getClientProfile(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const { data, error } = await adminClient
    .from('client_profiles')
    .select('id, email, full_name, company, role, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as ClientProfileRow | null
}

async function getAdminUserIds(adminClient: ReturnType<typeof createAdminClient>) {
  const { data, error } = await adminClient.from('admin_users').select('id')

  if (error) {
    throw error
  }

  return new Set((data ?? []).map((entry) => entry.id as string))
}

async function logAdminAudit(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  eventType: string,
  input: {
    subjectUserId?: string | null
    quoteId?: string | null
    documentPath?: string | null
    metadata?: Record<string, unknown>
    request?: Request
  } = {},
) {
  const forwardedFor = input.request?.headers.get('x-forwarded-for') ?? null
  const userAgent = input.request?.headers.get('user-agent') ?? null

  const { error } = await adminClient.from('portal_audit_logs').insert({
    actor_user_id: actorUserId,
    subject_user_id: input.subjectUserId ?? null,
    scope: 'admin_console',
    event_type: eventType,
    route: '/admin',
    quote_id: input.quoteId ?? null,
    document_path: input.documentPath ?? null,
    metadata: {
      ...(input.metadata ?? {}),
      requestIp: forwardedFor,
      userAgent,
    },
  })

  if (error) {
    throw error
  }
}

function serialiseClientRecord(input: {
  profile: ClientProfileRow
  lastSignInAt: string | null
  packs: QuoteRow[]
}) {
  const sortedPacks = [...input.packs].sort((left, right) =>
    right.updated_at.localeCompare(left.updated_at),
  )

  return {
    id: input.profile.id,
    email: input.profile.email ?? '',
    name: input.profile.full_name ?? 'Client',
    company: input.profile.company ?? 'Client account',
    role: input.profile.role ?? 'Client',
    createdAt: input.profile.created_at,
    updatedAt: input.profile.updated_at,
    lastSignInAt: input.lastSignInAt,
    quoteCount: sortedPacks.length,
    latestQuoteTitle: sortedPacks[0]?.title ?? null,
    packs: sortedPacks.map((quote) => ({
      id: quote.id,
      title: quote.title,
      status: quote.status ?? 'Draft',
      updatedAt: quote.updated_at,
      documentCount: Array.isArray(quote.documents) ? quote.documents.length : 0,
    })),
  }
}

async function listClientRecords(adminClient: ReturnType<typeof createAdminClient>) {
  const adminUserIds = await getAdminUserIds(adminClient)

  const [{ data: profiles, error: profileError }, { data: quotes, error: quoteError }] =
    await Promise.all([
      adminClient
        .from('client_profiles')
        .select('id, email, full_name, company, role, created_at, updated_at')
        .order('updated_at', { ascending: false }),
      adminClient
        .from('quotes')
        .select('id, auth_user_id, title, status, updated_at, documents')
        .order('updated_at', { ascending: false }),
    ])

  if (profileError) {
    throw profileError
  }

  if (quoteError) {
    throw quoteError
  }

  const authUsers = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (authUsers.error) {
    throw authUsers.error
  }

  const lastSignInById = new Map<string, string | null>(
    (authUsers.data.users ?? []).map((user) => [user.id, user.last_sign_in_at ?? null]),
  )

  const quotesByUser = new Map<string, QuoteRow[]>()

  for (const quote of (quotes ?? []) as QuoteRow[]) {
    const nextQuotes = quotesByUser.get(quote.auth_user_id) ?? []
    nextQuotes.push(quote)
    quotesByUser.set(quote.auth_user_id, nextQuotes)
  }

  return ((profiles ?? []) as ClientProfileRow[])
    .filter((profile) => !adminUserIds.has(profile.id))
    .map((profile) =>
      serialiseClientRecord({
        profile,
        lastSignInAt: lastSignInById.get(profile.id) ?? null,
        packs: quotesByUser.get(profile.id) ?? [],
      }),
    )
}

async function listAuditLogRecords(adminClient: ReturnType<typeof createAdminClient>, limit: number) {
  const { data: logs, error } = await adminClient
    .from('portal_audit_logs')
    .select(
      'id, actor_user_id, subject_user_id, scope, event_type, route, quote_id, document_path, metadata, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  const userIds = new Set<string>()

  for (const log of logs ?? []) {
    if (typeof log.actor_user_id === 'string') {
      userIds.add(log.actor_user_id)
    }

    if (typeof log.subject_user_id === 'string') {
      userIds.add(log.subject_user_id)
    }
  }

  const profileById = new Map<string, { email: string | null; fullName: string | null }>()

  if (userIds.size) {
    const { data: profiles, error: profileError } = await adminClient
      .from('client_profiles')
      .select('id, email, full_name')
      .in('id', [...userIds])

    if (profileError) {
      throw profileError
    }

    for (const profile of profiles ?? []) {
      profileById.set(profile.id as string, {
        email: (profile.email as string | null) ?? null,
        fullName: (profile.full_name as string | null) ?? null,
      })
    }
  }

  return (logs ?? []).map((log) => ({
    id: log.id,
    scope: log.scope,
    eventType: log.event_type,
    route: log.route,
    createdAt: log.created_at,
    actorUserId: log.actor_user_id,
    actorEmail: profileById.get(log.actor_user_id)?.email ?? null,
    actorName: profileById.get(log.actor_user_id)?.fullName ?? null,
    subjectUserId: log.subject_user_id,
    subjectEmail: profileById.get(log.subject_user_id)?.email ?? null,
    subjectName: profileById.get(log.subject_user_id)?.fullName ?? null,
    quoteId: log.quote_id,
    documentPath: log.document_path,
    metadata: typeof log.metadata === 'object' && log.metadata ? log.metadata : {},
  }))
}

async function handleCreateClient(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  payload: Record<string, unknown>,
  request: Request,
) {
  const email = String(payload.email ?? '').trim().toLowerCase()
  const password = String(payload.password ?? '')
  const fullName = String(payload.fullName ?? '').trim()
  const company = String(payload.company ?? '').trim()
  const role = String(payload.role ?? 'Client').trim()
  const sendWelcomeEmail = Boolean(payload.sendWelcomeEmail)

  if (!email || !password || !fullName || !company) {
    throw new Error('Email, password, name and company are required.')
  }

  const created = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      company,
      role,
    },
  })

  if (created.error || !created.data.user) {
    throw created.error ?? new Error('Unable to create that client.')
  }

  const userId = created.data.user.id

  const { error: upsertError } = await adminClient.from('client_profiles').upsert({
    id: userId,
    email,
    full_name: fullName,
    company,
    role,
  })

  if (upsertError) {
    throw upsertError
  }

  await logAdminAudit(adminClient, actorUserId, 'client_created', {
    subjectUserId: userId,
    metadata: {
      email,
      fullName,
      company,
      role,
    },
    request,
  })

  let emailStatus: { sent: boolean; error?: string } | null = null

  if (sendWelcomeEmail) {
    const rendered = renderWelcomeEmail({
      name: fullName,
      email,
      password,
    })

    const result = await sendEmail({
      to: email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    })

    emailStatus = { sent: result.ok, error: result.error }

    await logAdminAudit(adminClient, actorUserId, 'client_welcome_email_sent', {
      subjectUserId: userId,
      metadata: {
        email,
        sent: result.ok,
        error: result.error ?? null,
      },
      request,
    })
  }

  const clientRecord = (await listClientRecords(adminClient)).find((client) => client.id === userId)

  return jsonResponse({
    ok: true,
    client: clientRecord,
    emailStatus,
  })
}

async function handleUpdateClient(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  payload: Record<string, unknown>,
  request: Request,
) {
  const userId = String(payload.userId ?? '')
  const email = String(payload.email ?? '').trim().toLowerCase()
  const fullName = String(payload.fullName ?? '').trim()
  const company = String(payload.company ?? '').trim()
  const role = String(payload.role ?? 'Client').trim()

  if (!userId || !email || !fullName || !company) {
    throw new Error('User, email, name and company are required.')
  }

  const updated = await adminClient.auth.admin.updateUserById(userId, {
    email,
    user_metadata: {
      full_name: fullName,
      company,
      role,
    },
  })

  if (updated.error) {
    throw updated.error
  }

  const { error: profileError } = await adminClient.from('client_profiles').upsert({
    id: userId,
    email,
    full_name: fullName,
    company,
    role,
  })

  if (profileError) {
    throw profileError
  }

  await logAdminAudit(adminClient, actorUserId, 'client_updated', {
    subjectUserId: userId,
    metadata: {
      email,
      fullName,
      company,
      role,
    },
    request,
  })

  const clientRecord = (await listClientRecords(adminClient)).find((client) => client.id === userId)

  return jsonResponse({
    ok: true,
    client: clientRecord,
  })
}

async function handleResetPassword(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  payload: Record<string, unknown>,
  request: Request,
) {
  const userId = String(payload.userId ?? '')
  const password = String(payload.password ?? '')

  if (!userId || !password) {
    throw new Error('User and password are required.')
  }

  const updated = await adminClient.auth.admin.updateUserById(userId, {
    password,
  })

  if (updated.error) {
    throw updated.error
  }

  await logAdminAudit(adminClient, actorUserId, 'client_password_reset', {
    subjectUserId: userId,
    request,
  })

  return jsonResponse({ ok: true })
}

async function removeStorageFolder(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const objects = await adminClient.storage.from('client-documents').list(userId, {
    limit: 1000,
    offset: 0,
  })

  if (objects.error) {
    throw objects.error
  }

  const paths = (objects.data ?? [])
    .filter((entry) => entry.name)
    .map((entry) => `${userId}/${entry.name}`)

  if (!paths.length) {
    return
  }

  const removed = await adminClient.storage.from('client-documents').remove(paths)

  if (removed.error) {
    throw removed.error
  }
}

async function handleDeleteClient(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  payload: Record<string, unknown>,
  request: Request,
) {
  const userId = String(payload.userId ?? '')

  if (!userId) {
    throw new Error('A client user id is required.')
  }

  const profile = await getClientProfile(adminClient, userId)

  if (!profile) {
    throw new Error('That client was not found.')
  }

  await logAdminAudit(adminClient, actorUserId, 'client_deleted', {
    subjectUserId: userId,
    metadata: {
      email: profile.email,
      fullName: profile.full_name,
      company: profile.company,
    },
    request,
  })

  await removeStorageFolder(adminClient, userId)

  const deleted = await adminClient.auth.admin.deleteUser(userId)

  if (deleted.error) {
    throw deleted.error
  }

  return jsonResponse({ ok: true })
}

async function handleUploadClientPack(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  request: Request,
) {
  const formData = await request.formData()
  const userId = String(formData.get('userId') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const summary = String(formData.get('summary') ?? '').trim()
  const status = String(formData.get('status') ?? 'Awaiting approval').trim()
  const validUntil = String(formData.get('validUntil') ?? '').trim()
  const timeline = String(formData.get('timeline') ?? 'TBC').trim()
  const notes = String(formData.get('notes') ?? '').trim()
  const totalAmount = toSafeNumber(String(formData.get('totalAmount') ?? '0'))
  const scope = parseScopeList(formData.get('scope'))
  const documentLabel = String(formData.get('documentLabel') ?? '').trim()
  const documentDescription = String(formData.get('documentDescription') ?? '').trim()
  const fileEntry = formData.get('file')

  if (!userId || !title || !summary) {
    throw new Error('Client, title and summary are required for a client pack.')
  }

  if (!(fileEntry instanceof File)) {
    throw new Error('A PDF file is required.')
  }

  const mimeType = fileEntry.type || 'application/pdf'
  const lowerName = fileEntry.name.toLowerCase()

  if (mimeType !== 'application/pdf' && !lowerName.endsWith('.pdf')) {
    throw new Error('Only PDF uploads are supported right now.')
  }

  const profile = await getClientProfile(adminClient, userId)

  if (!profile) {
    throw new Error('That client was not found.')
  }

  const filePath = `${userId}/${Date.now()}-${slugify(fileEntry.name || title)}.pdf`
  const uploaded = await adminClient.storage
    .from('client-documents')
    .upload(filePath, fileEntry, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploaded.error) {
    throw uploaded.error
  }

  const quoteRecord = await adminClient
    .from('quotes')
    .insert({
      auth_user_id: userId,
      client_name: profile.full_name ?? 'Client',
      client_company: profile.company ?? 'Client account',
      client_email: profile.email ?? '',
      title,
      summary,
      status: status || 'Awaiting approval',
      valid_until: validUntil || null,
      timeline: timeline || 'TBC',
      notes,
      contact_email: 'hello@noventisdigital.co.uk',
      scope,
      line_items:
        totalAmount > 0
          ? [
              {
                name: title,
                description: summary,
                amount: totalAmount,
              },
            ]
          : [],
      milestones: [],
      documents: [
        {
          label: documentLabel || fileEntry.name || title,
          url: `storage://client-documents/${filePath}`,
          kind: 'pdf',
          description: documentDescription || summary,
        },
      ],
      total_amount: totalAmount,
    })
    .select('id')
    .single()

  if (quoteRecord.error || !quoteRecord.data) {
    throw quoteRecord.error ?? new Error('Unable to save that client pack.')
  }

  await logAdminAudit(adminClient, actorUserId, 'client_pack_uploaded', {
    subjectUserId: userId,
    quoteId: quoteRecord.data.id,
    documentPath: filePath,
    metadata: {
      title,
      fileName: fileEntry.name,
      totalAmount,
    },
    request,
  })

  return jsonResponse({ ok: true })
}

type InvoiceLineItemInput = {
  description?: string
  quantity?: number | string
  unitPrice?: number | string
  amount?: number | string
}

function normaliseInvoiceLineItems(raw: unknown) {
  if (!Array.isArray(raw)) {
    return { items: [], subtotal: 0 }
  }

  const items = (raw as InvoiceLineItemInput[]).map((entry) => {
    const quantity = Number(entry.quantity ?? 1) || 0
    const unitPrice = Number(entry.unitPrice ?? 0) || 0
    const amount =
      entry.amount !== undefined && entry.amount !== null && entry.amount !== ''
        ? Number(entry.amount) || 0
        : Number((quantity * unitPrice).toFixed(2))

    return {
      description: String(entry.description ?? '').trim(),
      quantity,
      unitPrice,
      amount,
    }
  })

  const subtotal = Number(
    items.reduce((total, item) => total + item.amount, 0).toFixed(2),
  )

  return { items, subtotal }
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

const INVOICE_SELECT =
  'id, invoice_number, invoice_sequence, auth_user_id, client_name, client_company, client_email, billing_email, issue_date, due_date, line_items, notes, terms, subtotal, total_amount, currency, status, visible_to_client, pdf_path, sent_at, paid_at, created_at, updated_at'

function serialiseInvoice(row: InvoiceRow) {
  const { items, subtotal } = normaliseInvoiceLineItems(row.line_items)
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
    lineItems: items,
    notes: row.notes ?? '',
    terms: row.terms ?? '',
    subtotal: Number(row.subtotal ?? subtotal) || 0,
    totalAmount: Number(row.total_amount ?? subtotal) || 0,
    currency: row.currency ?? 'GBP',
    status: row.status,
    visibleToClient: Boolean(row.visible_to_client),
    pdfPath: row.pdf_path,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function generateAndStoreInvoicePdf(
  adminClient: ReturnType<typeof createAdminClient>,
  invoice: ReturnType<typeof serialiseInvoice>,
): Promise<string | null> {
  if (!invoice.authUserId) {
    return null
  }

  const pdfBytes = await buildInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
    clientCompany: invoice.clientCompany,
    billingEmail: invoice.billingEmail,
    clientEmail: invoice.clientEmail,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    lineItems: invoice.lineItems,
    subtotal: invoice.subtotal,
    totalAmount: invoice.totalAmount,
    currency: invoice.currency,
    notes: invoice.notes,
    terms: invoice.terms,
  })

  const path = `invoices/${invoice.authUserId}/invoice-${invoice.invoiceNumber}.pdf`

  const upload = await adminClient.storage
    .from('client-documents')
    .upload(path, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (upload.error) {
    throw upload.error
  }

  const { error: updateError } = await adminClient
    .from('invoices')
    .update({ pdf_path: path })
    .eq('id', invoice.id)

  if (updateError) {
    throw updateError
  }

  return path
}

async function listInvoices(adminClient: ReturnType<typeof createAdminClient>) {
  const { data, error } = await adminClient
    .from('invoices')
    .select(
      INVOICE_SELECT,
    )
    .order('invoice_sequence', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => serialiseInvoice(row as InvoiceRow))
}

async function handleCreateInvoice(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  payload: Record<string, unknown>,
  request: Request,
) {
  const authUserId = String(payload.authUserId ?? '')
  const billingEmail = String(payload.billingEmail ?? '').trim()
  const issueDate = String(payload.issueDate ?? '').trim()
  const dueDate = String(payload.dueDate ?? '').trim()
  const notes = String(payload.notes ?? '').trim()
  const terms =
    String(payload.terms ?? '').trim() ||
    'Payment due within 14 days of invoice date.'

  if (!authUserId || !issueDate || !dueDate) {
    throw new Error('Client, issue date and due date are required.')
  }

  const profile = await getClientProfile(adminClient, authUserId)
  if (!profile) {
    throw new Error('That client was not found.')
  }

  const { items, subtotal } = normaliseInvoiceLineItems(payload.lineItems)

  if (!items.length) {
    throw new Error('At least one line item is required.')
  }

  const { data, error } = await adminClient
    .from('invoices')
    .insert({
      auth_user_id: authUserId,
      client_name: profile.full_name ?? 'Client',
      client_company: profile.company ?? 'Client account',
      client_email: profile.email ?? '',
      billing_email: billingEmail || null,
      issue_date: issueDate,
      due_date: dueDate,
      line_items: items,
      notes,
      terms,
      subtotal,
      total_amount: subtotal,
      currency: 'GBP',
      status: 'draft',
      visible_to_client: false,
    })
    .select(
      INVOICE_SELECT,
    )
    .single()

  if (error || !data) {
    throw error ?? new Error('Unable to create the invoice.')
  }

  const invoice = serialiseInvoice(data as InvoiceRow)

  try {
    const pdfPath = await generateAndStoreInvoicePdf(adminClient, invoice)
    if (pdfPath) {
      invoice.pdfPath = pdfPath
    }
  } catch (pdfError) {
    console.error('Failed to generate invoice PDF', pdfError)
  }

  await logAdminAudit(adminClient, actorUserId, 'invoice_created', {
    subjectUserId: authUserId,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      pdfPath: invoice.pdfPath,
    },
    request,
  })

  return jsonResponse({ ok: true, invoice })
}

async function handleRegenerateInvoicePdf(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  payload: Record<string, unknown>,
  request: Request,
) {
  const invoiceId = String(payload.invoiceId ?? '')
  if (!invoiceId) {
    throw new Error('Invoice id is required.')
  }

  const { data, error } = await adminClient
    .from('invoices')
    .select(INVOICE_SELECT)
    .eq('id', invoiceId)
    .single()

  if (error || !data) {
    throw error ?? new Error('Invoice not found.')
  }

  const invoice = serialiseInvoice(data as InvoiceRow)
  const pdfPath = await generateAndStoreInvoicePdf(adminClient, invoice)
  if (pdfPath) {
    invoice.pdfPath = pdfPath
  }

  await logAdminAudit(adminClient, actorUserId, 'invoice_pdf_regenerated', {
    subjectUserId: invoice.authUserId,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      pdfPath: invoice.pdfPath,
    },
    request,
  })

  return jsonResponse({ ok: true, invoice })
}

async function handleUpdateInvoiceStatus(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  payload: Record<string, unknown>,
  request: Request,
) {
  const invoiceId = String(payload.invoiceId ?? '')
  const status = String(payload.status ?? '')

  if (!invoiceId || !status) {
    throw new Error('Invoice id and status are required.')
  }

  if (!['draft', 'sent', 'paid', 'cancelled'].includes(status)) {
    throw new Error('Invalid invoice status.')
  }

  const patch: Record<string, unknown> = { status }
  if (status === 'sent') {
    patch.sent_at = new Date().toISOString()
  }
  if (status === 'paid') {
    patch.paid_at = new Date().toISOString()
  }

  const { data, error } = await adminClient
    .from('invoices')
    .update(patch)
    .eq('id', invoiceId)
    .select(
      INVOICE_SELECT,
    )
    .single()

  if (error || !data) {
    throw error ?? new Error('Unable to update the invoice.')
  }

  const invoice = serialiseInvoice(data as InvoiceRow)

  await logAdminAudit(adminClient, actorUserId, 'invoice_status_updated', {
    subjectUserId: invoice.authUserId,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status,
    },
    request,
  })

  return jsonResponse({ ok: true, invoice })
}

async function handleSendInvoice(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  payload: Record<string, unknown>,
  request: Request,
) {
  const invoiceId = String(payload.invoiceId ?? '')
  if (!invoiceId) {
    throw new Error('Invoice id is required.')
  }

  const { data, error } = await adminClient
    .from('invoices')
    .select(INVOICE_SELECT)
    .eq('id', invoiceId)
    .single()

  if (error || !data) {
    throw error ?? new Error('Invoice not found.')
  }

  const invoice = serialiseInvoice(data as InvoiceRow)

  if (invoice.status === 'cancelled') {
    throw new Error('Cannot send a cancelled invoice.')
  }

  const recipient = (invoice.billingEmail || invoice.clientEmail || '').trim()
  if (!recipient) {
    throw new Error('This client has no email address to send the invoice to.')
  }

  let pdfPath = invoice.pdfPath
  if (!pdfPath) {
    pdfPath = (await generateAndStoreInvoicePdf(adminClient, invoice)) ?? null
    if (pdfPath) {
      invoice.pdfPath = pdfPath
    }
  }

  if (!pdfPath) {
    throw new Error('Unable to generate an invoice PDF for sending.')
  }

  const download = await adminClient.storage
    .from('client-documents')
    .download(pdfPath)

  if (download.error || !download.data) {
    throw download.error ?? new Error('Unable to read the stored invoice PDF.')
  }

  const pdfBytes = new Uint8Array(await download.data.arrayBuffer())
  const pdfBase64 = uint8ToBase64(pdfBytes)

  const rendered = renderInvoiceEmail({
    clientName: invoice.clientName || 'there',
    invoiceNumber: invoice.invoiceNumber,
    totalFormatted: formatInvoiceCurrency(invoice.totalAmount, invoice.currency),
    issueDateFormatted: formatInvoiceDate(invoice.issueDate),
    dueDateFormatted: formatInvoiceDate(invoice.dueDate),
    accountName: PAYMENT_DETAILS.accountName,
    bank: PAYMENT_DETAILS.bank,
    sortCode: PAYMENT_DETAILS.sortCode,
    accountNumber: PAYMENT_DETAILS.accountNumber,
  })

  const result = await sendEmail({
    to: recipient,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBase64,
      },
    ],
  })

  if (!result.ok) {
    await logAdminAudit(adminClient, actorUserId, 'invoice_send_failed', {
      subjectUserId: invoice.authUserId,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        recipient,
        error: result.error ?? null,
      },
      request,
    })
    throw new Error(result.error ?? 'Unable to send the invoice email.')
  }

  const patch: Record<string, unknown> = { sent_at: new Date().toISOString() }
  if (invoice.status === 'draft') {
    patch.status = 'sent'
  }

  const update = await adminClient
    .from('invoices')
    .update(patch)
    .eq('id', invoiceId)
    .select(INVOICE_SELECT)
    .single()

  if (update.error || !update.data) {
    throw update.error ?? new Error('Unable to update the invoice after sending.')
  }

  const updatedInvoice = serialiseInvoice(update.data as InvoiceRow)

  await logAdminAudit(adminClient, actorUserId, 'invoice_sent', {
    subjectUserId: updatedInvoice.authUserId,
    metadata: {
      invoiceId: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoiceNumber,
      recipient,
    },
    request,
  })

  return jsonResponse({ ok: true, invoice: updatedInvoice, recipient })
}

async function handleToggleInvoiceVisibility(
  adminClient: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  payload: Record<string, unknown>,
  request: Request,
) {
  const invoiceId = String(payload.invoiceId ?? '')
  const visible = Boolean(payload.visible)

  if (!invoiceId) {
    throw new Error('Invoice id is required.')
  }

  const { data, error } = await adminClient
    .from('invoices')
    .update({ visible_to_client: visible })
    .eq('id', invoiceId)
    .select(
      INVOICE_SELECT,
    )
    .single()

  if (error || !data) {
    throw error ?? new Error('Unable to update the invoice.')
  }

  const invoice = serialiseInvoice(data as InvoiceRow)

  await logAdminAudit(adminClient, actorUserId, 'invoice_visibility_updated', {
    subjectUserId: invoice.authUserId,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      visible,
    },
    request,
  })

  return jsonResponse({ ok: true, invoice })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const currentUser = await getRequestUser(request)
    const adminClient = createAdminClient()
    await assertAdmin(adminClient, currentUser.id)

    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      return await handleUploadClientPack(adminClient, currentUser.id, request)
    }

    const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const action = String(payload.action ?? '')

    switch (action) {
      case 'listClients': {
        const clients = await listClientRecords(adminClient)
        return jsonResponse({ ok: true, clients })
      }

      case 'listAuditLogs': {
        const limit = Math.min(Math.max(Number(payload.limit ?? 80), 1), 250)
        const auditLogs = await listAuditLogRecords(adminClient, limit)
        return jsonResponse({ ok: true, auditLogs })
      }

      case 'createClient':
        return await handleCreateClient(adminClient, currentUser.id, payload, request)

      case 'updateClient':
        return await handleUpdateClient(adminClient, currentUser.id, payload, request)

      case 'resetClientPassword':
        return await handleResetPassword(adminClient, currentUser.id, payload, request)

      case 'deleteClient':
        return await handleDeleteClient(adminClient, currentUser.id, payload, request)

      case 'listInvoices': {
        const invoices = await listInvoices(adminClient)
        return jsonResponse({ ok: true, invoices })
      }

      case 'createInvoice':
        return await handleCreateInvoice(adminClient, currentUser.id, payload, request)

      case 'regenerateInvoicePdf':
        return await handleRegenerateInvoicePdf(adminClient, currentUser.id, payload, request)

      case 'sendInvoice':
        return await handleSendInvoice(adminClient, currentUser.id, payload, request)

      case 'updateInvoiceStatus':
        return await handleUpdateInvoiceStatus(adminClient, currentUser.id, payload, request)

      case 'toggleInvoiceVisibility':
        return await handleToggleInvoiceVisibility(adminClient, currentUser.id, payload, request)

      default:
        return errorResponse('Unknown admin action.', 404)
    }
  } catch (error) {
    console.error(error)
    return errorResponse(error instanceof Error ? error.message : 'Admin request failed.', 400)
  }
})
