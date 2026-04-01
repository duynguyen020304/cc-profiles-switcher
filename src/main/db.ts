import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

function getDbPath(): string {
  return path.join(app.getPath('userData'), 'cc-profiles.db')
}

export function initDb(): Database.Database {
  if (db) return db

  db = new Database(getDbPath())
  
  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      display_name TEXT NOT NULL,
      base_url TEXT,
      auth_token_hint TEXT,
      model_haiku TEXT,
      model_sonnet TEXT,
      model_opus TEXT,
      raw_json TEXT NOT NULL,
      last_seen INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      active_profile_id TEXT,
      last_switched INTEGER,
      settings_json_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS switch_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_profile_id TEXT,
      to_profile_id TEXT NOT NULL,
      switched_at INTEGER NOT NULL,
      success INTEGER NOT NULL DEFAULT 1
    );
  `)

  // Ensure app_state has exactly one row
  const row = db.prepare('SELECT id FROM app_state WHERE id = 1').get()
  if (!row) {
    db.prepare(
      'INSERT INTO app_state (id, active_profile_id, last_switched, settings_json_hash) VALUES (1, NULL, NULL, NULL)'
    ).run()
  }

  return db
}

export function upsertProfile(profile: {
  id: string
  filename: string
  displayName: string
  baseUrl: string | null
  authTokenHint: string | null
  modelHaiku: string | null
  modelSonnet: string | null
  modelOpus: string | null
  rawJson: string
}): void {
  const database = initDb()
  const now = Date.now()
  database.prepare(`
    INSERT INTO profiles (id, filename, display_name, base_url, auth_token_hint, model_haiku, model_sonnet, model_opus, raw_json, last_seen, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      filename = excluded.filename,
      display_name = excluded.display_name,
      base_url = excluded.base_url,
      auth_token_hint = excluded.auth_token_hint,
      model_haiku = excluded.model_haiku,
      model_sonnet = excluded.model_sonnet,
      model_opus = excluded.model_opus,
      raw_json = excluded.raw_json,
      last_seen = excluded.last_seen
  `).run(
    profile.id,
    profile.filename,
    profile.displayName,
    profile.baseUrl,
    profile.authTokenHint,
    profile.modelHaiku,
    profile.modelSonnet,
    profile.modelOpus,
    profile.rawJson,
    now,
    now
  )
}

export function getAllProfiles(): import('../renderer/types/profile').Profile[] {
  const database = initDb()
  const rows = database.prepare(`
    SELECT 
      id, filename, display_name, base_url, auth_token_hint,
      model_haiku, model_sonnet, model_opus, raw_json, last_seen, created_at
    FROM profiles
    ORDER BY display_name ASC
  `).all() as Array<Record<string, unknown>>

  return rows.map(row => ({
    id: row.id as string,
    filename: row.filename as string,
    displayName: row.display_name as string,
    baseUrl: row.base_url as string | null,
    authTokenHint: row.auth_token_hint as string | null,
    modelHaiku: row.model_haiku as string | null,
    modelSonnet: row.model_sonnet as string | null,
    modelOpus: row.model_opus as string | null,
    rawJson: row.raw_json as string,
    lastSeen: row.last_seen as number,
    createdAt: row.created_at as number
  }))
}

export function getProfileById(id: string): import('../renderer/types/profile').Profile | null {
  const database = initDb()
  const row = database.prepare(`
    SELECT 
      id, filename, display_name, base_url, auth_token_hint,
      model_haiku, model_sonnet, model_opus, raw_json, last_seen, created_at
    FROM profiles WHERE id = ?
  `).get(id) as Record<string, unknown> | undefined

  if (!row) return null

  return {
    id: row.id as string,
    filename: row.filename as string,
    displayName: row.display_name as string,
    baseUrl: row.base_url as string | null,
    authTokenHint: row.auth_token_hint as string | null,
    modelHaiku: row.model_haiku as string | null,
    modelSonnet: row.model_sonnet as string | null,
    modelOpus: row.model_opus as string | null,
    rawJson: row.raw_json as string,
    lastSeen: row.last_seen as number,
    createdAt: row.created_at as number
  }
}

export function setActiveProfile(profileId: string | null): void {
  const database = initDb()
  database.prepare(`
    UPDATE app_state SET active_profile_id = ?, last_switched = ?
    WHERE id = 1
  `).run(profileId, Date.now())
}

export function getActiveProfileId(): string | null {
  const database = initDb()
  const row = database.prepare(
    'SELECT active_profile_id FROM app_state WHERE id = 1'
  ).get() as { active_profile_id?: string } | undefined

  return row?.active_profile_id ?? null
}

export function logSwitchHistory(fromProfileId: string | null, toProfileId: string, success: boolean): void {
  const database = initDb()
  database.prepare(`
    INSERT INTO switch_history (from_profile_id, to_profile_id, switched_at, success)
    VALUES (?, ?, ?, ?)
  `).run(fromProfileId, toProfileId, Date.now(), success ? 1 : 0)
}

export function getSwitchHistory(limit: number = 20): import('../renderer/types/profile').SwitchHistoryEntry[] {
  const database = initDb()
  const rows = database.prepare(`
    SELECT id, from_profile_id, to_profile_id, switched_at, success
    FROM switch_history
    ORDER BY switched_at DESC
    LIMIT ?
  `).all(limit) as Array<Record<string, unknown>>

  return rows.map(row => ({
    id: row.id as number,
    fromProfileId: row.from_profile_id as string | null,
    toProfileId: row.to_profile_id as string,
    switchedAt: row.switched_at as number,
    success: row.success as number
  }))
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
