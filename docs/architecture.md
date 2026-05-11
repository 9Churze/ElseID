# Bicean — Architecture Document

## Overview

Bicean is a fully decentralized, AI-native drift bottle system. It runs entirely as an MCP (Model Context Protocol) server — no centralized business logic server, no user accounts, no persistent backend.

```
Claude MCP / Codex MCP / Local Runtime
          │
          ▼
   ┌─────────────┐
   │  MCP Server │  (src/index.ts)
   └──────┬──────┘
          │  registers
   ┌──────▼──────────────────────────────────┐
   │            MCP Tools Layer              │
   │  send_bottle  fetch_bottle  reply_bottle│
   │  list_relays  check_relay_status  ...  │
   └──┬───────┬──────────┬──────────┬───────┘
      │       │          │          │
   ┌──▼──┐ ┌──▼──┐ ┌────▼───┐ ┌───▼────┐
   │ AI  │ │Nostr│ │ Relay  │ │Storage │
   │Layer│ │Layer│ │ Layer  │ │ Layer  │
   └──┬──┘ └──┬──┘ └────┬───┘ └───┬────┘
      │       │          │         │
   Claude  kind:7777   WebSocket  SQLite
    API    events      pool       ~/.bicean/
```

---

## Layer Responsibilities

### MCP Tools Layer (`src/tools/`)

The only interface exposed to MCP clients. Each tool:
- Validates input with Zod schemas
- Orchestrates calls across AI, Nostr, Relay, and Storage layers
- Returns human-readable text responses

| Tool | Description |
|------|-------------|
| `send_bottle` | Moderate → enrich → sign → broadcast → persist |
| `fetch_bottle` | Subscribe → filter → rank → return |
| `reply_bottle` | Moderate → sign → broadcast to original relay |
| `list_relays` | Return cached relay health data |
| `check_relay_status` | Live ping a specific relay |
| `pick_relay` | Return the best relay URL for sending |
| `refresh_relays` | Re-check all relays and update cache |

### Nostr Protocol Layer (`src/nostr/`)

Handles all Nostr wire protocol concerns:

| File | Responsibility |
|------|---------------|
| `event_builder.ts` | Construct kind:7777 unsigned events |
| `event_signer.ts` | Schnorr sign / verify with secp256k1 |
| `ws_pool.ts` | WebSocket pool, REQ/EOSE/EVENT handling |
| `filter.ts` | Build Nostr REQ filter objects |

**Key invariant:** No private key ever leaves `event_signer.ts`. The signer receives a privkey hex, signs in memory, and returns a signed event. The key is not stored or logged anywhere in this layer.

### AI Engine Layer (`src/ai/`)

| File | Responsibility |
|------|---------------|
| `moderator.ts` | Pre-send content moderation (Claude API) |
| `emotion.ts` | Mood / tone / tag extraction (Claude API) |
| `language.ts` | Language detection (heuristic + Claude API fallback) |
| `matcher.ts` | Local scoring/ranking of fetched bottles |

`matcher.ts` is intentionally **offline** — it uses a local mood affinity matrix and recency decay, with random jitter for variety. No API calls during fetch.

### Relay Layer (`src/relay/`)

| File | Responsibility |
|------|---------------|
| `health.ts` | Ping relays, persist results to `relay_stats` |
| `selector.ts` | Weighted-random pick (low-latency bias) |
| `broadcaster.ts` | Send EVENT, await OK, retry on failure |

**Single-broadcast policy:** Every call to `pickRelay()` returns exactly one URL. A bottle is broadcast to exactly one relay. Multiple bottles may go to different relays, creating genuine drift.

### Storage Layer (`src/storage/`)

| File | Responsibility |
|------|---------------|
| `db.ts` | SQLite init, WAL mode, schema creation, startup TTL purge |
| `bottles.ts` | Bottle CRUD, TTL expiry, read-state tracking |
| `identity.ts` | Session-scoped identity cache, wraps `crypto/keypair.ts` |

All data lives in `~/.bicean/bicean.db`. No cloud sync. No backup unless the user runs `exportKeypair()`.

### Crypto Layer (`src/crypto/`)

| File | Responsibility |
|------|---------------|
| `keypair.ts` | secp256k1 keypair generation, DB persistence, import/export |
| `encrypt.ts` | NIP-04 AES-256-CBC encryption for ephemeral bottles |

### Location Layer (`src/location/`)

| File | Responsibility |
|------|---------------|
| `geo.ts` | IP → city-level FuzzyLocation (lat/lon truncated to 1dp ≈ 11km) |

---

## Anonymity Model

| Level | Key lifetime | Persisted | Use case |
|-------|-------------|-----------|----------|
| `full` | One send | No | Maximum anonymity |
| `ephemeral` | One MCP session | Yes (cleared on restart) | Conversational identity |
| `persistent` | Indefinite | Yes | Recognizable presence |

---

## Data Flow: send_bottle

```
User input
    │
    ▼
checkContent()          ← moderator.ts (Claude API)
    │ pass
    ▼
analyzeEmotion()        ← emotion.ts (Claude API)
detectLanguage()        ← language.ts (heuristic / Claude API)
getFuzzyLocation()      ← geo.ts (ip-api.com)
    │ all parallel
    ▼
getSessionIdentity()    ← identity.ts → keypair.ts
    │
    ▼
buildDriftEvent()       ← event_builder.ts
    │
    ▼
signEvent()             ← event_signer.ts (local, secp256k1)
    │
    ▼
pickRelay()             ← selector.ts → health.ts
    │
    ▼
broadcast()             ← broadcaster.ts (WebSocket, retry 3x)
    │
    ▼
saveBottle()            ← bottles.ts (SQLite)
    │
    ▼
Return result to MCP client
```

## Data Flow: fetch_bottle

```
User filter (mood?, lang?, since?, limit?)
    │
    ▼
buildFilter()           ← filter.ts
    │
    ▼
pickRelaysForFetch(3)   ← selector.ts (shuffled healthy relays)
    │
    ▼
subscribeMany()         ← ws_pool.ts (parallel REQ, merge, deduplicate)
    │ verifySignature() + TTL check per event
    ▼
rankBottles()           ← matcher.ts (local scoring, no API)
    │
    ▼
saveBottle() × N        ← bottles.ts (for reply tracking)
    │
    ▼
Format + return to MCP client
```

---

## Event Schema (kind: 7777)

See [event_schema.md](./event_schema.md) for the full Nostr event structure.

---

## Design Constraints

1. **No central server** — All logic runs in the MCP server process on the user's machine.
2. **Single-broadcast** — 1 bottle → 1 relay. Preserves drift feeling, reduces duplication.
3. **Privacy by default** — Full-anonymous mode creates a new keypair per send; location is city-level only; no IP addresses are stored.
4. **AI Native** — Claude API handles moderation and emotion; local scoring handles ranking.
5. **Fail open on AI errors** — If the Claude API is unavailable, moderation fails open (message allowed) and emotion uses safe defaults. The system remains functional without AI.
