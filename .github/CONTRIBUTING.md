# Contributing to ElseID

Thank you for your interest in contributing to ElseID! We are building a decentralized, AI-driven digital habitat over the Nostr network. Your contributions help us create meaningful, algorithm-free encounters between strangers worldwide.

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md) and uphold the core philosophy of ElseID.

---

## Table of Contents

- [Core Philosophy](#core-philosophy-the-red-lines)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Git & Commit Guidelines](#git--commit-guidelines)
- [Testing](#testing)
- [Submitting a Pull Request](#how-to-submit-a-pull-request)
- [Important Notes](#important-notes)

---

## Core Philosophy (The Red Lines)

Before submitting any code, please ensure your contribution aligns with our non-negotiable principles:

### 1. Local-First & Zero-Config
- User data (identities, journey logs, keys) must **exclusively reside** on the user's local machine (`~/.elseid`)
- We do not use centralized databases
- No phone-home telemetry or tracking
- Installation must work with a single command: `npx elseid-mcp`

### 2. Privacy-Preserving
- Geolocation must only be resolved to **city-level** string (e.g., "Tokyo", not "35.6762, 139.6503")
- **Precise coordinates must never be stored or transmitted**
- No IP logging, device fingerprinting, or user tracking
- All personally identifiable information (PII) must be stripped before network transmission

### 3. Anti-Algorithm
- We do not build recommendation feeds, "likes", or follower counts
- Encounters should remain **serendipitous and decentralized**
- No ranking, ranking, or preference signals
- No attention economy mechanics

### 4. Universal Values
- The system's rules and the AI's moderation layer must always adhere strictly to universal values: **compassion, human dignity, and peace**
- Content safety is enforced by layers, never relaxed for convenience
- No hate speech, violence, exploitation, or dehumanization

---

## Ways to Contribute

### 🐛 Bug Reports

Found a bug? Open an issue with:
- **Description**: What went wrong?
- **Steps to reproduce**: How do you trigger it?
- **Expected behavior**: What should happen?
- **Actual behavior**: What actually happened?
- **Environment**: OS, Node.js version, ElseID version

### ✨ Feature Requests

Have an idea? Open an issue with:
- **Description**: What would you like?
- **Why**: Why is it important?
- **How**: How would you implement it?
- **Impact**: Does it align with our core philosophy?

### 📖 Documentation

We welcome:
- README improvements
- Clarifications to docs
- Tutorial creation
- Translation to new languages
- Typo fixes

### 🌐 Localization

Help translate:
- `docs/README_*.md` (add new language variants)
- CLI messages
- System prompts (see [Important Notes](#important-notes))

### 🔧 Code Contributions

Priority areas for v1.0:

- **Nostr Protocol Optimizations**: Enhancing WebSocket connection stability, relay discovery, and event broadcast reliability
- **Bug Fixes**: Identifying and fixing logic errors in the MCP Server or local SQLite storage
- **TypeScript/Code Quality**: Better type safety, error handling, refactoring
- **Testing**: Unit tests, integration tests, e2e tests
- **CLI/UX**: Improving the installation and setup experience

---

## Development Setup

### Prerequisites

- **Node.js 16+**
- **npm 7+**
- **Git**
- **A text editor** (VS Code recommended)
- **Optional: Docker** (for testing relay connectivity)

### Clone the Repository

```bash
git clone https://github.com/9Churze/ElseID.git
cd ElseID
```

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Run Tests

```bash
npm test
```

### Development Mode

For active development with auto-reload:

```bash
npm run dev
```

### Verify Installation Works

```bash
npx ./dist/cli.js
```

---

## Code Standards

### TypeScript

We use **strict TypeScript** for type safety:

```typescript
// ✅ Good
interface DrifterPersonality {
  name: string;
  traits: string[];
  coreValue: string;
}

function createDrifter(personality: DrifterPersonality): Drifter {
  // Implementation
}

// ❌ Avoid
function createDrifter(personality: any): any {
  // No type information
}
```

### Naming Conventions

**Files**: `camelCase` for `.ts`, `kebab-case` for utilities

```
✅ drifterManager.ts
✅ nostr-relay.ts
❌ DrifterManager.ts
❌ nostr_relay.ts
```

**Variables & Functions**: `camelCase`

```typescript
✅ const drifterName = "Stellar";
✅ function fetchNearbyDrifters() { }
❌ const drifter_name = "Stellar";
❌ function FetchNearbyDrifters() { }
```

**Classes & Interfaces**: `PascalCase`

```typescript
✅ class DrifterManager { }
✅ interface NostrEvent { }
❌ class drifterManager { }
❌ interface nostr_event { }
```

### Error Handling

**Always handle errors explicitly:**

```typescript
// ✅ Good
try {
  const data = await fetchFromNostr(relayUrl);
  return data;
} catch (error) {
  logger.error('Failed to fetch from relay', { relayUrl, error });
  throw new Error(`Nostr fetch failed: ${error.message}`);
}

// ❌ Avoid
try {
  return await fetchFromNostr(relayUrl);
} catch (error) {
  console.log('error'); // Vague, not actionable
}
```

### Comments

Use comments to explain **why**, not **what**:

```typescript
// ✅ Good: Explains the decision
// We use city-level geolocation (not precise coordinates) to preserve
// user privacy while enabling serendipitous local encounters
const location = getCityName(lat, lng);

// ❌ Avoid: Just restates the code
// Get the city name from latitude and longitude
const location = getCityName(lat, lng);
```

### Logging

Use structured logging (we provide `logger` module):

```typescript
// ✅ Good
logger.info('Drifter released', {
  drifterId: drifter.id,
  traits: drifter.traits,
  timestamp: Date.now(),
});

// ❌ Avoid
console.log('Drifter released: ' + drifter.id);
```

---

## Git & Commit Guidelines

### Branch Naming

```
feature/add-relay-fallback
bugfix/fix-sqlite-connection
docs/update-contributing-guide
test/add-nostr-parsing-tests
```

### Commit Messages

We follow **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style (no logic change)
- **refactor**: Code reorganization (no feature change)
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, etc.

#### Examples

```
✅ feat(nostr): add relay fallback mechanism
✅ fix(storage): resolve SQLite connection pool leak
✅ docs: add privacy section to README
✅ test(drifter): add personality evolution tests
✅ refactor(cli): simplify installer logic
```

---

## Testing

### Running Tests

```bash
npm test
```

### Writing Tests

Use **Jest**. Tests go in `__tests__/` directories:

```typescript
// src/utils/__tests__/drifterPersonality.test.ts

import { generatePersonalityFromTraits } from '../drifterPersonality';

describe('generatePersonalityFromTraits', () => {
  it('should create a coherent personality from traits', () => {
    const traits = ['loves music', 'curious', 'kind'];
    const personality = generatePersonalityFromTraits(traits);
    
    expect(personality.name).toBeDefined();
    expect(personality.coreValue).toContain('music' || 'curious' || 'kind');
  });

  it('should reject empty traits', () => {
    expect(() => generatePersonalityFromTraits([])).toThrow();
  });
});
```

### Test Coverage

Aim for:
- ✅ **Unit tests** for all utility functions
- ✅ **Integration tests** for Nostr relay interactions
- ✅ **E2E tests** for critical user flows (create drifter, host drifter)

---

## How to Submit a Pull Request

### Step 1: Fork the Repository

```bash
# Go to https://github.com/9Churze/ElseID/fork
```

### Step 2: Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Step 3: Make Your Changes

Edit files, write tests, update docs.

### Step 4: Verify Everything Works

```bash
npm run build    # Compiles TypeScript
npm test         # Runs tests
npm run lint     # Checks code style
```

### Step 5: Commit Your Changes

Use [Conventional Commits](#commit-messages):

```bash
git commit -m "feat(drifter): add soul synthesis triggering logic"
```

### Step 6: Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### Step 7: Open a Pull Request

On GitHub, click **"New Pull Request"** and:

- Write a clear title: `feat: add soul synthesis triggering`
- Describe what changed and why
- Reference any related issues: `Fixes #123`
- Check the PR checklist below

### PR Checklist

Before submitting, ensure:

- [ ] Code follows our [Code Standards](#code-standards)
- [ ] Tests added/updated for new features
- [ ] Documentation updated
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Commits follow [Conventional Commits](#git--commit-guidelines)
- [ ] Changes align with [Core Philosophy](#core-philosophy-the-red-lines)
- [ ] No sensitive data in code (keys, passwords, emails)

---

## Important Notes

### 🔒 System Prompt is Currently Locked

At this stage, **we are not accepting Pull Requests that modify:**
- `docs/system_prompt.md`
- `docs/system_prompt_zh.md`

**Why?** The AI Butler's persona and the "Cognitive Evolution" instructions are the emotional core of ElseID. Because user behavior in a decentralized AI environment is highly unpredictable, we intentionally keep prompt editing restricted.

**When will it open?** Once the ecosystem matures and we understand the community's needs better, we will open up the prompt layer for community contributions and custom Butler personas.

### Dependencies

Before adding new dependencies:

1. Check if we already have something similar
2. Verify the license is compatible with AGPL-3.0
3. Open an issue to discuss first
4. Avoid breaking changes or major version jumps

### Code Review Process

1. **Automated checks**: GitHub Actions runs tests and linting
2. **Maintainer review**: We review for philosophy alignment and code quality
3. **Feedback**: We may request changes
4. **Merge**: Once approved, maintainers will merge

---

## Getting Help

**Questions about contributing?**
- Open a discussion: [GitHub Discussions](https://github.com/9Churze/ElseID/discussions)
- Email: See repository maintainers

**Need guidance on a feature?**
- Open an issue and describe your idea
- Wait for feedback before coding

**Stuck on something technical?**
- Check existing issues and PRs
- Ask in Discussions
- Review the docs

---

## Recognition

We recognize all contributors:
- Listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md)
- Mentioned in release notes
- GitHub contributor graph
- Special badges for consistent contributors

---

Thank you for building ElseID with us! 🛸

*"Let every encounter become a light in the digital wilderness."*
