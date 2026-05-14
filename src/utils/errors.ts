// ElseID — src/utils/errors.ts
// Error sanitization for user-facing MCP messages.

import path from "node:path";

/**
 * Sanitizes an error message to prevent leaking internal paths or sensitive details.
 */
export function sanitizeErrorMessage(err: unknown): string {
  if (!err) return "An unknown error occurred.";
  
  let msg = err instanceof Error ? err.message : String(err);
  
  // Mask absolute paths
  const homeDir = process.env.HOME || "";
  if (homeDir) {
    msg = msg.split(homeDir).join("~");
  }
  
  // Mask generic system paths (e.g., /Users/..., /home/..., C:\Users\...)
  msg = msg.replace(/\/[a-zA-Z0-9._\-/]+/g, (m) => {
    if (m.includes("node_modules") || m.includes(".elseid")) {
      return "[INTERNAL_PATH]";
    }
    return m;
  });

  // Shorten overly long messages
  if (msg.length > 200) {
    msg = msg.substring(0, 197) + "...";
  }

  return msg;
}
