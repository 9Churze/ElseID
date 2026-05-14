// ElseID — src/crypto/encryption.ts
// Application-level encryption for sensitive fields (e.g. private keys).
// Uses a device-specific key stored in a restricted-access file.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const DATA_DIR = process.env.ELSEID_DATA_DIR || path.join(os.homedir(), ".elseid");
const SECRET_PATH = path.join(DATA_DIR, ".key");
const ALGORITHM = "aes-256-gcm";

/**
 * Retrieves or generates a 32-byte master key for this device.
 * Stored with 0600 permissions.
 */
function getDeviceSecret(): Buffer {
  if (fs.existsSync(SECRET_PATH)) {
    return fs.readFileSync(SECRET_PATH);
  }

  // Create directory if it doesn't exist (failsafe)
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }

  const key = crypto.randomBytes(32);
  fs.writeFileSync(SECRET_PATH, key, { mode: 0o600 });
  return key;
}

/**
 * Encrypts a string using AES-256-GCM.
 * Output format: iv:tag:encryptedContent
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const key = getDeviceSecret();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

/**
 * Decrypts a string using AES-256-GCM.
 * Supports fallback for legacy plaintext keys (64-char hex).
 */
export function decrypt(encryptedData: string): string {
  // Check for legacy plaintext (64-char hex string)
  if (/^[0-9a-f]{64}$/i.test(encryptedData)) {
    return encryptedData;
  }

  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted format");
    }

    const [ivHex, tagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const key = getDeviceSecret();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    console.error("❌ Decryption failed. The secret key might be missing or corrupted.");
    throw err;
  }
}
