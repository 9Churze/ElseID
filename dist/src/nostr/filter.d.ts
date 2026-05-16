export interface NostrFilter {
    kinds: number[];
    limit?: number;
    since?: number;
    until?: number;
    /** Tag filters: #<tag_name>: [values] */
    [key: `#${string}`]: string[] | undefined;
}
export declare function buildDrifterFilter(limit?: number): NostrFilter;
export declare function buildFeedingFilter(drifterId: string, limit?: number): NostrFilter;
export declare function newSubId(): string;
