// ============================================================
// ElseID — src/tools/create_drifter.ts
// MCP Tool: Create and launch an ElseID drifter.
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFuzzyLocation } from "../location/geo.js";
import { getPrimaryIdentity, setActiveDrifter } from "../storage/identity.js";
import { buildDrifterEvent } from "../nostr/event_builder.js";
import { signEvent } from "../nostr/event_signer.js";
import { pickRelayByGeo } from "../relay/selector.js";
import { broadcast } from "../relay/broadcaster.js";
import { saveMyDrifter } from "../storage/drifters.js";

const schema = z.object({
  name: z.string().describe("Name of your ElseID drifter"),
  personality: z.string().describe("Full personality description/quote"),
  trait: z.string().describe("Primary identity trait extracted by the Butler"),
  tags: z.array(z.string()).describe("List of personality tags extracted by the Butler"),
});

export function registerCreateDrifter(server: McpServer) {
  server.tool(
    "create_drifter",
    "创建并放出你的 ElseID 分身。作为管家，你必须负责从用户的描述中提取核心特质(trait)和人格标签(tags)后再调用此工具。",
    schema.shape,
    async (input) => {
      const identity = getPrimaryIdentity();
      if (identity.activeDrifterId) {
        return {
          content: [{ type: "text", text: "❌ 你的 ElseID 正在旅途中。如需开启新旅程，请先进行重生仪式（abandon_drifter）。" }],
          isError: true,
        };
      }

      const location = await getFuzzyLocation();
      
      const unsigned = buildDrifterEvent({
        pubkey: identity.pubkey,
        name: input.name,
        personality: input.personality,
        analysis: {
          trait: input.trait,
          tags: input.tags,
        },
        location,
        content: input.personality, // Use the personality/quote as the content
      });

      const signed = signEvent(unsigned, identity.privkey);
      const relayUrl = pickRelayByGeo(location);
      const result = await broadcast(signed, relayUrl);

      if (!result.success) {
        return {
          content: [{ type: "text", text: `⚠️ Launch failed: ${result.message}` }],
          isError: true,
        };
      }

      saveMyDrifter({
        id: signed.id,
        pubkey: signed.pubkey,
        privkey: identity.privkey,
        name: input.name,
        personality: input.personality,
        trait: input.trait,
        tags: input.tags,
        relay: relayUrl,
        departedAt: signed.created_at,
        status: "roaming",
      });

      setActiveDrifter(signed.id);

      return {
        content: [{
          type: "text",
          text: `🚀 ElseID 创建成功！\n\n「${input.name}」已离岸，正在进入流浪网络…\n\n` +
                `📍 初始中继站: ${relayUrl}\n` +
                `🌊 当前状态: 正在寻找第一个愿意接待它的人。`
        }],
      };
    }
  );
}
