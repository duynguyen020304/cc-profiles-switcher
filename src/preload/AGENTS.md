# AGENTS.md

<!-- Parent: ../AGENTS.md -->

Preload scripts - context bridge exposing safe APIs to renderer.

## Overview

The preload script runs in an isolated context between the main process and renderer process. It uses Electron's `contextBridge` API to safely expose a limited set of IPC methods to the renderer, preventing direct access to Node.js and Electron APIs from the web content.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Exposes `ccProfiles` API via contextBridge |

## Exposed API

The preload script exposes `window.ccProfiles` to the renderer with the following methods:

### Data Fetching

| Method | Returns | Description |
|--------|---------|-------------|
| `getProfiles()` | `Promise<Profile[]>` | Get all discovered profiles from SQLite |
| `getActiveProfile()` | `Promise<Profile \| null>` | Get the currently active profile |
| `getSwitchHistory()` | `Promise<SwitchHistoryEntry[]>` | Get recent switch history entries |

### Actions

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `switchProfile(profileId)` | `string` | `Promise<{ success: boolean; error?: string }>` | Switch to a different profile |
| `refreshProfiles()` | - | `Promise<Profile[]>` | Rescan `~/.claude/` directory for profiles |

### Event Subscriptions

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `onProfileSwitched(callback)` | `(profile: Profile) => void` | `() => void` | Subscribe to profile switch events, returns unsubscribe function |
| `onProfilesChanged(callback)` | `(profiles: Profile[]) => void` | `() => void` | Subscribe to profiles-changed events, returns unsubscribe function |

## Type Definitions

Types are defined in `../renderer/types/profile.ts`:

- `Profile` - Profile data structure
- `SwitchHistoryEntry` - History record structure
- `CCProfilesAPI` - Interface for the exposed API

## For AI Agents

- **Security First**: Always use `contextBridge` to expose APIs - never expose `ipcRenderer` or Node.js modules directly
- **Minimal Surface Area**: Only expose methods the renderer actually needs
- **Type Safety**: Import types from `../renderer/types/profile.ts` to ensure main/renderer type consistency
- **Event Pattern**: Event subscriptions return cleanup functions for proper memory management
- **IPC Channels**: Main process handlers are in `src/main/ipc.ts`

## Architecture

```
Main Process                Preload                 Renderer
    │                          │                        │
    │  ipcMain.handle()        │                        │
    │ ◄─────────────────────   │                        │
    │                          │  contextBridge         │
    │                          │  .exposeInMainWorld()  │
    │                          │ ──────────────────────►│
    │                          │                        │
    │                          │   window.ccProfiles    │
    │                          │ ◄──────────────────────│
    │  ipcRenderer.invoke()    │                        │
    │ ◄─────────────────────── │                        │
    │                          │                        │
```

The preload script acts as a secure bridge, allowing the renderer to communicate with the main process through a controlled API.