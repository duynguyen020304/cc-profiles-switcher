# Unit Tests

<!-- Parent: ../AGENTS.md -->

Unit tests for main process and renderer components using Vitest and Testing Library.

## Running Tests

```bash
npm run test       # Run all tests once
npm run test:watch # Watch mode for development
```

## Test Files

| File | Purpose | Tests |
|------|---------|-------|
| `profileManager.test.ts` | Profile discovery and metadata extraction | 18 |
| `db.test.ts` | Database operations (SQLite) | 13 |
| `ProfileCard.test.tsx` | ProfileCard React component | 7 |
| `useProfiles.test.ts` | useProfiles React hook | 4 |

## Testing Patterns

### Vitest Configuration

- Test runner: Vitest v3.2.4
- Environment: jsdom for React component tests
- Path aliases: `@/` maps to `src/`

### Main Process Tests

Mock Node.js APIs with `vi.mock()`:

```typescript
vi.mock('fs', () => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  // ...
}))

vi.mock('os', () => ({
  homedir: () => '/home/testuser'
}))
```

For database tests, use sql.js as an in-memory SQLite replacement:

```typescript
vi.mock('better-sqlite3', async () => {
  const SqlJs = await initSqlJs()
  class MockDatabase {
    private db = new SqlJs.Database()
    // implement prepare, exec, etc.
  }
  return { default: MockDatabase }
})
```

### Renderer Tests

Mock Electron IPC via `window.ccProfiles`:

```typescript
Object.defineProperty(window, 'ccProfiles', {
  value: {
    getProfiles: vi.fn().mockResolvedValue([]),
    refreshProfiles: vi.fn().mockResolvedValue([]),
    onProfilesChanged: vi.fn(),
    // ...
  },
  writable: true,
  configurable: true
})
```

React components use `@testing-library/react`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

render(<ProfileCard profile={mockProfile} ... />)
expect(screen.getByText('Test Profile')).toBeInTheDocument()
fireEvent.click(screen.getByTestId('profile-card-id'))
```

React hooks use `renderHook` and `waitFor`:

```typescript
import { renderHook, waitFor, act } from '@testing-library/react'

const { result } = renderHook(() => useProfiles())
await waitFor(() => expect(result.current.loading).toBe(false))
await act(async () => { await result.current.refresh() })
```

## Mock Data

Standard mock profile object:

```typescript
const mockProfile: Profile = {
  id: 'test-profile-1',
  filename: 'settings_test.json',
  displayName: 'Test Profile',
  baseUrl: 'https://test-api.example.com',
  authTokenHint: 'sk-test12...',
  modelHaiku: 'test-haiku',
  modelSonnet: 'test-sonnet',
  modelOpus: 'test-opus',
  rawJson: '{}',
  lastSeen: Date.now(),
  createdAt: Date.now()
}
```

## Best Practices

1. Clear mocks between tests with `beforeEach(() => vi.clearAllMocks())`
2. Use `data-testid` attributes for reliable element selection
3. Test both success and error paths
4. Verify async operations with `waitFor()` or `act()`
5. Mock environment variables with `process.env.VAR = value` in `beforeEach`