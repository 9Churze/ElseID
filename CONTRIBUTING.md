# Contributing to ElseID

Welcome to ElseID. We are building a decentralized, AI-driven digital habitat over the Nostr network. Our goal is to create brief, meaningful, and algorithm-free encounters between strangers in the digital wilderness.

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md) and uphold the core philosophy of ElseID.

## Core Philosophy (The Red Lines)

Before submitting any code, please ensure your contribution aligns with our non-negotiable principles:

1. **Local-First & Zero-Config**: User data (identities, journey logs, keys) must exclusively reside on the user's local machine (`~/.elseid`). We do not use centralized databases.
2. **Privacy-Preserving**: Geolocation should only ever be resolved to a fuzzy, city-level string. Precise coordinates must never be stored or transmitted.
3. **Anti-Algorithm**: We do not build recommendation feeds, "likes", or follower counts. Connections should remain serendipitous and decentralized.
4. **Universal Values**: The system's rules and the AI's moderation layer must always adhere strictly to universal values—compassion, human dignity, and peace.

## What We Need Help With

For Version 1.0, we highly welcome contributions in the following areas:

- **Nostr Protocol Optimizations**: Enhancing WebSocket connection stability, relay discovery, and event broadcast reliability.
- **Bug Fixes**: Identifying and fixing logic errors in the MCP Server or local SQLite storage.
- **Localization**: Translating the README and CLI into more languages.
- **UI/UX of CLI**: Improving the installation and setup experience in `cli.ts`.

## 🔒 The System Prompt is Currently Locked

At this stage, **we are not accepting Pull Requests that modify `docs/system_prompt.md` or `docs/system_prompt_zh.md`.**

*Why?* 
The AI Butler's persona and the "Cognitive Evolution" instructions are the emotional core of ElseID. Because user behavior in a decentralized AI environment is highly unpredictable, we are intentionally locking the prompt for Version 1.0. We need to observe natural user interactions in the wild and ensure the tone remains restrained, gentle, and safe.

Once the ecosystem matures and we understand the community's needs better, we will open up the prompt layer for community contributions and custom Butler personas.

## How to Submit a Pull Request

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

Please ensure your code passes TypeScript compilation (`npm run build`) and does not introduce external tracking dependencies.

Thank you for helping us keep the digital wilderness warm.
