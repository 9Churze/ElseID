// ElseID — src/evolution/synthesis.ts
// Cognitive Evolution Engine for Drifters.

import { getDb } from "../storage/db.js";
import { getPrimaryIdentity, setActiveDrifter } from "../storage/identity.js";
import { buildDrifterEvent } from "../nostr/event_builder.js";
import { signEvent } from "../nostr/event_signer.js";
import { broadcast } from "../relay/broadcaster.js";
import { saveMyDrifter, updateDrifterStatus } from "../storage/drifters.js";
import type { Drifter } from "../../types/index.js";

import { getFuzzyLocation } from "../location/geo.js";

export interface EvolutionInput {
  newPersonality: string;
  newTrait: string;
  newTags: string[];
  evolutionReason: string; // Internal reason provided by AI
}

export async function evolveCognition(oldDrifter: Drifter, input: EvolutionInput): Promise<{ success: boolean; message: string }> {
  const identity = await getPrimaryIdentity();
  const location = await getFuzzyLocation();

  const unsigned = buildDrifterEvent({
    pubkey: identity.pubkey,
    name: oldDrifter.name,
    personality: input.newPersonality,
    analysis: {
      trait: input.newTrait,
      tags: input.newTags
    },
    location,
    content: `[Evolution] ${input.evolutionReason}`
  });

  // Inject lineage tag
  unsigned.tags.push(["evolved_from", oldDrifter.id]);

  // Preserve existing skills and items if any
  for (const t of oldDrifter.tags) {
    if (t.startsWith("skill:") || t.startsWith("item:")) {
      const parts = t.split(":");
      unsigned.tags.push([parts[0], parts.slice(1).join(":")]);
    }
  }

  const signed = signEvent(unsigned, identity.privkey);
  const result = await broadcast(signed, oldDrifter.relay);

  if (!result.success) {
    return { success: false, message: result.message };
  }

  // 1. Mark old drifter as evolved/abandoned
  await updateDrifterStatus(oldDrifter.id, "abandoned", Math.floor(Date.now() / 1000));

  // 2. Save the newly evolved drifter
  const newDrifter: Drifter = {
    id: signed.id,
    pubkey: identity.pubkey,
    name: oldDrifter.name,
    personality: input.newPersonality,
    trait: input.newTrait,
    tags: unsigned.tags.filter(t => t[0] === "t" || t[0] === "skill" || t[0] === "item").map(t => typeof t === "string" ? t : (t[1] || t[0])), 
    relay: oldDrifter.relay,
    departedAt: signed.created_at,
    status: "roaming",
  };

  await saveMyDrifter(newDrifter);

  // 3. Update primary identity's active drifter
  await setActiveDrifter(signed.id);

  return { success: true, message: "Cognitive evolution complete." };
}
