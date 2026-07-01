import "server-only";
import { withTenant, type Session } from "./db.js";
import {
  isDemo,
  listNotifications as demoList,
  markNotificationsRead as demoMark,
  type MemNotification,
} from "./demo.js";

export type Notification = MemNotification;

export async function listNotifications(session: Session): Promise<Notification[]> {
  if (isDemo()) return demoList();
  return withTenant(session, async (c) => {
    const { rows } = await c.query(
      `SELECT id, type, title, body, parcel_id AS "parcelId",
              to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt", read
       FROM notification ORDER BY created_at DESC LIMIT 50`,
    );
    return rows as Notification[];
  });
}

export async function markRead(session: Session, id?: string): Promise<void> {
  if (isDemo()) return demoMark(id);
  await withTenant(session, async (c) => {
    if (id) await c.query(`UPDATE notification SET read = true WHERE id = $1`, [id]);
    else await c.query(`UPDATE notification SET read = true WHERE read = false`);
  });
}

export function unreadCount(list: Notification[]): number {
  return list.filter((n) => !n.read).length;
}
