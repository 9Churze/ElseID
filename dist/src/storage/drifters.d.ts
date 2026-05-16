import type { Drifter, Feeding, DrifterStatus } from "../../types/index.js";
export declare function saveMyDrifter(drifter: Drifter): Promise<void>;
export declare function updateDrifterStatus(id: string, status: DrifterStatus, abandonedAt?: number): Promise<void>;
export declare function updateDrifterPresence(id: string, location: string, timestamp: number): Promise<void>;
export declare function getDrifter(id: string): Promise<Drifter | null>;
export declare function getMyActiveDrifter(): Promise<Drifter | null>;
export declare function saveOutgoingFeeding(feeding: Feeding, drifterName?: string): Promise<void>;
export declare function hasHostedBefore(drifterId: string): Promise<boolean>;
export declare function saveIncomingFeeding(feeding: Feeding): Promise<void>;
export declare function getMyDrifterJourney(drifterId: string): Promise<Feeding[]>;
export declare function getPastMemories(): Promise<{
    drifter: Drifter;
    journey: Feeding[];
}[]>;
export declare function getMyEncounters(): Promise<(Feeding & {
    drifterName?: string;
})[]>;
export declare function saveDrifterLineage(parentId: string, childId: string, reason: string, evolvedAt: number): Promise<void>;
