// ElseID — src/location/geo.ts
// IP → coarse city-level FuzzyLocation.
// Coordinates are intentionally not retained for relay-bound events.

import type { FuzzyLocation } from "../../types/index.js";

// IP geolocation

interface GeoApiResponse {
  status:      string;
  country:     string;
  countryCode: string;
  city:        string;
  lat:         number;
  lon:         number;
  query:       string;
}

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

export function makeFuzzyLocation(
  lat: number,
  lon: number,
  country: string,
  city: string
): FuzzyLocation {
  return truncate(lat, lon, country, city);
}

// Helpers

function truncate(_lat: number, _lon: number, country: string, city: string): FuzzyLocation {
  return {
    country: (country ?? "").toUpperCase().slice(0, 2),
    city:    (city    ?? "Unknown").slice(0, 50),
    lat:     "",
    lon:     "",
  };
}

function fallback(): FuzzyLocation {
  return { country: "XX", city: "Unknown", lat: "", lon: "" };
}
