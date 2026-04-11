import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  renderClientUploadEmail,
  renderFirstLoginNotification,
  renderQuoteViewedNotification,
} from '../_shared/emailTemplates.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
const emailFromAddress =
  Deno.env.get('EMAIL_FROM_ADDRESS') ?? 'onboarding@resend.dev'
const adminNotificationEmail =
  Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? 'hello@noventisdigital.co.uk'
const webhookSecret = Deno.env.get('WEBHOOK_SECRET') ?? ''

type AuditLogRecord = {
  id: string
  actor_user_id: string
  subject_user_id: string | null
  scope: string
  event_type: string
  route: string | null
  quote_id: string | null
  document_path: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table?: string
  schema?: string
  record?: AuditLogRecord
  old_record?: AuditLogRecord | null
}

function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function sendEmail(input: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<{ ok: boolean; error?: string }> {
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

async function getClientProfile(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<{ id: string; name: string; company: string; email: string } | null> {
  const { data, error } = await adminClient
    .from('client_profiles')
    .select('id, full_name, company, email')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return {
    id: data.id as string,
    name: (data.full_name as string) ?? 'Client',
    company: (data.company as string) ?? 'Client account',
    email: (data.email as string) ?? '',
  }
}

async function countMatchingAuditEvents(
  adminClient: ReturnType<typeof createAdminClient>,
  filters: {
    actorUserId: string
    eventType: string
    quoteId?: string | null
  },
): Promise<number> {
  let query = adminClient
    .from('portal_audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('actor_user_id', filters.actorUserId)
    .eq('event_type', filters.eventType)

  if (filters.quoteId) {
    query = query.eq('quote_id', filters.quoteId)
  }

  const { count, error } = await query

  if (error) {
    throw error
  }

  return count ?? 0
}

async function getQuoteTitle(
  adminClient: ReturnType<typeof createAdminClient>,
  quoteId: string,
): Promise<string | null> {
  const { data, error } = await adminClient
    .from('quotes')
    .select('title')
    .eq('id', quoteId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return (data.title as string) ?? null
}

async function handlePortalSignedIn(
  adminClient: ReturnType<typeof createAdminClient>,
  record: AuditLogRecord,
) {
  const count = await countMatchingAuditEvents(adminClient, {
    actorUserId: record.actor_user_id,
    eventType: 'portal_signed_in',
  })

  if (count !== 1) {
    return { skipped: true, reason: `Not first sign-in (count ${count}).` }
  }

  const profile = await getClientProfile(adminClient, record.actor_user_id)
  if (!profile) {
    return { skipped: true, reason: 'Client profile not found.' }
  }

  const rendered = renderFirstLoginNotification({
    clientName: profile.name,
    clientCompany: profile.company,
    clientId: profile.id,
  })

  const result = await sendEmail({
    to: adminNotificationEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  })

  return { sent: true, result }
}

async function handleQuoteViewed(
  adminClient: ReturnType<typeof createAdminClient>,
  record: AuditLogRecord,
) {
  if (!record.quote_id) {
    return { skipped: true, reason: 'No quote_id on record.' }
  }

  const count = await countMatchingAuditEvents(adminClient, {
    actorUserId: record.actor_user_id,
    eventType: 'quote_viewed',
    quoteId: record.quote_id,
  })

  if (count !== 1) {
    return { skipped: true, reason: `Not first view (count ${count}).` }
  }

  const [profile, quoteTitle] = await Promise.all([
    getClientProfile(adminClient, record.actor_user_id),
    getQuoteTitle(adminClient, record.quote_id),
  ])

  if (!profile) {
    return { skipped: true, reason: 'Client profile not found.' }
  }

  const rendered = renderQuoteViewedNotification({
    clientName: profile.name,
    clientCompany: profile.company,
    clientId: profile.id,
    quoteTitle: quoteTitle ?? 'an untitled pack',
  })

  const result = await sendEmail({
    to: adminNotificationEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  })

  return { sent: true, result }
}

async function handleClientFileUploaded(
  adminClient: ReturnType<typeof createAdminClient>,
  record: AuditLogRecord,
) {
  const profile = await getClientProfile(adminClient, record.actor_user_id)
  if (!profile) {
    return { skipped: true, reason: 'Client profile not found.' }
  }

  const metadata = (record.metadata ?? {}) as Record<string, unknown>
  const fileName = typeof metadata.fileName === 'string' ? metadata.fileName : 'a file'

  let quoteTitle: string | undefined
  if (record.quote_id) {
    quoteTitle = (await getQuoteTitle(adminClient, record.quote_id)) ?? undefined
  }

  const rendered = renderClientUploadEmail({
    clientName: profile.name,
    clientCompany: profile.company,
    fileName,
    quoteTitle,
  })

  const result = await sendEmail({
    to: adminNotificationEmail,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  })

  return { sent: true, result }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const providedSecret = request.headers.get('x-webhook-secret')
  if (!webhookSecret || providedSecret !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as WebhookPayload | null
  if (!payload || payload.type !== 'INSERT' || !payload.record) {
    return new Response('ok', { status: 200 })
  }

  const adminClient = createAdminClient()
  const record = payload.record

  try {
    let outcome: unknown = { skipped: true, reason: 'Unhandled event type.' }

    if (record.event_type === 'portal_signed_in') {
      outcome = await handlePortalSignedIn(adminClient, record)
    } else if (record.event_type === 'quote_viewed') {
      outcome = await handleQuoteViewed(adminClient, record)
    } else if (record.event_type === 'client_file_uploaded') {
      outcome = await handleClientFileUploaded(adminClient, record)
    }

    console.log(
      `portal-notifications ${record.event_type}`,
      JSON.stringify(outcome),
    )

    return new Response(JSON.stringify({ ok: true, outcome }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('portal-notifications error', error)
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Notification failed.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
})
