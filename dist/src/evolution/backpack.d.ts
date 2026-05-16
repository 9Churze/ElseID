export interface BackpackItem {
    id: string;
    name: string;
    giverPubkey: string;
    createdAt: number;
}
export declare function parseBackpackTags(tags: string[][]): BackpackItem[];
