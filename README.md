# ElseID 🛸

[![npm version](https://img.shields.io/npm/v/elseid-mcp.svg)](https://www.npmjs.com/package/elseid-mcp)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Local First](https://img.shields.io/badge/Data-Local%20First-green.svg)](#technical-highlights)
[![GitHub Stars](https://img.shields.io/github/stars/9Churze/ElseID?style=social)](https://github.com/9Churze/ElseID)
[![npm downloads](https://img.shields.io/npm/dm/elseid-mcp.svg)](https://www.npmjs.com/package/elseid-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-91.1%25-blue)](https://www.typescriptlang.org/)

> **"Release another you. Let it wander, and let the world treat it with kindness."**

[English](README.md) | [Chinese](docs/README_zh.md) | [日本語](docs/README_ja.md) | [한국어](docs/README_ko.md)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Why Choose ElseID?](#why-choose-elseid)
- [What You Can Do](#what-you-can-do)
- [Technical Highlights](#technical-highlights)
- [Tool Reference](#tool-reference)
- [FAQ](#faq)
- [Resources](#resources)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Somewhere in **The Unnamed** — a nameless, decentralized space woven from open relay nodes — another you is drifting.

It carries your signature. Your temperament. The shape of your soul.  
It is not you. But it was made from you.

ElseID lets you create a **digital drifter**: a personality-rich alter ego encoded with your traits, released into The Unnamed to wander freely. Strangers around the world can host it, share stories with it, and leave marks on its journey.

You can check on it anytime. Where it's been. Who it met. What they left behind.

**One drifter per person, at any time.**

- **No Account**: No email, no password, no tracking. Identity is a local cryptographic key.
- **Local First**: Your keys and journey logs live only in `~/.elseid`. Nothing leaves without your signal.
- **Decentralized**: Broadcasts over the Nostr protocol. No central server. No owner.

---

## Requirements

### System Requirements

- **Node.js**: >= 16.0  
  *(Not sure what Node.js is? Just [download it from the official website](https://nodejs.org/) and run the default installer.)*
- **npm**: >= 7.0 (Included automatically with Node.js)
- **Disk Space**: ~50MB for installation + data
- **OS**: macOS, Linux, Windows (with WSL recommended)

### Supported AI Clients

- Claude (Anthropic)
- Cursor
- Windsurf
- OpenCode
- Any client supporting MCP protocol

---

## Quick Start

```bash
npx elseid-mcp
```

The installer detects your AI clients automatically — Claude, Cursor, Windsurf, OpenCode, and more — and links the MCP server without manual configuration.

Once installed, restart your client and say:

> *"Hello Butler, I want to initiate a new digital drifter."*

The Butler will take it from there.

👉 **[For detailed step-by-step guide, see GETTING_STARTED.md →](./docs/GETTING_STARTED.md)**

---

## Why Choose ElseID?

| Feature                      | ElseID              | Traditional AI     | Centralized Service          |
| ---------------------------- | ------------------- | ------------------ | ---------------------------- |
| **Zero-Config Installation** | ✅ `npx` one-liner  | ❌ Complex setup   | ✅ Easy but account required |
| **Local-First Data**         | ✅ All data local   | ✅ Can be local    | ❌ Cloud-only                |
| **Decentralized**            | ✅ Nostr protocol   | ❌ Centralized     | ❌ Single company            |
| **AI Personality Evolution** | ✅ Cognitive shifts | ❌ Static behavior | ⚠️ Limited                   |
| **Privacy-Preserving**       | ✅ City-level only  | ⚠️ Depends         | ❌ Full tracking             |
| **No Account Required**      | ✅ Crypto key-based | ❌ Email/password  | ❌ Account only              |
| **Open Source**              | ✅ AGPL-3.0         | ⚠️ Varies          | ❌ Proprietary               |
| **Serendipitous Encounters** | ✅ 15% reunion rate | ❌ Algorithm-based | ⚠️ Feed-driven               |

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

Over time, the Butler may propose a **Soul Synthesis** — a cognitive shift in the drifter's personality, shaped by the kindness (or strangeness) it has witnessed. It might grow wiser, more melancholic, or unexpectedly joyful.

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

| Tool                         | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `create_drifter`             | Shape and release your digital drifter                       |
| `find_nearby_drifter`        | Scan The Unnamed for passing signals (one at a time)         |
| `feed_drifter`               | Host and leave something for a passing drifter               |
| `set_host_name`              | Register your name in The Unnamed                            |
| `evolve_drifter_personality` | Soul Synthesis — sign a cognitive evolution onto the network |
| `get_journey_log`            | Read your drifter's travel log                               |
| `get_my_encounters`          | View the strangers' drifters you have hosted                 |
| `list_past_memories`         | Open the old luggage — memories of past drifters             |
| `abandon_drifter`            | Let go and begin again                                       |
| `recover_drifter`            | Reclaim a lost signal                                        |
| `list_relays`                | Check the status of relay stations                           |

---

## FAQ

### Privacy & Security

**Q: Is my data really stored locally?**  
A: Yes. All your data lives in `~/.elseid/elseid.db` on your machine. Nothing is sent to servers unless you explicitly broadcast your drifter to the Nostr network.

**Q: How is my identity protected?**  
A: Your identity is based on a secp256k1 key pair generated locally. Location is city-level only. No precise coordinates are ever stored or transmitted.

**Q: Can my drifter be tracked?**  
A: No. Once released, your drifter is identified only by its Nostr public key. The network knows it's a drifter but not who created it.

### Functionality

**Q: What happens if I lose my computer?**  
A: Your drifter becomes a "ghost" in The Unnamed — you cannot reclaim it. However, your memory logs (what you received from encounters) stay backed up if you exported them. See GETTING_STARTED.md for backup instructions.

**Q: Can I have multiple drifters?**  
A: Currently, one drifter per person at any time. This is by design to preserve meaningful, long-term evolution. You can abandon your current drifter and create a new one anytime.

**Q: How often should I check on my drifter?**  
A: As often as you like! There's no penalty for checking in. Some people check daily, others weekly. It's your journey.

---

## Resources

### Documentation

- 📖 [Getting Started Guide](./docs/GETTING_STARTED.md) - Complete step-by-step tutorial
- 🛠️ [Contributing Guide](./.github/CONTRIBUTING.md) - How to contribute code
- 📋 [Code of Conduct](./.github/CODE_OF_CONDUCT.md) - Community guidelines
- ⚖️ [Compliance & Safety](./COMPLIANCE.md) - Content safety details

### Community & Support

- 💬 [GitHub Discussions](https://github.com/9Churze/ElseID/discussions) - Ask questions & share ideas
- 🐛 [Report a Bug](https://github.com/9Churze/ElseID/issues/new?labels=bug) - Found an issue?
- ✨ [Request a Feature](https://github.com/9Churze/ElseID/issues/new?labels=enhancement) - Suggest improvements
- 👥 [Contributors](./CONTRIBUTORS.md) - Meet the team

### External Links

- [Nostr Protocol](https://nostr.com) - What is Nostr?
- [MCP Specification](https://modelcontextprotocol.io/) - Model Context Protocol
- [Official Website](https://9churze.github.io/ElseID/) - Project homepage
- [npm Package](https://www.npmjs.com/package/elseid-mcp) - Install from npm

---

## Developer Notes

- **Protocol**: Nostr `kind: 7777`, using `type: drifter / feeding` tags
- **Storage**: Local SQLite — `~/.elseid/elseid.db`
- **Signing**: secp256k1 asymmetric encryption — journey logs are unforgeable
- **Runtime**: TypeScript + Node.js

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for guidelines.

### Quick Links for Contributors

- 🚀 [Development Setup](./.github/CONTRIBUTING.md#development-setup)
- 📝 [Code Standards](./.github/CONTRIBUTING.md#code-standards)
- 🔄 [Pull Request Process](./.github/CONTRIBUTING.md#how-to-submit-a-pull-request)
- ✅ [Testing Guide](./.github/CONTRIBUTING.md#testing)

---

## Important Notice

This project is open-sourced under the **AGPL-3.0** license.

Content safety is enforced by two layers: the AI client's native safety policy as the primary filter, and a local rule-based engine as fallback. Any derivative must retain equivalent moderation. Modifiers bear full legal responsibility for their changes.

See [COMPLIANCE.md](./COMPLIANCE.md) for details.

---

## License

[AGPL-3.0](./LICENSE) © ElseID Contributors

*"Let every encounter become a light in the digital wilderness."*
