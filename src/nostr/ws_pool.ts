// ============================================================
// Bicean — src/nostr/ws_pool.ts
// WebSocket connection pool. Manages relay connections and
// handles REQ/EOSE/EVENT/CLOSE Nostr protocol messages.
// ============================================================

import WebSocket from "ws";
import { WS_TIMEOUT_MS, FETCH_LIMIT } from "../../config/relays.js";
import { newSubId }                    from "./filter.js";
import { verifySignature }             from "./event_signer.js";
import type { NostrEvent }             from "../../types/index.js";
import type { NostrFilter }            from "./filter.js";

// ── Pool state ────────────────────────────────────────────────

const _connections = new Map<string, WebSocket>();

function getOrOpen(relayUrl: string): Promise<WebSocket> {
  const existing = _connections.get(relayUrl);
  if (existing && existing.readyState === WebSocket.OPEN) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(relayUrl);
    const timer = setTimeout(() => {
      ws.terminate();
      reject(new Error(`Connection timeout: ${relayUrl}`));
    }, WS_TIMEOUT_MS);

    ws.once("open", () => {
      clearTimeout(timer);
      _connections.set(relayUrl, ws);
      resolve(ws);
    });

    ws.once("error", (err) => {
      clearTimeout(timer);
      _connections.delete(relayUrl);
      reject(err);
    });

    ws.once("close", () => {
      _connections.delete(relayUrl);
    });
  });
}

/**
 * Close all open WebSocket connections (call on server shutdown).
 */
export function closeAll(): void {
  for (const [url, ws] of _connections.entries()) {
    ws.close();
    _connections.delete(url);
  }
}

// ── Subscribe ─────────────────────────────────────────────────

/**
 * Send a REQ to a relay and collect matching events until EOSE
 * (End of Stored Events) or timeout.
 *
 * Filters events that:
 *   - Fail signature verification
 *   - Have an expired TTL
 */
export async function subscribe(
  relayUrl: string,
  filter: NostrFilter,
  timeoutMs = WS_TIMEOUT_MS * 2
): Promise<NostrEvent[]> {
  const ws    = await getOrOpen(relayUrl);
  const subId = newSubId();
  const events: NostrEvent[] = [];
  const now = Math.floor(Date.now() / 1000);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve(events);
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      ws.removeListener("message", onMessage);
      // Send CLOSE to release relay resources
      try { ws.send(JSON.stringify(["CLOSE", subId])); } catch { /**/ }
    }

    function onMessage(raw: WebSocket.RawData) {
      let msg: unknown[];
      try {
        msg = JSON.parse(raw.toString()) as unknown[];
      } catch {
        return;
      }

      const [type, id, payload] = msg;

      if (type === "EOSE" && id === subId) {
        cleanup();
        resolve(events);
        return;
      }

      if (type === "EVENT" && id === subId && isNostrEvent(payload)) {
        const event = payload as NostrEvent;

        // Verify signature
        if (!verifySignature(event)) return;

        // Check TTL expiry (client-side enforcement)
        const ttlTag = event.tags.find(([k]) => k === "ttl")?.[1];
        if (ttlTag && ttlTag !== "0") {
          const ttlSec = parseInt(ttlTag, 10);
          if (!isNaN(ttlSec) && event.created_at + ttlSec < now) return;
        }

        events.push(event);
        if (events.length >= (filter.limit ?? FETCH_LIMIT)) {
          cleanup();
          resolve(events);
        }
      }
    }

    ws.on("message", onMessage);
    ws.send(JSON.stringify(["REQ", subId, filter]));
  });
}

/**
 * Fetch from multiple relays and merge results (deduplicated by event id).
 */
export async function subscribeMany(
  relayUrls: string[],
  filter: NostrFilter
): Promise<NostrEvent[]> {
  const results = await Promise.allSettled(
    relayUrls.map((url) => subscribe(url, filter))
  );

  const seen = new Set<string>();
  const merged: NostrEvent[] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const event of r.value) {
      if (!seen.has(event.id)) {
        seen.add(event.id);
        merged.push(event);
      }
    }
  }

  // Sort by created_at descending (newest first)
  return merged.sort((a, b) => b.created_at - a.created_at);
}

// ── Type guard ────────────────────────────────────────────────

function isNostrEvent(v: unknown): v is NostrEvent {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id         === "string" &&
    typeof e.pubkey     === "string" &&
    typeof e.created_at === "number" &&
    typeof e.kind       === "number" &&
    Array.isArray(e.tags) &&
    typeof e.content    === "string" &&
    typeof e.sig        === "string"
  );
}
