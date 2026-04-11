/**
 * Email templates for Noventis Digital client communications.
 *
 * DUPLICATE OF src/lib/emailTemplates.ts. Keep the two files in sync.
 * The Deno edge function cannot import from src/ because TypeScript
 * include is restricted to src/ and the two runtimes differ, so the
 * templates live in both places. Update both when editing copy or
 * layout.
 *
 * Each render function returns { subject, text, html } ready to hand to
 * Resend. Templates are pure string functions with no external imports.
 */

export type EmailTemplateId =
  | 'welcome'
  | 'new-pack'
  | 'client-upload'
  | 'password-reset'

export type RenderedEmail = {
  subject: string
  text: string
  html: string
}

const PORTAL_URL = 'https://noventisdigital.co.uk/portal'
const CONTACT_EMAIL = 'hello@noventisdigital.co.uk'

function wrapHtml(body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Noventis Digital</title>
</head>
<body style="margin:0;padding:0;background:#0c0c12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#f1e7d8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c12;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#15151d;border:1px solid rgba(255,245,232,0.12);border-radius:14px;">
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;letter-spacing:0.28em;color:#ece1d2;text-transform:uppercase;">NOVENTIS</div>
              <div style="font-size:11px;letter-spacing:0.08em;color:rgba(241,231,216,0.55);text-transform:uppercase;margin-top:4px;">Digital</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 32px 32px;font-size:15px;line-height:1.6;color:#f1e7d8;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px 32px;border-top:1px solid rgba(255,245,232,0.08);">
              <p style="margin:20px 0 0 0;font-size:11px;color:rgba(241,231,216,0.45);line-height:1.6;">
                Noventis Digital. Fractional CTO and AI build partner.<br />
                ${CONTACT_EMAIL}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function paragraph(content: string): string {
  return `<p style="margin:0 0 16px 0;">${content}</p>`
}

function link(url: string, label?: string): string {
  return `<a href="${url}" style="color:#ece1d2;text-decoration:underline;">${label ?? url}</a>`
}

function mono(content: string): string {
  return `<span style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;background:rgba(236,225,210,0.08);padding:2px 6px;border-radius:4px;font-size:13px;">${content}</span>`
}

function signatureHtml(): string {
  return `<p style="margin:20px 0 0 0;">John Byrne<br /><span style="color:rgba(241,231,216,0.55);">Noventis Digital</span></p>`
}

function signatureText(): string {
  return `John Byrne\nNoventis Digital`
}

// -----------------------------------------------------------------------------
// Welcome email - sent when a client account is first created
// -----------------------------------------------------------------------------

export type WelcomeEmailVars = {
  name: string
  email: string
  password: string
}

export function renderWelcomeEmail(vars: WelcomeEmailVars): RenderedEmail {
  const subject = 'Your Noventis Digital portal access'

  const text = `Hi ${vars.name},

You now have access to the Noventis Digital client portal. This is where proposals, project packs, and private documents will live instead of email.

Sign in: ${PORTAL_URL}

Email: ${vars.email}
Temporary password: ${vars.password}

Please sign in and change the password when you have a moment.

If you need anything, reply to this email or write to ${CONTACT_EMAIL}.

${signatureText()}
`

  const body = `
${paragraph(`Hi ${vars.name},`)}
${paragraph('You now have access to the Noventis Digital client portal. This is where proposals, project packs, and private documents will live instead of email.')}
${paragraph(`Sign in: ${link(PORTAL_URL)}`)}
${paragraph(`Email: ${mono(vars.email)}<br />Temporary password: ${mono(vars.password)}`)}
${paragraph('Please sign in and change the password when you have a moment.')}
${paragraph(`If you need anything, reply to this email or write to ${link(`mailto:${CONTACT_EMAIL}`, CONTACT_EMAIL)}.`)}
${signatureHtml()}
`

  return { subject, text, html: wrapHtml(body) }
}

// -----------------------------------------------------------------------------
// New pack notification - sent when admin uploads a new pack for a client
// -----------------------------------------------------------------------------

export type NewPackEmailVars = {
  name: string
  packTitle: string
}

export function renderNewPackEmail(vars: NewPackEmailVars): RenderedEmail {
  const subject = `New in your portal: ${vars.packTitle}`

  const text = `Hi ${vars.name},

A new pack has been added to your Noventis Digital portal.

${vars.packTitle}

Sign in to review: ${PORTAL_URL}

${signatureText()}
`

  const body = `
${paragraph(`Hi ${vars.name},`)}
${paragraph('A new pack has been added to your Noventis Digital portal.')}
${paragraph(`<strong style="color:#ece1d2;">${vars.packTitle}</strong>`)}
${paragraph(`Sign in to review: ${link(PORTAL_URL)}`)}
${signatureHtml()}
`

  return { subject, text, html: wrapHtml(body) }
}

// -----------------------------------------------------------------------------
// Client upload notification - sent to admin when a client uploads a file
// -----------------------------------------------------------------------------

export type ClientUploadEmailVars = {
  clientName: string
  clientCompany: string
  fileName: string
  quoteTitle?: string
}

export function renderClientUploadEmail(vars: ClientUploadEmailVars): RenderedEmail {
  const subject = `New upload from ${vars.clientCompany}`

  const text = `${vars.clientName} (${vars.clientCompany}) just uploaded a file to the portal.

File: ${vars.fileName}
${vars.quoteTitle ? `Attached to: ${vars.quoteTitle}\n` : ''}
Open the admin console to download: https://noventisdigital.co.uk/admin

${signatureText()}
`

  const body = `
${paragraph(`<strong style="color:#ece1d2;">${vars.clientName}</strong> (${vars.clientCompany}) just uploaded a file to the portal.`)}
${paragraph(`File: ${mono(vars.fileName)}${vars.quoteTitle ? `<br />Attached to: ${vars.quoteTitle}` : ''}`)}
${paragraph(`Open the admin console to download: ${link('https://noventisdigital.co.uk/admin')}`)}
${signatureHtml()}
`

  return { subject, text, html: wrapHtml(body) }
}

// -----------------------------------------------------------------------------
// Password reset - sent when admin resets a client password
// -----------------------------------------------------------------------------

export type PasswordResetEmailVars = {
  name: string
  email: string
  password: string
}

export function renderPasswordResetEmail(vars: PasswordResetEmailVars): RenderedEmail {
  const subject = 'Your Noventis Digital portal password has been reset'

  const text = `Hi ${vars.name},

Your portal password has been reset.

Sign in: ${PORTAL_URL}

Email: ${vars.email}
New password: ${vars.password}

If you did not expect this, reply to this email or write to ${CONTACT_EMAIL}.

${signatureText()}
`

  const body = `
${paragraph(`Hi ${vars.name},`)}
${paragraph('Your portal password has been reset.')}
${paragraph(`Sign in: ${link(PORTAL_URL)}`)}
${paragraph(`Email: ${mono(vars.email)}<br />New password: ${mono(vars.password)}`)}
${paragraph(`If you did not expect this, reply to this email or write to ${link(`mailto:${CONTACT_EMAIL}`, CONTACT_EMAIL)}.`)}
${signatureHtml()}
`

  return { subject, text, html: wrapHtml(body) }
}

// -----------------------------------------------------------------------------
// Sample data for the admin preview page
// -----------------------------------------------------------------------------

export const sampleTemplates: Array<{
  id: EmailTemplateId
  label: string
  description: string
  render: () => RenderedEmail
}> = [
  {
    id: 'welcome',
    label: 'Welcome email',
    description: 'Sent when a new client account is created, with login details.',
    render: () =>
      renderWelcomeEmail({
        name: 'Stuart Handley',
        email: 'stuart.handley@spe.co.uk',
        password: 'SPE-Audit-2026-kx7m',
      }),
  },
  {
    id: 'new-pack',
    label: 'New pack uploaded',
    description: 'Sent when admin uploads a new pack for a client.',
    render: () =>
      renderNewPackEmail({
        name: 'Stuart Handley',
        packTitle: 'AI engagement pitch',
      }),
  },
  {
    id: 'client-upload',
    label: 'Client upload received',
    description: 'Sent to you when a client uploads a file through the portal.',
    render: () =>
      renderClientUploadEmail({
        clientName: 'Stuart Handley',
        clientCompany: 'SPE Limited',
        fileName: 'material-certs-april.pdf',
        quoteTitle: 'AI engagement pitch',
      }),
  },
  {
    id: 'password-reset',
    label: 'Password reset',
    description: 'Sent when admin resets a client password.',
    render: () =>
      renderPasswordResetEmail({
        name: 'Stuart Handley',
        email: 'stuart.handley@spe.co.uk',
        password: 'SPE-2026-reset-q4',
      }),
  },
]
