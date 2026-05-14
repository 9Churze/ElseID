# Security Policy

ElseID is local-first software that handles local cryptographic identities, SQLite journey logs, and Nostr events. Security reports are taken seriously.

## Supported Versions

Before the first stable release, only the `main` branch is supported for security fixes.

## Reporting a Vulnerability

Please use GitHub private vulnerability reporting or GitHub Security Advisories for this repository.

If private reporting is unavailable, open a minimal public issue that says you have a security report, but do not include exploit details, private keys, precise location data, or user-identifying information. A maintainer will move the discussion to a private channel.

## Scope

High-priority issues include:

- private key exposure or unsafe key export paths
- precise location leakage
- identity or drifter state corruption
- forged or replayed feeding flows that harm host identity
- local database corruption or migration failures
- content moderation bypasses that leak contact information or PII

## Expectations

Please give us reasonable time to investigate before public disclosure. We will acknowledge reports as soon as practical and prioritize fixes that protect user identity, privacy, and local data integrity.
