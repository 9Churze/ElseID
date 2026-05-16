import type { RelayInfo } from "../../types/index.js";
export declare function checkRelay(url: string): Promise<RelayInfo>;
export declare function checkAllRelays(): Promise<RelayInfo[]>;
export declare function getCachedRelayInfo(): Promise<RelayInfo[]>;
export declare function getHealthyRelays(): Promise<RelayInfo[]>;
