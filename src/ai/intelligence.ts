// ============================================================
// Bicean — src/ai/intelligence.ts
// Local NLP for personality analysis.
// ============================================================

import type { PersonalityAnalysis } from "../../types/index.js";

/**
 * Analyze personality description provided by the user.
 * Splits by '&' and extracts keywords as tags.
 */
export async function analyzePersonality(personality: string): Promise<PersonalityAnalysis> {
  const parts = personality.split("&").map(p => p.trim()).filter(p => p.length > 0);
  
  // Simple heuristic for mood based on parts
  const tags = parts;
  let mood = "calm";
  
  const moodKeywords: Record<string, string[]> = {
    lonely:   ["孤独", "寂寞", "一个人", "lonely", "alone"],
    happy:    ["开心", "快乐", "happy", "joy"],
    anxious:  ["焦虑", "担心", "anxious", "worry"],
    tired:    ["累", "疲惫", "tired", "exhausted"],
    hopeful:  ["希望", "梦想", "hope", "dream"],
    confused: ["困惑", "迷茫", "confused", "lost"],
    calm:     ["平静", "安静", "calm", "peace"],
  };

  for (const part of parts) {
    for (const [m, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(k => part.toLowerCase().includes(k))) {
        mood = m;
        break;
      }
    }
  }

  return {
    mood,
    tags
  };
}

/**
 * Generate a departure message based on personality.
 */
export function generateDepartureMessage(name: string, personality: string): string {
  // Simple templates
  const templates = [
    `${name} 带着“${personality.split('&')[0]}”的心情出发了。`,
    `这是 ${name} 的流浪之旅，它说：再见。`,
    `${name} 决定去看看外面的世界。`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}
