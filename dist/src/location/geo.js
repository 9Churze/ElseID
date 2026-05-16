// ElseID — src/location/geo.ts
// IP → coarse city-level FuzzyLocation.
// Coordinates are intentionally not retained for relay-bound events.
export async function getFuzzyLocation() {
    try {
        const res = await fetch("https://ip-api.com/json/?fields=status,country,countryCode,city,lat,lon,query", {
            signal: AbortSignal.timeout(4_000),
        });
        if (!res.ok)
            return fallback();
        const data = (await res.json());
        if (data.status !== "success")
            return fallback();
        return truncate(data.lat, data.lon, data.countryCode, data.city);
    }
    catch {
        return fallback();
    }
}
export function makeFuzzyLocation(lat, lon, country, city) {
    return truncate(lat, lon, country, city);
}
// Helpers
function truncate(_lat, _lon, country, city) {
    return {
        country: (country ?? "").toUpperCase().slice(0, 2),
        city: (city ?? "Unknown").slice(0, 50),
        lat: "",
        lon: "",
    };
}
function fallback() {
    return { country: "XX", city: "Unknown", lat: "", lon: "" };
}
//# sourceMappingURL=geo.js.map