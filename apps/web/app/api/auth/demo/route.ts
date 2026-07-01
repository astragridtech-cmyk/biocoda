import { NextResponse } from "next/server";

/**
 * POST /api/auth/demo
 * Demo sign-in used when Supabase is not configured. Sets the auth cookie plus
 * the tenant/role lens. Body: { email?, role?, tenant? }.
 */
export async function POST(req: Request) {
  let body: { email?: string; role?: string; tenant?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }
  const email = body.email?.trim() || "demo@biocoda.earth";
  const role = body.role || "responsible_body";
  const tenant = body.tenant || "rb-natural-trust";

  const res = NextResponse.json({ ok: true });
  const oneYear = 60 * 60 * 24 * 365;
  res.cookies.set("bc_demo", encodeURIComponent(email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: oneYear,
  });
  res.cookies.set("bc_role", role, { sameSite: "lax", path: "/", maxAge: oneYear });
  res.cookies.set("bc_tenant", tenant, { sameSite: "lax", path: "/", maxAge: oneYear });
  return res;
}
