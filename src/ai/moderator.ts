// ============================================================
// Bicean — src/ai/moderator.ts
// Local content moderation.
// Blocks illegal/harmful content based on COMPLIANCE.md rules.
// ============================================================

import type { ModerationResult } from "../../types/index.js";

/**
 * Perform a local check on bottle content.
 * Since we are zero-config, we use heuristics (regex, blocklists).
 */
export async function checkContent(content: string): Promise<ModerationResult> {
  const normalized = content.toLowerCase();

  // 1. Contact information (regex)
  const contactPatterns = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email
    /(\+86|0)?1[3-9]\d{9}/g,                          // Phone (CN)
    /(https?:\/\/|www\.)\S+/g,                        // URLs
    /(v|wx|id|tel|mail|qq|tg|@):?\s*[a-zA-Z0-9_-]{3,}/g, // Social IDs
  ];

  for (const pattern of contactPatterns) {
    if (pattern.test(content)) {
      return { 
        passed: false, 
        reason: "Content contains contact information (Email/Phone/URL/ID) which is prohibited for anonymity." 
      };
    }
  }

  // 2. Prohibited keywords (Basic blocklist)
  // In a real app, this would be more extensive or use a local small model.
  const blockList = [
    "porn", "sexual", "nude", "violence", "threat", "kill", "suicide",
    "advertise", "promo", "buy", "sell", "discount",
    "色情", "淫秽", "暴力", "威胁", "自杀", "广告", "推销", "联系方式"
  ];

  for (const word of blockList) {
    if (normalized.includes(word)) {
      return { 
        passed: false, 
        reason: `Content contains prohibited keyword: "${word}".` 
      };
    }
  }

  // 3. Length check (already in schema but double check)
  if (content.length < 5) {
    return { passed: false, reason: "Content is too short to be meaningful." };
  }

  return { passed: true };
}
