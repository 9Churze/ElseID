import type { FuzzyLocation } from "../../types/index.js";
export declare function getFuzzyLocation(): Promise<FuzzyLocation>;
export declare function makeFuzzyLocation(lat: number, lon: number, country: string, city: string): FuzzyLocation;
