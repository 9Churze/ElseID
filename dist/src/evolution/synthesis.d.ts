import type { Drifter } from "../../types/index.js";
export interface EvolutionInput {
    newPersonality: string;
    newTrait: string;
    newTags: string[];
    evolutionReason: string;
}
export declare function evolveCognition(oldDrifter: Drifter, input: EvolutionInput): Promise<{
    success: boolean;
    message: string;
}>;
