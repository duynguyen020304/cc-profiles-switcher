<!-- Parent: ../AGENTS.md -->

# src/renderer - Frontend UI

Frontend UI for the profile switcher widget. React components, hooks, styles, and TypeScript type definitions running in the Electron renderer process.

## Directory Structure

```
renderer/
  App.tsx              # Main React component
  main.tsx             # React entry point
  index.html           # HTML template
  components/          # React UI components
    TopBar.tsx         # Window title bar with controls
    ProfileCard.tsx    # Individual profile card
    ProfileList.tsx    # Scrollable profile list container
    ActiveProfileDetail.tsx  # Active profile info panel
    ModelMappingRow.tsx      # Model/base URL display row
  hooks/               # Custom React hooks
    useProfiles.ts     # Profile loading and refresh
    useActiveProfile.ts # Active profile state and switching
  styles/              # CSS styles
    globals.css        # Global styles, scrollbar, animations
  types/               # TypeScript type definitions
    profile.ts         # Profile, API, and history types
```

## Key Files

### Entry Points

| File | Purpose |
|------|---------|
| `index.html` | HTML template with CSP, dark background, JetBrains Mono font |
| `main.tsx` | React entry - renders `<App />` into `#root` with StrictMode |
| `App.tsx` | Main component - orchestrates TopBar, ProfileList, ActiveProfileDetail |

### Components

| Component | Description |
|-----------|-------------|
| `TopBar` | Frameless window title bar: app icon, title, refresh/minimize/close buttons |
| `ProfileList` | Scrollable list of ProfileCard components, empty state handling |
| `ProfileCard` | Clickable profile entry with active indicator, display name, base URL, switch button |
| `ActiveProfileDetail` | Bottom panel showing active profile's model mappings and base URL |
| `ModelMappingRow` | Label/value row for Haiku, Sonnet, Opus, Base URL display |

### Hooks

| Hook | Returns | Purpose |
|------|---------|---------|
| `useProfiles` | `{ profiles, loading, error, refresh }` | Load profiles via `window.ccProfiles.refreshProfiles()` |
| `useActiveProfile` | `{ activeProfile, switchingId, switchErrors, switchToProfile }` | Track active profile, handle switching |

### Types

| Type | Description |
|------|-------------|
| `Profile` | Profile data: id, filename, displayName, baseUrl, model mappings, timestamps |
| `SwitchHistoryEntry` | Switch log: from/to profile IDs, timestamp, success flag |
| `CCProfilesAPI` | API interface exposed by preload contextBridge |
| `Window.ccProfiles` | Global type extension for renderer API access |

## IPC API Access

Renderer communicates with main process via `window.ccProfiles` API exposed by preload script:

```typescript
// Available methods
window.ccProfiles.getProfiles()           // Promise<Profile[]>
window.ccProfiles.getActiveProfile()      // Promise<Profile | null>
window.ccProfiles.switchProfile(id)       // Promise<{ success, error? }>
window.ccProfiles.refreshProfiles()       // Promise<Profile[]>
window.ccProfiles.getSwitchHistory()      // Promise<SwitchHistoryEntry[]>

// Event subscriptions (return cleanup functions)
window.ccProfiles.onProfileSwitched(cb)   // (profile: Profile) => void
window.ccProfiles.onProfilesChanged(cb)   // (profiles: Profile[]) => void
```

## Styling

- Dark terminal aesthetic: `#0d0d0d` background, `#e5e5e5` text
- Monospace font: JetBrains Mono (primary), Fira Code, Consolas fallback
- Accent color: `#f97316` (orange) for active states, buttons
- Frameless window: `WebkitAppRegion: 'drag'` on TopBar, `'no-drag'` on buttons
- Custom scrollbar: thin, semi-transparent

## For AI Agents

- **TypeScript strict mode**: All components use explicit types, no `any`
- **Use hooks for API access**: Never call `window.ccProfiles` directly in components
- **Frameless window**: TopBar uses `WebkitAppRegion: 'drag'`, interactive elements use `'no-drag'`
- **Test IDs**: Components include `data-testid` attributes for testing
- **Inline styles**: Components use inline style objects (no CSS modules)
- **Keyboard accessibility**: ProfileCard supports Enter/Space to switch

### Adding New Component

1. Create file in `components/`
2. Define Props interface with explicit types
3. Use `data-testid` for testable elements
4. Import types from `../types/profile`
5. Use hooks from `../hooks/` for state/API

### Adding New Hook

1. Create file in `hooks/`
2. Define return interface
3. Wrap `window.ccProfiles` methods with error handling
4. Use `useCallback` for API calls, `useEffect` for subscriptions
5. Return cleanup function for event subscriptions