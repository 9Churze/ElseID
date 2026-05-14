// tests/geo.test.ts
// Unit tests for src/location/geo.ts — makeFuzzyLocation (pure, no network)

import { describe, test, expect } from "vitest";
import { makeFuzzyLocation } from "../src/location/geo.js";

describe("makeFuzzyLocation", () => {
  test("country code is uppercased", () => {
    const loc = makeFuzzyLocation(31.2, 121.4, "cn", "Shanghai");
    expect(loc.country).toBe("CN");
  });

  test("country code is truncated to 2 chars", () => {
    const loc = makeFuzzyLocation(0, 0, "USA", "New York");
    expect(loc.country).toHaveLength(2);
    expect(loc.country).toBe("US");
  });

  test("city is preserved up to 50 chars", () => {
    const longCity = "A".repeat(80);
    const loc = makeFuzzyLocation(0, 0, "DE", longCity);
    expect(loc.city).toHaveLength(50);
  });

  test("coordinates are always empty strings (privacy guarantee)", () => {
    const loc = makeFuzzyLocation(51.5, -0.12, "GB", "London");
    expect(loc.lat).toBe("");
    expect(loc.lon).toBe("");
  });

  test("null-ish country falls back to empty string (not crash)", () => {
    // @ts-expect-error — testing runtime defensive path
    const loc = makeFuzzyLocation(0, 0, null, "City");
    expect(loc.country).toBe("");
  });

  test("null-ish city falls back to 'Unknown'", () => {
    // @ts-expect-error — testing runtime defensive path
    const loc = makeFuzzyLocation(0, 0, "JP", null);
    expect(loc.city).toBe("Unknown");
  });

  test("normal city is preserved verbatim", () => {
    const loc = makeFuzzyLocation(35.6, 139.6, "JP", "Tokyo");
    expect(loc.city).toBe("Tokyo");
  });
});
