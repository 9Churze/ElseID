// ElseID — src/evolution/skills.ts
// Skill definitions and execution logic for drifters.
export const AVAILABLE_SKILLS = [
    { id: "tarot_reader", name: "Tarot Reader", description: "Can draw a tarot card for the host." },
    { id: "poet", name: "Haiku Poet", description: "Leaves a short poem based on the host's story." }
];
export function hasSkill(tags, skillId) {
    return tags.includes(`skill:${skillId}`);
}
//# sourceMappingURL=skills.js.map