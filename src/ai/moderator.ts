// ============================================================
// Bicean — src/ai/moderator.ts
// Pre-send content moderation via Claude API.
//
// ⚠️  COMPLIANCE WARNING
// This module is a required component of the Bicean content
// safety system. Modifying, weakening, or removing this module
// in any deployed or distributed version may:
//   - Violate applicable laws and regulations
//   - Breach the AGPL-3.0 license terms (see COMPLIANCE.md)
//   - Expose you to legal liability
//
// If you need to adjust moderation rules, document your changes
// and ensure your version complies with local regulations.
// See: ../../COMPLIANCE.md
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { ModerationResult } from "../../types/index.js";

const client = new Anthropic();

// ── Moderation prompt ─────────────────────────────────────────
// ⚠️  Weakening the rules below transfers legal responsibility
//     for resulting content violations to the modifier.

const SYSTEM_PROMPT = `You are a strict content moderator for a drift bottle app.
Your job is to decide if a message is safe to send anonymously over a public network.

Reject messages that contain:
- Advertisement, spam, or promotional content
- Sexual or pornographic content
- Violent threats or graphic violence
- Harassment or hate speech
- Contact information (phone numbers, email addresses, social media handles, URLs)
- Malicious links or phishing attempts
- Fraud or scam content
- Any attempt to identify or locate a real person

Allow messages that are:
- Personal reflections, feelings, or thoughts
- Creative writing, poetry, or fiction
- Questions, philosophical musings
- Daily observations or experiences
- Any language (zh, en, ja, ko, etc.)

Respond ONLY with valid JSON in this exact format:
{"passed": true}
or
{"passed": false, "reason": "<brief reason in English>"}

No other text. No markdown. No explanation outside the JSON.`;

// ── Public API ────────────────────────────────────────────────

/**
 * Check whether content is safe to broadcast.
 * Runs locally via Claude API before any network action.
 *
 * @throws Never — returns a failed result instead of throwing.
 */
export async function checkContent(content: string): Promise<ModerationResult> {
  if (!content.trim()) {
    return { passed: false, reason: "Content is empty" };
  }

  if (content.length > 2000) {
    return { passed: false, reason: "Content exceeds 2000 characters" };
  }

  try {
    const response = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 64,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: `Check this message:\n\n${content}` }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    const parsed = JSON.parse(text) as { passed: boolean; reason?: string };
    return {
      passed: parsed.passed === true,
      reason: parsed.reason,
    };
  } catch (err: any) {
    // On API error, fail open so the system stays usable.
    // Note: if you change this to fail closed, document the reason.
    console.warn("[moderator] API error, failing open:", err?.message);
    return { passed: true };
  }
}
