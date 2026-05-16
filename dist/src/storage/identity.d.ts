import { getPrimaryIdentity, setActiveDrifter, rotateIdentity } from "../crypto/keypair.js";
export declare function getActiveDrifterId(): Promise<string | null>;
export declare function setCreationLock(locked: boolean): Promise<void>;
export declare function setHostName(name: string): Promise<void>;
export declare function isCreating(): Promise<boolean>;
export { getPrimaryIdentity, setActiveDrifter, rotateIdentity, };
