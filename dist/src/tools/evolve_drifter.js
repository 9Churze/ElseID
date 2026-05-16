// ElseID — src/tools/evolve_drifter.ts
// MCP Tool: Synthesize experiences to evolve the drifter's personality.
import { z } from "zod";
import { getMyActiveDrifter } from "../storage/drifters.js";
import { evolveCognition } from "../evolution/synthesis.js";
const schema = z.object({
    new_personality: z.string().describe("A summary of its updated personality after its journeys"),
    new_trait: z.string().describe("Its core characteristic, updated. Example: 'The Warmed Voyager'"),
    new_tags: z.array(z.string()).describe("3-5 keywords reflecting its current state"),
    reason: z.string().describe("Why it is evolving (e.g. 'It learned compassion from strangers')"),
});
export function registerEvolveDrifter(server) {
    server.tool("evolve_drifter_personality", "Evolve your active drifter's personality and trait based on its recent journey log. MUST adhere strictly to Universal Values.", schema.shape, async (input) => {
        const drifter = await getMyActiveDrifter();
        if (!drifter) {
            return {
                content: [{ type: "text", text: "You have no active drifter to evolve." }],
                isError: true,
            };
        }
        const result = await evolveCognition(drifter, {
            newPersonality: input.new_personality,
            newTrait: input.new_trait,
            newTags: input.new_tags,
            evolutionReason: input.reason
        });
        if (!result.success) {
            return {
                content: [{ type: "text", text: `Evolution failed: ${result.message}` }],
                isError: true,
            };
        }
        return {
            content: [{
                    type: "text",
                    text: `✨ Soul Synthesis Complete.\n\nYour drifter has evolved.\n\n` +
                        `New Personality: ${input.new_personality}\n` +
                        `New Trait: ${input.new_trait}\n` +
                        `Tags: ${input.new_tags.join(", ")}\n\n` +
                        `The evolution lineage has been cryptographically signed into the Nostr network.`
                }],
        };
    });
}
//# sourceMappingURL=evolve_drifter.js.map