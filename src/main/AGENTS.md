<!-- Parent: ../AGENTS.md -->

# main - Electron Main Process

Electron main process handling backend logic, IPC communication, SQLite database, and auto-updater.

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Main entry point, BrowserWindow creation, app lifecycle, auto-updater |
| `ipc.ts` | IPC handlers registration/cleanup, 5 handle channels + 2 event channels |
| `db.ts` | SQLite database operations via better-sqlite3 (synchronous API) |
| `profileManager.ts` | Profile discovery, validation, merging, settings.json file I/O |

## Architecture

The main process runs Node.js APIs and communicates with the renderer via IPC. It cannot directly access renderer DOM or React state.

```
Renderer (React UI)          Main Process (Node.js)
       |                            |
       v                            v
window.ccProfiles API    <--IPC-->  ipc.ts handlers
       |                            |
       |                    db.ts (SQLite)
       |                            |
       |                 profileManager.ts
       |                            |
       |                     ~/.claude/*.json
```

## IPC Channels

Registered in `ipc.ts` via `ipcMain.handle()`:

| Channel | Handler | Returns | Description |
|---------|---------|---------|-------------|
| `profiles:get` | `getAllProfiles()` | `Profile[]` | Fetch all profiles from DB |
| `profiles:getActive` | `getProfileById()` | `Profile \| null` | Get currently active profile |
| `profiles:refresh` | `discoverProfiles()` + `upsertProfile()` | `Profile[]` | Scan ~/.claude/, update DB, broadcast changes |
| `profiles:switch` | `mergeAndWriteProfile()` | `{ success, error? }` | Write profile env to settings.json |
| `profiles:history` | `getSwitchHistory()` | `SwitchHistoryEntry[]` | Recent switch history (default 20 entries) |

Event channels (main -> renderer, sent via `win.webContents.send()`):

| Channel | When Sent | Payload |
|---------|-----------|---------|
| `profile:switched` | After successful profile switch | `Profile` object |
| `profiles:changed` | After profile refresh/discovery | `Profile[]` array |

## Database Schema

SQLite database stored at `{userData}/cc-profiles.db`. Uses WAL mode for concurrent read performance.

### profiles table

```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,           -- SHA-256 hash of filename (first 16 chars)
  filename TEXT NOT NULL,        -- Original filename (e.g., "settings_alibaba.json")
  display_name TEXT NOT NULL,    -- Human-readable name (e.g., "alibaba")
  base_url TEXT,                 -- ANTHROPIC_BASE_URL value
  auth_token_hint TEXT,          -- First 8 chars + "..." for security
  model_haiku TEXT,              -- ANTHROPIC_DEFAULT_HAIKU_MODEL
  model_sonnet TEXT,             -- ANTHROPIC_DEFAULT_SONNET_MODEL
  model_opus TEXT,               -- ANTHROPIC_DEFAULT_OPUS_MODEL
  raw_json TEXT NOT NULL,        -- Full JSON content for merge operations
  last_seen INTEGER NOT NULL,    -- Unix timestamp of last discovery
  created_at INTEGER NOT NULL    -- Unix timestamp of first discovery
);
```

### app_state table

Single-row table for app-wide state:

```sql
CREATE TABLE app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  active_profile_id TEXT,        -- Currently active profile ID
  last_switched INTEGER,         -- Timestamp of last successful switch
  settings_json_hash TEXT        -- SHA-256 hash of settings.json (change detection)
);
```

### switch_history table

```sql
CREATE TABLE switch_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_profile_id TEXT,          -- Previous profile ID (null if first switch)
  to_profile_id TEXT NOT NULL,   -- Target profile ID
  switched_at INTEGER NOT NULL,  -- Unix timestamp
  success INTEGER NOT NULL DEFAULT 1  -- 1 = success, 0 = failed
);
```

## Database Operations

`db.ts` exports synchronous functions (better-sqlite3 is synchronous):

```typescript
initDb()                    // Initialize database, create tables
upsertProfile(profile)      // Insert or update profile (ON CONFLICT)
getAllProfiles()            // Returns Profile[] sorted by display_name
getProfileById(id)          // Returns Profile or null
setActiveProfile(id)        // Update app_state.active_profile_id
getActiveProfileId()        // Returns current profile ID or null
logSwitchHistory(from, to, success)  // Insert history entry
getSwitchHistory(limit)     // Returns SwitchHistoryEntry[]
closeDb()                   // Close database connection
```

## Profile Discovery

`profileManager.ts` scans `~/.claude/` (or `CLAUDE_DIR_OVERRIDE` env var) for valid profile files.

### Discovery Logic

1. Read all `.json` files in `CLAUDE_DIR`
2. Skip `settings.json` and `settings.local.json`
3. Parse each file, validate it contains `env` with known keys
4. Extract metadata: baseUrl, authTokenHint, model names
5. Generate deterministic ID via SHA-256 hash of filename
6. Return array ready for database insertion

### Valid Profile Criteria

A valid profile must have an `env` object containing at least one of:

```typescript
ANTHROPIC_BASE_URL
ANTHROPIC_AUTH_TOKEN
ANTHROPIC_DEFAULT_HAIKU_MODEL
ANTHROPIC_DEFAULT_SONNET_MODEL
ANTHROPIC_DEFAULT_OPUS_MODEL
```

### Display Name Derivation

```typescript
// settings_alibaba.json       -> "alibaba"
// settings_glm.json           -> "glm"
// settings_alibaba_qwen35.json -> "alibaba / qwen35"
deriveDisplayName(filename) => string
```

### Profile Merge Strategy

When switching profiles (`mergeAndWriteProfile()`):

1. Read current `settings.json` as base
2. Deep merge `env` keys from profile into base
3. Shallow merge other top-level keys from profile
4. Atomic write: write to `.tmp` file, then rename

## Auto-Updater

Only runs in production (when `ELECTRON_RENDERER_URL` is undefined). Development mode skips auto-updater entirely.

Configuration in `index.ts`:

```typescript
autoUpdater.allowDowngrade = false     // Security: prevent downgrade attacks
autoUpdater.allowPrerelease = false    // Only stable releases
```

Update flow:

1. Check for updates on app ready
2. Download update silently in background
3. Prompt user to restart when download complete
4. Install on restart or next launch

## Window Configuration

BrowserWindow created in `createWindow()`:

```typescript
{
  width: 420,
  height: 560,
  minWidth: 360,
  minHeight: 400,
  frame: false,            // Frameless window
  alwaysOnTop: true,       // Stay above other windows
  backgroundColor: '#0d0d0d',
  contextIsolation: true,  // Security: isolate preload context
  nodeIntegration: false,  // Security: no Node.js in renderer
  devTools: true           // Allow DevTools in production
}
```

External links open in OS default browser via `setWindowOpenHandler`.

## AI Agent Instructions

### When modifying main process code

1. **IPC handlers** - Add to `registerIpcHandlers()` in `ipc.ts`, cleanup in `unregisterIpcHandlers()`
2. **Database operations** - Add to `db.ts`, use prepared statements, handle null cases
3. **Profile logic** - Add to `profileManager.ts`, handle file I/O errors gracefully
4. **App lifecycle** - Modify `index.ts`, use Electron app events

### Adding new IPC channel

1. Add handler in `ipc.ts`:
   ```typescript
   ipcMain.handle('channel:name', (event, arg) => {
     // Call db.ts or profileManager.ts function
     return result
   })
   ```
2. Add cleanup in `unregisterIpcHandlers()`
3. Expose in preload script (`preload/index.ts`)
4. Add type in `renderer/types/profile.ts`

### Database best practices

- Use `initDb()` to ensure database is initialized before operations
- All operations are synchronous (no async/await)
- Use prepared statements via `db.prepare()` for repeated operations
- Handle `null` returns from `getProfileById()`

### Error handling patterns

```typescript
// File I/O - return result object
try {
  fs.writeFileSync(...)
  return { success: true }
} catch (err) {
  return { success: false, error: err.message }
}

// Profile discovery - skip silently, log warning
try {
  // parse JSON
} catch (err) {
  console.warn(`Skipping invalid profile ${filename}:`, err)
  continue
}
```

### Testing considerations

- Use `CLAUDE_DIR_OVERRIDE` env var to test with mock directory
- Database can be inspected at `{userData}/cc-profiles.db`
- Auto-updater logic only tested in production builds