// ElseID — src/evolution/backpack.ts
// Inventory management for drifters.
// In the future, items could be encoded into a specific Nostr tag:
// ["item", "lighter", "pubkey_of_giver", "timestamp"]
export function parseBackpackTags(tags) {
    return tags
        .filter(t => t[0] === "item")
        .map(t => ({
        id: t[1],
        name: t[2] || "Unknown Item",
        giverPubkey: t[3] || "anonymous",
        createdAt: parseInt(t[4] || "0", 10),
    }));
}
//# sourceMappingURL=backpack.js.map