import "server-only";
import { cookies } from "next/headers";

/**
 * Supabase Auth wiring.
 *
 * Real authentication runs through Supabase (the BioCoda build-doc choice) when
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set. When they
 * are not (local / keyless demo), the login page offers a demo sign-in instead,
 * so the journey is still testable. This module is the server side of that.
 */
export function hasSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Server-side Supabase client bound to the request cookies (read-only safe). */
export async function serverSupabase() {
  if (!hasSupabase()) return null;
  const { createServerClient } = await import("@supabase/ssr");
  const jar = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (
          toSet: { name: string; value: string; options?: Record<string, unknown> }[],
        ) => {
          try {
            for (const { name, value, options } of toSet) {
              jar.set(name, value, options as Parameters<typeof jar.set>[2]);
            }
          } catch {
            // Called from a Server Component where cookies are read-only; ignore.
          }
        },
      },
    },
  );
}

/** The authenticated Supabase user, or null. */
export async function supabaseUser(): Promise<{ email: string | null; mustChangePassword: boolean } | null> {
  const supa = await serverSupabase();
  if (!supa) return null;
  const { data } = await supa.auth.getUser();
  if (!data.user) return null;
  const meta = data.user.user_metadata as { must_change_password?: boolean } | undefined;
  return { email: data.user.email ?? null, mustChangePassword: meta?.must_change_password === true };
}
