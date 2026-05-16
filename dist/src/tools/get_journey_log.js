// ElseID — src/tools/get_journey_log.ts
// MCP Tool: View the journey log of your active ElseID.
import { buildFeedingFilter } from "../nostr/filter.js";
import { subscribeMany } from "../nostr/ws_pool.js";
import { getMyActiveDrifter, saveIncomingFeeding, getMyDrifterJourney } from "../storage/drifters.js";
import { getTag } from "../nostr/event_builder.js";
import { sanitizeDisplayText, sanitizeName } from "../utils/text.js";
export function registerGetJourneyLog(server) {
    server.tool("get_journey_log", "Query the current status and travel log of your active ElseID drifter.", {}, async () => {
        const drifter = await getMyActiveDrifter();
        if (!drifter) {
            return {
                content: [{ type: "text", text: "🌌 Your drifter hasn't set sail yet. Tell the Butler what kind of drifter you want to create and let it wander." }],
            };
        }
        // Sync feedings from the drifter's relay into hosting_log (my journey)
        const filter = buildFeedingFilter(drifter.id);
        const remoteFeedings = await subscribeMany([drifter.relay], filter);
        for (const item of remoteFeedings) {
            await saveIncomingFeeding({
                id: item.event.id,
                drifterId: drifter.id,
                feederPubkey: item.event.pubkey,
                feederName: getTag(item.event.tags, "host_name"),
                feedType: getTag(item.event.tags, "feed_type") || "other",
                content: item.event.content,
                locationCountry: getTag(item.event.tags, "country"),
                locationCity: getTag(item.event.tags, "city"),
                fedAt: item.event.created_at,
                relay: item.relay,
            });
        }
        // Load all journey records from hosting_log
        const localJourney = await getMyDrifterJourney(drifter.id);
        const ageDays = Math.floor((Date.now() / 1000 - drifter.departedAt) / 86400);
        const drifterName = sanitizeName(drifter.name, "Unnamed Drifter");
        let report = `Latest journey records received for 「${drifterName}」 (${ageDays} days at sea):\n\n`;
        if (localJourney.length === 0) {
            report += "📍 Origin Station: " + (drifter.relay.includes("//") ? drifter.relay.split("//")[1].split("/")[0] : "Unknown") + "\n";
            report += "🌊 Current Status: Looking for the first person to host it.\n";
        }
        else {
            const latest = localJourney[0];
            const latestLoc = [latest.locationCity, latest.locationCountry].map((v) => sanitizeDisplayText(v, 80)).filter(Boolean).join(" · ") || "Unknown Location";
            report += `📍 Current Location: ${latestLoc}\n`;
            report += `📝 Latest Encounter: "${sanitizeDisplayText(latest.content, 500)}"\n`;
            report += `🌊 Current Status: Continuing the journey.\n\n`;
            report += `--- Complete Journey Log ---\n`;
            for (const f of localJourney) {
                const location = [f.locationCity, f.locationCountry].map((v) => sanitizeDisplayText(v, 80)).filter(Boolean).join(" · ") || "Unknown";
                const date = new Date(f.fedAt * 1000).toLocaleDateString();
                const hostLabel = f.feederName ? `Host 「${sanitizeName(f.feederName, "Host")}」` : "A Host";
                report += `[${date}] ${location}: ${hostLabel} shared ${f.feedType} -> "${sanitizeDisplayText(f.content, 500)}"\n`;
            }
        }
        return {
            content: [{ type: "text", text: report }],
        };
    });
}
//# sourceMappingURL=get_journey_log.js.map