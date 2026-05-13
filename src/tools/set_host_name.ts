import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { setHostName } from "../storage/identity.js";

export function registerSetHostName(server: McpServer) {
  server.tool(
    "set_host_name",
    "Set the name of the user (Host) so that drifters know who is feeding them.",
    {
      name: z.string().min(1).describe("The chosen name of the Host"),
    },
    async ({ name }) => {
      try {
        await setHostName(name);
        return {
          content: [{ type: "text", text: `Host name successfully set to: ${name}. The cosmos will now remember you by this name.` }],
        };
      } catch (err: any) {
        return {
          content: [{ type: "text", text: `Error: Could not set host name. ${err.message}` }],
        };
      }
    }
  );
}
