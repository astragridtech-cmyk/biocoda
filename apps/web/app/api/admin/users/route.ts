import { NextResponse } from "next/server";
import { getAuthState } from "@/lib/auth";
import {
  adminConfigured,
  createManagedUser,
  listManagedUsers,
  revokeManagedUser,
} from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["responsible_body", "lpa", "developer", "ecologist"];

/** Every method requires an admin session. */
async function requireAdmin() {
  const auth = await getAuthState();
  if (!auth.isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "User management is not configured on the server (SUPABASE_SERVICE_KEY is missing)." },
      { status: 503 },
    );
  }
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const users = await listManagedUsers();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  const email = (body.email ?? "").trim();
  const name = (body.name ?? "").trim();
  const tenant = (body.tenant ?? "").trim();
  const role = (body.role ?? "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "Enter the person's name." }, { status: 400 });
  if (!tenant) return NextResponse.json({ error: "Choose an organisation." }, { status: 400 });
  if (!ROLES.includes(role)) return NextResponse.json({ error: "Choose a valid role." }, { status: 400 });

  try {
    const result = await createManagedUser({ email, name, tenant, role });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  // Guard against an admin removing their own licence and locking themselves out.
  const auth = await getAuthState();
  if (auth.email && email.toLowerCase() === auth.email.toLowerCase()) {
    return NextResponse.json({ error: "You cannot revoke your own access." }, { status: 400 });
  }

  try {
    await revokeManagedUser(email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
