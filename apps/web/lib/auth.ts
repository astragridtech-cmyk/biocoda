import { cookies } from "next/headers";
import type { Session } from "./db.js";
import { appUserByEmail } from "./db.js";
import { hasSupabase, supabaseUser } from "./supabase.js";

/**
 * Auth + session (invite-only).
 *
 * Supabase Auth is the credential store (email/password and Google/Microsoft).
 * Access is granted only if the authenticated email maps to an `app_user` row,
 * which carries the organisation (tenant) and role. No app_user row means no
 * access, of any kind: that single rule is the invite-only gate. The role and
 * organisation come from the row, never from a cookie, so a user is bound to
 * their own organisation and cannot switch tenants.
 *
 * Local/demo (no Supabase configured): the demo cookie stands in as the session
 * and the role switcher sets the lens, so the journey stays testable offline.
 */

const DEFAULT_TENANT = process.env.DEFAULT_TENANT ?? "rb-natural-trust";
const DEFAULT_ROLE = process.env.DEFAULT_ROLE ?? "responsible_body";

export interface AuthState {
  authenticated: boolean;
  /** An app_user row exists for this email (the invite-only gate). */
  provisioned: boolean;
  /** The user must set a new password before a full session is granted. */
  mustChangePassword: boolean;
  email: string | null;
  name: string | null;
  tenantId: string;
  role: string;
}

const DENY: AuthState = {
  authenticated: false,
  provisioned: false,
  mustChangePassword: false,
  email: null,
  name: null,
  tenantId: DEFAULT_TENANT,
  role: DEFAULT_ROLE,
};

/** Resolve the request's identity and organisation lens. */
export async function getAuthState(): Promise<AuthState> {
  if (!hasSupabase()) {
    // Local/demo: the demo cookie is the session; the switcher drives the lens.
    const jar = cookies();
    const demo = jar.get("bc_demo")?.value;
    if (!demo) return DENY;
    return {
      authenticated: true,
      provisioned: true,
      mustChangePassword: false,
      email: decodeURIComponent(demo),
      name: null,
      tenantId: jar.get("bc_tenant")?.value ?? DEFAULT_TENANT,
      role: jar.get("bc_role")?.value ?? DEFAULT_ROLE,
    };
  }

  const user = await supabaseUser();
  if (!user?.email) return DENY;

  let appUser = null;
  try {
    appUser = await appUserByEmail(user.email);
  } catch {
    // Database unreachable: fail closed (treated as not provisioned).
  }
  // Authenticated with Supabase but no licence on record: invite-only denies.
  if (!appUser) return { ...DENY, authenticated: true, email: user.email };

  return {
    authenticated: true,
    provisioned: true,
    mustChangePassword: user.mustChangePassword,
    email: user.email,
    name: appUser.name,
    tenantId: appUser.tenantId ?? DEFAULT_TENANT,
    role: appUser.role,
  };
}

/**
 * Organisation + role lens for tenant-scoped data. Throws in production if the
 * request is not an authenticated, provisioned user, so an unauthenticated API
 * call can never fall through to a default organisation's data.
 */
export async function getSession(): Promise<Session> {
  const a = await getAuthState();
  if (hasSupabase() && !a.provisioned) throw new Error("unauthorized");
  return { tenantId: a.tenantId, role: a.role };
}
