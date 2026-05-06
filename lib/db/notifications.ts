import { db } from "@/lib/db/client";

export type Notification = {
  id: number;
  userId: number;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

type NotifRow = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  href: string | null;
  read: number;
  created_at: string;
};

function map(row: NotifRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    href: row.href,
    read: row.read === 1,
    createdAt: row.created_at,
  };
}

export function getNotifications(userId: number, limit = 20): Notification[] {
  const rows = db()
    .prepare(
      `SELECT id, user_id, title, body, href, read, created_at
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .all(userId, limit) as NotifRow[];
  return rows.map(map);
}

export function getUnreadCount(userId: number): number {
  const row = db()
    .prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0")
    .get(userId) as { count: number };
  return row.count;
}

export function markAllRead(userId: number): void {
  db().prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(userId);
}

export function markRead(userId: number, id: number): void {
  db().prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND id = ?").run(userId, id);
}

export function createNotification(input: {
  userId: number;
  title: string;
  body: string;
  href?: string;
}): void {
  db()
    .prepare("INSERT INTO notifications (user_id, title, body, href) VALUES (?, ?, ?, ?)")
    .run(input.userId, input.title, input.body, input.href ?? null);
}
