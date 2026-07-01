import { Client } from "pg";

async function main() {
  const url = process.env.DATABASE_URL!;
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
  client.on("error", (e) => console.error("[client error]", (e as { code?: string }).code, e.message));
  try {
    await client.connect();
    console.log("connected ok");
    const a = await client.query("SELECT 1 AS one");
    console.log("select 1 ->", a.rows[0]);
    const b = await client.query("SELECT current_user, current_database()");
    console.log("who ->", b.rows[0]);
    const c = await client.query("SELECT count(*)::int AS n FROM parcel");
    console.log("parcels ->", c.rows[0].n);

    const m = await client.query("SELECT pg_has_role(CURRENT_USER, 'biocoda_app', 'MEMBER') AS is_member");
    console.log("postgres is member of biocoda_app ->", m.rows[0].is_member);

    const t = await client.query("SELECT id FROM tenant ORDER BY id LIMIT 1");
    const tenantId = t.rows[0]?.id;
    console.log("sample tenant ->", tenantId);

    void tenantId;
    // The real app access path, per tenant: scoped role + tenant GUC + RLS read.
    const tenants = await client.query("SELECT id, name FROM tenant ORDER BY id");
    for (const row of tenants.rows) {
      try {
        await client.query("BEGIN");
        await client.query("SET LOCAL ROLE biocoda_app");
        await client.query("SELECT set_config('app.tenant_id', $1, true)", [row.id]);
        const r = await client.query("SELECT count(*)::int AS n FROM parcel");
        await client.query("COMMIT");
        console.log(`  tenant ${row.id} (${row.name}) -> ${r.rows[0].n} parcels under RLS`);
      } catch (e2) {
        const er = e2 as { code?: string; message?: string };
        console.error(`  tenant ${row.id} FAILED ->`, er.code, er.message);
        try { await client.query("ROLLBACK"); } catch { /* noop */ }
      }
    }
    await client.end();
  } catch (e) {
    const err = e as { code?: string; message?: string; severity?: string };
    console.error("[caught]", err.code, err.severity, err.message);
  }
}
main();
