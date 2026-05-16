// ElseID — src/relay/health.ts
// Relay health checks: online status, latency, writability.
// Persists results to relay_stats table for use by selector.
import WebSocket from "ws";
import { getDb } from "../storage/db.js";
import { DEFAULT_RELAYS, WS_TIMEOUT_MS, HEALTH_CHECK_INTERVAL_MS } from "../../config/relays.js";
// Single relay check
export async function checkRelay(url) {
    return new Promise((resolve) => {
        const start = Date.now();
        let settled = false;
        const timeout = setTimeout(async () => {
            if (!settled) {
                settled = true;
                ws.terminate();
                await persist({ url, online: false, latencyMs: null, writable: false });
                resolve({ url, online: false, latencyMs: null, writable: false });
            }
        }, WS_TIMEOUT_MS);
        const ws = new WebSocket(url);
        ws.once("open", () => {
            const latencyMs = Date.now() - start;
            ws.send(JSON.stringify(["REQ", "health-probe", { kinds: [7777], limit: 1 }]));
            setTimeout(async () => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timeout);
                    try {
                        ws.send(JSON.stringify(["CLOSE", "health-probe"]));
                    }
                    catch (err) {
                        console.error(`[health] Failed to close health-probe for ${url}:`, err);
                    }
                    ws.close();
                    const info = { url, online: true, latencyMs, writable: true };
                    await persist(info);
                    resolve(info);
                }
            }, 1_000);
        });
        ws.once("error", async (err) => {
            if (!settled) {
                settled = true;
                clearTimeout(timeout);
                const info = { url, online: false, latencyMs: null, writable: false };
                await persist(info);
                resolve(info);
            }
        });
    });
}
// Batch check
export async function checkAllRelays() {
    const urls = DEFAULT_RELAYS.map((r) => r.url);
    const results = await Promise.all(urls.map(checkRelay));
    return results.sort((a, b) => {
        if (a.online !== b.online)
            return a.online ? -1 : 1;
        if (a.latencyMs === null)
            return 1;
        if (b.latencyMs === null)
            return -1;
        return a.latencyMs - b.latencyMs;
    });
}
export async function getCachedRelayInfo() {
    const db = getDb();
    const rows = await db.all(`
    SELECT url, online, latency_ms, writable, last_check
    FROM relay_stats
    ORDER BY online DESC, latency_ms ASC
  `);
    return rows.map((r) => ({
        url: r.url,
        online: r.online === 1,
        latencyMs: r.latency_ms,
        writable: r.writable === 1,
    }));
}
export async function getHealthyRelays() {
    const cached = await getCachedRelayInfo();
    const db = getDb();
    const staleThreshold = Math.floor(Date.now() / 1000) - HEALTH_CHECK_INTERVAL_MS / 1000;
    const row = await db.get(`SELECT MAX(last_check) AS lc FROM relay_stats`);
    if (!row?.lc || row.lc < staleThreshold) {
        checkAllRelays().catch((err) => {
            console.error("⚠️ Background relay health check failed:", err);
        });
    }
    const healthy = cached.filter((r) => r.online && r.writable);
    if (healthy.length === 0) {
        return DEFAULT_RELAYS
            .filter((r) => r.writable)
            .map((r) => ({ url: r.url, online: true, latencyMs: null, writable: true, region: r.region }));
    }
    return healthy;
}
// Persistence
async function persist(info) {
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);
    await db.run(`
    INSERT INTO relay_stats (url, online, latency_ms, writable, last_check)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(url) DO UPDATE SET
      online     = excluded.online,
      latency_ms = excluded.latency_ms,
      writable   = excluded.writable,
      last_check = excluded.last_check
  `, [
        info.url,
        info.online ? 1 : 0,
        info.latencyMs ?? null,
        info.writable ? 1 : 0,
        now
    ]);
}
//# sourceMappingURL=health.js.map