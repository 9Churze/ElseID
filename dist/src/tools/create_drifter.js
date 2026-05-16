// ElseID — src/tools/create_drifter.ts
// MCP Tool: Create and launch an ElseID drifter.
import { z } from "zod";
import { getFuzzyLocation } from "../location/geo.js";
import { buildDrifterEvent } from "../nostr/event_builder.js";
import { signEvent } from "../nostr/event_signer.js";
import { pickRelayByGeo } from "../relay/selector.js";
import { broadcast } from "../relay/broadcaster.js";
import { saveMyDrifter } from "../storage/drifters.js";
import { getDb } from "../storage/db.js";
import { isCreating, setCreationLock, getActiveDrifterId, getPrimaryIdentity } from "../storage/identity.js";
import { sanitizeDisplayText, sanitizeName } from "../utils/text.js";
import { sanitizeErrorMessage } from "../utils/errors.js";
const schema = z.object({
    name: z.string().describe("Name of your ElseID drifter"),
    personality: z.string().describe("Full personality description/quote"),
    trait: z.string().describe("Primary identity trait extracted by the Butler"),
    tags: z.array(z.string()).describe("List of personality tags extracted by the Butler"),
});
export function registerCreateDrifter(server) {
    server.tool("create_drifter", "Create and launch your ElseID drifter. As the Butler, you are responsible for extracting the core trait and personality tags from the user's description before calling this tool.", schema.shape, async (input) => {
        const identity = await getPrimaryIdentity();
        const db = getDb();
        const creating = await isCreating();
        const activeId = await getActiveDrifterId();
        if (activeId || creating) {
            return {
                content: [{ type: "text", text: "❌ You already have a drifter on a journey or in the process of launching. Please wait." }],
                isError: true,
            };
        }
        await setCreationLock(true);
        try {
            const location = await getFuzzyLocation();
            const safeName = sanitizeName(input.name, "Unnamed Drifter");
            const safePersonality = sanitizeDisplayText(input.personality, 1000);
            const safeTrait = sanitizeDisplayText(input.trait, 120);
            const safeTags = input.tags.map((tag) => sanitizeDisplayText(tag, 40)).filter(Boolean).slice(0, 8);
            const unsigned = buildDrifterEvent({
                pubkey: identity.pubkey,
                name: safeName,
                personality: safePersonality,
                analysis: {
                    trait: safeTrait,
                    tags: safeTags,
                },
                location,
                content: safePersonality,
            });
            const signed = signEvent(unsigned, identity.privkey);
            const relayUrl = await pickRelayByGeo(location);
            const result = await broadcast(signed, relayUrl);
            if (!result.success) {
                return {
                    content: [{ type: "text", text: `⚠️ Launch failed: ${sanitizeErrorMessage(result.message)}` }],
                    isError: true,
                };
            }
            await db.exec("BEGIN IMMEDIATE");
            try {
                await saveMyDrifter({
                    id: signed.id,
                    pubkey: signed.pubkey,
                    name: safeName,
                    personality: safePersonality,
                    trait: safeTrait,
                    tags: safeTags,
                    relay: relayUrl,
                    departedAt: signed.created_at,
                    status: "roaming",
                });
                await db.run(`
            UPDATE identities
            SET active_drifter_id = ?, is_creating = 0
            WHERE pubkey = ?
          `, [signed.id, identity.pubkey]);
                await db.exec("COMMIT");
            }
            catch (err) {
                await db.exec("ROLLBACK").catch(() => { });
                throw err;
            }
            return {
                content: [{
                        type: "text",
                        text: `🚀 ElseID launched successfully!\n\n「${safeName}」 has set sail and is entering the wandering network...\n\n` +
                            `📍 Initial Relay: ${relayUrl}\n` +
                            `🌊 Status: Looking for the first person to host it.`
                    }],
            };
        }
        finally {
            // Unlock creation process
            await setCreationLock(false);
        }
    });
}
//# sourceMappingURL=create_drifter.js.map