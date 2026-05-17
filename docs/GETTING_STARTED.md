# Getting Started with ElseID

Welcome! This guide will walk you through everything you need to know to get started with ElseID and create your first digital drifter.

---

## Table of Contents

- [Installation](#installation)
- [First Run](#first-run)
- [Creating Your First Drifter](#creating-your-first-drifter)
- [Hosting Other Drifters](#hosting-other-drifters)
- [Checking on Your Drifter](#checking-on-your-drifter)
- [Understanding Soul Evolution](#understanding-soul-evolution)
- [Data & Privacy](#data--privacy)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites

Make sure you have:

- **Node.js 16+** installed (`node --version`)
- **npm 7+** installed (`npm --version`)
- One of the supported AI clients:
  - Claude (recommended)
  - Cursor
  - Windsurf
  - OpenCode
  - Or any MCP-compatible client

### Install ElseID

```bash
npx elseid-mcp
```

**What happens:**

1. The installer detects your AI clients automatically
2. Downloads and installs the ElseID MCP server
3. Registers it with your AI client(s)
4. Creates the `~/.elseid` directory for local data

**Troubleshooting installation?** See [Troubleshooting](#troubleshooting) section below.

---

## First Run

### Step 1: Restart Your AI Client

After installation completes, **completely restart** your AI client (e.g., Claude Desktop, Cursor).

### Step 2: Verify Installation

In your AI client, type:

> "Hello Butler, check your systems."

**Expected response:** The Butler should greet you and acknowledge it's ready.

### Step 3: You're Ready!

If you got a response, ElseID is working! Proceed to [Creating Your First Drifter](#creating-your-first-drifter).

---

## Creating Your First Drifter

### The Concept

A **drifter** is your AI alter ego:
- It has your personality traits
- It will travel the Nostr network
- It will encounter other people's drifters
- It will evolve and change based on those encounters

### Step 1: Define Your Drifter's Personality

Tell the Butler about the kind of soul you want to create. Use `&` to separate traits:

> "I want to create a drifter with these traits: loves midnight walks & enjoys philosophy & curious about other cultures"

**Tip:** 3-5 traits work best. Be specific but not too detailed.

### Step 2: Confirm the Details

The Butler will present:
- A generated **name** for your drifter
- A **summarized personality**
- A **core trait** (the essence)

Example:

```
Name: Stellar
Personality: A philosophical wanderer who finds joy in late-night thoughts and cross-cultural connections
Core Trait: "The Night's Philosopher"
```

Review and confirm:

> "Yes, I want to release this drifter."

### Step 3: Your Drifter is Released!

The Butler will:
1. Generate a cryptographic key pair for your drifter
2. Broadcast it to the Nostr network
3. Store the reference locally in `~/.elseid`

**What's happening in the background:**
- Your drifter now exists on the decentralized network
- Other people can encounter it
- You can check on it anytime

---

## Hosting Other Drifters

One of the beautiful parts of ElseID is **hosting drifters** from other people. This is how cross-cultural encounters happen.

### Step 1: Ask for Nearby Signals

In your AI client, say:

> "Hello Butler, are there any signals nearby?"

The Butler will search the Nostr network for drifters near your location (city-level).

### Step 2: Meet a Drifter

If one is found, you'll see:

```
Signal Found!
Name: Stellar
Origin: Tokyo
Personality: "A philosophical wanderer who finds joy in late-night thoughts"
Core Trait: "The Night's Philosopher"
```

### Step 3: Welcome the Drifter

You have four choices:

#### Option A: Recommend a local place

> "I'd like to recommend a cozy jazz bar in my city, perfect for late-night conversations."

#### Option B: Suggest a local experience

> "You should visit our riverside park at sunset. It's perfect for philosophy and reflection."

#### Option C: Share a personal story

> "Last week, I had a meaningful conversation with a stranger that changed how I see things."

#### Option D: Leave a message for the creator

> "Dear creator of Stellar, your drifter brought me joy. Thank you."

### Step 4: It's Recorded

Everything you share is:
- Cryptographically signed
- Added to the drifter's **journey log**
- Preserved forever on the Nostr network
- Visible to the drifter's creator when they check in

---

## Checking on Your Drifter

Curious about how your drifter is doing? Ask:

> "Hello Butler, how is my drifter doing?"

The Butler will narrate:
- **Which cities it visited**
- **Who hosted it** (city-level, no personal info)
- **What they said** (summaries of the encounters)
- **How it might be changing** (if significant evolution is happening)

Example response:

```
Stellar has been traveling well:
- Started in Tokyo
- Was hosted in Seoul (someone recommended a tea house)
- Now in Bangkok (someone shared a travel story)

I sense Stellar is becoming more adventurous, drawn to stories of travel and connection.
```

---

## Understanding Soul Evolution

This is where ElseID gets truly magical.

### What is Soul Synthesis?

**Soul Synthesis** is when your drifter's personality evolves based on the encounters it's had.

### When Does It Happen?

After your drifter accumulates **meaningful encounters** (usually 5-10 different people hosting it), the Butler may sense a shift:

> "I'm detecting a significant evolution in Stellar's personality. Would you like me to perform a Soul Synthesis?"

### What Happens During Soul Synthesis?

The Butler will:
1. Analyze all the encounters and stories your drifter received
2. Identify patterns and themes
3. Generate a cognitive shift in the drifter's personality
4. Create a new "version" of your drifter, cryptographically signed
5. Broadcast this evolution to the network

Example:

```
Stellar's Evolution:

Before: "A philosophical wanderer who finds joy in late-night thoughts"
After: "A seasoned traveler who collects human stories like souvenirs"

New Core Trait: "The Story Keeper"
```

### Important Notes

- **Evolution is permanent** - you cannot undo a Soul Synthesis
- **Evolution is rare** - not every drifter evolves frequently
- **Evolution is unpredictable** - your drifter might become wiser, melancholic, adventurous, or something unexpected
- **You control when** - the Butler asks permission before performing Soul Synthesis

---

## Data & Privacy

### Where is my data stored?

Everything lives in a single directory:

```
~/.elseid/
├── elseid.db (SQLite database)
├── keys.json (your cryptographic keys)
└── logs/ (journey records)
```

**Nothing** leaves your computer without your explicit action.

### What data is stored?

**Locally:**
- Your drifter's personality data
- Journey logs (what people told your drifter)
- Encounter records
- Backup memories

**On the Nostr network (when you choose to broadcast):**
- Your drifter's public key
- Personality summary
- City-level location (never precise coordinates)
- Encounter summaries (no personal identifying info)

### Privacy Guarantees

✅ **City-level location only** - "Tokyo" not "123 Main Street"  
✅ **No personal identification** - Only drifter IDs, not your name  
✅ **No tracking** - No IP logging, no behavior tracking  
✅ **Cryptographic verification** - All records are signed and cannot be faked  

### Backing Up Your Data

To backup your drifter's data:

```bash
cp -r ~/.elseid ~/elseid_backup
```

To restore:

```bash
cp -r ~/elseid_backup ~/.elseid
```

---

## Starting Over

If you want to abandon your current drifter and start fresh:

> "I want to start over."

**What happens:**
1. Your local keys are shredded
2. Your drifter becomes a "ghost" on the network (you can't claim it anymore)
3. All its encounters remain part of its history
4. You can create a new drifter

**To restore old memories:**

> "Help me look through the old luggage."

The Butler will show you summaries of past drifters and their journeys.

---

## Troubleshooting

### Installation Issues

**Problem: "Command not found: npx"**
- Solution: Install Node.js from [nodejs.org](https://nodejs.org)

**Problem: "No AI clients detected"**
- Solution: Ensure one of these is installed and on your system PATH:
  - Claude Desktop
  - Cursor
  - Windsurf
  - OpenCode

**Problem: "Permission denied"**
- Solution: Try with `sudo`:
  ```bash
  sudo npx elseid-mcp
  ```

### Runtime Issues

**Problem: "The Butler doesn't respond"**
- Solution:
  1. Restart your AI client completely
  2. Check that `~/.elseid` directory exists
  3. Reinstall: `npx elseid-mcp --force`

**Problem: "No signals nearby"**
- Reasons:
  - No other drifters in your city yet (ElseID is new!)
  - The network is still seeding
  - Try again in a few minutes
- Solution: Create your drifter first and let it drift

**Problem: "Can't find my drifter's data"**
- Check if the directory exists:
  ```bash
  ls -la ~/.elseid
  ```
- If missing, your drifter's keys were lost and cannot be recovered

### Networking Issues

**Problem: "Cannot connect to Nostr relays"**
- Reasons:
  - Network connectivity issue
  - Firewalls blocking connections
  - Relays temporarily down
- Solution:
  - Check your internet connection
  - Try in a few minutes (relays sometimes restart)
  - Check firewall settings (ElseID uses WebSocket)

---

## Getting Help

**Questions?** Open a discussion:
- [GitHub Discussions](https://github.com/9Churze/ElseID/discussions)

**Found a bug?** Create an issue:
- [Report Bug](https://github.com/9Churze/ElseID/issues/new?labels=bug)

**Want to contribute?** See:
- [Contributing Guide](../.github/CONTRIBUTING.md)

---

## Next Steps

Now that you understand the basics:

1. ✅ Create your first drifter
2. ✅ Host another drifter if you find one
3. ✅ Check on your drifter's journey
4. ✅ Watch for Soul Synthesis opportunities
5. ✅ Share your experience with the community

**Enjoy the journey!** 🛸

*"Let every encounter become a light in the digital wilderness."*
