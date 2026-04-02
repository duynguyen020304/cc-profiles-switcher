# AGENTS.md

<!-- Parent: ../AGENTS.md -->

End-to-end tests for the Claude Code Profile Switcher Electron application.

## Overview

E2E tests verify the full application stack: Electron main process, IPC communication, and React renderer UI. Tests are executed via Playwright MCP tool calls against a running Electron window, not through `@playwright/test`.

## Prerequisites

Before running E2E tests:

1. **Build the application first**:
   ```bash
   npm run build
   ```

2. **Install Playwright Python package** (for Python runner):
   ```bash
   pip install playwright
   playwright install chromium
   ```

## Running Tests

### Strategy A: Connect to Running App

Launch the app with remote debugging enabled, then connect:

```bash
npm run build
npx electron . --remote-debugging-port=9222
python tests/e2e/run_e2e.py
```

### Strategy B: Auto-Launch Mode

The Python runner (`run_e2e.py`) automatically attempts multiple connection strategies:

1. CDP connection to existing instance on port 9222
2. Port scan (9222-9229) for running Electron instances
3. Launch Electron subprocess with debugging port
4. Fallback to `file://` protocol with mock IPC

```bash
npm run build
python tests/e2e/run_e2e.py
```

## Test Specifications

Test specs are defined in `app.spec.ts` as TypeScript constants. They describe test steps for manual/Playwright MCP execution:

| Test ID | Name | Purpose |
|---------|------|---------|
| test-1 | App launches and renders profile list | Verifies initial UI state |
| test-2 | Profile cards display correct metadata | Validates fixture data rendering |
| test-3 | Switch profile updates active state | Tests profile switch to alpha |
| test-4 | Switch to second profile | Tests profile switch to beta |
| test-5 | Refresh button rescans profiles | Tests refresh functionality |
| test-6 | Active profile detail shows model mappings | Validates model row display |

## Test Fixtures

Fixture files in `fixtures/` simulate Claude Code settings profiles:

| File | Purpose |
|------|---------|
| `settings.json` | Default/base profile |
| `settings_fixture_alpha.json` | Alpha profile with `alpha.example.com` base URL |
| `settings_fixture_beta.json` | Beta profile with `beta.example.com` base URL |

Fixtures are loaded via `CLAUDE_DIR_OVERRIDE` environment variable.

## Key Files

| File | Purpose |
|------|---------|
| `app.spec.ts` | Test specification definitions (TypeScript) |
| `run_e2e.py` | Python Playwright test runner |
| `fixtures/*.json` | Mock Claude Code settings profiles |
| `initial-state.png` | Diagnostic screenshot at test start |
| `final-state.png` | Diagnostic screenshot at test end |
| `initial-dom.html` | DOM capture for debugging |

## data-testid Reference

UI elements use `data-testid` attributes for reliable test targeting:

- `profile-list` - Main profile list container
- `profile-card-{id}-*` - Profile card elements (base-url, switch, active-dot)
- `active-profile-detail` - Active profile detail panel
- `active-profile-name` - Active profile name display
- `model-row-{type}` - Model mapping rows (haiku, sonnet, opus, base-url)
- `switch-spinner-{id}` - Loading spinner during profile switch
- `refresh-button` - Profile refresh button

## For AI Agents

- **CRITICAL**: Run `npm run build` before any E2E test execution
- Tests use Playwright MCP, not `@playwright/test` npm package
- Python runner handles multiple connection strategies automatically
- Fixtures override `CLAUDE_DIR_OVERRIDE` for isolated test environment
- Test specs in `app.spec.ts` are documentation/specs, not executable test code
- All assertions use `data-testid` selectors for stability
- Mock IPC fallback allows testing renderer without full Electron process