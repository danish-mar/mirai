import { db } from "@/lib/db/client";

export type WatchlistItem = {
  userId: number;
  animeId: number;
  title: string;
  coverImage: string | null;
  addedAt: string;
};

type WatchlistRow = {
  user_id: number;
  anime_id: number;
  title: string;
  cover_image: string | null;
  added_at: string;
};

function mapWatchlist(row: WatchlistRow): WatchlistItem {
  return {
    userId: row.user_id,
    animeId: row.anime_id,
    title: row.title,
    coverImage: row.cover_image,
    addedAt: row.added_at,
  };
}

export function listWatchlist(userId: number): WatchlistItem[] {
  const rows = db()
    .prepare(
      `SELECT user_id, anime_id, title, cover_image, added_at
       FROM watchlist WHERE user_id = ? ORDER BY added_at DESC`
    )
    .all(userId) as WatchlistRow[];
  return rows.map(mapWatchlist);
}

export function isInWatchlist(userId: number, animeId: number): boolean {
  const row = db()
    .prepare("SELECT 1 FROM watchlist WHERE user_id = ? AND anime_id = ?")
    .get(userId, animeId);
  return !!row;
}

export function addWatchlistItem(input: {
  userId: number;
  animeId: number;
  title: string;
  coverImage?: string | null;
}): WatchlistItem {
  db()
    .prepare(
      `INSERT INTO watchlist (user_id, anime_id, title, cover_image, added_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, anime_id)
       DO UPDATE SET title = excluded.title, cover_image = excluded.cover_image`
    )
    .run(input.userId, input.animeId, input.title, input.coverImage ?? null);

  const row = db()
    .prepare("SELECT user_id, anime_id, title, cover_image, added_at FROM watchlist WHERE user_id = ? AND anime_id = ?")
    .get(input.userId, input.animeId) as WatchlistRow | undefined;

  if (!row) throw new Error("Failed to add watchlist item");
  return mapWatchlist(row);
}

export function removeWatchlistItem(userId: number, animeId: number): void {
  db().prepare("DELETE FROM watchlist WHERE user_id = ? AND anime_id = ?").run(userId, animeId);
}

export function getTotalWatchlistCount(): number {
  const row = db().prepare("SELECT COUNT(*) as count FROM watchlist").get() as { count: number };
  return row.count;
}
