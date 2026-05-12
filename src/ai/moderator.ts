// ============================================================
// ElseID — src/ai/moderator.ts
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

  // 2. Prohibited keyword blocklist (secondary fallback layer)
  // Primary filtering is done by the AI client (Claude/Codex). This layer
  // catches structured patterns and common obfuscations.
  const blockList = [
    // Sexual content
    "porn", "porno", "pornographic", "sexual", "nude", "nudity", "nsfw",
    "色情", "淫秽", "成人内容", "裸体",
    // Violence
    "violence", "violent", "threat", "threaten", "kill", "murder", "rape",
    "暴力", "威胁", "杀人", "强奸",
    // Self-harm
    "suicide", "self-harm", "自杀", "自残",
    // Spam & promotion
    "advertise", "advertisement", "promo", "promotion", "buy now", "sell",
    "discount", "free trial", "click here", "limited offer",
    "广告", "推销", "优惠", "买卖", "代购", "兼职", "招募",
    // Hate speech markers (simplified — AI client handles nuance)
    "hate speech", "racist", "sexist",
    "仇恨", "歧视",
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
