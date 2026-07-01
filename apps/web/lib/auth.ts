import { cookies } from "next/headers";
import type { Session } from "./db.js";
import { hasSupabase, supabaseUser } from "./supabase.js";

/**
 * Auth + session.
 *
 * `getSession()` (sync) returns the tenant/role lens used by data queries; the
 * lens is driven by cookies the role switcher writes, falling back to env
 * defaults. `getAuthState()` (async) decides whether the request is logged in:
 * the real Supabase session when configured, or the demo cookie otherwise.
 */

const DEFAULT_TENANT = process.env.DEFAULT_TENANT ?? "rb-natural-trust";
const DEFAULT_ROLE = process.env.DEFAULT_ROLE ?? "responsible_body";

export function getSession(): Session {
  const jar = cookies();
  return {
    tenantId: jar.get("bc_tenant")?.value ?? DEFAULT_TENANT,
    role: jar.get("bc_role")?.value ?? DEFAULT_ROLE,
  };
}

export interface AuthState {
  authenticated: boolean;
  email: string | null;
}

export async function getAuthState(): Promise<AuthState> {
  if (hasSupabase()) {
    const user = await supabaseUser();
    if (user) return { authenticated: true, email: user.email ?? null };
    // Fall through to the demo cookie so the "demo mode" toggle still works
    // even when Supabase is configured.
  }
  const demo = cookies().get("bc_demo")?.value;
  return { authenticated: Boolean(demo), email: demo ? decodeURIComponent(demo) : null };
}
