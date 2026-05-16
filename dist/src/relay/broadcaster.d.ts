import type { NostrEvent } from "../../types/index.js";
export interface BroadcastResult {
    success: boolean;
    relay: string;
    eventId: string;
    message?: string;
}
export declare function broadcast(event: NostrEvent, relayUrl: string): Promise<BroadcastResult>;
