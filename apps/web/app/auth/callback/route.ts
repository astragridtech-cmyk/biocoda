import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase";

/**
 * OAuth / magic-link callback. Google and Microsoft (Azure) sign-in redirect
 * here with a one-time code; we exchange it for a Supabase session (the cookies
 * are written by the SSR client) and forward to the app. Configure the provider
 * in the Supabase dashboard with this path as an allowed redirect URL.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supa = await serverSupabase();
    if (supa) {
      const { error } = await supa.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
}
