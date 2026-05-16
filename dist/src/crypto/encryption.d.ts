/**
 * Encrypts a string using AES-256-GCM.
 * Output format: iv:tag:encryptedContent
 */
export declare function encrypt(text: string): string;
/**
 * Decrypts a string using AES-256-GCM.
 * Supports fallback for legacy plaintext keys (64-char hex).
 */
export declare function decrypt(encryptedData: string): string;
