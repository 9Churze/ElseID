// Local Storage — SQLite Initialization (Async Version)

import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import os from "os";
import fs from "fs";

const DATA_DIR = process.env.ELSEID_DATA_DIR || path.join(os.homedir(), ".elseid");
const DB_PATH = path.join(DATA_DIR, "elseid.db");

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  } else {
    fs.chmodSync(DATA_DIR, 0o700);
  }
} catch (err) {
  console.warn(`⚠️ Failed to set permissions on data directory ${DATA_DIR}:`, err);
}

let _db: Database | null = null;

export function getDb(): Database {
  if (!_db) throw new Error("DB not initialized. Call initDb() first.");
  return _db;
}

export async function initDb(): Promise<void> {
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

  // Migration for adding host_name column
  try {
    const tableInfo = await _db.all(`PRAGMA table_info(identities)`);
    if (!tableInfo.some(col => col.name === 'host_name')) {
      await _db.exec(`ALTER TABLE identities ADD COLUMN host_name TEXT`);
    }

    const feedingsInfo = await _db.all(`PRAGMA table_info(feedings)`);
    if (!feedingsInfo.some(col => col.name === 'drifter_name')) {
      await _db.exec(`ALTER TABLE feedings ADD COLUMN drifter_name TEXT`);
      await _db.exec(`ALTER TABLE feedings ADD COLUMN feeder_name TEXT`);
    }

    const hostingLogInfo = await _db.all(`PRAGMA table_info(hosting_log)`);
    if (!hostingLogInfo.some(col => col.name === 'feeder_name')) {
      await _db.exec(`ALTER TABLE hosting_log ADD COLUMN feeder_name TEXT`);
    }
  } catch (err) {
    // Column might already exist or PRAGMA failed
  }
}
