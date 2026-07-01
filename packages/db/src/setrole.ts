import { Client } from "pg";

/**
 * Give biocoda_app a login so the app connects AS the least-privilege,
 * RLS-bound role directly (Supabase's pooler blocks SET ROLE, and connecting as
 * postgres would bypass RLS). Role DDL must run over the direct connection.
 * Retries because the direct endpoint is flaky from some networks.
 */
async function once(): Promise<void> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    keepAlive: true,
  });
  client.on("error", () => {});
  await client.connect();
  const pass = process.env.APP_DB_PASSWORD!;
  await client.query(`ALTER ROLE biocoda_app WITH LOGIN PASSWORD '${pass}'`);
  await client.query("GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO biocoda_app");
  await client.query("GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO biocoda_app");
  await client.end();
}

async function main() {
  if (!/^[A-Za-z0-9]{16,}$/.test(process.env.APP_DB_PASSWORD ?? "")) {
    throw new Error("APP_DB_PASSWORD must be alphanumeric, 16+ chars");
  }
  for (let i = 1; i <= 6; i++) {
    try {
      await once();
      console.log(`biocoda_app login enabled (attempt ${i})`);
      return;
    } catch (e) {
      console.error(`attempt ${i} failed:`, (e as Error).message);
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
  process.exit(1);
}
main();
