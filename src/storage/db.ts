// ============================================================
// Local Storage — SQLite Initialization
// ============================================================

import Database from "better-sqlite3";
import path from "path";
import os from "os";
import fs from "fs";

const DATA_DIR = process.env.ELSEID_DATA_DIR || path.join(os.homedir(), ".elseid");
const DB_PATH  = path.join(DATA_DIR, "elseid.db");

// 确保数据目录存在
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn(`⚠️ 无法创建数据目录 ${DATA_DIR}, 将尝试使用当前目录下的 .elseid_temp`);
  const fallbackDir = path.join(process.cwd(), ".elseid_temp");
  if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir);
  // 这里不更新常量，但给开发者一个明确的信号
}

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
    CREATE TABLE IF NOT EXISTS drifters (
      id            TEXT PRIMARY KEY,        -- 分身的 Nostr Event ID
      pubkey        TEXT NOT NULL,           -- 主人的公钥
      privkey       TEXT NOT NULL,           -- 主人的私钥（本地签名用）
      name          TEXT NOT NULL,           -- 分身名称
      personality   TEXT NOT NULL,           -- 性格描述
      mood          TEXT,                    -- AI从性格中提取的主情绪
      tags          TEXT,                    -- JSON数组
      relay         TEXT NOT NULL,           -- 出发中继站URL
      departed_at   INTEGER NOT NULL,        -- 出发时间
      status        TEXT DEFAULT 'roaming',  -- roaming | resting | returned | abandoned
      abandoned_at  INTEGER,                 -- 放弃时间
      last_seen_at  INTEGER,                 -- 最近一次被接待的时间
      last_seen_loc TEXT                     -- 最近位置
    );

    CREATE TABLE IF NOT EXISTS feedings (
      id              TEXT PRIMARY KEY,      -- 投喂事件的 Nostr Event ID
      drifter_id      TEXT NOT NULL,         -- 我投喂的那个分身 ID
      feeder_pubkey   TEXT NOT NULL,         -- 我的公钥
      feed_type       TEXT NOT NULL,         -- story | food | place | other
      content         TEXT NOT NULL,         -- 投喂内容
      location_country TEXT,                 -- 我的位置（国家）
      location_city    TEXT,                 -- 我的位置（城市）
      fed_at          INTEGER NOT NULL,      -- 投喂时间
      relay           TEXT NOT NULL          -- 投喂事件所在中继站
    );

    CREATE TABLE IF NOT EXISTS hosting_log (
      id              TEXT PRIMARY KEY,      -- 投喂事件的 Nostr Event ID
      drifter_id      TEXT NOT NULL,         -- 我的分身 ID
      feeder_pubkey   TEXT NOT NULL,         -- 投喂我的那个人的公钥
      feed_type       TEXT NOT NULL,         -- story | food | place | other
      content         TEXT NOT NULL,         -- 投喂内容
      location_country TEXT,                 -- 对方的位置（国家）
      location_city    TEXT,                 -- 对方的位置（城市）
      fed_at          INTEGER NOT NULL,      -- 被投喂时间
      relay           TEXT NOT NULL          -- 投喂事件所在中继站
    );

    CREATE TABLE IF NOT EXISTS identities (
      pubkey      TEXT PRIMARY KEY,
      privkey     TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      active_drifter_id TEXT
    );

    CREATE TABLE IF NOT EXISTS relay_stats (
      url         TEXT PRIMARY KEY,
      online      INTEGER DEFAULT 0,
      latency_ms  INTEGER,
      writable    INTEGER DEFAULT 1,
      last_check  INTEGER
    );
  `);

  // Purge logic for drifters (e.g. clean up abandoned if needed, though doc says permanent)
  // For now, no automatic purge like bottles.
}
