import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { setHostName } from "../storage/identity.js";
import { sanitizeName } from "../utils/text.js";

export function registerSetHostName(server: McpServer) {
  server.tool(
    "set_host_name",
    "Set the name of the user (Host) so that drifters know who is feeding them.",
    {
      name: z.string().min(1).max(80).describe("The chosen name of the Host"),
    },
    async ({ name }) => {
      try {
        const safeName = sanitizeName(name, "Host");
        await setHostName(safeName);
        return {
          content: [{ type: "text", text: `Host name successfully set to: ${safeName}. The cosmos will now remember you by this name.` }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Error: Could not set host name. ${err.message}` }],
        };
      }
    }
  );
}
