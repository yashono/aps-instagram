import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "../config";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  createdAt: string;
};

let db: Database.Database;

export function initDb(): Database.Database {
  const dir = path.dirname(config.databasePath);
  fs.mkdirSync(dir, { recursive: true });

  db = new Database(config.databasePath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      ig_user_id TEXT PRIMARY KEY,
      first_contacted_at TEXT NOT NULL,
      last_message_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ig_user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ig_user_id) REFERENCES users(ig_user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_user_created
      ON messages (ig_user_id, created_at);
  `);

  return db;
}

function getDb(): Database.Database {
  if (!db) {
    return initDb();
  }
  return db;
}

export function isNewUser(igUserId: string): boolean {
  const row = getDb()
    .prepare("SELECT 1 AS ok FROM users WHERE ig_user_id = ?")
    .get(igUserId) as { ok: number } | undefined;
  return !row;
}

export function ensureUser(igUserId: string): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `
      INSERT INTO users (ig_user_id, first_contacted_at, last_message_at)
      VALUES (?, ?, ?)
      ON CONFLICT(ig_user_id) DO UPDATE SET last_message_at = excluded.last_message_at
    `
    )
    .run(igUserId, now, now);
}

export function saveMessage(
  igUserId: string,
  role: ChatRole,
  content: string
): void {
  const now = new Date().toISOString();
  ensureUser(igUserId);
  getDb()
    .prepare(
      `
      INSERT INTO messages (ig_user_id, role, content, created_at)
      VALUES (?, ?, ?, ?)
    `
    )
    .run(igUserId, role, content, now);
  getDb()
    .prepare("UPDATE users SET last_message_at = ? WHERE ig_user_id = ?")
    .run(now, igUserId);
}

export function getRecentMessages(
  igUserId: string,
  limit = 20
): ChatMessage[] {
  const rows = getDb()
    .prepare(
      `
      SELECT role, content, created_at
      FROM messages
      WHERE ig_user_id = ?
      ORDER BY id DESC
      LIMIT ?
    `
    )
    .all(igUserId, limit) as Array<{
    role: ChatRole;
    content: string;
    created_at: string;
  }>;

  return rows.reverse().map((row) => ({
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
}
