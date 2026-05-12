// ============================================================
// ElseID — src/location/geo.ts
// IP → coarse city-level FuzzyLocation.
// Precision is intentionally limited to protect user privacy.
// ============================================================

import type { FuzzyLocation } from "../../types/index.js";

// ── IP geolocation ────────────────────────────────────────────

interface GeoApiResponse {
  status:      string;
  country:     string;
  countryCode: string;
  city:        string;
  lat:         number;
  lon:         number;
  query:       string;
}

/**
 * Fetch coarse location for the current machine's public IP.
 * Uses ip-api.com (free, no key required, 45 req/min limit).
 *
 * Returns a fallback location on any error (never throws).
 */
export async function getFuzzyLocation(): Promise<FuzzyLocation> {
  try {
    const res = await fetch("https://ip-api.com/json/?fields=status,country,countryCode,city,lat,lon,query", {
      signal: AbortSignal.timeout(4_000),
    });

    if (!res.ok) return fallback();

    const data = (await res.json()) as GeoApiResponse;
    if (data.status !== "success") return fallback();

    return truncate(data.lat, data.lon, data.countryCode, data.city);
  } catch {
    return fallback();
  }
}

/**
 * Build a FuzzyLocation from known coordinates (e.g. from a config).
 * Still applies truncation.
 */
export function makeFuzzyLocation(
  lat: number,
  lon: number,
  country: string,
  city: string
): FuzzyLocation {
  return truncate(lat, lon, country, city);
}

// ── Helpers ───────────────────────────────────────────────────

/**
 * Truncate lat/lon to 1 decimal place (≈ 11 km precision).
 * This is city-level and cannot pinpoint a neighbourhood.
 */
function truncate(lat: number, lon: number, country: string, city: string): FuzzyLocation {
  return {
    country: (country ?? "").toUpperCase().slice(0, 2),
    city:    (city    ?? "Unknown").slice(0, 50),
    lat:     (Math.trunc(lat * 10) / 10).toFixed(1),
    lon:     (Math.trunc(lon * 10) / 10).toFixed(1),
  };
}

function fallback(): FuzzyLocation {
  return { country: "XX", city: "Unknown", lat: "0.0", lon: "0.0" };
}
