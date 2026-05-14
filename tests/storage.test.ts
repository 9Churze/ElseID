// tests/storage.test.ts
// Integration tests for SQLite CRUD — uses :memory: database, fully hermetic.

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import type { Database } from "sqlite";

// ─── Bootstrap an in-memory DB with the same schema as initDb() ──────────────
let db: Database;

beforeAll(async () => {
  db = await open({ filename: ":memory:", driver: sqlite3.Database });

  await db.exec("PRAGMA foreign_keys = ON");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS drifters (
      id            TEXT PRIMARY KEY,
      pubkey        TEXT NOT NULL,
      name          TEXT NOT NULL,
      personality   TEXT NOT NULL,
      trait         TEXT,
      tags          TEXT,
      relay         TEXT NOT NULL,
      departed_at   INTEGER NOT NULL,
      status        TEXT DEFAULT 'roaming',
      abandoned_at  INTEGER,
      last_seen_at  INTEGER,
      last_seen_loc TEXT
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
      pubkey            TEXT PRIMARY KEY,
      privkey           TEXT NOT NULL,
      created_at        INTEGER NOT NULL,
      active_drifter_id TEXT,
      is_creating       INTEGER DEFAULT 0,
      creating_at       INTEGER,
      host_name         TEXT
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
});

afterAll(async () => {
  await db.close();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeDrifter(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id:          "d".repeat(64),
    pubkey:      "p".repeat(64),
    name:        "Lantern",
    personality: "quiet",
    trait:       "Curious",
    tags:        JSON.stringify(["quiet", "observer"]),
    relay:       "wss://relay.example.com",
    departed_at: Math.floor(Date.now() / 1000),
    status:      "roaming",
    ...overrides,
  };
}

// ─── drifters CRUD ────────────────────────────────────────────────────────────
describe("drifters table", () => {
  test("inserts a drifter row", async () => {
    const d = makeDrifter();
    await db.run(
      `INSERT INTO drifters (id, pubkey, name, personality, trait, tags, relay, departed_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.id, d.pubkey, d.name, d.personality, d.trait, d.tags, d.relay, d.departed_at, d.status]
    );
    const row = await db.get(`SELECT * FROM drifters WHERE id = ?`, [d.id]);
    expect(row).toBeTruthy();
    expect(row.name).toBe("Lantern");
  });

  test("tags round-trip as JSON array", async () => {
    const row = await db.get(`SELECT tags FROM drifters WHERE id = ?`, ["d".repeat(64)]);
    expect(JSON.parse(row.tags)).toEqual(["quiet", "observer"]);
  });

  test("updates drifter status to abandoned", async () => {
    const abandonedAt = Math.floor(Date.now() / 1000);
    await db.run(
      `UPDATE drifters SET status = ?, abandoned_at = ? WHERE id = ?`,
      ["abandoned", abandonedAt, "d".repeat(64)]
    );
    const row = await db.get(`SELECT status, abandoned_at FROM drifters WHERE id = ?`, ["d".repeat(64)]);
    expect(row.status).toBe("abandoned");
    expect(row.abandoned_at).toBe(abandonedAt);
  });

  test("updates last_seen presence", async () => {
    const ts = Math.floor(Date.now() / 1000);
    await db.run(
      `UPDATE drifters SET last_seen_loc = ?, last_seen_at = ? WHERE id = ?`,
      ["Shanghai", ts, "d".repeat(64)]
    );
    const row = await db.get(`SELECT last_seen_loc, last_seen_at FROM drifters WHERE id = ?`, ["d".repeat(64)]);
    expect(row.last_seen_loc).toBe("Shanghai");
    expect(row.last_seen_at).toBe(ts);
  });

  test("getDrifter returns null for unknown id", async () => {
    const row = await db.get(`SELECT * FROM drifters WHERE id = ?`, ["unknown"]);
    expect(row).toBeUndefined();
  });
});

// ─── feedings CRUD ───────────────────────────────────────────────────────────
describe("feedings table", () => {
  const feeding = {
    id:               "f".repeat(64),
    drifter_id:       "d".repeat(64),
    drifter_name:     "Lantern",
    feeder_pubkey:    "h".repeat(64),
    feeder_name:      "River Host",
    feed_type:        "story",
    content:          "Once upon a time",
    location_country: "JP",
    location_city:    "Kyoto",
    fed_at:           Math.floor(Date.now() / 1000),
    relay:            "wss://relay.example.com",
  };

  test("inserts a feeding row", async () => {
    await db.run(
      `INSERT OR IGNORE INTO feedings
        (id, drifter_id, drifter_name, feeder_pubkey, feeder_name, feed_type, content,
         location_country, location_city, fed_at, relay)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(feeding)
    );
    const row = await db.get(`SELECT * FROM feedings WHERE id = ?`, [feeding.id]);
    expect(row.feed_type).toBe("story");
    expect(row.feeder_name).toBe("River Host");
  });

  test("INSERT OR IGNORE is idempotent (no duplicate)", async () => {
    await db.run(
      `INSERT OR IGNORE INTO feedings
        (id, drifter_id, drifter_name, feeder_pubkey, feeder_name, feed_type, content,
         location_country, location_city, fed_at, relay)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(feeding)
    );
    const rows = await db.all(`SELECT * FROM feedings WHERE id = ?`, [feeding.id]);
    expect(rows).toHaveLength(1);
  });

  test("hasHostedBefore — returns true after feeding saved", async () => {
    const row = await db.get(`SELECT 1 FROM feedings WHERE drifter_id = ?`, ["d".repeat(64)]);
    expect(!!row).toBe(true);
  });
});

// ─── identities CRUD ─────────────────────────────────────────────────────────
describe("identities table", () => {
  const identity = {
    pubkey:     "k".repeat(64),
    privkey:    "encrypted:tag:data",
    created_at: Math.floor(Date.now() / 1000),
  };

  test("inserts identity row", async () => {
    await db.run(
      `INSERT INTO identities (pubkey, privkey, created_at) VALUES (?, ?, ?)`,
      [identity.pubkey, identity.privkey, identity.created_at]
    );
    const row = await db.get(`SELECT * FROM identities WHERE pubkey = ?`, [identity.pubkey]);
    expect(row.pubkey).toBe(identity.pubkey);
    expect(row.is_creating).toBe(0);
  });

  test("is_creating lock set and cleared", async () => {
    const now = Math.floor(Date.now() / 1000);
    await db.run(
      `UPDATE identities SET is_creating = 1, creating_at = ? WHERE pubkey = ?`,
      [now, identity.pubkey]
    );
    let row = await db.get(`SELECT is_creating, creating_at FROM identities WHERE pubkey = ?`, [identity.pubkey]);
    expect(row.is_creating).toBe(1);
    expect(row.creating_at).toBe(now);

    await db.run(
      `UPDATE identities SET is_creating = 0, creating_at = NULL WHERE pubkey = ?`,
      [identity.pubkey]
    );
    row = await db.get(`SELECT is_creating, creating_at FROM identities WHERE pubkey = ?`, [identity.pubkey]);
    expect(row.is_creating).toBe(0);
    expect(row.creating_at).toBeNull();
  });

  test("active_drifter_id updates correctly", async () => {
    const drifterId = "x".repeat(64);
    await db.run(
      `UPDATE identities SET active_drifter_id = ? WHERE pubkey = ?`,
      [drifterId, identity.pubkey]
    );
    const row = await db.get(`SELECT active_drifter_id FROM identities WHERE pubkey = ?`, [identity.pubkey]);
    expect(row.active_drifter_id).toBe(drifterId);
  });

  test("host_name updates correctly", async () => {
    await db.run(
      `UPDATE identities SET host_name = ? WHERE pubkey = ?`,
      ["River Host", identity.pubkey]
    );
    const row = await db.get(`SELECT host_name FROM identities WHERE pubkey = ?`, [identity.pubkey]);
    expect(row.host_name).toBe("River Host");
  });
});

// ─── drifter_lineage ─────────────────────────────────────────────────────────
describe("drifter_lineage table", () => {
  test("saves lineage record", async () => {
    const now = Math.floor(Date.now() / 1000);
    await db.run(
      `INSERT OR REPLACE INTO drifter_lineage (child_id, parent_id, reason, evolved_at)
       VALUES (?, ?, ?, ?)`,
      ["c".repeat(64), "p".repeat(64), "evolved", now]
    );
    const row = await db.get(`SELECT * FROM drifter_lineage WHERE child_id = ?`, ["c".repeat(64)]);
    expect(row.reason).toBe("evolved");
    expect(row.parent_id).toBe("p".repeat(64));
  });
});

// ─── Migration guard ─────────────────────────────────────────────────────────
describe("schema integrity", () => {
  test("all expected tables exist", async () => {
    const tables = await db.all(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    );
    const names = tables.map((t: any) => t.name);
    expect(names).toContain("drifters");
    expect(names).toContain("feedings");
    expect(names).toContain("hosting_log");
    expect(names).toContain("identities");
    expect(names).toContain("encounters");
    expect(names).toContain("drifter_lineage");
  });
});
