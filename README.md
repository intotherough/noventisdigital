# Noventis Digital

A Vite + React site for `noventisdigital.co.uk` with:

- A public-facing personal brand / consultancy homepage
- A private client portal for reviewing quotes
- Static hosting support for GitHub Pages
- Supabase-ready auth and quote storage for live client logins
- Demo credentials and sample quotes for local review

## Run locally

```bash
npm install
npm run dev
```

The portal works immediately in demo mode if you do not configure Supabase.

## Demo logins

- `sarah@northlabs.co.uk` / `DemoQuote!24`
- `daniel@meridianvc.com` / `Pipeline!27`

## Live client logins with Supabase

1. Create a Supabase project.
2. Run the SQL in [supabase/schema.sql](/mnt/c/Users/john/Documents/sites/noventisdigital/supabase/schema.sql).
3. Copy `.env.example` to `.env` and set:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

4. In Supabase Auth, create a user for each client.
5. Insert quote rows in `public.quotes` using that client's `auth.users.id` as `auth_user_id`.
6. Optional but recommended: store `full_name` and `company` in the auth user's metadata so the portal header looks polished.

Once those env vars exist, the app switches from demo mode to live mode automatically.
If you are deploying through GitHub Actions, add the same values as repository secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Quote table model

The live portal expects a `quotes` table with one row per quote and at least these fields:

- `auth_user_id`
- `client_name`
- `client_company`
- `client_email`
- `title`
- `summary`
- `status`
- `valid_until`
- `timeline`
- `notes`
- `contact_email`
- `scope`
- `line_items`
- `milestones`
- `total_amount`

`line_items` and `milestones` are stored as `jsonb`.

## GitHub Pages deployment

The project includes:

- `public/CNAME` for `noventisdigital.co.uk`
- `public/404.html` so React routes like `/portal` work on GitHub Pages
- `npm run deploy` using `gh-pages`
- A GitHub Actions workflow that republishes the site when `main` is pushed

Typical flow:

```bash
git add .
git commit -m "Update site"
git push
```

Then in GitHub Pages:

1. Set the repo to deploy from the `gh-pages` branch.
2. Add the custom domain `noventisdigital.co.uk`.
3. Point your DNS records at GitHub Pages if you have not already.

If you want to trigger a deploy manually from your machine, `npm run deploy` still works.

## Notes

- GitHub Pages is only serving the frontend.
- Secure per-client access is handled by Supabase Auth plus row-level security.
- If you want approvals to update status inside the app instead of opening email, add a small mutation layer or edge function next.
