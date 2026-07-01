-- BioCoda: tenant isolation via Row-Level Security (Phase 0)
--
-- The web layer runs each request inside a transaction as the non-superuser
-- role `biocoda_app`, after `SET LOCAL app.tenant_id = '<tenant>'`. RLS then
-- scopes every row to that tenant. The seed (run by the superuser bootstrap
-- role) bypasses RLS, so seeding is unaffected.
--
-- Under Supabase this maps directly onto auth.jwt()-driven policies; here we
-- read the tenant from a session GUC instead.

-- Application role the API connects through (RLS applies to non-superusers).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'biocoda_app') THEN
    CREATE ROLE biocoda_app NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO biocoda_app;
GRANT SELECT ON tenant, app_user TO biocoda_app;
GRANT SELECT, INSERT, UPDATE ON
  parcel, target, condition_point, trajectory_flag, survey_task, verification, report
  TO biocoda_app;

-- Current tenant for the request, NULL when unset (which denies all rows).
CREATE OR REPLACE FUNCTION current_tenant() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT current_setting('app.tenant_id', true) $$;

ALTER TABLE parcel           ENABLE ROW LEVEL SECURITY;
ALTER TABLE target           ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_point  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trajectory_flag  ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_task      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification     ENABLE ROW LEVEL SECURITY;
ALTER TABLE report           ENABLE ROW LEVEL SECURITY;

-- parcel is the tenant anchor; children inherit via a parcel lookup.
CREATE POLICY parcel_tenant ON parcel
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

CREATE OR REPLACE FUNCTION parcel_in_tenant(pid text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
      SELECT 1 FROM parcel p
      WHERE p.id = pid AND p.tenant_id = current_tenant()
    )
  $$;

CREATE POLICY target_tenant ON target
  USING (parcel_in_tenant(parcel_id)) WITH CHECK (parcel_in_tenant(parcel_id));
CREATE POLICY condition_point_tenant ON condition_point
  USING (parcel_in_tenant(parcel_id)) WITH CHECK (parcel_in_tenant(parcel_id));
CREATE POLICY trajectory_flag_tenant ON trajectory_flag
  USING (parcel_in_tenant(parcel_id)) WITH CHECK (parcel_in_tenant(parcel_id));
CREATE POLICY survey_task_tenant ON survey_task
  USING (parcel_in_tenant(parcel_id)) WITH CHECK (parcel_in_tenant(parcel_id));
CREATE POLICY verification_tenant ON verification
  USING (parcel_in_tenant(parcel_id)) WITH CHECK (parcel_in_tenant(parcel_id));
CREATE POLICY report_tenant ON report
  USING (parcel_in_tenant(parcel_id)) WITH CHECK (parcel_in_tenant(parcel_id));
