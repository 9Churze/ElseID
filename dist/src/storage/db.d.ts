import { Database } from "sqlite";
export declare function getDb(): Database;
export declare function initDb(): Promise<void>;
export declare function closeDb(): Promise<void>;
