// ElseID — src/storage/drifters.ts
// Local SQLite CRUD for digital drifters and feedings.

import { getDb } from "./db.js";
import type { Drifter, Feeding, DrifterStatus, FeedType } from "../../types/index.js";

// Drifter Persistence

export async function saveMyDrifter(drifter: Drifter): Promise<void> {
  const db = getDb();
  await db.run(`
    INSERT INTO drifters (
      id, pubkey, name, personality, trait, tags,
      relay, departed_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    drifter.id,
    drifter.pubkey,
    drifter.name,
    drifter.personality,
    drifter.trait ?? null,
    JSON.stringify(drifter.tags),
    drifter.relay,
    drifter.departedAt,
    drifter.status
  ]);
}

export async function updateDrifterStatus(id: string, status: DrifterStatus, abandonedAt?: number): Promise<void> {
  const db = getDb();
  if (abandonedAt) {
    await db.run(`UPDATE drifters SET status = ?, abandoned_at = ? WHERE id = ?`, [status, abandonedAt, id]);
  } else {
    await db.run(`UPDATE drifters SET status = ? WHERE id = ?`, [status, id]);
  }
}

export async function updateDrifterPresence(id: string, location: string, timestamp: number): Promise<void> {
  const db = getDb();
  await db.run(`
    UPDATE drifters SET last_seen_loc = ?, last_seen_at = ? WHERE id = ?
  `, [location, timestamp, id]);
}

export async function getDrifter(id: string): Promise<Drifter | null> {
  const db = getDb();
  const row = await db.get(`SELECT * FROM drifters WHERE id = ?`, [id]) as any;
  if (!row) return null;
  return rowToDrifter(row);
}

export async function getMyActiveDrifter(): Promise<Drifter | null> {
  const db = getDb();
  const row = await db.get(`
    SELECT d.* FROM drifters d
    JOIN identities i ON d.id = i.active_drifter_id
    WHERE d.status = 'roaming'
    LIMIT 1
  `) as any;
  if (!row) return null;
  return rowToDrifter(row);
}

// Feeding Persistence

export async function saveOutgoingFeeding(feeding: Feeding): Promise<void> {
  const db = getDb();
  await db.run(`
    INSERT OR IGNORE INTO feedings (
      id, drifter_id, feeder_pubkey, feed_type, content,
      location_country, location_city, fed_at, relay
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    feeding.id,
    feeding.drifterId,
    feeding.feederPubkey,
    feeding.feedType,
    feeding.content,
    feeding.locationCountry ?? null,
    feeding.locationCity ?? null,
    feeding.fedAt,
    feeding.relay
  ]);
}

export async function hasHostedBefore(drifterId: string): Promise<boolean> {
  const db = getDb();
  const row = await db.get(`SELECT 1 FROM feedings WHERE drifter_id = ?`, [drifterId]);
  return !!row;
}

// Journey Log Persistence

export async function saveIncomingFeeding(feeding: Feeding): Promise<void> {
  const db = getDb();
  await db.run(`
    INSERT OR IGNORE INTO hosting_log (
      id, drifter_id, feeder_pubkey, feed_type, content,
      location_country, location_city, fed_at, relay
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    feeding.id,
    feeding.drifterId,
    feeding.feederPubkey,
    feeding.feedType,
    feeding.content,
    feeding.locationCountry ?? null,
    feeding.locationCity ?? null,
    feeding.fedAt,
    feeding.relay
  ]);
}

export async function getMyDrifterJourney(drifterId: string): Promise<Feeding[]> {
  const db = getDb();
  const rows = await db.all(`
    SELECT * FROM hosting_log WHERE drifter_id = ? ORDER BY fed_at DESC
  `, [drifterId]) as any[];
  return rows.map(rowToFeeding);
}

export async function getPastMemories(): Promise<{ drifter: Drifter, journey: Feeding[] }[]> {
  const db = getDb();
  const drifters = await db.all(`
    SELECT * FROM drifters WHERE status = 'abandoned' ORDER BY abandoned_at DESC
  `) as any[];

  const result = [];
  for (const row of drifters) {
    const drifter = rowToDrifter(row);
    const journey = await getMyDrifterJourney(drifter.id);
    result.push({ drifter, journey });
  }
  return result;
}

// Row mapping

function rowToDrifter(row: any): Drifter {
  return {
    id:          row.id,
    pubkey:      row.pubkey,
    name:        row.name,
    personality: row.personality,
    trait:       row.trait ?? undefined,
    tags:        JSON.parse(row.tags ?? "[]"),
    relay:       row.relay,
    departedAt:  row.departed_at,
    status:      row.status as DrifterStatus,
    abandonedAt: row.abandoned_at ?? undefined,
    lastSeenAt:  row.last_seen_at ?? undefined,
    lastSeenLoc: row.last_seen_loc ?? undefined,
  };
}

function rowToFeeding(row: any): Feeding {
  return {
    id:              row.id,
    drifterId:       row.drifter_id,
    feederPubkey:    row.feeder_pubkey,
    feedType:        row.feed_type as FeedType,
    content:         row.content,
    locationCountry: row.location_country ?? undefined,
    locationCity:    row.location_city    ?? undefined,
    fedAt:           row.fed_at,
    relay:           row.relay,
  };
}
