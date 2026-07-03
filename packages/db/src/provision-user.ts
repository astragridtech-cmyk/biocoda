import { randomBytes, randomUUID } from "node:crypto";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";

/**
 * Provision a licensed BioCoda user (invite-only).
 *
 * Both variants create the `app_user` row, which is the licence: it grants
 * access and carries the organisation (tenant) and role. Password users also get
 * a Supabase Auth account with a temporary password and a must_change_password
 * flag; the temporary password is printed so you can hand it over out of band,
 * and the user is forced to set their own on first login. Single-sign-on users
 * need only the app_user row: they sign in with Google or Microsoft and are
 * matched by email. This is the exact logic a future in-app "Team" admin page
 * would call.
 *
 * Env:
 *   DATABASE_URL             a role that can INSERT app_user (e.g. postgres)
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY  (password users only)
 *
 * Usage:
 *   pnpm --filter @biocoda/db exec tsx src/provision-user.ts \
 *     --email jane@council.gov.uk --name "Jane Smith" \
 *     --tenant rb-natural-trust --role responsible_body --mode password
 */

const ROLES = ["responsible_body", "lpa", "developer", "ecologist"];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** Readable, strong temporary password, e.g. Bc-7f3a-9d2e-c1b8. */
function tempPassword(): string {
  const hex = randomBytes(6).toString("hex");
  return `Bc-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

async function main() {
  const email = arg("email")?.toLowerCase();
  const name = arg("name");
  const tenant = arg("tenant") ?? null;
  const role = arg("role") ?? "responsible_body";
  const mode = (arg("mode") ?? "password") as "password" | "sso";
  if (!email || !name) throw new Error("--email and --name are required");
  if (!ROLES.includes(role)) throw new Error(`--role must be one of: ${ROLES.join(", ")}`);
  if (mode !== "password" && mode !== "sso") throw new Error("--mode must be password or sso");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is required");
  const local = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") || dbUrl.includes("@db:");

  let tempPw: string | null = null;

  // 1. Supabase Auth account (password users only).
  if (mode === "password") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are required for password users");
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    tempPw = tempPassword();
    const { error } = await admin.auth.admin.createUser({
      email,
      password: tempPw,
      email_confirm: true,
      user_metadata: { must_change_password: true, name },
    });
    if (error) {
      if (/registered|already|exists/i.test(error.message)) {
        console.warn(`  note: a Supabase account already exists for ${email}; password left unchanged`);
        tempPw = null;
      } else {
        throw error;
      }
    }
  }

  // 2. The app_user licence.
  const client = new Client({ connectionString: dbUrl, ssl: local ? undefined : { rejectUnauthorized: false }, connectionTimeoutMillis: 20000 });
  client.on("error", () => {});
  await client.connect();
  const id = `usr_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  await client.query(
    `INSERT INTO app_user (id, tenant_id, role, name, email)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, role = EXCLUDED.role, name = EXCLUDED.name`,
    [id, tenant, role, name, email],
  );
  await client.end();

  console.log(`\nProvisioned ${email}`);
  console.log(`  organisation: ${tenant ?? "(none)"}   role: ${role}   mode: ${mode}`);
  if (tempPw) console.log(`  TEMPORARY PASSWORD (share securely; they must change it at first login): ${tempPw}`);
  else if (mode === "password") console.log(`  existing account kept; they can use "Forgot password" to reset`);
  else console.log(`  they sign in with Google or Microsoft using this email`);
}

main().catch((e) => {
  console.error("provision failed:", (e as Error).message);
  process.exit(1);
});
