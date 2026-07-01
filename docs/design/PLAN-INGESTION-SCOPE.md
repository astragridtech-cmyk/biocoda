# BioCoda: Plan Ingestion (scope)

Extract structured monitoring data from Biodiversity / Habitat Management Plan documents (HMMP, LEMP, Biodiversity Gain Plan, BMP) and turn it into BioCoda parcels, targets, management actions, and a retained evidence trail, with a human reviewing before anything is written.

## Why

The plan is where the ground truth lives: parcel boundaries, baseline and target habitat condition, the management actions, and the monitoring schedule. Today an ecologist re-keys all of that by hand. Extraction removes the most manual part of onboarding a site and starts the 30-year evidence trail from the source document.

## Principles

1. **Decision support, not authority.** Extraction proposes; a human approves. Field verification stays authoritative. The plan is a legal document, so nothing reaches `parcel` or `target` without review.
2. **Provenance always.** Every extracted target carries the clause and quote it came from, strengthening the durable 30-year record.
3. **Adapter-shaped.** Extraction sits behind `PlanIngestionAdapter` (Mock now for a keyless demo, Claude for real), exactly like `EoHabitatAdapter` and `MetricAdapter`. The data model does not change shape.

## Architecture

```
Upload (PDF / text)
   │
   ▼
PlanIngestionAdapter.extract()        packages/adapters (interface + Mock)
   ├─ Mock: deterministic sample      → keyless demo
   └─ Claude (Opus 4.8):              → apps/web/lib/plan-extract.ts
        document block + messages.parse(zodOutputFormat(PlanExtractionSchema))
   │
   ▼
PlanExtraction (zod, packages/shared)  parcels + targets + actions + monitoring + provenance + confidence + warnings
   │
   ▼
Review UI (human in the loop)          /plans: edit, include/exclude per parcel
   │
   ▼
commit                                 writes management_plan + parcel + target + management_action
                                       (DB path) or the in-memory store (BIOCODA_DEMO=1)
```

## Data model additions (packages/db/sql/0004_plans.sql)

- `management_plan` (id, tenant_id, title, plan_type, site_name, period_years, source_filename, extraction jsonb, status, created_at): the source document and its full extraction, for provenance.
- `management_action` (id, parcel_id, plan_id, action, schedule_years int[], notes): the actions a parcel is contracted to receive.
- `target` gains `source_plan_id`, `source_clause`, `source_quote`: which clause each target came from.

No change to `parcel`, `condition_point`, `trajectory_flag`, `verification`, `report`.

## Extraction schema (packages/shared/src/plan.ts)

`PlanExtraction = { plan: PlanMetadata, parcels: ExtractedParcel[], confidence, warnings[] }`, where each `ExtractedParcel` carries `ref, name, habitatType, areaHa, baselineCondition, targetCondition, byYear, targetUnits?, managementActions[], monitoring?, provenance{page,clause,quote}`. Conditions reuse the existing Defra band vocabulary, so extracted targets line up with the EO trajectory and Metric linkage with no translation.

## Claude integration

- Official `@anthropic-ai/sdk`, model `claude-opus-4-8`, adaptive thinking.
- PDFs pass as a base64 `document` content block (Opus 4.8 reads PDF natively, no server-side parsing). Plain text passes as a text block.
- Structured output via `client.messages.parse()` with `zodOutputFormat(PlanExtractionSchema)`, so the response validates against the schema. Provenance (page, clause, quote) is part of the schema, so we get source attribution without the citations feature.
- Gated by `ANTHROPIC_API_KEY` plus `BIOCODA_PLAN_REAL=1`. Without a key the Mock adapter serves a deterministic sample, so the whole flow is demonstrable with no external keys.

## Input formats

- **PDF**: passed to Claude as a native document block.
- **.docx**: converted to text server-side with mammoth, then extracted.
- **Plain text / paste**: extracted directly.

## Boundaries

- Optional **GeoJSON** upload at review time: features are matched to extracted parcels by a `ref`, `id`, `parcel`, or `name` property (case-insensitive), and the real Polygon is used on commit.
- Parcels without a matched boundary get a synthesised placeholder square near the site and surface as **Awaiting EO** until an EO baseline is captured. Shapefile import is a future add.

## Out of scope (this pass)

- Statutory Metric calculation (link to it, do not reimplement) and BNG unit trading, per the product spec.

## Acceptance

- Upload a plan (or the bundled sample), see proposed parcels with conditions, targets, actions, and the quote each came from.
- Edit and include/exclude per parcel, then commit.
- Committed parcels appear in the portfolio (as Awaiting EO) and the plan is retained with its extraction for provenance.
- Swapping the Mock adapter for Claude changes no calling code.
