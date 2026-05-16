// ElseID — src/storage/drifters.ts
// Local SQLite CRUD for digital drifters and feedings.
import { getDb } from "./db.js";
// Drifter Persistence
export async function saveMyDrifter(drifter) {
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
export async function updateDrifterStatus(id, status, abandonedAt) {
    const db = getDb();
    if (abandonedAt) {
        await db.run(`UPDATE drifters SET status = ?, abandoned_at = ? WHERE id = ?`, [status, abandonedAt, id]);
    }
    else {
        await db.run(`UPDATE drifters SET status = ? WHERE id = ?`, [status, id]);
    }
}
export async function updateDrifterPresence(id, location, timestamp) {
    const db = getDb();
    await db.run(`
    UPDATE drifters SET last_seen_loc = ?, last_seen_at = ? WHERE id = ?
  `, [location, timestamp, id]);
}
export async function getDrifter(id) {
    const db = getDb();
    const row = await db.get(`SELECT * FROM drifters WHERE id = ?`, [id]);
    if (!row)
        return null;
    return rowToDrifter(row);
}
export async function getMyActiveDrifter() {
    const db = getDb();
    const row = await db.get(`
    SELECT d.* FROM drifters d
    JOIN identities i ON d.id = i.active_drifter_id
    WHERE d.status = 'roaming'
    LIMIT 1
  `);
    if (!row)
        return null;
    return rowToDrifter(row);
}
// Feeding Persistence
export async function saveOutgoingFeeding(feeding, drifterName) {
    const db = getDb();
    await db.run(`
    INSERT OR IGNORE INTO feedings (
      id, drifter_id, drifter_name, feeder_pubkey, feeder_name, feed_type, content,
      location_country, location_city, fed_at, relay
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
        feeding.id,
        feeding.drifterId,
        drifterName ?? null,
        feeding.feederPubkey,
        feeding.feederName ?? null,
        feeding.feedType,
        feeding.content,
        feeding.locationCountry ?? null,
        feeding.locationCity ?? null,
        feeding.fedAt,
        feeding.relay
    ]);
}
export async function hasHostedBefore(drifterId) {
    const db = getDb();
    const row = await db.get(`SELECT 1 FROM feedings WHERE drifter_id = ?`, [drifterId]);
    return !!row;
}
// Journey Log Persistence
export async function saveIncomingFeeding(feeding) {
    const db = getDb();
    await db.run(`
    INSERT OR IGNORE INTO hosting_log (
      id, drifter_id, feeder_pubkey, feeder_name, feed_type, content,
      location_country, location_city, fed_at, relay
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
        feeding.id,
        feeding.drifterId,
        feeding.feederPubkey,
        feeding.feederName ?? null,
        feeding.feedType,
        feeding.content,
        feeding.locationCountry ?? null,
        feeding.locationCity ?? null,
        feeding.fedAt,
        feeding.relay
    ]);
}
export async function getMyDrifterJourney(drifterId) {
    const db = getDb();
    const rows = await db.all(`
    SELECT * FROM hosting_log WHERE drifter_id = ? ORDER BY fed_at DESC
  `, [drifterId]);
    return rows.map(rowToFeeding);
}
export async function getPastMemories() {
    const db = getDb();
    const drifters = await db.all(`
    SELECT * FROM drifters WHERE status = 'abandoned' ORDER BY abandoned_at DESC
  `);
    const result = [];
    for (const row of drifters) {
        const drifter = rowToDrifter(row);
        const journey = await getMyDrifterJourney(drifter.id);
        result.push({ drifter, journey });
    }
    return result;
}
export async function getMyEncounters() {
    const db = getDb();
    const rows = await db.all(`
    SELECT * FROM feedings ORDER BY fed_at DESC
  `);
    return rows.map(rowToFeeding);
}
export async function saveDrifterLineage(parentId, childId, reason, evolvedAt) {
    const db = getDb();
    await db.run(`
    INSERT OR REPLACE INTO drifter_lineage (child_id, parent_id, reason, evolved_at)
    VALUES (?, ?, ?, ?)
  `, [childId, parentId, reason, evolvedAt]);
}
// Row mapping
function rowToDrifter(row) {
    return {
        id: row.id,
        pubkey: row.pubkey,
        name: row.name,
        personality: row.personality,
        trait: row.trait ?? undefined,
        tags: JSON.parse(row.tags ?? "[]"),
        relay: row.relay,
        departedAt: row.departed_at,
        status: row.status,
        abandonedAt: row.abandoned_at ?? undefined,
        lastSeenAt: row.last_seen_at ?? undefined,
        lastSeenLoc: row.last_seen_loc ?? undefined,
    };
}
function rowToFeeding(row) {
    return {
        id: row.id,
        drifterId: row.drifter_id,
        drifterName: row.drifter_name ?? undefined,
        feederPubkey: row.feeder_pubkey,
        feederName: row.feeder_name ?? undefined,
        feedType: row.feed_type,
        content: row.content,
        locationCountry: row.location_country ?? undefined,
        locationCity: row.location_city ?? undefined,
        fedAt: row.fed_at,
        relay: row.relay,
    };
}
//# sourceMappingURL=drifters.js.map