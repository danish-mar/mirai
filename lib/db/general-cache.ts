import { db } from "@/lib/db/client";

export function getCachedData<T>(key: string): T | null {
  try {
    const row = db()
      .prepare("SELECT value_json FROM general_cache WHERE key = ? AND expires_at > CURRENT_TIMESTAMP")
      .get(key) as { value_json: string } | undefined;

    if (!row) return null;
    return JSON.parse(row.value_json) as T;
  } catch (e) {
    console.error("General cache read error:", e);
    return null;
  }
}

export function setCachedData<T>(key: string, value: T, ttlSeconds: number = 86400) {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString().replace("T", " ").replace("Z", "");
    
    db()
      .prepare(
        "INSERT INTO general_cache (key, value_json, expires_at) VALUES (?, ?, ?) " +
        "ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, expires_at = excluded.expires_at, created_at = CURRENT_TIMESTAMP"
      )
      .run(key, JSON.stringify(value), expiresAt);
  } catch (e) {
    console.error("General cache write error:", e);
  }
}
