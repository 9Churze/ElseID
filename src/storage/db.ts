// ============================================================
// Local Storage — SQLite Initialization
// ============================================================

import Database from "better-sqlite3";
import path from "path";
import os from "os";
import fs from "fs";

const DATA_DIR = path.join(os.homedir(), ".bicean");
const DB_PATH  = path.join(DATA_DIR, "bicean.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) throw new Error("DB not initialized. Call initDb() first.");
  return _db;
}

export async function initDb(): Promise<void> {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS bottles (
      event_id    TEXT PRIMARY KEY,
      content     TEXT NOT NULL,
      mood        TEXT,
      tone        TEXT,
      lang        TEXT,
      tags        TEXT,       -- JSON array
      ttl         INTEGER,
      created_at  INTEGER NOT NULL,
      expires_at  INTEGER,
      relay       TEXT NOT NULL,
      country     TEXT,
      city        TEXT,
      lat         TEXT,
      lon         TEXT,
      ephemeral   INTEGER DEFAULT 0,
      read_at     INTEGER
    );

    CREATE TABLE IF NOT EXISTS identities (
      pubkey      TEXT PRIMARY KEY,
      privkey     TEXT NOT NULL,   -- stored encrypted by OS keychain in future
      level       TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS relay_stats (
      url         TEXT PRIMARY KEY,
      online      INTEGER DEFAULT 0,
      latency_ms  INTEGER,
      writable    INTEGER DEFAULT 1,
      last_check  INTEGER
    );
  `);

  // Purge expired bottles on startup
  const now = Math.floor(Date.now() / 1000);
  _db.prepare(`DELETE FROM bottles WHERE expires_at IS NOT NULL AND expires_at < ?`).run(now);
}
