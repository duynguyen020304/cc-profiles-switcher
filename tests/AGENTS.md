# Tests Directory

<!-- Parent: ../AGENTS.md -->

Test suites organized by type (unit, e2e).

## Subdirectories

| Directory | Description |
|-----------|-------------|
| `unit/` | Unit tests for main process and renderer |
| `e2e/` | End-to-end tests (Playwright MCP-driven) |
| `e2e/fixtures/` | Test fixtures and mock settings files |

## Key Files

### Unit Tests (`tests/unit/`)

| File | Scope | Mocking Strategy |
|------|-------|------------------|
| `ProfileCard.test.tsx` | Renderer component | `@testing-library/react` with mocked props |
| `useProfiles.test.ts` | Renderer hook | `window.ccProfiles` API mock |
| `profileManager.test.ts` | Main process | Mocked `fs`, `os`, `crypto` modules |
| `db.test.ts` | Main process database | `sql.js` as in-memory `better-sqlite3` mock |

### E2E Tests (`tests/e2e/`)

| File | Description |
|------|-------------|
| `app.spec.ts` | Playwright MCP test specifications (NOT npm-executed) |
| `run_e2e.py` | Python runner for e2e test execution |
| `fixtures/*.json` | Mock Claude settings files for testing |

## Testing Framework

**Vitest** (v3.2.4) with jsdom environment.

### Commands

```bash
npm run test          # Run all unit tests once
npm run test:watch    # Run tests in watch mode
```

### Configuration

- Config file: `vite.config.mts`
- Path alias: `@/` resolves to `./src`
- Environment: jsdom
- Test pattern: `tests/unit/**/*.test.{ts,tsx}`
- Globals enabled (no need to import `describe`, `it`, `expect`)

## AI Agent Instructions

### Adding New Tests

1. **All new features require corresponding tests** before merging.
2. Place unit tests in `tests/unit/` matching the source module path.
3. Use `.test.ts` for logic tests, `.test.tsx` for component tests.

### Component Testing Pattern

Use `@testing-library/react` for renderer component tests:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import Component from '@/renderer/components/Component'

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component {...mockProps} />)
    expect(screen.getByTestId('component-root')).toBeInTheDocument()
  })
})
```

### Mocking Electron IPC

Renderer tests must mock `window.ccProfiles` API (preload bridge):

```typescript
beforeEach(() => {
  Object.defineProperty(window, 'ccProfiles', {
    value: {
      getProfiles: vi.fn().mockResolvedValue([]),
      refreshProfiles: vi.fn().mockResolvedValue([]),
      switchProfile: vi.fn().mockResolvedValue({ success: true }),
      onProfilesChanged: vi.fn(() => vi.fn()),
      // ... other API methods
    },
    writable: true,
    configurable: true
  })
})
```

### Main Process Testing Pattern

Mock Node.js modules and Electron APIs:

```typescript
vi.mock('fs', () => ({
  default: { readFileSync: vi.fn(), writeFileSync: vi.fn() },
  readFileSync: vi.fn(),
  writeFileSync: vi.fn()
}))

vi.mock('electron', () => ({
  app: { getPath: () => ':memory:' }
}))
```

For database tests, use `sql.js` as an in-memory SQLite replacement for `better-sqlite3`.

### E2E Testing

E2E tests are **Playwright MCP-driven**, not executed via `@playwright/test`.

Prerequisites:
1. Build completed: `npm run build`
2. App launched with `CLAUDE_DIR_OVERRIDE=tests/e2e/fixtures/`
3. Electron window visible with title "CC Profiles"

Tests execute via MCP tool calls against the running application window.

### Test Data IDs

Components use `data-testid` attributes for reliable test selectors:
- Profile cards: `profile-card-{id}`
- Active indicator: `profile-card-{id}-active-dot`
- Base URL display: `profile-card-{id}-base-url`
- Switch spinner: `switch-spinner-{id}`
- Error display: `switch-error-{id}`