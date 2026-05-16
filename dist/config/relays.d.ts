export interface RelayConfig {
    url: string;
    region: string;
    writable: boolean;
}
/** Final list of default relays based on environment check */
export declare const DEFAULT_RELAYS: RelayConfig[];
/** Maximum events fetched per REQ */
export declare const FETCH_LIMIT = 50;
/** WebSocket connection timeout (ms) */
export declare const WS_TIMEOUT_MS = 8000;
/** Health check interval (ms) */
export declare const HEALTH_CHECK_INTERVAL_MS = 60000;
