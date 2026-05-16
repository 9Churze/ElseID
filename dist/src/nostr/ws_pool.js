// ElseID — src/nostr/ws_pool.ts
// WebSocket connection pool. Manages relay connections and
// handles REQ/EOSE/EVENT/CLOSE Nostr protocol messages.
import WebSocket from "ws";
import { WS_TIMEOUT_MS, FETCH_LIMIT } from "../../config/relays.js";
import { newSubId } from "./filter.js";
import { verifySignature } from "./event_signer.js";
// Pool state
const _connections = new Map();
const _connecting = new Map();
function getOrOpen(relayUrl) {
    const existing = _connections.get(relayUrl);
    if (existing) {
        if (existing.readyState === 1) { // 1: WebSocket.OPEN
            return Promise.resolve(existing);
        }
        // 2: CLOSING, 3: CLOSED - remove and re-open
        if (existing.readyState === 2 || existing.readyState === 3) {
            _connections.delete(relayUrl);
        }
    }
    const inProgress = _connecting.get(relayUrl);
    if (inProgress)
        return inProgress;
    const promise = new Promise((resolve, reject) => {
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
        ws.once("error", (err) => {
            clearTimeout(timer);
            _connections.delete(relayUrl);
            _connecting.delete(relayUrl);
            reject(err);
        });
        ws.once("close", () => {
            clearTimeout(timer);
            _connections.delete(relayUrl);
            _connecting.delete(relayUrl);
        });
    });
    _connecting.set(relayUrl, promise);
    return promise;
}
export function closeAll() {
    for (const [url, ws] of _connections.entries()) {
        ws.close();
        _connections.delete(url);
    }
    _connecting.clear();
}
// Subscribe
export async function subscribe(relayUrl, filter, timeoutMs = WS_TIMEOUT_MS * 2) {
    let ws;
    try {
        ws = await getOrOpen(relayUrl);
    }
    catch {
        return [];
    }
    const subId = newSubId();
    const results = [];
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
            try {
                ws.send(JSON.stringify(["CLOSE", subId]));
            }
            catch (err) {
                console.error(`[ws_pool] Failed to send CLOSE for ${subId}:`, err);
            }
        }
        function onAbort() {
            cleanup();
            resolve(results);
        }
        function onMessage(raw) {
            let msg;
            try {
                msg = JSON.parse(raw.toString());
            }
            catch (err) {
                console.error("[ws_pool] Failed to parse message:", err);
                return;
            }
            const [type, id, payload] = msg;
            if (type === "EOSE" && id === subId) {
                cleanup();
                resolve(results);
                return;
            }
            if (type === "EVENT" && id === subId && isNostrEvent(payload)) {
                const event = payload;
                if (!verifySignature(event))
                    return;
                const ttlTag = event.tags.find(([k]) => k === "ttl")?.[1];
                if (ttlTag && ttlTag !== "0") {
                    const ttlSec = parseInt(ttlTag, 10);
                    if (!isNaN(ttlSec) && event.created_at + ttlSec < now)
                        return;
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
        try {
            ws.send(JSON.stringify(["REQ", subId, filter]));
        }
        catch (err) {
            cleanup();
            resolve(results);
        }
    });
}
export async function subscribeMany(relayUrls, filter) {
    const results = await Promise.allSettled(relayUrls.map((url) => subscribe(url, filter)));
    const seen = new Set();
    const merged = [];
    for (const r of results) {
        if (r.status !== "fulfilled")
            continue;
        for (const item of r.value) {
            if (!seen.has(item.event.id)) {
                seen.add(item.event.id);
                merged.push(item);
            }
        }
    }
    return merged.sort((a, b) => b.event.created_at - a.event.created_at);
}
export async function subscribeRaceFirst(relayUrls, filter, predicate, timeoutMs = WS_TIMEOUT_MS * 2) {
    const abortController = new AbortController();
    const now = Math.floor(Date.now() / 1000);
    return new Promise((resolve) => {
        let resolved = false;
        let pending = relayUrls.length;
        const timer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                abortController.abort();
                resolve(null);
            }
        }, timeoutMs);
        const finishRelay = () => {
            pending -= 1;
            if (pending <= 0 && !resolved) {
                resolved = true;
                clearTimeout(timer);
                abortController.abort();
                resolve(null);
            }
        };
        const checkEvent = async (event, relay) => {
            if (resolved)
                return;
            try {
                const pass = await predicate(event);
                if (pass && !resolved) {
                    resolved = true;
                    clearTimeout(timer);
                    abortController.abort();
                    resolve({ event, relay });
                }
            }
            catch {
                // predicate failed
            }
        };
        if (relayUrls.length === 0) {
            clearTimeout(timer);
            resolve(null);
            return;
        }
        for (const relayUrl of relayUrls) {
            const subId = newSubId();
            let ws;
            try {
                getOrOpen(relayUrl).then((opened) => {
                    ws = opened;
                    if (resolved) {
                        finishRelay();
                        return;
                    }
                    let finished = false;
                    const cleanup = () => {
                        ws.removeListener("message", onMessage);
                        ws.removeListener("close", onAbort);
                        ws.removeListener("error", onAbort);
                        abortController.signal.removeEventListener("abort", onAbort);
                        try {
                            ws.send(JSON.stringify(["CLOSE", subId]));
                        }
                        catch (err) {
                            console.error(`[ws_pool] Failed to send CLOSE (race) for ${subId}:`, err);
                        }
                    };
                    const closeRelay = () => {
                        if (finished)
                            return;
                        finished = true;
                        cleanup();
                        finishRelay();
                    };
                    const onAbort = () => closeRelay();
                    const onMessage = (raw) => {
                        if (resolved) {
                            closeRelay();
                            return;
                        }
                        let msg;
                        try {
                            msg = JSON.parse(raw.toString());
                        }
                        catch (err) {
                            console.error("[ws_pool] Failed to parse message (race):", err);
                            return;
                        }
                        const [type, id, payload] = msg;
                        if (type === "EOSE" && id === subId) {
                            closeRelay();
                            return;
                        }
                        if (type === "EVENT" && id === subId && isNostrEvent(payload)) {
                            const event = payload;
                            if (!verifySignature(event))
                                return;
                            const ttlTag = event.tags.find(([k]) => k === "ttl")?.[1];
                            if (ttlTag && ttlTag !== "0") {
                                const ttlSec = parseInt(ttlTag, 10);
                                if (!isNaN(ttlSec) && event.created_at + ttlSec < now)
                                    return;
                            }
                            checkEvent(event, relayUrl);
                        }
                    };
                    ws.on("message", onMessage);
                    ws.on("close", onAbort);
                    ws.on("error", onAbort);
                    abortController.signal.addEventListener("abort", onAbort);
                    try {
                        ws.send(JSON.stringify(["REQ", subId, filter]));
                    }
                    catch (err) {
                        closeRelay();
                    }
                }).catch(() => {
                    finishRelay();
                });
            }
            catch {
                finishRelay();
            }
        }
    });
}
// Type guard
function isNostrEvent(v) {
    if (typeof v !== "object" || v === null)
        return false;
    const e = v;
    return (typeof e.id === "string" &&
        typeof e.pubkey === "string" &&
        typeof e.created_at === "number" &&
        typeof e.kind === "number" &&
        Array.isArray(e.tags) &&
        typeof e.content === "string" &&
        typeof e.sig === "string");
}
//# sourceMappingURL=ws_pool.js.map