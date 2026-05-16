// ElseID — src/nostr/event_builder.ts
// Constructs kind:7777 unsigned Nostr events for digital drifters.
import { DRIFTER_KIND } from "../../types/index.js";
export function buildDrifterEvent(opts) {
    const { pubkey, name, personality, analysis, location, content } = opts;
    const now = Math.floor(Date.now() / 1000);
    const tags = [
        ["type", "drifter"],
        ["name", name],
        ["personality", personality],
        ["trait", analysis.trait],
    ];
    for (const t of analysis.tags) {
        tags.push(["t", t]);
    }
    if (location.country)
        tags.push(["country", location.country]);
    if (location.city)
        tags.push(["city", location.city]);
    return {
        pubkey,
        created_at: now,
        kind: DRIFTER_KIND,
        tags,
        content,
    };
}
export function buildFeedingEvent(opts) {
    const { pubkey, drifterEventId, feedType, content, location, hostName } = opts;
    const tags = [
        ["type", "feeding"],
        ["e", drifterEventId],
        ["feed_type", feedType],
    ];
    if (hostName)
        tags.push(["host_name", hostName]);
    if (location.country)
        tags.push(["country", location.country]);
    if (location.city)
        tags.push(["city", location.city]);
    return {
        pubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: DRIFTER_KIND,
        tags,
        content,
    };
}
export function buildDeletionEvent(pubkey, eventIds, reason = "") {
    return {
        pubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 5,
        tags: eventIds.map(id => ["e", id]),
        content: reason,
    };
}
// Tag parsing helpers
export function getTag(tags, name) {
    return tags.find(([k]) => k === name)?.[1];
}
export function getAllTags(tags, name) {
    return tags.filter(([k]) => k === name).map(([, v]) => v);
}
//# sourceMappingURL=event_builder.js.map