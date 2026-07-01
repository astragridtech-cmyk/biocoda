# Deploying BioCoda to Vercel

Production target: **https://biocoda.astragrid.tech**

The web app lives in `apps/web` of this pnpm monorepo and consumes the workspace
packages from source (`transpilePackages`), so Vercel only needs to install the
workspace and run `next build` in `apps/web`. Data is served from Supabase
Postgres (schema already migrated); auth is Supabase; imagery is Copernicus
Sentinel-2.

## 1. Import the repo in Vercel

1. Vercel dashboard: **Add New... > Project > Import** `astragridtech-cmyk/biocoda`.
2. **Root Directory:** set to `apps/web`.
3. Framework preset auto-detects **Next.js**. Leave the build and install commands
   as the defaults (Vercel installs the pnpm workspace from the repo root).

## 2. Environment variables (Project Settings > Environment Variables)

Set these for **Production** (and Preview if you want preview deploys to work).
Values marked *secret* must never be committed; they live only in Vercel.

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | *secret.* Supabase **Transaction pooler** URI (port 6543), connecting as the `biocoda_app` role. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable / anon key (browser-safe). |
| `CDSE_CLIENT_ID` | Copernicus Data Space (Sentinel Hub) OAuth client id. |
| `CDSE_CLIENT_SECRET` | *secret.* Copernicus client secret. |
| `DEFAULT_TENANT` | `rb-natural-trust` (the seeded portfolio's tenant). |
| `DEFAULT_ROLE` | `responsible_body` |

Do **not** set `BIOCODA_DEMO` (that forces the in-memory demo store; production
uses the database). Optional extras: `ANTHROPIC_API_KEY` + `BIOCODA_PLAN_REAL=1`
to extract real management plans with Claude; `RESEND_API_KEY` +
`BIOCODA_EMAIL_FROM` to actually send the state-of-portfolio digest email.

## 3. Custom domain

1. Vercel project > **Settings > Domains > Add** `biocoda.astragrid.tech`.
2. At the DNS provider for `astragrid.tech`, add the record Vercel shows, a
   **CNAME** for `biocoda` pointing to `cname.vercel-dns.com` (Vercel displays the
   exact target). Wait for it to verify.

## 4. Supabase auth for the production domain

Supabase dashboard > **Authentication > URL Configuration**:

- **Site URL:** `https://biocoda.astragrid.tech`
- **Redirect URLs:** add `https://biocoda.astragrid.tech/auth/callback`
  (keep `http://localhost:3011/auth/callback` for local dev).

Google and Microsoft sign-in already point at the Supabase callback; adding the
production redirect URL above is what lets them return into the app.

## 5. Deploy and check

Trigger a deploy (push to `main`, or the initial import deploys automatically).
After it's live: load the domain, sign in, and confirm the dashboard shows the
40-parcel portfolio and the parcel change viewer loads Sentinel-2 imagery.

## Database operations (reference)

The schema was applied once with the runner in `packages/db`:

```bash
# Build/seed schema on a fresh managed Postgres (session or direct connection):
DATABASE_URL="postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres" \
  pnpm --filter @biocoda/db migrate

# Give biocoda_app a login so the app connects as it (Supabase pooler blocks SET ROLE):
DATABASE_URL="<direct-connection>" APP_DB_PASSWORD="<generated>" \
  pnpm --filter @biocoda/db exec tsx src/setrole.ts
```

The app connects as `biocoda_app` (not `postgres`) so PostgreSQL Row-Level
Security enforces tenant isolation in the database. Use the **transaction
pooler** (6543) for the app, the **session or direct** connection for migrations.
