// ============================================================
// Bicean — tests/nostr.test.ts
// Unit tests for Nostr protocol layer
// ============================================================

import { describe, it, expect } from "vitest";
import { buildDriftEvent, buildReplyEvent, getTag } from "../src/nostr/event_builder.js";
import { signEvent, verifySignature, serializeEvent } from "../src/nostr/event_signer.js";
import { buildFilter, buildReplyFilter } from "../src/nostr/filter.js";
import { DRIFT_BOTTLE_KIND } from "../types/index.js";

// Use a fixed test keypair (DO NOT use in production)
const TEST_PRIVKEY = "a".repeat(64); // 64-char hex; obviously insecure — tests only
const TEST_PUBKEY  = "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798".slice(2, 66);

const TEST_EMOTION = {
  mood:       "lonely" as const,
  tone:       "melancholic",
  tags:       ["night", "tokyo"],
  confidence: 0.92,
};

const TEST_LOCATION = {
  country: "JP",
  city:    "Tokyo",
  lat:     "35.6",
  lon:     "139.6",
};

// ── event_builder ─────────────────────────────────────────────

describe("buildDriftEvent", () => {
  it("sets correct kind", () => {
    const ev = buildDriftEvent({
      input:    { content: "hello ocean" },
      pubkey:   TEST_PUBKEY,
      location: TEST_LOCATION,
      emotion:  TEST_EMOTION,
    });
    expect(ev.kind).toBe(DRIFT_BOTTLE_KIND);
  });

  it("includes mandatory tags", () => {
    const ev = buildDriftEvent({
      input:    { content: "深夜的东京" },
      pubkey:   TEST_PUBKEY,
      location: TEST_LOCATION,
      emotion:  TEST_EMOTION,
    });
    expect(getTag(ev.tags, "type")).toBe("drift");
    expect(getTag(ev.tags, "mood")).toBeDefined();
    expect(getTag(ev.tags, "lang")).toBeDefined();
    expect(getTag(ev.tags, "ttl")).toBeDefined();
  });

  it("respects explicit mood override", () => {
    const ev = buildDriftEvent({
      input:    { content: "test", mood: "happy" },
      pubkey:   TEST_PUBKEY,
      location: TEST_LOCATION,
      emotion:  TEST_EMOTION,
    });
    expect(getTag(ev.tags, "mood")).toBe("happy");
  });

  it("includes location tags", () => {
    const ev = buildDriftEvent({
      input:    { content: "test" },
      pubkey:   TEST_PUBKEY,
      location: TEST_LOCATION,
      emotion:  TEST_EMOTION,
    });
    expect(getTag(ev.tags, "country")).toBe("JP");
    expect(getTag(ev.tags, "city")).toBe("Tokyo");
    expect(getTag(ev.tags, "lat")).toBe("35.6");
  });

  it("adds encrypted tag when ephemeral=true", () => {
    const ev = buildDriftEvent({
      input:    { content: "secret", ephemeral: true },
      pubkey:   TEST_PUBKEY,
      location: TEST_LOCATION,
      emotion:  TEST_EMOTION,
    });
    expect(getTag(ev.tags, "encrypted")).toBe("true");
  });
});

describe("buildReplyEvent", () => {
  it("includes e-tag referencing original event", () => {
    const originalId = "b".repeat(64);
    const ev = buildReplyEvent({
      content:         "I got your bottle",
      pubkey:          TEST_PUBKEY,
      originalEventId: originalId,
    });
    expect(getTag(ev.tags, "e")).toBe(originalId);
    expect(getTag(ev.tags, "type")).toBe("drift-reply");
  });
});

// ── event_signer ──────────────────────────────────────────────

describe("signEvent", () => {
  it("produces a 64-char hex sig", () => {
    const unsigned = buildDriftEvent({
      input:    { content: "sign me" },
      pubkey:   TEST_PUBKEY,
      location: TEST_LOCATION,
      emotion:  TEST_EMOTION,
    });
    const signed = signEvent(unsigned, TEST_PRIVKEY);
    expect(signed.sig).toMatch(/^[0-9a-f]{128}$/);
    expect(signed.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("throws on invalid privkey", () => {
    const unsigned = buildDriftEvent({
      input:    { content: "bad key" },
      pubkey:   TEST_PUBKEY,
      location: TEST_LOCATION,
      emotion:  TEST_EMOTION,
    });
    expect(() => signEvent(unsigned, "notahexkey")).toThrow();
  });
});

// ── filter ────────────────────────────────────────────────────

describe("buildFilter", () => {
  it("always includes kind 7777", () => {
    const f = buildFilter();
    expect(f.kinds).toContain(7777);
  });

  it("adds mood tag filter when specified", () => {
    const f = buildFilter({ mood: "lonely" });
    expect(f["#mood"]).toEqual(["lonely"]);
  });

  it("applies limit", () => {
    const f = buildFilter({ limit: 10 });
    expect(f.limit).toBe(10);
  });
});

describe("buildReplyFilter", () => {
  it("includes e-tag filter", () => {
    const id = "c".repeat(64);
    const f  = buildReplyFilter(id);
    expect(f["#e"]).toEqual([id]);
    expect(f["#type"]).toEqual(["drift-reply"]);
  });
});
