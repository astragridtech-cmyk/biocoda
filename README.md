# BioCoda

**30-year Biodiversity Net Gain (BNG) habitat monitoring with Earth observation and field verification.**

BioCoda tracks whether the habitats a development was required to create or
enhance are actually being delivered and sustained across the statutory 30-year
management period, combining EO-derived condition trajectories, ecologist field
verification, and Defra Biodiversity Metric linkage. It competes on the EO axis:
long-horizon condition monitoring of habitat parcels at scale, the 30-year tail
that site visits alone can't service.

> **Name is a placeholder.** "BioCoda" lives in exactly one place,
> [`packages/shared/src/brand.ts`](packages/shared/src/brand.ts). Change `APP_NAME`
> there to rebrand everything user-facing.

---

## What's in the box

A demo-ready MVP that runs locally with seed BNG parcels, a mock EO condition
engine, and a mock Metric link. **No external keys.** EO and Metric both sit
behind adapters, so real wiring changes only adapter bodies.

```
biocoda/
  apps/
    web/         # Next.js (App Router) BNG monitoring dashboard + MapLibre + API
    mobile/      # Expo / React Native ecologist verification app
    eo-worker/   # Python + FastAPI habitat-condition / trajectory service
  packages/
    shared/      # zod schemas, condition/trajectory model, deterministic profiles
    adapters/    # EoHabitatAdapter, MetricAdapter (interfaces + deterministic mocks)
    db/          # PostGIS schema, RLS, ~40-parcel seed generator
  docker-compose.yml
```

### Architecture at a glance

- **One deterministic model, three consumers.** Each parcel's story (baseline,
  target, EO curve) is derived from `parcelId` in
  [`packages/shared/src/profile.ts`](packages/shared/src/profile.ts). The DB seed,
  the Python EO worker, and the TS mock adapter all read from it, so the seeded
  `target`, the EO trajectory, and the verdict can never drift. The TS and Python
  implementations are pinned equivalent (identical values + FNV-1a hashes).
- **EO behind an interface.** `EoHabitatAdapter` (mock now → EarthDaily/Sentinel
  later) and `MetricAdapter` (mock fixtures → Defra Metric export later). Swapping
  Mock for Real changes no calling code.
- **Tenant isolation via RLS.** Every tenant-scoped query runs as the
  non-superuser `biocoda_app` role with `app.tenant_id` set; Postgres RLS
  filters the rows. Same posture Supabase gives in production.

---

## Quickstart

### Option A: full stack (Docker)

```bash
docker compose up --build
```

- Web dashboard → http://localhost:3000
- EO worker → http://localhost:8000/health
- Postgres+PostGIS → localhost:5432 (`biocoda`/`biocoda`)

The database boots **pre-seeded**: the postgis image runs `packages/db/sql/*.sql`
(schema → RLS → ~40 parcels of mixed trajectories) on first start.

### Option B: local dev (web + worker against a Postgres)

```bash
pnpm install

# 1) a PostGIS database, then load schema + seed:
#    psql "$DATABASE_URL" -f packages/db/sql/0001_init.sql
#    psql "$DATABASE_URL" -f packages/db/sql/0002_rls.sql
#    psql "$DATABASE_URL" -f packages/db/sql/0003_seed.sql

# 2) EO worker
cd apps/eo-worker && pip install -r requirements.txt && uvicorn app.main:app --reload

# 3) web (new shell)
pnpm --filter @biocoda/web dev   # http://localhost:3000
```

> The web app falls back to computing EO locally (same model) if `EO_WORKER_URL`
> is unset or the worker is down; the dashboard never breaks.

### Option C: zero-infra demo (no database)

To just *look at* the dashboard with no Postgres, no Docker, no worker:

```bash
pnpm install
cd apps/web && BIOCODA_DEMO=1 pnpm dev   # http://localhost:3000
```

`BIOCODA_DEMO=1` serves the full seeded portfolio straight from the deterministic
generator, with an in-memory store for survey tasks and verifications, so the
whole flow (dispatch → verify → export) works for the life of the dev server.
EO is computed locally (same model as the worker). This is view-only convenience;
the real RLS/tenant-isolation path needs Postgres (Option A or B).

### Regenerating the seed

```bash
pnpm --filter @biocoda/db seed:print   # preview to stdout
pnpm --filter @biocoda/db seed:sql      # rewrite packages/db/sql/0003_seed.sql
```

### Mobile app (Expo)

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=http://<your-LAN-ip>:3000 pnpm start
```

Talks to the same web API the dashboard uses.

---

## Demo script

1. **Portfolio view:** open http://localhost:3000. KPIs, a parcel map (colour =
   trajectory status), and the early-warning list.
2. **Filter at-risk:** click *Filter at-risk*; the map + table narrow to parcels
   slipping below their required curve.
3. **Open a declining parcel:** pick an at-risk grassland parcel. See the
   actual-vs-required condition trajectory across the 30-year period, the Metric
   linkage (baseline/target units + conditions), and the at-risk gap.
4. **Dispatch a survey:** *Dispatch field survey* spawns a targeted task.
5. **Mobile verification:** in the Expo app, the task appears in the worklist;
   capture a condition band + notes + photos + geotag and file it. The EO signal
   is reconciled and the task closes.
6. **Export the annual pack:** back on the parcel, *Export annual pack*
   downloads the JSON evidence manifest (EO trajectory + required curve + field
   verifications + Metric linkage) for the responsible body/LPA.

---

## Acceptance criteria → where it's met

| Criterion (build doc §1.6) | Where |
|---|---|
| Runs via docker-compose, seed parcels, mock EO/Metric, no external keys | `docker-compose.yml`, `packages/db/sql/*` |
| Import parcels; per-parcel required-vs-actual trajectory + at-risk flags | `apps/web/app/parcels/[id]`, `eo-worker`, `lib/eo.ts` |
| At-risk parcel → field-survey task → ecologist app records a verification | `lib/data.ts` (survey_task), `apps/mobile`, `api/mobile/verifications` |
| Annual pack exports EO trajectory + field evidence + Metric linkage | `lib/report.ts`, `api/reports` |
| Swapping EoHabitatAdapter(Mock) for Real changes no calling code | `packages/adapters` interfaces |

---

## Testing

```bash
pnpm test            # shared + adapters (vitest)
pnpm -r typecheck    # all TS workspaces
cd apps/eo-worker && pytest      # worker engine + cross-language contract
```

- **15 TS unit tests** (trajectory math, condition mapping, deterministic mock
  adapters) + **6 Python tests** (engine + at-risk classification).
- The TS and Python EO models are verified to produce identical values, guarding
  against drift between the worker and the rest of the stack.

---

## Out of scope (MVP)

Statutory Metric *calculation* (we link to it, not reimplement it), BNG unit
trading/marketplace, and planning-application workflow, per spec §1.4.

## Production wiring (later)

- `EoHabitatAdapter` → EarthDaily / Sentinel habitat-condition classification +
  multi-year trajectory.
- `MetricAdapter` → Defra Biodiversity Metric data export.
- Local Postgres → Supabase (Postgres + PostGIS + Auth + Storage, UK region); the
  RLS policies and `Session` shape are already Supabase-compatible; real auth
  changes only [`apps/web/lib/auth.ts`](apps/web/lib/auth.ts).
