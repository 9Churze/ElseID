import type { UnsignedEvent, NostrEvent } from "../../types/index.js";
export declare function signEvent(unsignedEvent: UnsignedEvent, privkeyHex: string): NostrEvent;
export declare function verifySignature(event: NostrEvent): boolean;
export declare function serializeEvent(event: UnsignedEvent): string;
