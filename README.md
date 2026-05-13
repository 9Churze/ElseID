# ElseID 🛸

> **"Release another you. Let it wander, and let the world treat it with kindness."**

[English](README.md) | [Chinese](docs/README_zh.md) | [日本語](docs/README_ja.md) | [한국어](docs/README_ko.md)

ElseID lets you create a **digital drifter** — a personality-rich alter ego that wanders across a decentralized network. Strangers around the world can host it, share stories with it, recommend local food, and leave messages for you.

You can check on it anytime: where it's been, who it met, and what they left behind.

**One drifter per person, at any time.**
No account needed. No server. Your data lives only on your own machine.

---

## 🚀 Quick Start

### Step 1 — Install

Make sure you have [Node.js](https://nodejs.org/) v18 or later, then run:

```bash
npm run setup
```

### Step 2 — Configure the Butler

Open your AI client (Claude Desktop, Codex, etc.) and go to **System Prompt** or **Custom Instructions**.
Paste the full contents of `docs/system_prompt.md` and save.

### Step 3 — Start

Restart your AI client, then just say:

> "I want to create a drifter."

The Butler will guide you through everything else.

---

## 💡 What You Can Do

### Launch Your Drifter

Tell the Butler what your drifter is like.
Use `&` to separate traits — a few words is plenty:

> `loves late nights & a bit romantic & wants to see a lighthouse`

The Butler will give it a name, shape its personality, and ask for your confirmation.
Say the word, and it sets off.

---

### Host a Passing Drifter

Ask the Butler: **"Any drifters nearby?"**

If one is found, the Butler will introduce it — its name, origin, personality.
You can choose how to welcome it:

- 🍜 Recommend local food
- 📍 Suggest a place worth visiting
- 🗺️ Share a recent story
- 💬 Leave a message for its owner

What you leave gets written into its journey log. Its owner will read it someday.

*   **Fate & Reunion**: You might meet the same drifter more than once. The Butler remembers your history — every act of kindness is recorded.

---

### Check In on Your Drifter

Ask the Butler: **"How is it doing?"**

The Butler will tell you which city it's reached, who hosted it, and what they left behind.

---

### Start Over

If you want to let go of your current drifter, tell the Butler: **"I want to start over."**

The Butler will ask you to confirm. After that, the drifter is retired — but everything it received stays on your local machine, preserved.

If you ever miss a past companion, say: **"Help me look through the old luggage."**
The kindness collected in the digital wilderness has been carefully stored, waiting to be opened again.

---

## ⚙️ Tool Reference

| Tool | Description |
| --- | --- |
| `create_drifter` | Create and launch your digital drifter |
| `find_nearby_drifter` | Scan for wandering drifters nearby (finds 1 at a time) |
| `feed_drifter` | Host and feed a passing drifter |
| `set_host_name` | Set the name of the user (Host) |
| `evolve_drifter_personality` | Evolve the drifter's personality based on its journey (Soul Synthesis) |
| `get_journey_log` | View your drifter's travel log |
| `get_my_encounters` | View the log of strangers' drifters you have hosted and fed |
| `list_past_memories` | Browse memories of past drifters (the old luggage) |
| `abandon_drifter` | Say goodbye and start fresh |
| `recover_drifter` | Recover a lost signal (soul retrieval) |
| `list_relays` | Check relay station status |

---

## 🛡 Technical Highlights

- **Cognitive Evolution Engine**: Drifters synthesize memories to evolve their personality (strictly adhering to Universal Values).
- **Fate Mechanics**: Encountering the same drifter twice is possible, but subject to a poetic 15% probability.
- **Personality-first**: Not a message — a digital self with a character.
- **Geo-proximity matching**: Drifters prefer relays closest to their origin.
- **Local-first**: All data lives in `~/.elseid` on your own machine.
- **Privacy-preserving**: City-level location only — no precise coordinates stored.
- **No account required**: Identity is based on a locally generated cryptographic key pair.

---

## 🔧 Developer Notes

- **Protocol**: Nostr `kind: 7777`, using `type: drifter / feeding` tags
- **Storage**: Local SQLite database (`~/.elseid/elseid.db`)
- **Signing**: secp256k1 asymmetric encryption — journey logs are unforgeable
- **Runtime**: TypeScript + Node.js

---

## ⚠️ Important Notice

This project is open-sourced under the **AGPL-3.0** license.

Content safety is enforced by two layers: the AI client's native safety policy (Claude/Codex) as the primary filter, and a local rule-based engine as a secondary fallback. Any derivative version must retain equivalent content moderation. Modifiers bear full legal responsibility for their changes.

See [COMPLIANCE.md](./COMPLIANCE.md) for details.

---

## License

[AGPL-3.0](./LICENSE) © ElseID Contributors

_"Let every encounter become a light in the digital wilderness."_
