import type { Identity } from "../../types/index.js";
export declare function getPrimaryIdentity(): Promise<Identity>;
export declare function setActiveDrifter(drifterId: string | null): Promise<void>;
export declare function rotateIdentity(): Promise<Identity>;
