// ============================================================
// Bicean — src/ai/emotion.ts
// Emotion recognition and tag generation via Claude API.
// Auto-detects mood, tone, and topic tags from bottle content.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { EmotionResult, Mood } from "../../types/index.js";

const client = new Anthropic();

const MOODS: Mood[] = ["lonely","happy","anxious","tired","hopeful","confused","calm"];

const SYSTEM_PROMPT = `You are an emotion analysis engine for a drift bottle app.
Given a message, identify:
1. The primary mood (pick exactly one): lonely, happy, anxious, tired, hopeful, confused, calm
2. The emotional tone (a single descriptive word, e.g. "melancholic", "playful", "wistful")
3. Up to 5 topic tags (lowercase, single words or hyphenated, e.g. "night", "work", "late-night")
4. A confidence score between 0.0 and 1.0

Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{
  "mood": "<one of: lonely|happy|anxious|tired|hopeful|confused|calm>",
  "tone": "<single word>",
  "tags": ["<tag1>", "<tag2>"],
  "confidence": <0.0-1.0>
}`;

/**
 * Analyze emotion from bottle content.
 * Returns a default result if the API call fails.
 */
export async function analyzeEmotion(content: string): Promise<EmotionResult> {
  const fallback: EmotionResult = {
    mood:       "calm",
    tone:       "neutral",
    tags:       [],
    confidence: 0,
  };

  if (!content.trim()) return fallback;

  try {
    const response = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 128,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    const parsed = JSON.parse(text) as {
      mood: string; tone: string; tags: string[]; confidence: number;
    };

    return {
      mood:       MOODS.includes(parsed.mood as Mood) ? (parsed.mood as Mood) : "calm",
      tone:       typeof parsed.tone === "string" ? parsed.tone.slice(0, 30) : "neutral",
      tags:       Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map(String) : [],
      confidence: typeof parsed.confidence === "number"
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.5,
    };
  } catch (err: any) {
    console.warn("[emotion] API error:", err?.message);
    return fallback;
  }
}
