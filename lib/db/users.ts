import { db } from "@/lib/db/client";

export type UserRecord = {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  isAdmin: boolean;
  avatarUrl: string | null;
  createdAt: string;
};

type UserRow = {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  is_admin: number;
  avatar_url: string | null;
  created_at: string;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    isAdmin: row.is_admin === 1,
    avatarUrl: row.avatar_url ?? null,
    createdAt: row.created_at,
  };
}

const SELECT = "SELECT id, email, name, password_hash, is_admin, avatar_url, created_at FROM users";

export function findUserByEmail(email: string): UserRecord | null {
  const row = db().prepare(`${SELECT} WHERE email = ?`).get(email) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function findUserById(id: number): UserRecord | null {
  const row = db().prepare(`${SELECT} WHERE id = ?`).get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  isAdmin?: boolean;
}): UserRecord {
  const result = db()
    .prepare("INSERT INTO users (email, name, password_hash, is_admin) VALUES (?, ?, ?, ?)")
    .run(input.email, input.name, input.passwordHash, input.isAdmin ? 1 : 0);

  const row = db().prepare(`${SELECT} WHERE id = ?`).get(result.lastInsertRowid) as UserRow | undefined;
  if (!row) throw new Error("Failed to create user");
  return mapUser(row);
}

export function updateUserProfile(id: number, input: {
  name?: string;
  avatarUrl?: string | null;
}): UserRecord {
  if (input.name !== undefined) {
    db().prepare("UPDATE users SET name = ? WHERE id = ?").run(input.name, id);
  }
  if (input.avatarUrl !== undefined) {
    db().prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(input.avatarUrl, id);
  }
  const row = db().prepare(`${SELECT} WHERE id = ?`).get(id) as UserRow | undefined;
  if (!row) throw new Error("User not found");
  return mapUser(row);
}

export function updateUserPassword(id: number, passwordHash: string): void {
  db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, id);
}

export function getUserCount(): number {
  const row = db().prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  return row.count;
}

export function getLatestUsers(limit = 5): UserRecord[] {
  const rows = db()
    .prepare(`${SELECT} ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as UserRow[];
  return rows.map(mapUser);
}

export function listUsers(): UserRecord[] {
  const rows = db().prepare(`${SELECT} ORDER BY name ASC`).all() as UserRow[];
  return rows.map(mapUser);
}

export function deleteUser(id: number): void {
  db().prepare("DELETE FROM users WHERE id = ?").run(id);
}
