import { describe, expect, test } from "vitest";
import { buildDrifterEvent } from "../src/nostr/event_builder.js";
import { makeFuzzyLocation } from "../src/location/geo.js";
import { checkContent } from "../src/ai/moderator.js";
import { redactSecrets } from "../src/utils/redact.js";
import { sanitizeDisplayText, sanitizeName } from "../src/utils/text.js";

describe("relay privacy", () => {
  test("drifter events do not include coordinate tags", () => {
    const location = makeFuzzyLocation(31.2304, 121.4737, "CN", "Shanghai");

    const event = buildDrifterEvent({
      pubkey: "p".repeat(64),
      name: "Lantern",
      personality: "quiet",
      analysis: { trait: "Quiet", tags: ["quiet"] },
      location,
      content: "hello",
    });

    expect(event.tags.some(([name]) => name === "lat" || name === "lon")).toBe(false);
    expect(event.tags).toContainEqual(["country", "CN"]);
    expect(event.tags).toContainEqual(["city", "Shanghai"]);
  });
});

describe("moderation fallback", () => {
  test("blocks obfuscated contact information", async () => {
    const result = await checkContent("test＠example．com");

    expect(result.passed).toBe(false);
  });
});

describe("text hardening", () => {
  test("removes terminal and bidi control characters from display text", () => {
    expect(sanitizeName("Alice\u001b[31m\u202Eevil", "Host")).toBe("Alice evil");
    expect(sanitizeDisplayText("hello\nworld", 20)).toBe("hello world");
  });

  test("redacts hex private keys from logs", () => {
    const key = "a".repeat(64);

    expect(redactSecrets(new Error(`failed with ${key}`))).not.toContain(key);
  });
});
