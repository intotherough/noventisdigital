import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function getArg(flag) {
  const index = process.argv.indexOf(flag)

  if (index === -1) {
    return undefined
  }

  return process.argv[index + 1]
}

function requireArg(flag, label) {
  const value = getArg(flag)

  if (!value) {
    throw new Error(`Missing ${label}.`)
  }

  return value
}

function printUsage() {
  console.log(`Usage:
  npm run quote:upsert -- \\
    --email client@example.com \\
    --file supabase/examples/quote.example.json`)
}

function sumLineItems(lineItems) {
  if (!Array.isArray(lineItems)) {
    return 0
  }

  return lineItems.reduce((total, item) => total + (Number(item.amount) || 0), 0)
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for admin scripts.',
    )
  }

  const email = requireArg('--email', 'client email')
  const filePath = requireArg('--file', 'quote JSON file')

  const absoluteFilePath = path.resolve(process.cwd(), filePath)
  const fileContents = await readFile(absoluteFilePath, 'utf8')
  const input = JSON.parse(fileContents)

  if (!input.title) {
    throw new Error('Quote JSON must include a title.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data: profile, error: profileError } = await supabase
    .from('client_profiles')
    .select('id, email, full_name, company')
    .eq('email', email)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  if (!profile) {
    throw new Error(`No client profile found for ${email}.`)
  }

  const record = {
    id: input.id,
    auth_user_id: profile.id,
    client_name: input.client_name ?? profile.full_name ?? 'Client',
    client_company: input.client_company ?? profile.company ?? 'Client account',
    client_email: input.client_email ?? profile.email ?? email,
    title: input.title,
    summary: input.summary ?? '',
    status: input.status ?? 'Awaiting approval',
    valid_until: input.valid_until ?? null,
    timeline: input.timeline ?? 'TBC',
    notes: input.notes ?? '',
    contact_email: input.contact_email ?? 'hello@noventisdigital.co.uk',
    scope: Array.isArray(input.scope) ? input.scope : [],
    line_items: Array.isArray(input.line_items) ? input.line_items : [],
    milestones: Array.isArray(input.milestones) ? input.milestones : [],
    total_amount:
      typeof input.total_amount === 'number'
        ? input.total_amount
        : sumLineItems(input.line_items),
  }

  const { data, error } = await supabase
    .from('quotes')
    .upsert(record, { onConflict: 'id' })
    .select('id, title')
    .single()

  if (error) {
    throw error
  }

  console.log(`Upserted quote "${data.title}" for ${email}`)
  console.log(`Quote ID: ${data.id}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  printUsage()
  process.exit(1)
})
