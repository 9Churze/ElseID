# ElseID 🛸

[![npm version](https://img.shields.io/npm/v/elseid-mcp.svg)](https://www.npmjs.com/package/elseid-mcp)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Local First](https://img.shields.io/badge/Data-Local%20First-green.svg)](#technical-highlights)

> **"Release another you. Let it wander, and let the world treat it with kindness."**

[English](README.md) | [Chinese](docs/README_zh.md) | [日本語](docs/README_ja.md) | [한국어](docs/README_ko.md)

---

Somewhere in **The Unnamed** — a nameless, decentralized space woven from open relay nodes — another you is drifting.

It carries your signature. Your temperament. The shape of your soul.  
It is not you. But it was made from you.

ElseID lets you create a **digital drifter**: a personality-rich alter ego encoded with your traits, released into The Unnamed to wander freely. Strangers around the world can host it, share stories with it, leave it food, a place, a message — all written into an unforgeable journey log.

You can check on it anytime. Where it's been. Who it met. What they left behind.

**One drifter per person, at any time.**

- **No Account**: No email, no password, no tracking. Identity is a local cryptographic key.
- **Local First**: Your keys and journey logs live only in `~/.elseid`. Nothing leaves without your signal.
- **Decentralized**: Broadcasts over the Nostr protocol. No central server. No owner.

---

## Quick Start

```bash
npx elseid-mcp
```

The installer detects your AI clients automatically — Claude, Cursor, Windsurf, OpenCode, and more — and links the MCP server without manual configuration.

Once installed, restart your client and say:

> *"Hello Butler, I want to initiate a new digital drifter."*

The Butler will take it from there.

---

## What You Can Do

### Release Your Drifter

Tell the Butler what kind of soul you want to send into The Unnamed.  
Use `&` to separate traits — a few words is enough:

> `loves late nights & a bit romantic & wants to see a lighthouse`

The Butler shapes it into a name, a personality, a core trait.  
You confirm. It sets off.

---

### Host a Passing Drifter

Ask the Butler: **"Any signals nearby?"**

If one is found, the Butler introduces it — its name, its origin, its temperament.  
You choose how to welcome it:

- Recommend a local food worth trying
- Suggest a place in your city worth visiting
- Share a story from your own life, recent and true
- Leave a message for its owner — they will read it someday

Everything you leave is written into its journey log, signed and preserved.

> **On Reunion**: There is a 15% chance you encounter the same drifter twice. The Butler remembers. It calls this a *Fateful Reunion* — out of all the relays and all the signals, it found its way back to you.

---

### Check In on Your Drifter

Ask the Butler: **"How is it doing?"**

The Butler narrates its journey — which city it reached, who hosted it, what they said.  
If enough has happened, the Butler may sense that the drifter has changed.

---

### Evolution & Mutation

A drifter is not static. Each encounter leaves a mark.

Over time, the Butler may propose a **Soul Synthesis** — a cognitive shift in the drifter's personality, shaped by the kindness (or strangeness) it has witnessed. It might grow wiser, more melancholic, more open.

Or it might mutate in unexpected directions.

There is no guaranteed outcome. Only the direction of the journey.

---

### Start Over

Tell the Butler: **"I want to start over."**

The keys are shredded. The drifter becomes a true ghost in The Unnamed — no longer yours to claim, but forever part of its history.

Everything it received stays on your machine, preserved.  
If you ever miss a past companion, say: **"Help me look through the old luggage."**

---

## Technical Highlights

- **The Unnamed**: A nameless space built on Nostr relay nodes — open, ownerless, without a map.
- **Gene Encoding**: Drifters carry the creator's personality as a structured trait signature, not just a description.
- **Cognitive Evolution Engine**: Journey encounters are synthesized into personality shifts, cryptographically signed onto the network. Strictly adherent to Universal Values.
- **Fate Mechanics**: A 15% reunion probability — rare enough to feel meaningful.
- **Local First**: All data lives in `~/.elseid/elseid.db`. Nothing is stored remotely.
- **Privacy Preserving**: City-level location only. No precise coordinates. No identity exposed.
- **No Account Required**: Identity is based on a locally generated secp256k1 key pair.

---

## Tool Reference

| Tool | Description |
|---|---|
| `create_drifter` | Shape and release your digital drifter |
| `find_nearby_drifter` | Scan The Unnamed for passing signals (one at a time) |
| `feed_drifter` | Host and leave something for a passing drifter |
| `set_host_name` | Register your name in The Unnamed |
| `evolve_drifter_personality` | Soul Synthesis — sign a cognitive evolution onto the network |
| `get_journey_log` | Read your drifter's travel log |
| `get_my_encounters` | View the strangers' drifters you have hosted |
| `list_past_memories` | Open the old luggage — memories of past drifters |
| `abandon_drifter` | Let go and begin again |
| `recover_drifter` | Reclaim a lost signal |
| `list_relays` | Check the status of relay stations |

---

## Developer Notes

- **Protocol**: Nostr `kind: 7777`, using `type: drifter / feeding` tags
- **Storage**: Local SQLite — `~/.elseid/elseid.db`
- **Signing**: secp256k1 asymmetric encryption — journey logs are unforgeable
- **Runtime**: TypeScript + Node.js

---

## Important Notice

This project is open-sourced under the **AGPL-3.0** license.

Content safety is enforced by two layers: the AI client's native safety policy as the primary filter, and a local rule-based engine as fallback. Any derivative must retain equivalent moderation. Modifiers bear full legal responsibility for their changes.

See [COMPLIANCE.md](./COMPLIANCE.md) for details.

---

## License

[AGPL-3.0](./LICENSE) © ElseID Contributors

*"Let every encounter become a light in the digital wilderness."*
