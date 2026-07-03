import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase";

/**
 * Password-reset callback. The reset email link lands here with a one-time code;
 * we exchange it for a (recovery) session and ALWAYS send the user to the
 * set-a-new-password screen. A dedicated clean path (no query string) so the
 * redirect survives Supabase's allowlist matching, which strips query params.
 * Add https://<domain>/auth/reset to Supabase's redirect allow-list.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supa = await serverSupabase();
    if (supa) {
      const { error } = await supa.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/account/change-password", url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=reset", url.origin));
}
