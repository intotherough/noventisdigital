import { supabaseUrl } from './supabase'

type ContactFormInput = {
  name: string
  email: string
  company: string
  message: string
  website?: string
}

function getPublicContactUrl() {
  if (!supabaseUrl) {
    throw new Error('Supabase is not configured for contact form submissions.')
  }

  return `${new URL(supabaseUrl).origin}/functions/v1/public-contact`
}

export async function submitPublicContactForm(input: ContactFormInput) {
  const response = await fetch(getPublicContactUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string }
    | null

  if (!response.ok || !result?.ok) {
    throw new Error(result?.error ?? 'Unable to send your message right now.')
  }
}
