import { randomBytes, randomUUID } from "node:crypto";
import { Client } from "pg";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Provision a licensed BioCoda user (invite-only).
 *
 * Every variant creates the `app_user` row, which is the licence: it grants
 * access and carries the organisation (tenant) and role.
 *
 *   --mode invite   (recommended) Sends a Supabase invite email. The link lands
 *                   the user on /auth/reset, where they set their own password
 *                   once, then sign in with it. Nothing to hand over out of band.
 *                   Any pre-existing auth account for the email is removed first,
 *                   so re-inviting is a clean start-over.
 *   --mode password Creates a Supabase account with a temporary password (printed)
 *                   and a must_change_password flag; the user is forced to set
 *                   their own at first login.
 *   --mode sso      No password; the user signs in with Google or Microsoft and
 *                   is matched by email. Only the app_user row is written.
 *
 * Env:
 *   DATABASE_URL             a role that can INSERT app_user (e.g. postgres).
 *                            Optional for invite/password: if omitted, the
 *                            app_user upsert is skipped (use when the row already
 *                            exists) and only the Supabase account is touched.
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY  (invite and password modes)
 *   APP_URL                  base URL for the invite link's redirect
 *                            (default https://biocoda.astragrid.tech)
 *
 * Usage:
 *   pnpm --filter @biocoda/db exec tsx src/provision-user.ts \
 *     --email jane@council.gov.uk --name "Jane Smith" \
 *     --tenant rb-natural-trust --role responsible_body --mode invite
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

/** Find an existing Supabase auth user's id by email, or null. Paginates. */
async function findUserId(admin: SupabaseClient, email: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u: { email?: string }) => u.email?.toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  const email = arg("email")?.toLowerCase();
  const name = arg("name");
  const tenant = arg("tenant") ?? null;
  const role = arg("role") ?? "responsible_body";
  const mode = (arg("mode") ?? "invite") as "invite" | "password" | "sso";
  if (!email || !name) throw new Error("--email and --name are required");
  if (!ROLES.includes(role)) throw new Error(`--role must be one of: ${ROLES.join(", ")}`);
  if (!["invite", "password", "sso"].includes(mode)) throw new Error("--mode must be invite, password or sso");

  const dbUrl = process.env.DATABASE_URL;
  const local = !!dbUrl && (dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") || dbUrl.includes("@db:"));

  let tempPw: string | null = null;
  let invited = false;

  // 1. Supabase Auth account.
  if (mode === "invite" || mode === "password") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are required for invite/password modes");
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    if (mode === "invite") {
      // Start over cleanly: remove any existing auth account for this email so
      // the invite is a fresh first-time set-your-password journey.
      const existingId = await findUserId(admin, email);
      if (existingId) {
        const { error } = await admin.auth.admin.deleteUser(existingId);
        if (error) throw new Error(`could not remove existing account: ${error.message}`);
        console.log(`  removed existing Supabase account for ${email}`);
      }
      const appUrl = (process.env.APP_URL ?? "https://biocoda.astragrid.tech").replace(/\/$/, "");
      const { error } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${appUrl}/auth/reset`,
        data: { name },
      });
      if (error) throw error;
      invited = true;
    } else {
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
  }

  // 2. The app_user licence. Skipped when no DATABASE_URL is given, for the case
  // where the row already exists and only the Supabase account is being reset.
  if (dbUrl) {
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
  } else {
    console.warn(`  note: no DATABASE_URL; skipped app_user upsert (relying on an existing licence row)`);
  }

  console.log(`\nProvisioned ${email}`);
  console.log(`  organisation: ${tenant ?? "(none)"}   role: ${role}   mode: ${mode}`);
  if (invited) console.log(`  INVITE EMAIL SENT: they follow the link, set a password once, then sign in with it.`);
  else if (tempPw) console.log(`  TEMPORARY PASSWORD (share securely; they must change it at first login): ${tempPw}`);
  else if (mode === "password") console.log(`  existing account kept; they can use "Forgot password" to reset`);
  else console.log(`  they sign in with Google or Microsoft using this email`);
}

main().catch((e) => {
  console.error("provision failed:", (e as Error).message);
  process.exit(1);
});
