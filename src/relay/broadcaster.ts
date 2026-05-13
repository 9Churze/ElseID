// ElseID — src/relay/broadcaster.ts
// Broadcasts a signed Nostr event to a single relay via
// WebSocket. Retries on transient failures with backoff.

import WebSocket from "ws";
import { WS_TIMEOUT_MS } from "../../config/relays.js";
import type { NostrEvent } from "../../types/index.js";

const MAX_RETRIES   = 3;
const RETRY_DELAY_MS = 1_500;

export interface BroadcastResult {
  success:  boolean;
  relay:    string;
  eventId:  string;
  message?: string;
}

export async function broadcast(
  event: NostrEvent,
  relayUrl: string
): Promise<BroadcastResult> {
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await sendOnce(event, relayUrl);
      if (result.success) return result;
      lastError = result.message ?? "relay rejected event";
      // Non-retriable relay rejection (e.g. content policy) — stop early
      break;
    } catch (err: any) {
      lastError = err?.message ?? "unknown error";
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  return { success: false, relay: relayUrl, eventId: event.id, message: lastError };
}

// Internal

function sendOnce(event: NostrEvent, relayUrl: string): Promise<BroadcastResult> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(relayUrl);
    let settled = false;

    const done = (result: BroadcastResult) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        ws.close();
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws.terminate();
        reject(new Error("WebSocket timeout"));
      }
    }, WS_TIMEOUT_MS);

    ws.once("open", () => {
      // Nostr protocol: ["EVENT", <event>]
      ws.send(JSON.stringify(["EVENT", event]));
    });

    ws.on("message", (raw: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(raw.toString()) as unknown[];
        const [type, subscriptionIdOrEventId, ...rest] = msg;

        // ["OK", <event_id>, <accepted>, <message>]
        if (type === "OK" && subscriptionIdOrEventId === event.id) {
          const accepted = rest[0] === true || rest[0] === "true";
          const message  = typeof rest[1] === "string" ? rest[1] : undefined;
          done({ success: accepted, relay: relayUrl, eventId: event.id, message });
          return;
        }

        // ["NOTICE", <message>] — informational, not final
        if (type === "NOTICE") {
          console.warn(`[broadcaster] NOTICE from ${relayUrl}:`, rest[0]);
        }
      } catch {
        // ignore parse errors
      }
    });

    ws.once("error", (err: Error) => {
      reject(err);
    });

    ws.once("close", () => {
      if (!settled) {
        reject(new Error("WebSocket closed before OK received"));
      }
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
