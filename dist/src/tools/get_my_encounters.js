import { getMyEncounters } from "../storage/drifters.js";
import { sanitizeDisplayText, sanitizeName } from "../utils/text.js";
export function registerGetMyEncounters(server) {
    server.tool("get_my_encounters", "View the log of strangers' drifters you have hosted and fed.", {}, async () => {
        const encounters = await getMyEncounters();
        if (encounters.length === 0) {
            return {
                content: [{ type: "text", text: "You have not hosted any digital drifters yet. Your terminal waits quietly for the first signal." }],
            };
        }
        let text = "📖 Your Encounters Log:\n\n";
        for (const enc of encounters) {
            const date = new Date(enc.fedAt * 1000).toLocaleString();
            const drifterInfo = enc.drifterName ? `「${sanitizeName(enc.drifterName, "Unnamed Drifter")}」` : `Drifter (${enc.drifterId.slice(0, 8)}...)`;
            text += `- [${date}] Hosted ${drifterInfo} at ${enc.relay}\n`;
            text += `  You shared (${enc.feedType}): "${sanitizeDisplayText(enc.content, 500)}"\n\n`;
        }
        return {
            content: [{ type: "text", text }],
        };
    });
}
//# sourceMappingURL=get_my_encounters.js.map