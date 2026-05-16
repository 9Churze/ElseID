// ElseID — src/nostr/filter.ts
// Builds Nostr REQ subscription filters for drifters and feedings.
import { DRIFTER_KIND } from "../../types/index.js";
import crypto from "node:crypto";
export function buildDrifterFilter(limit = 20) {
    return {
        kinds: [DRIFTER_KIND],
        limit,
        "#type": ["drifter"],
    };
}
export function buildFeedingFilter(drifterId, limit = 50) {
    return {
        kinds: [DRIFTER_KIND],
        limit,
        "#e": [drifterId],
        "#type": ["feeding"],
    };
}
export function newSubId() {
    return crypto.randomBytes(8).toString("hex");
}
//# sourceMappingURL=filter.js.map