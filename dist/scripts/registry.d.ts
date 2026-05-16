export type ConfigFormat = "json-mcpServers" | "json-mcp" | "json-mcp-local" | "toml-mcp";
export interface ClientDef {
    id: string;
    label: string;
    configPath: () => string;
    detectPaths?: () => string[];
    format: ConfigFormat;
    unsupported?: true;
    manualUrl?: string;
    requiresStdioType?: true;
}
/**
 * Registry of supported AI clients and their configuration paths.
 * To add a new client: append one entry here.
 */
export declare function getRegistry(): ClientDef[];
