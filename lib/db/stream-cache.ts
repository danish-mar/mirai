import { db } from "./client";

export interface CachedStream {
  sources: any[];
  mode: string;
  createdAt: string;
}

export function getCachedStream(animeId: number, episode: string, mode: string): CachedStream | null {
  const row = db()
    .prepare("SELECT sources_json, mode, created_at FROM stream_cache WHERE anime_id = ? AND episode = ? AND mode = ?")
    .get(animeId, episode, mode) as any;

  if (!row) return null;

  return {
    sources: JSON.parse(row.sources_json),
    mode: row.mode,
    createdAt: row.created_at,
  };
}

export function setCachedStream(anime_id: number, episode: string, mode: string, sources: any[]) {
  db()
    .prepare(
      "INSERT OR REPLACE INTO stream_cache (anime_id, episode, mode, sources_json, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
    )
    .run(anime_id, episode, mode, JSON.stringify(sources));
}

export function deleteCachedStream(anime_id: number, episode: string, mode: string) {
  db()
    .prepare("DELETE FROM stream_cache WHERE anime_id = ? AND episode = ? AND mode = ?")
    .run(anime_id, episode, mode);
}
