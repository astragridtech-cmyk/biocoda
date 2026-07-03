import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markRead } from "@/lib/notifications";

/** POST /api/notifications/read { id? } -> mark one, or all, read. */
export async function POST(req: Request) {
  let body: { id?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body marks all read
  }
  try {
    await markRead((await getSession()), body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
