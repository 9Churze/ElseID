// ElseID — src/evolution/backpack.ts
// Inventory management for drifters.

export interface BackpackItem {
  id: string;
  name: string;
  giverPubkey: string;
  createdAt: number;
}

// In the future, items could be encoded into a specific Nostr tag:
// ["item", "lighter", "pubkey_of_giver", "timestamp"]
export function parseBackpackTags(tags: string[][]): BackpackItem[] {
  return tags
    .filter(t => t[0] === "item")
    .map(t => ({
      id: t[1],
      name: t[2] || "Unknown Item",
      giverPubkey: t[3] || "anonymous",
      createdAt: parseInt(t[4] || "0", 10),
    }));
}
