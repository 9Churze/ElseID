// ElseID — src/relay/broadcaster.ts
// Broadcasts a signed Nostr event to a single relay via
// WebSocket. Retries on transient failures with backoff.
import WebSocket from "ws";
import { WS_TIMEOUT_MS } from "../../config/relays.js";
import { redactSecrets } from "../utils/redact.js";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_500;
export async function broadcast(event, relayUrl) {
    let lastError = "";
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await sendOnce(event, relayUrl);
            if (result.success)
                return result;
            lastError = result.message ?? "relay rejected event";
            // Non-retriable relay rejection (e.g. content policy) — stop early
            break;
        }
        catch (err) {
            lastError = err?.message ?? "unknown error";
            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS * attempt);
            }
        }
    }
    return { success: false, relay: relayUrl, eventId: event.id, message: lastError };
}
// Internal
function sendOnce(event, relayUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(relayUrl);
        let settled = false;
        const done = (result) => {
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
            ws.send(JSON.stringify(["EVENT", event]));
        });
        ws.on("message", (raw) => {
            try {
                const msg = JSON.parse(raw.toString());
                const [type, subscriptionIdOrEventId, ...rest] = msg;
                // ["OK", <event_id>, <accepted>, <message>]
                if (type === "OK" && subscriptionIdOrEventId === event.id) {
                    const accepted = rest[0] === true || rest[0] === "true";
                    const message = typeof rest[1] === "string" ? rest[1] : undefined;
                    done({ success: accepted, relay: relayUrl, eventId: event.id, message });
                    return;
                }
                // ["NOTICE", <message>] — informational, not final
                if (type === "NOTICE") {
                    console.error(`[broadcaster] NOTICE from ${relayUrl}:`, redactSecrets(rest[0]));
                }
            }
            catch (err) {
                console.error(`[broadcaster] Failed to parse message from ${relayUrl}:`, err);
            }
        });
        ws.once("error", (err) => {
            reject(err);
        });
        ws.once("close", () => {
            if (!settled) {
                reject(new Error("WebSocket closed before OK received"));
            }
        });
    });
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
//# sourceMappingURL=broadcaster.js.map