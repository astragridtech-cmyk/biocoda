-- BioCoda: plan ingestion (provenance + management actions)
-- Runs after 0003_seed.sql. Adds the source-document trail without changing
-- the shape of parcel / condition_point / trajectory_flag / verification / report.

CREATE TABLE management_plan (
  id              text PRIMARY KEY,
  tenant_id       text NOT NULL REFERENCES tenant(id),
  title           text NOT NULL,
  plan_type       text NOT NULL CHECK (plan_type IN ('HMMP', 'LEMP', 'BGP', 'BMP', 'other')),
  site_name       text NOT NULL DEFAULT '',
  period_years    int  NOT NULL DEFAULT 30,
  source_filename text NOT NULL DEFAULT '',
  -- The full PlanExtraction JSON, retained for provenance and re-review.
  extraction      jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'committed'
                    CHECK (status IN ('draft', 'committed')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX management_plan_tenant_idx ON management_plan (tenant_id);

CREATE TABLE management_action (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id      text NOT NULL REFERENCES parcel(id) ON DELETE CASCADE,
  plan_id        text REFERENCES management_plan(id) ON DELETE SET NULL,
  action         text NOT NULL,
  schedule_years int[] NOT NULL DEFAULT '{}',
  notes          text NOT NULL DEFAULT ''
);
CREATE INDEX management_action_parcel_idx ON management_action (parcel_id);

-- Provenance on the target: which plan clause each target came from.
ALTER TABLE target ADD COLUMN source_plan_id text REFERENCES management_plan(id);
ALTER TABLE target ADD COLUMN source_clause  text NOT NULL DEFAULT '';
ALTER TABLE target ADD COLUMN source_quote   text NOT NULL DEFAULT '';

-- Tenant isolation, consistent with 0002_rls.sql.
GRANT SELECT, INSERT, UPDATE ON management_plan, management_action TO biocoda_app;

ALTER TABLE management_plan   ENABLE ROW LEVEL SECURITY;
ALTER TABLE management_action ENABLE ROW LEVEL SECURITY;

CREATE POLICY management_plan_tenant ON management_plan
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE POLICY management_action_tenant ON management_action
  USING (parcel_in_tenant(parcel_id)) WITH CHECK (parcel_in_tenant(parcel_id));
