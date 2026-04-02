# AGENTS.md

<!-- Parent: ../AGENTS.md -->

Test fixtures and mock data for E2E tests.

## Overview

Fixtures are mock Claude Code `settings.json` profiles used by E2E tests for isolated testing. Each fixture simulates a different profile configuration with distinct API endpoints and tokens.

## Key Files

| File | Purpose |
|------|---------|
| `settings.json` | Default/base profile with `default.api.example.com` |
| `settings_fixture_alpha.json` | Alpha profile with `alpha.example.com` base URL |
| `settings_fixture_beta.json` | Beta profile with `beta.example.com` base URL |

## Fixture Structure

Each fixture is a valid Claude Code `settings.json` with:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "<profile-specific-url>",
    "ANTHROPIC_AUTH_TOKEN": "<profile-specific-token>",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "<model>",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "<model>",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "<model>"
  }
}
```

### Profile Details

| Profile | Base URL | Token Prefix | Models |
|---------|----------|--------------|--------|
| default | `default.api.example.com` | `default-token` | N/A |
| alpha | `alpha.example.com` | `alpha-token` | `alpha-model` |
| beta | `beta.example.com` | `beta-token` | `beta-model` |

## For AI Agents

- **Purpose**: Fixtures simulate Claude Code profiles for E2E testing
- **Usage**: Loaded via `CLAUDE_DIR_OVERRIDE` environment variable
- **Isolation**: Each fixture provides a distinct profile for switch testing
- **Tokens**: Use fake tokens (format: `{profile}-token-1234567890`) - never real credentials
- **Do NOT modify**: These are test fixtures; changes may break E2E tests
- **Extension**: Add new profiles by creating `settings_fixture_{name}.json` following the established pattern