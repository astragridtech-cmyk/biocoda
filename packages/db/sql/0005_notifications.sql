-- BioCoda: notifications (early-warning alerts + digests)
-- Runs after 0004_plans.sql.

CREATE TABLE notification (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  text NOT NULL REFERENCES tenant(id),
  type       text NOT NULL CHECK (type IN ('at_risk', 'survey', 'plan', 'digest')),
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  parcel_id  text REFERENCES parcel(id) ON DELETE SET NULL,
  read       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notification_tenant_idx ON notification (tenant_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON notification TO biocoda_app;

ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_tenant ON notification
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());
