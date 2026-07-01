import { NextResponse } from "next/server";
import { hasSupabase, serverSupabase } from "@/lib/supabase";

/** POST /api/auth/signout: end the Supabase session (if any) and clear cookies. */
export async function POST() {
  if (hasSupabase()) {
    const supa = await serverSupabase();
    await supa?.auth.signOut();
  }
  const res = NextResponse.json({ ok: true });
  for (const name of ["bc_demo", "bc_role", "bc_tenant"]) {
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return res;
}
