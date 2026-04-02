<!-- Parent: ../AGENTS.md -->

# src/renderer/hooks - Custom React Hooks

Custom React hooks for state management and IPC communication with the main process. These hooks encapsulate all renderer-to-main communication via the `window.ccProfiles` API.

## Files

| File | Purpose |
|------|---------|
| `useProfiles.ts` | Profile list loading, refresh, and change subscription |
| `useActiveProfile.ts` | Active profile state, switching, and error handling |

## useProfiles

Manages profile list state with loading and error handling.

```typescript
interface UseProfilesReturn {
  profiles: Profile[]      // Array of available profiles
  loading: boolean         // True during initial load
  error: string | null     // Error message if load failed
  refresh: () => Promise<void>  // Manually refresh profile list
}
```

### Usage

```typescript
const { profiles, loading, error, refresh } = useProfiles()
```

### Behavior

1. On mount: calls `window.ccProfiles.refreshProfiles()` to load profiles
2. Subscribes to `window.ccProfiles.onProfilesChanged` for real-time updates
3. Cleanup: unsubscribes from events on unmount
4. Error handling: catches and exposes errors in `error` state

## useActiveProfile

Tracks active profile and handles profile switching with loading states.

```typescript
interface UseActiveProfileReturn {
  activeProfile: Profile | null      // Currently active profile
  switchingId: string | null         // Profile ID currently being switched
  switchErrors: Record<string, string | null>  // Errors keyed by profile ID
  switchToProfile: (profileId: string) => Promise<void>  // Switch to profile
}
```

### Usage

```typescript
const { activeProfile, switchingId, switchErrors, switchToProfile } = useActiveProfile(profiles)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `profiles` | `Profile[]` | Array of profiles (for resolving active profile) |

### Behavior

1. On mount: calls `window.ccProfiles.getActiveProfile()` to load current active
2. Subscribes to `window.ccProfiles.onProfileSwitched` for switch events
3. `switchToProfile(id)`: calls `window.ccProfiles.switchProfile(id)` with loading state
4. Tracks switching progress in `switchingId` (null when complete)
5. Captures per-profile errors in `switchErrors` record

## For AI Agents

- **All IPC calls go through hooks**: Components should never call `window.ccProfiles` directly
- **useState + useEffect pattern**: Hooks use standard React state and effect hooks
- **useCallback for API calls**: Prevents unnecessary re-renders and effect re-runs
- **Return cleanup functions**: Event subscriptions return cleanup for proper unmounting
- **Error handling**: Both hooks catch errors and expose them in state

### Adding a New Hook

1. Create file in `hooks/` directory
2. Define return interface with explicit types
3. Import types from `../types/profile`
4. Wrap `window.ccProfiles` methods with try/catch
5. Use `useCallback` for API call functions
6. Use `useEffect` for subscriptions with cleanup return
7. Export from hooks directory

### Hook Dependencies

Both hooks depend on the `window.ccProfiles` API exposed by preload:

```typescript
// Available in hooks via window.ccProfiles
getActiveProfile(): Promise<Profile | null>
refreshProfiles(): Promise<Profile[]>
switchProfile(id: string): Promise<{ success: boolean; error?: string }>
onProfileSwitched(callback: (profile: Profile) => void): () => void
onProfilesChanged(callback: (profiles: Profile[]) => void): () => void
```