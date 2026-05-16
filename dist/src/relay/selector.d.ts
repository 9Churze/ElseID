import type { FuzzyLocation } from "../../types/index.js";
export declare function pickRelayByGeo(location: FuzzyLocation): Promise<string>;
export declare function pickRelay(preferredUrl?: string): Promise<string>;
export declare function pickRelaysForFetch(location: FuzzyLocation, count?: number): Promise<string[]>;
