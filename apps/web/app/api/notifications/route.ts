import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listNotifications, unreadCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/** GET /api/notifications -> { notifications, unread }. */
export async function GET() {
  try {
    const notifications = await listNotifications(getSession());
    return NextResponse.json({ notifications, unread: unreadCount(notifications) });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
