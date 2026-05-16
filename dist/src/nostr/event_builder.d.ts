import type { UnsignedEvent, FuzzyLocation, PersonalityAnalysis } from "../../types/index.js";
export interface DrifterBuildOptions {
    pubkey: string;
    name: string;
    personality: string;
    analysis: PersonalityAnalysis;
    location: FuzzyLocation;
    content: string;
}
export declare function buildDrifterEvent(opts: DrifterBuildOptions): UnsignedEvent;
export interface FeedingBuildOptions {
    pubkey: string;
    drifterEventId: string;
    feedType: string;
    content: string;
    location: FuzzyLocation;
    hostName?: string | null;
}
export declare function buildFeedingEvent(opts: FeedingBuildOptions): UnsignedEvent;
export declare function buildDeletionEvent(pubkey: string, eventIds: string[], reason?: string): UnsignedEvent;
export declare function getTag(tags: string[][], name: string): string | undefined;
export declare function getAllTags(tags: string[][], name: string): string[];
