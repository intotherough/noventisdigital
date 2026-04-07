# Noventis Digital

This repository powers `noventisdigital.co.uk` and the private client quote portal behind it.

It is built for two jobs:

- the public-facing site for John Byrne as a digital entrepreneur, AI consultant and developer
- a private portal where each client can sign in and review only their own quotes

The frontend is deployed to GitHub Pages. Client authentication and quote data are designed to run through Supabase.

## Current Status

- GitHub repo: `Into-The-Rough/noventisdigital`
- Pages source: `gh-pages`
- Custom domain: `noventisdigital.co.uk`
- Deployment: automatic on push to `main` via GitHub Actions
- Portal mode: demo by default, live once Supabase env vars are set

## Local Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Where To Edit

Main files you will touch most often:

- marketing homepage: [src/pages/HomePage.tsx](/mnt/c/Users/john/Documents/sites/noventisdigital/src/pages/HomePage.tsx)
- client portal UI: [src/pages/PortalPage.tsx](/mnt/c/Users/john/Documents/sites/noventisdigital/src/pages/PortalPage.tsx)
- global visual styling: [src/index.css](/mnt/c/Users/john/Documents/sites/noventisdigital/src/index.css)
- portal auth/data behaviour: [src/lib/portalService.ts](/mnt/c/Users/john/Documents/sites/noventisdigital/src/lib/portalService.ts)
- GitHub Pages workflow: [.github/workflows/deploy.yml](/mnt/c/Users/john/Documents/sites/noventisdigital/.github/workflows/deploy.yml)

## Deployment Flow

The repo is set up so a normal push to `main` republishes the site automatically:

```bash
git add .
git commit -m "Update site"
git push
```

GitHub Actions builds the app and updates the `gh-pages` branch. GitHub Pages then serves that branch on the custom domain.

Manual deploy still works if you want it:

```bash
npm run deploy
```

## DNS For noventisdigital.co.uk

At your DNS provider, set the root domain `@` to these GitHub Pages IPs:

```text
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
```

Optional IPv6:

```text
AAAA  @     2606:50c0:8000::153
AAAA  @     2606:50c0:8001::153
AAAA  @     2606:50c0:8002::153
AAAA  @     2606:50c0:8003::153
```

For `www`, use:

```text
CNAME  www  Into-The-Rough.github.io
```

Once DNS has propagated, GitHub Pages should allow HTTPS for `noventisdigital.co.uk`.

## Environment Files

Frontend env file for local development:

- [.env.example](/mnt/c/Users/john/Documents/sites/noventisdigital/.env.example)

Admin script env file template:

- [.env.admin.example](/mnt/c/Users/john/Documents/sites/noventisdigital/.env.admin.example)

Frontend runtime values:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Admin script values:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

For GitHub Actions, add these repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not put the service role key into GitHub Pages frontend env vars.

## Supabase Setup

1. Create a Supabase project.
2. Run [supabase/schema.sql](/mnt/c/Users/john/Documents/sites/noventisdigital/supabase/schema.sql) in the Supabase SQL editor.
3. Set local `.env` values from [.env.example](/mnt/c/Users/john/Documents/sites/noventisdigital/.env.example).
4. Add the same frontend env vars as GitHub repository secrets if you want the live site to use Supabase.

The schema creates:

- `public.client_profiles` for the client directory
- `public.quotes` for portal quotes
- triggers for `updated_at`
- a trigger that creates a client profile when a new auth user is created
- row-level security so clients can only read their own profile and quotes

## Demo Portal Access

If Supabase is not configured yet, the portal falls back to demo accounts:

- `sarah@northlabs.co.uk` / `DemoQuote!24`
- `daniel@meridianvc.com` / `Pipeline!27`

## Create A Real Client Account

1. Copy [.env.admin.example](/mnt/c/Users/john/Documents/sites/noventisdigital/.env.admin.example) to `.env.admin` or export the variables in your shell.
2. Run:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run client:create -- \
  --email client@example.com \
  --password "StrongPassword123!" \
  --name "Client Name" \
  --company "Client Company" \
  --role "Client"
```

That script creates the Supabase auth user and upserts a matching `client_profiles` record.

Script file:

- [scripts/create-client.mjs](/mnt/c/Users/john/Documents/sites/noventisdigital/scripts/create-client.mjs)

## Create Or Update A Quote

Use the JSON example here:

- [supabase/examples/quote.example.json](/mnt/c/Users/john/Documents/sites/noventisdigital/supabase/examples/quote.example.json)

Then run:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run quote:upsert -- \
  --email client@example.com \
  --file supabase/examples/quote.example.json
```

That script looks up the client by email, then inserts or updates the quote in `public.quotes`.

Script file:

- [scripts/upsert-quote.mjs](/mnt/c/Users/john/Documents/sites/noventisdigital/scripts/upsert-quote.mjs)

## Live Portal Behaviour

In live mode:

- clients authenticate with Supabase Auth
- the app loads their profile from `client_profiles`
- the app loads only quotes where `auth_user_id = auth.uid()`
- the quote portal stays compatible with GitHub Pages because the secure data layer lives in Supabase, not in the static host

## Notes

- `public/CNAME` is already set to `noventisdigital.co.uk`
- `public/404.html` is included so `/portal` works on GitHub Pages
- approval actions currently open email replies rather than writing back into Supabase
- if you want in-app approval, I would add either a small admin backend or Supabase edge functions next
