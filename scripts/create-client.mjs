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
  npm run client:create -- \\
    --email client@example.com \\
    --password "StrongPassword123!" \\
    --name "Client Name" \\
    --company "Client Company" \\
    --role "Client"`)
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
  const password = requireArg('--password', 'client password')
  const name = requireArg('--name', 'client name')
  const company = requireArg('--company', 'client company')
  const role = getArg('--role') ?? 'Client'

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      company,
      role,
    },
  })

  if (error || !data.user) {
    throw error ?? new Error('Failed to create client auth user.')
  }

  const profile = {
    id: data.user.id,
    email,
    full_name: name,
    company,
    role,
  }

  const { error: profileError } = await supabase
    .from('client_profiles')
    .upsert(profile, { onConflict: 'id' })

  if (profileError) {
    throw profileError
  }

  console.log(`Created client account for ${email}`)
  console.log(`User ID: ${data.user.id}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  printUsage()
  process.exit(1)
})
