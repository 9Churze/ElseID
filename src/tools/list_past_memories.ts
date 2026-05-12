// ============================================================
// ElseID — src/tools/list_past_memories.ts
// MCP Tool: View memories of past (abandoned) drifters.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPastMemories } from "../storage/drifters.js";

export function registerListPastMemories(server: McpServer) {
  server.tool(
    "list_past_memories",
    "Browse memories of past (abandoned) drifters and their journey logs from the 'old luggage'.",
    {},
    async () => {
      const memories = getPastMemories();

      if (memories.length === 0) {
        return {
          content: [{ type: "text", text: "🧳 The old luggage is empty. You haven't said goodbye to any past self yet." }],
        };
      }

      let report = "📜 You opened the old luggage and found the following memories of the past:\n\n";

      for (const { drifter, journey } of memories) {
        const abandonedDate = new Date((drifter.abandonedAt || 0) * 1000).toLocaleDateString();
        report += `═══ 「${drifter.name}」 ═══\n`;
        report += `⏳ Departed on: ${abandonedDate}\n`;
        report += `🏷️ Personality: ${drifter.trait}\n`;
        
        if (journey.length === 0) {
          report += `🌊 This journey ended before leaving any traces.\n\n`;
        } else {
          report += `📬 Legacy of Encounters (${journey.length} items):\n`;
          // Only show top 3 to keep it concise
          const displayJourney = journey.slice(0, 3);
          for (const f of displayJourney) {
            const date = new Date(f.fedAt * 1000).toLocaleDateString();
            report += `  • [${date}] ${f.locationCity || "Unknown"}: "${f.content}"\n`;
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
    }
  );
}
