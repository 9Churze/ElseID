/**
 * Encrypts content using AES-256-GCM.
 * Output format: base64(iv + tag + ciphertext)
 */
export declare function encryptContent(plaintext: string, senderPrivHex: string, recipientPubHex: string): string;
/**
 * Decrypts content using AES-256-GCM.
 */
export declare function decryptContent(combinedB64: string, recipientPrivHex: string, senderPubHex: string): string;
export declare function generateEphemeralRecipient(): {
    pubkey: string;
    privkey: string;
};
