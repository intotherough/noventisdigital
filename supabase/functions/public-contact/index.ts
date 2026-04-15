import { corsHeaders } from '../_shared/cors.ts'

const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
const emailFromAddress =
  Deno.env.get('EMAIL_FROM_ADDRESS') ?? 'onboarding@resend.dev'
const adminNotificationEmail =
  Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? 'hello@noventisdigital.co.uk'

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
  return jsonResponse({ ok: false, error: message }, status)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

async function sendEmail(input: {
  replyTo: string
  subject: string
  text: string
  html: string
}) {
  if (!resendApiKey) {
    throw new Error('Email provider is not configured.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFromAddress,
      to: [adminNotificationEmail],
      reply_to: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `Resend responded ${response.status}.`)
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return errorResponse('Method not allowed.', 405)
  }

  try {
    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null

    const name = String(payload?.name ?? '').trim()
    const email = String(payload?.email ?? '').trim().toLowerCase()
    const company = String(payload?.company ?? '').trim()
    const message = String(payload?.message ?? '').trim()
    const website = String(payload?.website ?? '').trim()

    if (website) {
      return jsonResponse({ ok: true })
    }

    if (!name || !email || !message) {
      return errorResponse('Name, email, and message are required.')
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Please enter a valid email address.')
    }

    if (message.length < 20) {
      return errorResponse('Please include a little more detail in your message.')
    }

    const subject = company
      ? `New Noventis enquiry from ${name} (${company})`
      : `New Noventis enquiry from ${name}`

    const forwardedFor = request.headers.get('x-forwarded-for') ?? 'Unknown'
    const userAgent = request.headers.get('user-agent') ?? 'Unknown'

    const text = [
      'New website enquiry',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company || 'Not provided'}`,
      '',
      'Message:',
      message,
      '',
      `IP: ${forwardedFor}`,
      `User-Agent: ${userAgent}`,
    ].join('\n')

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h1 style="font-size:20px;margin-bottom:16px;">New website enquiry</h1>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company || 'Not provided')}</p>
        <p><strong>Message:</strong></p>
        <div style="white-space:pre-wrap;border:1px solid #e5e7eb;border-radius:12px;padding:16px;">${escapeHtml(message)}</div>
        <p style="margin-top:16px;color:#6b7280;font-size:13px;">
          IP: ${escapeHtml(forwardedFor)}<br />
          User-Agent: ${escapeHtml(userAgent)}
        </p>
      </div>
    `

    await sendEmail({
      replyTo: email,
      subject,
      text,
      html,
    })

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error(error)
    return errorResponse(
      error instanceof Error ? error.message : 'Unable to send your message right now.',
      400,
    )
  }
})
