// ============================================================
// Bicean — tests/relay.test.ts
// Unit tests for relay selector and broadcaster logic.
// Network calls are mocked.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { pickRelay, pickRelaysForFetch } from "../src/relay/selector.js";
import type { RelayInfo } from "../types/index.js";

// Mock health module
vi.mock("../src/relay/health.js", () => ({
  getHealthyRelays: vi.fn(),
}));

import { getHealthyRelays } from "../src/relay/health.js";
const mockGetHealthyRelays = vi.mocked(getHealthyRelays);

const RELAY_A: RelayInfo = { url: "wss://relay-a.test", online: true, latencyMs: 80,  writable: true };
const RELAY_B: RelayInfo = { url: "wss://relay-b.test", online: true, latencyMs: 150, writable: true };
const RELAY_C: RelayInfo = { url: "wss://relay-c.test", online: true, latencyMs: 300, writable: true };

describe("pickRelay", () => {
  beforeEach(() => {
    mockGetHealthyRelays.mockReturnValue([RELAY_A, RELAY_B, RELAY_C]);
  });

  it("returns a string URL", () => {
    const url = pickRelay();
    expect(typeof url).toBe("string");
    expect(url).toMatch(/^wss?:\/\//);
  });

  it("honours preferred relay when it is healthy", () => {
    // Run enough times to see that B can be forced
    let bCount = 0;
    for (let i = 0; i < 50; i++) {
      if (pickRelay(RELAY_B.url) === RELAY_B.url) bCount++;
    }
    expect(bCount).toBe(50); // preferred relay always wins when healthy
  });

  it("falls back to weighted pick when preferred relay is not healthy", () => {
    const url = pickRelay("wss://not-in-list.test");
    expect([RELAY_A.url, RELAY_B.url, RELAY_C.url]).toContain(url);
  });

  it("low-latency relay wins more often (statistical)", () => {
    const counts: Record<string, number> = { [RELAY_A.url]: 0, [RELAY_B.url]: 0, [RELAY_C.url]: 0 };
    for (let i = 0; i < 300; i++) {
      counts[pickRelay()]++;
    }
    // Relay A (80ms) should win significantly more than Relay C (300ms)
    expect(counts[RELAY_A.url]).toBeGreaterThan(counts[RELAY_C.url]);
  });
});

describe("pickRelaysForFetch", () => {
  beforeEach(() => {
    mockGetHealthyRelays.mockReturnValue([RELAY_A, RELAY_B, RELAY_C]);
  });

  it("returns requested count", () => {
    expect(pickRelaysForFetch(2)).toHaveLength(2);
  });

  it("returns all when count exceeds available", () => {
    expect(pickRelaysForFetch(10)).toHaveLength(3);
  });

  it("returns unique URLs", () => {
    const urls = pickRelaysForFetch(3);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
