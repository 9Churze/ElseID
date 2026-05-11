// ============================================================
// Bicean — tests/ai.test.ts
// Unit tests for AI engine (language detection + matcher)
// Claude API calls are mocked.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectLanguage } from "../src/ai/language.js";
import { rankBottles }    from "../src/ai/matcher.js";
import type { NostrEvent } from "../types/index.js";
import { DRIFT_BOTTLE_KIND } from "../types/index.js";

// ── language.ts — heuristic path (no API needed) ─────────────

describe("detectLanguage — heuristics", () => {
  it("detects Chinese", async () => {
    expect(await detectLanguage("深夜的东京，路灯像海底的浮标")).toBe("zh");
  });

  it("detects Japanese (hiragana)", async () => {
    expect(await detectLanguage("今日はとても疲れた。眠れない夜。")).toBe("ja");
  });

  it("detects Korean (hangul)", async () => {
    expect(await detectLanguage("오늘 밤은 유독 외롭다.")).toBe("ko");
  });

  it("detects English", async () => {
    expect(await detectLanguage("Tonight the ocean feels endless and quiet.")).toBe("en");
  });
});

// ── matcher.ts ────────────────────────────────────────────────

function makeEvent(id: string, mood: string, lang: string, createdAt: number): NostrEvent {
  return {
    id,
    pubkey:     "0".repeat(64),
    created_at: createdAt,
    kind:       DRIFT_BOTTLE_KIND,
    tags: [
      ["type", "drift"],
      ["mood", mood],
      ["lang", lang],
      ["ttl",  "86400"],
    ],
    content: `content of ${id}`,
    sig:     "0".repeat(128),
  };
}

const now = Math.floor(Date.now() / 1000);

describe("rankBottles", () => {
  it("returns same number of events", () => {
    const events = [
      makeEvent("a".repeat(64), "lonely", "zh", now - 100),
      makeEvent("b".repeat(64), "happy",  "en", now - 200),
    ];
    const ranked = rankBottles(events, {});
    expect(ranked).toHaveLength(2);
  });

  it("prefers mood-matching bottles", () => {
    const lonelyEvent = makeEvent("a".repeat(64), "lonely", "zh", now - 3600);
    const happyEvent  = makeEvent("b".repeat(64), "happy",  "zh", now - 3600);
    // Run many times to account for jitter
    let lonelyFirst = 0;
    for (let i = 0; i < 20; i++) {
      const ranked = rankBottles([happyEvent, lonelyEvent], { mood: "lonely" });
      if (ranked[0].id === lonelyEvent.id) lonelyFirst++;
    }
    // Lonely-first should win the majority
    expect(lonelyFirst).toBeGreaterThan(12);
  });

  it("prefers newer bottles when mood/lang are equal", () => {
    const old   = makeEvent("a".repeat(64), "calm", "en", now - 86400 * 5); // 5 days ago
    const fresh = makeEvent("b".repeat(64), "calm", "en", now - 60);        // 1 min ago
    let freshFirst = 0;
    for (let i = 0; i < 20; i++) {
      const ranked = rankBottles([old, fresh], { mood: "calm", lang: "en" });
      if (ranked[0].id === fresh.id) freshFirst++;
    }
    expect(freshFirst).toBeGreaterThan(12);
  });
});
