import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin operations for in-app user management.
 *
 * These use the Supabase SERVICE key, which has admin power (it creates auth
 * users and bypasses Row-Level Security). It must never reach the browser, so
 * this module is server-only and the key is read from a non-public env var. The
 * only caller is the admin API route, which is gated on getAuthState().isAdmin.
 */

const APP_URL = (process.env.APP_URL ?? "https://biocoda.astragrid.tech").replace(/\/$/, "");

export function adminConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("admin not configured (missing SUPABASE_SERVICE_KEY)");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const { data, error } = await admin()
    .from("app_user")
    .select("id, email, name, tenant_id, role")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id, email: r.email, name: r.name, tenantId: r.tenant_id, role: r.role,
  }));
}

export async function listAdminTenants(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await admin().from("tenant").select("id, name").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name }));
}

export interface CreateUserInput {
  email: string;
  name: string;
  tenant: string;
  role: string;
}

/**
 * Provision a licensed user: upsert their app_user licence row, then send the
 * branded invite so they set a password and sign in. Mirrors the CLI script.
 * Returns a note when the person already had a Supabase account (licence is
 * still updated; no duplicate invite is sent).
 */
export async function createManagedUser(
  input: CreateUserInput,
): Promise<{ user: ManagedUser; note?: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const a = admin();

  const id = `usr_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const { data: rows, error: upErr } = await a
    .from("app_user")
    .upsert(
      { id, email, name, tenant_id: input.tenant, role: input.role },
      { onConflict: "email" },
    )
    .select("id, email, name, tenant_id, role")
    .limit(1);
  if (upErr) throw new Error(upErr.message);
  const r = rows![0];
  const user: ManagedUser = { id: r.id, email: r.email, name: r.name, tenantId: r.tenant_id, role: r.role };

  const { error: invErr } = await a.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${APP_URL}/auth/reset`,
    data: { name },
  });
  if (invErr) {
    if (/registered|already|exists/i.test(invErr.message)) {
      return { user, note: "This person already had an account, so their licence was updated but no new invite was sent. They can sign in, or use Forgot password." };
    }
    throw new Error(invErr.message);
  }
  return { user };
}

/** Revoke access: remove the licence row. The invite-only gate then denies them. */
export async function revokeManagedUser(email: string): Promise<void> {
  const { error } = await admin().from("app_user").delete().eq("email", email.trim().toLowerCase());
  if (error) throw new Error(error.message);
}
