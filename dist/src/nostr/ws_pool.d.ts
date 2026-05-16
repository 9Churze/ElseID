import type { NostrEvent } from "../../types/index.js";
import type { NostrFilter } from "./filter.js";
export declare function closeAll(): void;
export declare function subscribe(relayUrl: string, filter: NostrFilter, timeoutMs?: number): Promise<{
    event: NostrEvent;
    relay: string;
}[]>;
export declare function subscribeMany(relayUrls: string[], filter: NostrFilter): Promise<{
    event: NostrEvent;
    relay: string;
}[]>;
export declare function subscribeRaceFirst(relayUrls: string[], filter: NostrFilter, predicate: (event: NostrEvent) => boolean | Promise<boolean>, timeoutMs?: number): Promise<{
    event: NostrEvent;
    relay: string;
} | null>;
