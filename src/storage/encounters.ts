import { randomBytes } from "crypto";
import { getDb } from "./db.js";

const ENCOUNTER_TTL_SEC = 15 * 60;

export async function saveEncounter(drifterId: string, relay: string): Promise<string> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const token = randomBytes(16).toString("hex");

  await db.run(`
    INSERT INTO encounters (token, drifter_id, relay, discovered_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `, [token, drifterId, relay, now, now + ENCOUNTER_TTL_SEC]);

  return token;
}

export async function validateEncounter(token: string, drifterId: string, relay: string): Promise<boolean> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  await db.run(`DELETE FROM encounters WHERE expires_at < ?`, [now]);

  const row = await db.get(`
    SELECT 1 FROM encounters
    WHERE token = ? AND drifter_id = ? AND relay = ? AND expires_at >= ?
  `, [token, drifterId, relay, now]);

  return !!row;
}
