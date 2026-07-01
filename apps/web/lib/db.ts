import { Pool, type PoolClient } from "pg";

/**
 * Postgres access with tenant isolation.
 *
 * Every tenant-scoped query runs through `withTenant`, which opens a
 * transaction, drops to the non-superuser `biocoda_app` role and sets
 * `app.tenant_id`. Row-Level Security (packages/db/sql/0002_rls.sql) then
 * filters every row to the active tenant, the same posture Supabase RLS gives
 * us in production, enforced in the database rather than in app code.
 */

const globalForPool = globalThis as unknown as { gkPool?: Pool };

export function pool(): Pool {
  if (!globalForPool.gkPool) {
    const connectionString =
      process.env.DATABASE_URL ?? "postgresql://biocoda:biocoda@localhost:5432/biocoda";
    // Managed Postgres (Supabase) requires TLS; the local docker db does not.
    const local =
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1") ||
      connectionString.includes("@db:");
    globalForPool.gkPool = new Pool({
      connectionString,
      max: process.env.DATABASE_URL ? 4 : 8, // serverless: keep the pool small
      ssl: local ? undefined : { rejectUnauthorized: false },
    });
  }
  return globalForPool.gkPool;
}

export interface Session {
  tenantId: string;
  role: string;
}

/** Run `fn` inside an RLS-scoped transaction for the session's tenant. */
export async function withTenant<T>(
  session: Session,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE biocoda_app");
    // Parameterised GUCs via set_config to avoid injection.
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [
      session.tenantId,
    ]);
    await client.query("SELECT set_config('app.role', $1, true)", [session.role]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Tenants list (reference data; not RLS-scoped) for the role switcher. */
export async function listTenants(): Promise<
  { id: string; name: string; type: string }[]
> {
  if (process.env.BIOCODA_DEMO === "1") {
    return [
      { id: "rb-natural-trust", name: "Natural Trust Responsible Body", type: "responsible_body" },
      { id: "lpa-downshire", name: "Downshire County Council", type: "lpa" },
      { id: "dev-greenfield", name: "Greenfield Developments Ltd", type: "developer" },
    ];
  }
  const { rows } = await pool().query(
    "SELECT id, name, type FROM tenant ORDER BY name",
  );
  return rows;
}
