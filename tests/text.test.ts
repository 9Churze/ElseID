// tests/text.test.ts
// Unit tests for src/utils/text.ts and src/utils/redact.ts

import { describe, test, expect } from "vitest";
import { sanitizeDisplayText, sanitizeName } from "../src/utils/text.js";
import { redactSecrets } from "../src/utils/redact.js";

// ─── sanitizeDisplayText ─────────────────────────────────────────────────────
describe("sanitizeDisplayText", () => {
  test("strips ANSI escape sequences", () => {
    expect(sanitizeDisplayText("\u001b[31mred text\u001b[0m")).toBe("red text");
  });

  test("strips BiDi control characters", () => {
    // U+202E RIGHT-TO-LEFT OVERRIDE
    expect(sanitizeDisplayText("hello\u202Eworld")).toBe("hello world");
  });

  test("strips null bytes and control chars", () => {
    expect(sanitizeDisplayText("a\u0000b\u001fc")).toBe("a b c");
  });

  test("collapses multiple whitespace to single space", () => {
    expect(sanitizeDisplayText("hello   \t  world")).toBe("hello world");
  });

  test("trims leading and trailing whitespace", () => {
    expect(sanitizeDisplayText("  padded  ")).toBe("padded");
  });

  test("truncates to maxLength", () => {
    const long = "A".repeat(200);
    expect(sanitizeDisplayText(long, 50)).toHaveLength(50);
  });

  test("default maxLength is 500", () => {
    const over = "B".repeat(600);
    const result = sanitizeDisplayText(over);
    expect(result.length).toBeLessThanOrEqual(500);
  });

  test("handles null input gracefully", () => {
    // @ts-expect-error — testing runtime path
    expect(sanitizeDisplayText(null)).toBe("");
  });

  test("handles undefined input gracefully", () => {
    expect(sanitizeDisplayText(undefined)).toBe("");
  });

  test("preserves normal Unicode content", () => {
    expect(sanitizeDisplayText("你好世界")).toBe("你好世界");
  });

  test("normalises NFKC (e.g. fullwidth → ASCII)", () => {
    // ＠ (fullwidth) → @ (ASCII) after NFKC
    expect(sanitizeDisplayText("test＠example．com")).toBe("test@example.com");
  });
});

// ─── sanitizeName ────────────────────────────────────────────────────────────
describe("sanitizeName", () => {
  test("returns fallback for empty string", () => {
    expect(sanitizeName("", "Host")).toBe("Host");
  });

  test("returns fallback for whitespace-only string", () => {
    expect(sanitizeName("   ", "Host")).toBe("Host");
  });

  test("strips dangerous chars and returns cleaned name", () => {
    expect(sanitizeName("Alice\u001b[31m\u202Eevil", "Host")).toBe("Alice evil");
  });

  test("truncates to 40 chars", () => {
    const long = "N".repeat(80);
    expect(sanitizeName(long, "Fallback")).toHaveLength(40);
  });

  test("handles null with default fallback", () => {
    // @ts-expect-error — testing runtime path
    expect(sanitizeName(null)).toBe("Anonymous");
  });
});

// ─── redactSecrets ───────────────────────────────────────────────────────────
describe("redactSecrets", () => {
  test("redacts privkey value in log string", () => {
    const log = `operation failed with privkey: ${"a".repeat(64)}`;
    const result = redactSecrets(log);
    expect(result).toContain("[REDACTED]");
    expect(result).not.toContain("a".repeat(64));
  });

  test("redacts private_key value", () => {
    const log = `private_key="${"b".repeat(64)}"`;
    const result = redactSecrets(log);
    expect(result).toContain("[REDACTED]");
  });

  test("redacts secret value", () => {
    const log = `secret: ${"c".repeat(64)}`;
    const result = redactSecrets(log);
    expect(result).toContain("[REDACTED]");
  });

  test("works with Error objects", () => {
    const key = "a".repeat(64);
    const err = new Error(`failed with privkey: ${key}`);
    const result = redactSecrets(err);
    expect(result).not.toContain(key);
    expect(result).toContain("[REDACTED]");
  });

  test("passes through strings without secrets unchanged", () => {
    const safe = "relay connected successfully to wss://relay.example.com";
    expect(redactSecrets(safe)).toBe(safe);
  });

  test("handles objects via JSON.stringify", () => {
    const obj = { status: "ok", relay: "wss://relay.example.com" };
    const result = redactSecrets(obj);
    expect(result).toContain("relay.example.com");
  });
});
