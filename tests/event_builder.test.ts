// tests/event_builder.test.ts
// Unit tests for src/nostr/event_builder.ts and src/nostr/event_signer.ts

import { describe, test, expect } from "vitest";
import {
  buildDrifterEvent,
  buildFeedingEvent,
  buildDeletionEvent,
  getTag,
  getAllTags,
} from "../src/nostr/event_builder.js";
import { signEvent, verifySignature, serializeEvent } from "../src/nostr/event_signer.js";
import { makeFuzzyLocation } from "../src/location/geo.js";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { bytesToHex } from "@noble/hashes/utils.js";
import { DRIFTER_KIND } from "../types/index.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────
function makeKeypair() {
  const secretBytes = generateSecretKey();
  return {
    privkey: bytesToHex(secretBytes),
    pubkey: getPublicKey(secretBytes),
  };
}

const LOCATION = makeFuzzyLocation(31.2, 121.4, "CN", "Shanghai");
const PUBKEY   = "p".repeat(64);

// ─── buildDrifterEvent ───────────────────────────────────────────────────────
describe("buildDrifterEvent", () => {
  const event = buildDrifterEvent({
    pubkey: PUBKEY,
    name: "Lantern",
    personality: "quiet and curious",
    analysis: { trait: "Curious", tags: ["quiet", "observer"] },
    location: LOCATION,
    content: "Starting the journey",
  });

  test("kind is DRIFTER_KIND (7777)", () => {
    expect(event.kind).toBe(DRIFTER_KIND);
  });

  test("pubkey matches input", () => {
    expect(event.pubkey).toBe(PUBKEY);
  });

  test("created_at is recent unix timestamp", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(event.created_at).toBeGreaterThanOrEqual(now - 5);
    expect(event.created_at).toBeLessThanOrEqual(now + 5);
  });

  test("has required type/name/personality/trait tags", () => {
    expect(event.tags).toContainEqual(["type", "drifter"]);
    expect(event.tags).toContainEqual(["name", "Lantern"]);
    expect(event.tags).toContainEqual(["personality", "quiet and curious"]);
    expect(event.tags).toContainEqual(["trait", "Curious"]);
  });

  test("personality tags are included as [t, value]", () => {
    expect(event.tags).toContainEqual(["t", "quiet"]);
    expect(event.tags).toContainEqual(["t", "observer"]);
  });

  test("country and city tags are present", () => {
    expect(event.tags).toContainEqual(["country", "CN"]);
    expect(event.tags).toContainEqual(["city", "Shanghai"]);
  });

  test("no lat or lon tags in event (privacy)", () => {
    const hasCoords = event.tags.some(([k]) => k === "lat" || k === "lon");
    expect(hasCoords).toBe(false);
  });

  test("content matches input", () => {
    expect(event.content).toBe("Starting the journey");
  });
});

// ─── buildFeedingEvent ───────────────────────────────────────────────────────
describe("buildFeedingEvent", () => {
  const event = buildFeedingEvent({
    pubkey: PUBKEY,
    drifterEventId: "e".repeat(64),
    feedType: "story",
    content: "Once upon a time…",
    location: LOCATION,
    hostName: "Wanderer",
  });

  test("has correct type/feed_type/e tags", () => {
    expect(event.tags).toContainEqual(["type", "feeding"]);
    expect(event.tags).toContainEqual(["feed_type", "story"]);
    expect(event.tags).toContainEqual(["e", "e".repeat(64)]);
  });

  test("host_name tag is included when provided", () => {
    expect(event.tags).toContainEqual(["host_name", "Wanderer"]);
  });

  test("host_name tag is omitted when null", () => {
    const noHost = buildFeedingEvent({
      pubkey: PUBKEY,
      drifterEventId: "e".repeat(64),
      feedType: "gift",
      content: "A flower",
      location: LOCATION,
      hostName: null,
    });
    expect(noHost.tags.some(([k]) => k === "host_name")).toBe(false);
  });
});

// ─── buildDeletionEvent ──────────────────────────────────────────────────────
describe("buildDeletionEvent", () => {
  const ids = ["a".repeat(64), "b".repeat(64)];
  const event = buildDeletionEvent(PUBKEY, ids, "abandoned");

  test("kind is 5 (NIP-09 deletion)", () => {
    expect(event.kind).toBe(5);
  });

  test("each id becomes an [e, id] tag", () => {
    for (const id of ids) {
      expect(event.tags).toContainEqual(["e", id]);
    }
  });

  test("content is the reason string", () => {
    expect(event.content).toBe("abandoned");
  });
});

// ─── Tag helpers ─────────────────────────────────────────────────────────────
describe("getTag / getAllTags", () => {
  const tags = [["t", "quiet"], ["t", "observer"], ["name", "Lantern"]];

  test("getTag returns first matching value", () => {
    expect(getTag(tags, "t")).toBe("quiet");
    expect(getTag(tags, "name")).toBe("Lantern");
  });

  test("getTag returns undefined for missing key", () => {
    expect(getTag(tags, "missing")).toBeUndefined();
  });

  test("getAllTags returns all matching values", () => {
    expect(getAllTags(tags, "t")).toEqual(["quiet", "observer"]);
  });

  test("getAllTags returns empty array for missing key", () => {
    expect(getAllTags(tags, "missing")).toEqual([]);
  });
});

// ─── signEvent / verifySignature ─────────────────────────────────────────────
describe("signEvent + verifySignature", () => {
  const kp = makeKeypair();
  const unsigned = buildDrifterEvent({
    pubkey: kp.pubkey,
    name: "Test",
    personality: "testing",
    analysis: { trait: "Methodical", tags: [] },
    location: LOCATION,
    content: "test run",
  });

  test("signed event has id and sig fields", () => {
    const signed = signEvent(unsigned, kp.privkey);
    expect(signed.id).toMatch(/^[0-9a-f]{64}$/);
    expect(signed.sig).toMatch(/^[0-9a-f]{128}$/);
  });

  test("verifySignature returns true for valid event", () => {
    const signed = signEvent(unsigned, kp.privkey);
    expect(verifySignature(signed)).toBe(true);
  });


  test("signEvent throws for invalid privkey format", () => {
    expect(() => signEvent(unsigned, "not-a-key")).toThrow();
  });

  test("serializeEvent produces valid JSON array with 6 elements", () => {
    const json = serializeEvent(unsigned);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(6);
    expect(parsed[0]).toBe(0); // NIP-01 canonical serialization prefix
  });
});
