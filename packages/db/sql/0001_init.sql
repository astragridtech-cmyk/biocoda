-- BioCoda: schema (Phase 0)
-- PostGIS-backed BNG habitat monitoring. SRID 4326 throughout.
-- Runs first via the postgis image's docker-entrypoint-initdb.d.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Organisations holding a stake in a parcel's 30-year obligation ──────────
CREATE TABLE tenant (
  id    text PRIMARY KEY,
  name  text NOT NULL,
  type  text NOT NULL CHECK (type IN ('responsible_body', 'lpa', 'developer'))
);

-- ── App users (login roles). ecologists may be cross-org (tenant_id NULL). ──
CREATE TABLE app_user (
  id         text PRIMARY KEY,
  tenant_id  text REFERENCES tenant(id),
  role       text NOT NULL CHECK (role IN ('responsible_body', 'lpa', 'developer', 'ecologist')),
  name       text NOT NULL,
  email      text NOT NULL UNIQUE
);

-- ── BNG habitat parcels ─────────────────────────────────────────────────────
CREATE TABLE parcel (
  id            text PRIMARY KEY,
  tenant_id     text NOT NULL REFERENCES tenant(id),
  name          text NOT NULL,
  habitat_type  text NOT NULL,
  metric_ref    text NOT NULL,                       -- ties to the Defra Metric row
  geom          geometry(Polygon, 4326) NOT NULL,
  area_ha       double precision NOT NULL CHECK (area_ha > 0),
  baseline_date date NOT NULL                        -- year 0 of the management period
);
CREATE INDEX parcel_tenant_idx ON parcel (tenant_id);
CREATE INDEX parcel_geom_gix ON parcel USING gist (geom);

-- ── Target condition/units derived from the Metric ─────────────────────────
CREATE TABLE target (
  id                 text PRIMARY KEY,
  parcel_id          text NOT NULL REFERENCES parcel(id) ON DELETE CASCADE,
  baseline_condition text NOT NULL CHECK (baseline_condition IN ('poor', 'moderate', 'good')),
  target_condition   text NOT NULL CHECK (target_condition IN ('poor', 'moderate', 'good')),
  baseline_units     double precision NOT NULL,
  target_units       double precision NOT NULL,
  by_year            int  NOT NULL CHECK (by_year BETWEEN 1 AND 30),
  UNIQUE (parcel_id)
);

-- ── EO- and field-derived condition observations ───────────────────────────
CREATE TABLE condition_point (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id   text NOT NULL REFERENCES parcel(id) ON DELETE CASCADE,
  metric      text NOT NULL,
  value       double precision NOT NULL,
  captured_at timestamptz NOT NULL,
  source      text NOT NULL CHECK (source IN ('eo', 'field'))
);
CREATE INDEX condition_point_parcel_idx ON condition_point (parcel_id, captured_at);

-- ── Latest trajectory verdict per parcel ───────────────────────────────────
CREATE TABLE trajectory_flag (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id   text NOT NULL REFERENCES parcel(id) ON DELETE CASCADE,
  status      text NOT NULL CHECK (status IN ('on_track', 'at_risk')),
  year        int  NOT NULL,
  actual      double precision NOT NULL,
  required    double precision NOT NULL,
  gap         double precision NOT NULL,
  detected_at timestamptz NOT NULL
);
CREATE INDEX trajectory_flag_parcel_idx ON trajectory_flag (parcel_id, detected_at DESC);

-- ── Targeted field-survey tasks (often spawned by an at_risk flag) ──────────
CREATE TABLE survey_task (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id       text NOT NULL REFERENCES parcel(id) ON DELETE CASCADE,
  reason          text NOT NULL,
  status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  verification_id uuid
);
CREATE INDEX survey_task_parcel_idx ON survey_task (parcel_id);
CREATE INDEX survey_task_status_idx ON survey_task (status);

-- ── Authoritative field verifications ──────────────────────────────────────
CREATE TABLE verification (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id    text NOT NULL REFERENCES parcel(id) ON DELETE CASCADE,
  ecologist_id text NOT NULL REFERENCES app_user(id),
  condition    text NOT NULL CHECK (condition IN ('poor', 'moderate', 'good')),
  notes        text NOT NULL DEFAULT '',
  photos       text[] NOT NULL DEFAULT '{}',
  geom         geometry(Point, 4326) NOT NULL,
  at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX verification_parcel_idx ON verification (parcel_id, at DESC);

ALTER TABLE survey_task
  ADD CONSTRAINT survey_task_verification_fk
  FOREIGN KEY (verification_id) REFERENCES verification(id);

-- ── Exported annual monitoring packs ───────────────────────────────────────
CREATE TABLE report (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id  text NOT NULL REFERENCES parcel(id) ON DELETE CASCADE,
  year       int  NOT NULL,
  manifest   jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX report_parcel_idx ON report (parcel_id, year);
