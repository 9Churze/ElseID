// ElseID — src/tools/list_past_memories.ts
// MCP Tool: View memories of past (abandoned) drifters.
import { getPastMemories } from "../storage/drifters.js";
import { sanitizeDisplayText, sanitizeName } from "../utils/text.js";
export function registerListPastMemories(server) {
    server.tool("list_past_memories", "Browse memories of past (abandoned) drifters and their journey logs from the 'old luggage'.", {}, async () => {
        const memories = await getPastMemories();
        if (memories.length === 0) {
            return {
                content: [{ type: "text", text: "🧳 The old luggage is empty. You haven't said goodbye to any past self yet." }],
            };
        }
        let report = "📜 You opened the old luggage and found the following memories of the past:\n\n";
        for (const { drifter, journey } of memories) {
            const abandonedDate = new Date((drifter.abandonedAt || 0) * 1000).toLocaleDateString();
            report += `═══ 「${sanitizeName(drifter.name, "Unnamed Drifter")}」 ═══\n`;
            report += `⏳ Departed on: ${abandonedDate}\n`;
            report += `🏷️ Personality: ${sanitizeDisplayText(drifter.trait, 120)}\n`;
            if (journey.length === 0) {
                report += `🌊 This journey ended before leaving any traces.\n\n`;
            }
            else {
                report += `📬 Legacy of Encounters (${journey.length} items):\n`;
                // Only show top 3 to keep it concise
                const displayJourney = journey.slice(0, 3);
                for (const f of displayJourney) {
                    const date = new Date(f.fedAt * 1000).toLocaleDateString();
                    report += `  • [${date}] ${sanitizeDisplayText(f.locationCity || "Unknown", 80)}: "${sanitizeDisplayText(f.content, 500)}"\n`;
                }
                if (journey.length > 3) {
                    report += `  ... and ${journey.length - 3} more sealed records.\n`;
                }
                report += "\n";
            }
        }
        return {
            content: [{ type: "text", text: report }],
        };
    });
}
//# sourceMappingURL=list_past_memories.js.map