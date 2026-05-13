// ElseID — src/evolution/skills.ts
// Skill definitions and execution logic for drifters.

export interface Skill {
  id: string;
  name: string;
  description: string;
}

export const AVAILABLE_SKILLS: Skill[] = [
  { id: "tarot_reader", name: "Tarot Reader", description: "Can draw a tarot card for the host." },
  { id: "poet", name: "Haiku Poet", description: "Leaves a short poem based on the host's story." }
];

export function hasSkill(tags: string[], skillId: string): boolean {
  return tags.includes(`skill:${skillId}`);
}
