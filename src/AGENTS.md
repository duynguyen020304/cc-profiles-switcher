<!-- Parent: ../AGENTS.md -->

# src - Application Source Code

Application source code organized by Electron process architecture.

## Directory Structure

```
src/
  main/      # Electron main process (backend, IPC, database)
  preload/   # Context bridge between main and renderer
  renderer/  # Frontend UI (React components, hooks, styles)
```

## Process Architecture

| Process | Directory | Responsibility |
|---------|-----------|----------------|
| Main | `main/` | Backend logic, IPC handlers, SQLite database, profile management |
| Preload | `preload/` | Secure API bridge exposed to renderer via contextBridge |
| Renderer | `renderer/` | React UI components, hooks, styles, TypeScript types |

## Security Configuration

This app follows Electron security best practices (configured in `main/index.ts`):

- `contextIsolation: true` - Isolates JavaScript context between preload and renderer
- `nodeIntegration: false` - Prevents renderer from accessing Node.js APIs directly
- External links open in OS default browser via `setWindowOpenHandler`

## IPC Channels

All IPC handlers are registered in `main/ipc.ts`. Available channels:

| Channel | Direction | Description |
|---------|-----------|-------------|
| `profiles:get` | renderer -> main | Get all discovered profiles |
| `profiles:getActive` | renderer -> main | Get currently active profile |
| `profiles:refresh` | renderer -> main | Rescan ~/.claude/ and update DB |
| `profiles:switch` | renderer -> main | Switch to specified profile |
| `profiles:history` | renderer -> main | Get recent switch history |
| `profile:switched` | main -> renderer | Event: profile was switched |
| `profiles:changed` | main -> renderer | Event: profiles list changed |

## Renderer API

The preload script (`preload/index.ts`) exposes `window.ccProfiles` with methods:

- `getProfiles()` - Returns all Profile objects
- `getActiveProfile()` - Returns active Profile or null
- `switchProfile(profileId)` - Switch to profile by ID
- `refreshProfiles()` - Trigger profile discovery
- `getSwitchHistory()` - Get SwitchHistoryEntry array
- `onProfileSwitched(callback)` - Subscribe to switch events, returns unsubscribe function
- `onProfilesChanged(callback)` - Subscribe to list changes, returns unsubscribe function

## Type Definitions

Shared types in `renderer/types/profile.ts`:

- `Profile` - Profile data structure
- `SwitchHistoryEntry` - History log entry
- `CCProfilesAPI` - API interface exposed via contextBridge

## AI Agent Instructions

When modifying code in this directory:

1. **IPC handlers** go in `main/ipc.ts` - use `ipcMain.handle()` for async operations
2. **React components** go in `renderer/components/` - use TypeScript, follow existing patterns
3. **Custom hooks** go in `renderer/hooks/` - wrap `window.ccProfiles` API calls
4. **Database operations** go in `main/db.ts` - SQLite operations only
5. **Profile logic** goes in `main/profileManager.ts` - discovery, merging, file I/O

### Adding New IPC Channel

1. Add handler in `main/ipc.ts` under `registerIpcHandlers()`
2. Add cleanup in `unregisterIpcHandlers()`
3. Add method in `preload/index.ts` via `contextBridge`
4. Add type definition in `renderer/types/profile.ts`

### Adding New React Component

1. Create in `renderer/components/`
2. Import types from `../types/profile`
3. Use hooks from `../hooks/` for API access
4. Never access `window.ccProfiles` directly in components - use hooks