import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "@/lib/env";

type DatabaseInstance = Database.Database;

const globalForDb = globalThis as typeof globalThis & {
  miraiDb?: DatabaseInstance;
};

function resolveDatabasePath(databaseUrl: string): string {
  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.replace(/^file:/, "");
  }
  return databaseUrl;
}

function migrate(db: DatabaseInstance): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS watch_progress (
      user_id INTEGER NOT NULL,
      anime_id INTEGER NOT NULL,
      episode TEXT NOT NULL,
      anime_title TEXT NOT NULL DEFAULT '',
      cover_image TEXT,
      position_seconds REAL NOT NULL DEFAULT 0,
      duration_seconds REAL NOT NULL DEFAULT 0,
      is_completed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, anime_id, episode),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      user_id INTEGER NOT NULL,
      anime_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      cover_image TEXT,
      added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, anime_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      href TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS stream_cache (
      anime_id INTEGER NOT NULL,
      episode TEXT NOT NULL,
      mode TEXT NOT NULL,
      sources_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (anime_id, episode, mode)
    );

    CREATE TABLE IF NOT EXISTS general_cache (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_watch_progress_user_updated ON watch_progress(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_watch_progress_user_anime ON watch_progress(user_id, anime_id);
    CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
  `);

  // Migrate existing watch_progress episode column from INTEGER to TEXT if needed
  try {
    const cols = db.pragma("table_info(watch_progress)") as { name: string; type: string }[];
    const epCol = cols.find(c => c.name === "episode");
    if (epCol && epCol.type.toUpperCase() === "INTEGER") {
      db.exec(`
        ALTER TABLE watch_progress RENAME TO watch_progress_old;
        CREATE TABLE watch_progress (
          user_id INTEGER NOT NULL,
          anime_id INTEGER NOT NULL,
          episode TEXT NOT NULL,
          anime_title TEXT NOT NULL DEFAULT '',
          cover_image TEXT,
          position_seconds REAL NOT NULL DEFAULT 0,
          duration_seconds REAL NOT NULL DEFAULT 0,
          is_completed INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, anime_id, episode),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        INSERT INTO watch_progress (user_id, anime_id, episode, anime_title, cover_image, position_seconds, duration_seconds, is_completed, updated_at)
          SELECT user_id, anime_id, CAST(episode AS TEXT), anime_title, cover_image, position_seconds, duration_seconds, is_completed, updated_at
          FROM watch_progress_old;
        DROP TABLE watch_progress_old;
        CREATE INDEX IF NOT EXISTS idx_watch_progress_user_updated ON watch_progress(user_id, updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_watch_progress_user_anime ON watch_progress(user_id, anime_id);
      `);
    }

    // Refresh cols after potential recreation
    const currentCols = db.pragma("table_info(watch_progress)") as { name: string }[];
    
    // Add avatar_url column if missing
    const userCols = db.pragma("table_info(users)") as { name: string }[];
    if (!userCols.find(c => c.name === "avatar_url")) {
      db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT");
    }

    // Add anime_title / cover_image / is_completed columns if missing
    if (!currentCols.find(c => c.name === "anime_title")) {
      db.exec("ALTER TABLE watch_progress ADD COLUMN anime_title TEXT NOT NULL DEFAULT ''");
    }
    if (!currentCols.find(c => c.name === "cover_image")) {
      db.exec("ALTER TABLE watch_progress ADD COLUMN cover_image TEXT");
    }
    if (!currentCols.find(c => c.name === "is_completed")) {
      db.exec("ALTER TABLE watch_progress ADD COLUMN is_completed INTEGER NOT NULL DEFAULT 0");
    }
  } catch (e) {
    console.error("Migration error:", e);
  }
}

export function db(): DatabaseInstance {
  if (globalForDb.miraiDb) {
    return globalForDb.miraiDb;
  }

  const dbPath = resolveDatabasePath(env.DATABASE_URL);
  const dir = path.dirname(dbPath);
  if (dir && dir !== ".") {
    fs.mkdirSync(dir, { recursive: true });
  }

  const instance = new Database(dbPath);
  migrate(instance);
  globalForDb.miraiDb = instance;
  return instance;
}
