// ElseID — src/nostr/ws_pool.ts
// WebSocket connection pool. Manages relay connections and
// handles REQ/EOSE/EVENT/CLOSE Nostr protocol messages.

import WebSocket from "ws";
import { WS_TIMEOUT_MS, FETCH_LIMIT } from "../../config/relays.js";
import { newSubId }                    from "./filter.js";
import { verifySignature }             from "./event_signer.js";
import type { NostrEvent }             from "../../types/index.js";
import type { NostrFilter }            from "./filter.js";

// Pool state

const _connections = new Map<string, WebSocket>();
const _connecting  = new Map<string, Promise<WebSocket>>();

function getOrOpen(relayUrl: string): Promise<WebSocket> {
  const existing = _connections.get(relayUrl);
  if (existing && existing.readyState === WebSocket.OPEN) {
    return Promise.resolve(existing);
  }

  const inProgress = _connecting.get(relayUrl);
  if (inProgress) return inProgress;

  const promise = new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(relayUrl);
    const timer = setTimeout(() => {
      ws.terminate();
      _connecting.delete(relayUrl);
      reject(new Error(`Connection timeout: ${relayUrl}`));
    }, WS_TIMEOUT_MS);

    ws.once("open", () => {
      clearTimeout(timer);
      _connections.set(relayUrl, ws);
      _connecting.delete(relayUrl);
      resolve(ws);
    });

    ws.once("error", (err: Error) => {
      clearTimeout(timer);
      _connections.delete(relayUrl);
      _connecting.delete(relayUrl);
      reject(err);
    });

    ws.once("close", () => {
      _connections.delete(relayUrl);
      _connecting.delete(relayUrl);
    });
  });

  _connecting.set(relayUrl, promise);
  return promise;
}

export function closeAll(): void {
  for (const [url, ws] of _connections.entries()) {
    ws.close();
    _connections.delete(url);
  }
}

// Subscribe

export async function subscribe(
  relayUrl: string,
  filter: NostrFilter,
  timeoutMs = WS_TIMEOUT_MS * 2
): Promise<{ event: NostrEvent; relay: string }[]> {
  let ws: WebSocket;
  try {
    ws = await getOrOpen(relayUrl);
  } catch {
    return []; // Return empty if connection fails
  }

  const subId = newSubId();
  const results: { event: NostrEvent; relay: string }[] = [];
  const now = Math.floor(Date.now() / 1000);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve(results);
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      ws.removeListener("message", onMessage);
      ws.removeListener("close", onAbort);
      ws.removeListener("error", onAbort);
      try { ws.send(JSON.stringify(["CLOSE", subId])); } catch { /**/ }
    }

    function onAbort() {
      cleanup();
      resolve(results);
    }

    function onMessage(raw: WebSocket.RawData) {
      let msg: unknown[];
      try {
        msg = JSON.parse(raw.toString()) as unknown[];
      } catch { return; }

      const [type, id, payload] = msg;

      if (type === "EOSE" && id === subId) {
        cleanup();
        resolve(results);
        return;
      }

      if (type === "EVENT" && id === subId && isNostrEvent(payload)) {
        const event = payload as NostrEvent;
        if (!verifySignature(event)) return;

        const ttlTag = event.tags.find(([k]) => k === "ttl")?.[1];
        if (ttlTag && ttlTag !== "0") {
          const ttlSec = parseInt(ttlTag, 10);
          if (!isNaN(ttlSec) && event.created_at + ttlSec < now) return;
        }

        results.push({ event, relay: relayUrl });
        if (results.length >= (filter.limit ?? FETCH_LIMIT)) {
          cleanup();
          resolve(results);
        }
      }
    }

    ws.on("message", onMessage);
    ws.on("close", onAbort);
    ws.on("error", onAbort);
    ws.send(JSON.stringify(["REQ", subId, filter]));
  });
}

export async function subscribeMany(
  relayUrls: string[],
  filter: NostrFilter
): Promise<{ event: NostrEvent; relay: string }[]> {
  const results = await Promise.allSettled(
    relayUrls.map((url) => subscribe(url, filter))
  );

  const seen = new Set<string>();
  const merged: { event: NostrEvent; relay: string }[] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value) {
      if (!seen.has(item.event.id)) {
        seen.add(item.event.id);
        merged.push(item);
      }
    }
  }

  return merged.sort((a, b) => b.event.created_at - a.event.created_at);
}

// Type guard

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
