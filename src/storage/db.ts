// Local Storage — SQLite Initialization (Async Version)

import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import os from "os";
import fs from "fs";

const DEFAULT_DATA_DIR = path.join(os.homedir(), ".elseid");
let DATA_DIR = process.env.ELSEID_DATA_DIR || DEFAULT_DATA_DIR;

// Path Traversal Mitigation: Ensure the data directory is absolute and not suspicious
if (process.env.ELSEID_DATA_DIR) {
  DATA_DIR = path.resolve(process.env.ELSEID_DATA_DIR);
  if (!path.isAbsolute(DATA_DIR) || DATA_DIR.includes("..")) {
    console.error(`❌ Invalid ELSEID_DATA_DIR: ${process.env.ELSEID_DATA_DIR}. Falling back to default.`);
    DATA_DIR = DEFAULT_DATA_DIR;
  }
}

const DB_PATH = path.join(DATA_DIR, "elseid.db");

let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) throw new Error("DB not initialized. Call initDb() first.");
  return _db;
}

export async function initDb(): Promise<void> {
  // Ensure data directory exists with correct permissions (always chmod to be sure)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    }
    fs.chmodSync(DATA_DIR, 0o700);
  } catch (err) {
    console.warn(`⚠️ Failed to set permissions on data directory ${DATA_DIR}:`, err);
  }

  // Use sqlite3.Database as the driver
  _db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // Ensure DB file has restricted permissions
  try {
    if (fs.existsSync(DB_PATH)) {
      fs.chmodSync(DB_PATH, 0o600);
    }
  } catch (err) {
    console.warn(`⚠️ Failed to set permissions on database file ${DB_PATH}:`, err);
  }

  await _db.exec("PRAGMA journal_mode = WAL");
  await _db.exec("PRAGMA foreign_keys = ON");
  await _db.exec("PRAGMA secure_delete = ON");

  await _db.exec(`
    CREATE TABLE IF NOT EXISTS drifters (
      id            TEXT PRIMARY KEY,        -- Nostr Event ID
      pubkey        TEXT NOT NULL,           -- Owner's pubkey
      name          TEXT NOT NULL,           -- Drifter name
      personality   TEXT NOT NULL,           -- Personality description
      trait         TEXT,                    -- Extracted core trait
      tags          TEXT,                    -- JSON array
      relay         TEXT NOT NULL,           -- Origin relay URL
      departed_at   INTEGER NOT NULL,        -- Departure time
      status        TEXT DEFAULT 'roaming',  -- roaming | resting | returned | abandoned
      abandoned_at  INTEGER,                 -- Retirement time
      last_seen_at  INTEGER,                 -- Last host time
      last_seen_loc TEXT                     -- Last city
    );

    CREATE TABLE IF NOT EXISTS feedings (
      id              TEXT PRIMARY KEY,      
      drifter_id      TEXT NOT NULL,         
      drifter_name    TEXT,
      feeder_pubkey   TEXT NOT NULL,         
      feeder_name     TEXT,
      feed_type       TEXT NOT NULL,         
      content         TEXT NOT NULL,         
      location_country TEXT,                 
      location_city    TEXT,                 
      fed_at          INTEGER NOT NULL,      
      relay           TEXT NOT NULL          
    );

    CREATE TABLE IF NOT EXISTS hosting_log (
      id              TEXT PRIMARY KEY,      
      drifter_id      TEXT NOT NULL,         
      feeder_pubkey   TEXT NOT NULL,         
      feeder_name     TEXT,
      feed_type       TEXT NOT NULL,         
      content         TEXT NOT NULL,         
      location_country TEXT,                 
      location_city    TEXT,                 
      fed_at          INTEGER NOT NULL,      
      relay           TEXT NOT NULL          
    );

    CREATE TABLE IF NOT EXISTS identities (
      pubkey      TEXT PRIMARY KEY,
      privkey     TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      active_drifter_id TEXT,
      is_creating INTEGER DEFAULT 0,
      creating_at INTEGER,
      host_name   TEXT
    );

    CREATE TABLE IF NOT EXISTS relay_stats (
      url         TEXT PRIMARY KEY,
      online      INTEGER DEFAULT 0,
      latency_ms  INTEGER,
      writable    INTEGER DEFAULT 1,
      last_check  INTEGER
    );

    CREATE TABLE IF NOT EXISTS encounters (
      token         TEXT PRIMARY KEY,
      drifter_id    TEXT NOT NULL,
      relay         TEXT NOT NULL,
      discovered_at INTEGER NOT NULL,
      expires_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drifter_lineage (
      child_id   TEXT PRIMARY KEY,
      parent_id  TEXT NOT NULL,
      reason     TEXT,
      evolved_at INTEGER NOT NULL
    );
  `);

  await _db.run(`UPDATE identities SET is_creating = 0`);

  // Versioned Migrations
  await runMigrations(_db);
}

async function runMigrations(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY
    )
  `);

  const row = await db.get("SELECT version FROM _migrations") as { version: number } | undefined;
  const currentVersion = row?.version ?? 0;

  const migrations = [
    // Version 1: Initial schema (handled by CREATE TABLE IF NOT EXISTS)
    async () => {},
    // Version 2: Add host_name and creating_at to identities
    async (db: Database) => {
      const info = await db.all(`PRAGMA table_info(identities)`);
      if (!info.some(c => c.name === "host_name")) {
        await db.exec(`ALTER TABLE identities ADD COLUMN host_name TEXT`);
      }
      if (!info.some(c => c.name === "creating_at")) {
        await db.exec(`ALTER TABLE identities ADD COLUMN creating_at INTEGER`);
      }
    },
    // Version 3: Add drifter_name, feeder_name to feedings
    async (db: Database) => {
      const info = await db.all(`PRAGMA table_info(feedings)`);
      if (!info.some(c => c.name === "drifter_name")) {
        await db.exec(`ALTER TABLE feedings ADD COLUMN drifter_name TEXT`);
      }
      if (!info.some(c => c.name === "feeder_name")) {
        await db.exec(`ALTER TABLE feedings ADD COLUMN feeder_name TEXT`);
      }
    },
    // Version 4: Add feeder_name to hosting_log
    async (db: Database) => {
      const info = await db.all(`PRAGMA table_info(hosting_log)`);
      if (!info.some(c => c.name === "feeder_name")) {
        await db.exec(`ALTER TABLE hosting_log ADD COLUMN feeder_name TEXT`);
      }
    }
  ];

  for (let i = currentVersion; i < migrations.length; i++) {
    const nextVersion = i + 1;
    try {
      await migrations[i](db);
      await db.run("INSERT OR REPLACE INTO _migrations (version) VALUES (?)", [nextVersion]);
    } catch (err) {
      console.error(`❌ Migration to version ${nextVersion} failed:`, err);
      throw err; // Stop initialization if migration fails
    }
  }
}

export async function closeDb(): Promise<void> {
  if (_db) {
    try {
      await _db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
      await _db.close();
      _db = null;
    } catch (err) {
      console.error("❌ Error closing database:", err);
    }
  }
}
