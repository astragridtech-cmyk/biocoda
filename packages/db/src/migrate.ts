import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "pg";

/**
 * Apply the BioCoda schema to a Postgres database from DATABASE_URL.
 *
 * The docker demo applies packages/db/sql/*.sql via the postgis image's
 * init hook; this runner does the same against a managed Postgres (Supabase),
 * plus the two things that hook gave us for free: it ensures the PostGIS and
 * pgcrypto extensions exist, and it grants the app the `biocoda_app` role so the
 * connecting user can `SET ROLE biocoda_app` (Supabase's `postgres` is not a
 * superuser). Idempotent extension/grant/search_path steps; the schema files
 * themselves expect a clean database. Run once against a fresh project.
 */
const FILES = [
  "0001_init.sql",
  "0002_rls.sql",
  "0003_seed.sql",
  "0004_plans.sql",
  "0005_notifications.sql",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const local = url.includes("localhost") || url.includes("127.0.0.1") || url.includes("@db:");

  const sqlDir = join(dirname(fileURLToPath(import.meta.url)), "..", "sql");
  const client = new Client({ connectionString: url, ssl: local ? undefined : { rejectUnauthorized: false } });
  await client.connect();
  console.log("connected");

  // Extensions may live in `public` or `extensions` on managed Postgres; make
  // both resolvable so geometry types are found regardless.
  await client.query("SET search_path = public, extensions");
  await client.query("CREATE EXTENSION IF NOT EXISTS postgis");
  await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  console.log("extensions ready");

  for (const file of FILES) {
    process.stdout.write(`applying ${file} ... `);
    await client.query(readFileSync(join(sqlDir, file), "utf8"));
    console.log("ok");
  }

  // Let the connecting role assume biocoda_app, and pin its search_path so the
  // geometry type resolves at query time too.
  await client.query("GRANT biocoda_app TO CURRENT_USER");
  await client.query("ALTER ROLE biocoda_app SET search_path = public, extensions");
  console.log("granted biocoda_app to current user");

  await client.end();
  console.log("migration complete");
}

main().catch((err) => {
  console.error("\nmigration failed:", err.message);
  process.exit(1);
});
