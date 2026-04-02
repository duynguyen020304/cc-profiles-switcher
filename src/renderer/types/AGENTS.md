<!-- Parent: ../AGENTS.md -->

# src/renderer/types - TypeScript Type Definitions

TypeScript type definitions for profiles, API interfaces, and history entries. These types are shared between the main process (via preload) and renderer process.

## Directory Structure

```
types/
  profile.ts    # Profile, SwitchHistoryEntry, CCProfilesAPI types
```

## Types

### Profile

Core profile data structure representing a Claude Code configuration profile.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (derived from filename) |
| `filename` | `string` | Profile JSON filename on disk |
| `displayName` | `string` | Human-readable profile name |
| `baseUrl` | `string \| null` | API base URL (null for default) |
| `authTokenHint` | `string \| null` | Masked auth token for display |
| `modelHaiku` | `string \| null` | Configured Haiku model ID |
| `modelSonnet` | `string \| null` | Configured Sonnet model ID |
| `modelOpus` | `string \| null` | Configured Opus model ID |
| `rawJson` | `string` | Full JSON content for debugging |
| `lastSeen` | `number` | Unix timestamp of last access |
| `createdAt` | `number` | Unix timestamp of profile creation |

### SwitchHistoryEntry

Records profile switch operations for audit trail.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique entry ID |
| `fromProfileId` | `string \| null` | Previous profile ID (null if first switch) |
| `toProfileId` | `string` | Target profile ID |
| `switchedAt` | `number` | Unix timestamp of switch |
| `success` | `number` | Success flag (1 = success, 0 = failure) |

### CCProfilesAPI

API interface exposed via `contextBridge` in preload script. All methods return Promises; event subscriptions return cleanup functions.

| Method | Returns | Description |
|--------|---------|-------------|
| `getProfiles()` | `Promise<Profile[]>` | List all available profiles |
| `getActiveProfile()` | `Promise<Profile \| null>` | Get currently active profile |
| `switchProfile(id)` | `Promise<{ success: boolean; error?: string }>` | Switch to specified profile |
| `refreshProfiles()` | `Promise<Profile[]>` | Rescan profiles directory |
| `getSwitchHistory()` | `Promise<SwitchHistoryEntry[]>` | Get switch history log |
| `onProfileSwitched(cb)` | `() => void` | Subscribe to profile switch events |
| `onProfilesChanged(cb)` | `() => void` | Subscribe to profile list changes |

### Window.ccProfiles

Global type extension for renderer access to the API.

```typescript
declare global {
  interface Window {
    ccProfiles: CCProfilesAPI
  }
}
```

## For AI Agents

- **Shared types**: These types mirror the main process types in `src/main/profile-loader.ts`
- **Null safety**: Many fields are nullable (`string | null`) - always handle null cases
- **Timestamps**: All timestamps are Unix epoch milliseconds (`number`)
- **Immutability**: Profile objects should be treated as immutable in React components

### Adding New Type

1. Add to `profile.ts` or create new file in `types/`
2. Export from `profile.ts` if creating new file
3. Update parent `AGENTS.md` to reference new type

### Modifying Profile Interface

When modifying `Profile` interface:
1. Update `src/renderer/types/profile.ts`
2. Update `src/main/profile-loader.ts` to match
3. Update preload API if new fields need IPC exposure
4. Update components using the changed fields

### Usage in Components

```typescript
import type { Profile, CCProfilesAPI } from '../types/profile'

// Access API via window
const profiles = await window.ccProfiles.getProfiles()

// Type event handlers
const handleSwitch = (profile: Profile) => {
  console.log('Switched to:', profile.displayName)
}
```