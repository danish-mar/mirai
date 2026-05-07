import { db } from "@/lib/db/client";

export type WatchProgress = {
  userId: number;
  animeId: number;
  episode: string;
  animeTitle: string;
  coverImage: string | null;
  positionSeconds: number;
  durationSeconds: number;
  isCompleted: boolean;
  updatedAt: string;
  percentComplete: number;
};

type WatchProgressRow = {
  user_id: number;
  anime_id: number;
  episode: string;
  anime_title: string;
  cover_image: string | null;
  position_seconds: number;
  duration_seconds: number;
  is_completed: number;
  updated_at: string;
};

function mapProgress(row: WatchProgressRow): WatchProgress {
  const pct = row.duration_seconds > 0
    ? Math.min(100, Math.round((row.position_seconds / row.duration_seconds) * 100))
    : 0;
  return {
    userId: row.user_id,
    animeId: row.anime_id,
    episode: String(row.episode),
    animeTitle: row.anime_title ?? "",
    coverImage: row.cover_image ?? null,
    positionSeconds: row.position_seconds,
    durationSeconds: row.duration_seconds,
    isCompleted: row.is_completed === 1,
    updatedAt: row.updated_at,
    percentComplete: pct,
  };
}

const SELECT_COLS = "user_id, anime_id, episode, anime_title, cover_image, position_seconds, duration_seconds, is_completed, updated_at";

export function saveProgress(input: {
  userId: number;
  animeId: number;
  episode: string;
  animeTitle?: string;
  coverImage?: string | null;
  positionSeconds: number;
  durationSeconds: number;
  isCompleted?: boolean;
}): WatchProgress {
  db()
    .prepare(
      `INSERT INTO watch_progress (user_id, anime_id, episode, anime_title, cover_image, position_seconds, duration_seconds, is_completed, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, anime_id, episode)
       DO UPDATE SET
         anime_title = COALESCE(excluded.anime_title, anime_title),
         cover_image = COALESCE(excluded.cover_image, cover_image),
         position_seconds = excluded.position_seconds,
         duration_seconds = excluded.duration_seconds,
         is_completed = COALESCE(excluded.is_completed, is_completed),
         updated_at = CURRENT_TIMESTAMP`
    )
    .run(
      input.userId, input.animeId, String(input.episode),
      input.animeTitle ?? "", input.coverImage ?? null,
      input.positionSeconds, input.durationSeconds,
      input.isCompleted ? 1 : 0
    );

  const row = db()
    .prepare(
      `SELECT ${SELECT_COLS}
       FROM watch_progress WHERE user_id = ? AND anime_id = ? AND episode = ?`
    )
    .get(input.userId, input.animeId, String(input.episode)) as WatchProgressRow | undefined;

  if (!row) throw new Error("Failed to save progress");
  return mapProgress(row);
}

export function markEpisodeCompleted(userId: number, animeId: number, episode: string, completed: boolean = true) {
  db()
    .prepare(
      `INSERT INTO watch_progress (user_id, anime_id, episode, is_completed, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, anime_id, episode)
       DO UPDATE SET is_completed = ?, updated_at = CURRENT_TIMESTAMP`
    )
    .run(userId, animeId, String(episode), completed ? 1 : 0, completed ? 1 : 0);
}

export function getAnimeProgress(userId: number, animeId: number): WatchProgress[] {
  const rows = db()
    .prepare(
      `SELECT ${SELECT_COLS}
       FROM watch_progress WHERE user_id = ? AND anime_id = ? ORDER BY updated_at DESC`
    )
    .all(userId, animeId) as WatchProgressRow[];
  return rows.map(mapProgress);
}

/** Returns the most recently watched episode per anime (for continue-watching) */
export function getContinueWatching(userId: number, limit = 10): WatchProgress[] {
  const rows = db()
    .prepare(
      `SELECT ${SELECT_COLS}
       FROM watch_progress
       WHERE user_id = ?
       GROUP BY anime_id
       HAVING updated_at = MAX(updated_at)
       ORDER BY updated_at DESC
       LIMIT ?`
    )
    .all(userId, limit) as WatchProgressRow[];
  return rows.map(mapProgress);
}

/** All distinct anime the user has any progress on */
export function getWatchHistory(userId: number, limit = 50): WatchProgress[] {
  const rows = db()
    .prepare(
      `SELECT ${SELECT_COLS}
       FROM watch_progress
       WHERE user_id = ?
       GROUP BY anime_id
       HAVING updated_at = MAX(updated_at)
       ORDER BY updated_at DESC
       LIMIT ?`
    )
    .all(userId, limit) as WatchProgressRow[];
  return rows.map(mapProgress);
}

export function getEpisodeProgress(userId: number, animeId: number, episode: string): WatchProgress | null {
  const row = db()
    .prepare(
      `SELECT ${SELECT_COLS}
       FROM watch_progress WHERE user_id = ? AND anime_id = ? AND episode = ?`
    )
    .get(userId, animeId, String(episode)) as WatchProgressRow | undefined;
  return row ? mapProgress(row) : null;
}

export function getTotalProgressCount(): number {
  const row = db().prepare("SELECT COUNT(*) as count FROM watch_progress").get() as { count: number };
  return row.count;
}
