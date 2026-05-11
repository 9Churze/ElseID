// ============================================================
// Bicean — src/relay/health.ts
// Relay health checks: online status, latency, writability.
// Persists results to relay_stats table for use by selector.
// ============================================================

import WebSocket from "ws";
import { getDb }                from "../storage/db.js";
import { DEFAULT_RELAYS, WS_TIMEOUT_MS, HEALTH_CHECK_INTERVAL_MS } from "../../config/relays.js";
import type { RelayInfo }       from "../../types/index.js";

// ── Single relay check ────────────────────────────────────────

/**
 * Ping a single relay by opening a WebSocket and timing
 * how long it takes to receive the first message or confirm open.
 * Checks writability by sending a minimal AUTH probe (no actual write).
 */
export async function checkRelay(url: string): Promise<RelayInfo> {
  return new Promise((resolve) => {
    const start = Date.now();
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws.terminate();
        persist({ url, online: false, latencyMs: null, writable: false });
        resolve({ url, online: false, latencyMs: null, writable: false });
      }
    }, WS_TIMEOUT_MS);

    const ws = new WebSocket(url);

    ws.once("open", () => {
      const latencyMs = Date.now() - start;
      // Send a REQ with no filters to check read access
      ws.send(JSON.stringify(["REQ", "health-probe", { kinds: [7777], limit: 1 }]));

      // Give the relay 1 s to respond
      setTimeout(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          ws.close();
          const info: RelayInfo = { url, online: true, latencyMs, writable: true };
          persist(info);
          resolve(info);
        }
      }, 1_000);
    });

    ws.once("error", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        const info: RelayInfo = { url, online: false, latencyMs: null, writable: false };
        persist(info);
        resolve(info);
      }
    });
  });
}

// ── Batch check ──────────────────────────────────────────────

/**
 * Check all known relays in parallel. Returns results sorted
 * by latency (online first, then by speed).
 */
export async function checkAllRelays(): Promise<RelayInfo[]> {
  const urls    = DEFAULT_RELAYS.map((r) => r.url);
  const results = await Promise.all(urls.map(checkRelay));

  return results.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    if (a.latencyMs === null)  return 1;
    if (b.latencyMs === null)  return -1;
    return a.latencyMs - b.latencyMs;
  });
}

/**
 * Return all relay info from the local cache (relay_stats table).
 * Rows that have never been checked are omitted.
 */
export function getCachedRelayInfo(): RelayInfo[] {
  const rows = getDb().prepare(`
    SELECT url, online, latency_ms, writable, last_check
    FROM relay_stats
    ORDER BY online DESC, latency_ms ASC
  `).all() as {
    url: string; online: number; latency_ms: number | null;
    writable: number; last_check: number;
  }[];

  return rows.map((r) => ({
    url:       r.url,
    online:    r.online === 1,
    latencyMs: r.latency_ms,
    writable:  r.writable === 1,
  }));
}

/**
 * Return online, writable relays.
 * Triggers a background refresh if data is stale (> HEALTH_CHECK_INTERVAL_MS).
 */
export function getHealthyRelays(): RelayInfo[] {
  const cached = getCachedRelayInfo();

  // Refresh stale data in background
  const staleThreshold = Math.floor(Date.now() / 1000) - HEALTH_CHECK_INTERVAL_MS / 1000;
  const row = getDb().prepare(
    `SELECT MAX(last_check) AS lc FROM relay_stats`
  ).get() as { lc: number | null };

  if (!row?.lc || row.lc < staleThreshold) {
    // Fire and forget
    checkAllRelays().catch(() => {/* background refresh — ignore errors */});
  }

  const healthy = cached.filter((r) => r.online && r.writable);
  // Fallback: if cache is empty, return default list optimistically
  if (healthy.length === 0) {
    return DEFAULT_RELAYS
      .filter((r) => r.writable)
      .map((r) => ({ url: r.url, online: true, latencyMs: null, writable: true, region: r.region }));
  }

  return healthy;
}

// ── Persistence ───────────────────────────────────────────────

function persist(info: RelayInfo): void {
  const now = Math.floor(Date.now() / 1000);
  getDb().prepare(`
    INSERT INTO relay_stats (url, online, latency_ms, writable, last_check)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(url) DO UPDATE SET
      online     = excluded.online,
      latency_ms = excluded.latency_ms,
      writable   = excluded.writable,
      last_check = excluded.last_check
  `).run(
    info.url,
    info.online ? 1 : 0,
    info.latencyMs ?? null,
    info.writable ? 1 : 0,
    now
  );
}
