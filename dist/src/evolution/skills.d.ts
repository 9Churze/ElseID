export interface Skill {
    id: string;
    name: string;
    description: string;
}
export declare const AVAILABLE_SKILLS: Skill[];
export declare function hasSkill(tags: string[], skillId: string): boolean;
