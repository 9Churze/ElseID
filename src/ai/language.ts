// ============================================================
// Bicean — src/ai/language.ts
// Language detection for zh / en / ja / ko.
// Uses heuristics first; falls back to Claude API.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { SupportedLang } from "../../types/index.js";

const client = new Anthropic();

// ── Heuristic fast-path ───────────────────────────────────────

// CJK unified ideographs (Chinese / Japanese kanji)
const CJK_RE    = /[\u4E00-\u9FFF]/;
// Hiragana / Katakana (Japanese-specific)
const KANA_RE   = /[\u3040-\u30FF]/;
// Hangul (Korean)
const HANGUL_RE = /[\uAC00-\uD7AF\u1100-\u11FF]/;
// Basic Latin (English)
const LATIN_RE  = /[a-zA-Z]/;

function detectFast(text: string): SupportedLang | null {
  const hangul = (text.match(HANGUL_RE) ?? []).length;
  const kana   = (text.match(KANA_RE)   ?? []).length;
  const cjk    = (text.match(CJK_RE)    ?? []).length;
  const latin  = (text.match(LATIN_RE)  ?? []).length;
  const total  = hangul + kana + cjk + latin || 1;

  if (hangul / total > 0.2) return "ko";
  if (kana   / total > 0.1) return "ja";
  // CJK without kana → likely Chinese
  if (cjk    / total > 0.2 && kana / total <= 0.1) return "zh";
  if (latin  / total > 0.5) return "en";

  return null; // ambiguous → use API
}

// ── API fallback ──────────────────────────────────────────────

async function detectViaApi(text: string): Promise<SupportedLang> {
  try {
    const response = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 8,
      messages: [{
        role:    "user",
        content: `Reply with ONLY one of: zh en ja ko\nText: ${text.slice(0, 200)}`,
      }],
    });

    const lang = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim()
      .toLowerCase() as SupportedLang;

    return (["zh", "en", "ja", "ko"] as SupportedLang[]).includes(lang) ? lang : "en";
  } catch {
    return "en";
  }
}

// ── Public API ────────────────────────────────────────────────

/**
 * Detect the primary language of the given text.
 * Uses fast regex heuristics; falls back to Claude if ambiguous.
 */
export async function detectLanguage(text: string): Promise<SupportedLang> {
  const fast = detectFast(text);
  if (fast) return fast;
  return detectViaApi(text);
}
