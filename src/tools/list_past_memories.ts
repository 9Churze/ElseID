// ============================================================
// ElseID — src/tools/list_past_memories.ts
// MCP Tool: View memories of past (abandoned) drifters.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPastMemories } from "../storage/drifters.js";

export function registerListPastMemories(server: McpServer) {
  server.tool(
    "list_past_memories",
    "从旧行李箱里翻出过去的分身记忆（查看已注销的分身及其见闻录）。",
    {},
    async () => {
      const memories = getPastMemories();

      if (memories.length === 0) {
        return {
          content: [{ type: "text", text: "🧳 旧行李箱里空空如也，你还没有向过去告别过。" }],
        };
      }

      let report = "📜 你翻开了旧行李箱，找到了以下过去的记忆：\n\n";

      for (const { drifter, journey } of memories) {
        const abandonedDate = new Date((drifter.abandonedAt || 0) * 1000).toLocaleDateString();
        report += `═══ 「${drifter.name}」 ═══\n`;
        report += `⏳ 告别时间: ${abandonedDate}\n`;
        report += `🏷️ 性格标签: ${drifter.trait}\n`;
        
        if (journey.length === 0) {
          report += `🌊 这段旅程还没来得及留下痕迹就结束了。\n\n`;
        } else {
          report += `📬 留下的见闻 (${journey.length} 条):\n`;
          // 只展示最近的 3 条，避免太长
          const displayJourney = journey.slice(0, 3);
          for (const f of displayJourney) {
            const date = new Date(f.fedAt * 1000).toLocaleDateString();
            report += `  • [${date}] ${f.locationCity || "未知"}: "${f.content}"\n`;
          }
          if (journey.length > 3) {
            report += `  ... 以及另外 ${journey.length - 3} 条被尘封的记录。\n`;
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
