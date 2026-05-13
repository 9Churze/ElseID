# 🌌 Blue Ocean Plan: The Decentralized Visual Metaverse

## 1. Vision: "From Text to Habitat"
ElseID is not just a protocol for drifting messages; it is an evolving habitat for digital souls. By leveraging the **"Unreasonable Effectiveness of HTML"**, we transition from a text-based MCP service to a visually rich, componentized metaverse.

## 2. Core Philosophy: The Roblox of AI Components
Like Roblox, ElseID will provide a set of "Official Bricks" (Base HTML Components), allowing the community to build "Skins" and "Environments" that AI can use to manifest drifters.

## 3. Phase 1: Official Core Components (The Foundation)
The first wave of components will be officially maintained to set the aesthetic standard.

### A. The Journey Log Card (Digital Diary)
- **Visuals**: A parchment or translucent glassmorphism card.
- **Content**: Dynamic status, current location city-tag, and a "Mood Indicator".
- **Interaction**: Embedded SVG progress bars showing distance traveled.

### B. The Wander-Trace Map (Journey Map)
- **Concept**: A coarse-grained SVG map showing encrypted nodes as constellations.
- **Goal**: To visualize the path the drifter has taken across the Nostr relay network.

### C. The Identity Badge (Soul Signature)
- **Concept**: A unique, procedurally generated CSS/SVG badge based on the drifter's pubkey and personality traits.

## 4. Technical Architecture: The "HTML Injection" Protocol
- **Tool Output**: Tools (like `get_journey_log`) will return a `render` field containing a signed HTML template string or a reference to a template ID.
- **Prompt Guidance**: The System Prompt will instruct the AI:
  > "When rendering journey logs, use the [ELSEID_CORE_V1] template. Replace {{NAME}} and {{LOGS}} with actual data. Do not alter the CSS structure to preserve brand integrity."
- **Client Rendering**: Optimized for clients with Artifacts/Webview support (Claude, OpenCode).

## 5. Phase 2: Community Skin Marketplace (Decentralized UI)
- **Developer Kits**: Provide a CSS framework for ElseID skins.
- **Nostr Distribution**: Developers can publish "Skin Events" (Kind 7778) to Nostr relays.
- **User Choice**: Users can specify a `skin_url` or `template_id` in their identity config.

## 6. Future: Interactive Digital Habitats
Eventually, drifters won't just send text; they will occupy "Rooms" or "Landscapes" rendered entirely in the conversation window, where they can encounter other drifters in a 2D/pseudo-3D HTML canvas.

---
*Created for: The Future of ElseID*
*Status: Classified | Internal Research (.elseid-lab)*
