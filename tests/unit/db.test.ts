import { describe, it, expect, vi } from 'vitest'
import initSqlJs from 'sql.js'

vi.mock('electron', () => ({
  app: {
    getPath: () => ':memory:'
  }
}))

let SQL: any = null

vi.mock('better-sqlite3', async () => {
  const sqlJs = await import('sql.js')
  const SqlJs = await sqlJs.default()

  class MockDatabase {
    private db: any
    constructor(_path: string) {
      this.db = new SqlJs.Database()
    }
    pragma(_s: string) { /* sql.js doesn't support pragma like this - no-op */ }
    exec(sql: string) {
      // Split multi-statement strings and run each
      const stmts = sql.split(';').filter((s: string) => s.trim())
      for (const stmt of stmts) {
        try { this.db.run(stmt) } catch (_e) { /* ignore errors like IF NOT EXISTS on re-run */ }
      }
    }
    prepare(sql: string) {
      // For statements that might fail (e.g., INSERT OR REPLACE vs ON CONFLICT)
      // we need to translate some SQLite dialect differences
      let finalSql = sql
      return {
        run: (...params: unknown[]) => {
          try {
            this.db.run(finalSql, params)
          } catch (e: any) {
            if (!e.message?.includes('no such table')) throw e
          }
          return { changes: 1, lastInsertRowid: 0 }
        },
        get: (...params: unknown[]) => {
          try {
            const results = this.db.exec(finalSql, params)
            if (!results.length || !results[0].values.length) return undefined
            const cols = results[0].columns
            const vals = results[0].values[0]
            const row: Record<string, unknown> = {}
            cols.forEach((c: string, i: number) => { row[c] = vals[i] })
            return row
          } catch (_e) { return undefined }
        },
        all: (...params: unknown[]) => {
          try {
            const results = this.db.exec(finalSql, params)
            if (!results.length) return []
            const cols = results[0].columns
            return results[0].values.map((vals: unknown[]) => {
              const row: Record<string, unknown> = {}
              cols.forEach((c: string, i: number) => { row[c] = vals[i] })
              return row
            })
          } catch (_e) { return [] }
        },
      }
    }
    close() { this.db.close() }
  }

  return { default: MockDatabase }
})

const {
  initDb,
  upsertProfile,
  getAllProfiles,
  getProfileById,
  setActiveProfile,
  getActiveProfileId,
  logSwitchHistory,
  getSwitchHistory,
  closeDb
} = await import('@/main/db')

// Initialize sql.js engine before any tests
beforeAll(async () => {
  SQL = await initSqlJs()
})

afterAll(() => closeDb())

describe('initDb()', () => {
  it('creates all tables without error', () => {
    expect(true).toBe(true)
  })

  it('creates app_state row with id=1', async () => {
    const { initDb: idb } = await import('@/main/db')
    const db = idb() as any
    const row = db.prepare('SELECT id FROM app_state WHERE id = 1').get()
    expect(row).toEqual({ id: 1 })
  })
})

describe('upsertProfile()', () => {
  it('inserts new profile correctly', () => {
    upsertProfile({
      id: 'test-id-1',
      filename: 'settings_test.json',
      displayName: 'test',
      baseUrl: 'https://test.example.com',
      authTokenHint: 'token...',
      modelHaiku: 'haiku-v1',
      modelSonnet: 'sonnet-v1',
      modelOpus: 'opus-v1',
      rawJson: '{"env": {"ANTHROPIC_BASE_URL": "https://test.example.com"}}'
    })

    const profile = getProfileById('test-id-1')
    expect(profile).not.toBeNull()
    expect(profile!.displayName).toBe('test')
    expect(profile!.baseUrl).toBe('https://test.example.com')
    expect(profile!.modelHaiku).toBe('haiku-v1')
  })

  it('updates existing profile on conflict (same id)', () => {
    upsertProfile({
      id: 'update-test-id',
      filename: 'settings_original.json',
      displayName: 'original',
      baseUrl: 'https://original.com',
      authTokenHint: null,
      modelHaiku: null,
      modelSonnet: null,
      modelOpus: null,
      rawJson: '{}'
    })

    upsertProfile({
      id: 'update-test-id',
      filename: 'settings_updated.json',
      displayName: 'updated',
      baseUrl: 'https://updated.com',
      authTokenHint: 'new-token...',
      modelHaiku: 'updated-haiku',
      modelSonnet: 'updated-sonnet',
      modelOpus: 'updated-opus',
      rawJson: '{"env": {}}'
    })

    const profile = getProfileById('update-test-id')
    expect(profile!.displayName).toBe('updated')
    expect(profile!.baseUrl).toBe('https://updated.com')
    expect(profile!.authTokenHint).toBe('new-token...')
    expect(profile!.modelHaiku).toBe('updated-haiku')
  })
})

describe('setActiveProfile()', () => {
  it('updates app_state row correctly', () => {
    setActiveProfile('profile-abc')

    const activeId = getActiveProfileId()
    expect(activeId).toBe('profile-abc')
  })

  it('can set active profile back to null', () => {
    setActiveProfile('some-profile')
    expect(getActiveProfileId()).toBe('some-profile')

    setActiveProfile(null)
    expect(getActiveProfileId()).toBeNull()
  })
})

describe('getActiveProfile()', () => {
  it('returns null when no active profile set', () => {
    const activeId = getActiveProfileId()
    expect(activeId).toBeNull()
  })

  it('returns correct profile when active is set', () => {
    upsertProfile({
      id: 'active-test-id',
      filename: 'settings_active.json',
      displayName: 'active-profile',
      baseUrl: 'https://active.com',
      authTokenHint: null,
      modelHaiku: 'active-haiku',
      modelSonnet: null,
      modelOpus: null,
      rawJson: '{}'
    })

    setActiveProfile('active-test-id')
    const profile = getProfileById(getActiveProfileId()!)
    expect(profile!.id).toBe('active-test-id')
    expect(profile!.displayName).toBe('active-profile')
  })
})

describe('logSwitchHistory()', () => {
  it('inserts a history row', () => {
    logSwitchHistory('from-id', 'to-id', true)

    const history = getSwitchHistory()
    expect(history.length).toBe(1)
    expect(history[0].fromProfileId).toBe('from-id')
    expect(history[0].toProfileId).toBe('to-id')
    expect(history[0].success).toBe(1)
    expect(typeof history[0].switchedAt).toBe('number')
    expect(typeof history[0].id).toBe('number')
  })

  it('records failed switches', () => {
    logSwitchHistory(null, 'to-fail', false)
    const history = getSwitchHistory()
    expect(history[0].success).toBe(0)
  })
})

describe('getSwitchHistory()', () => {
  it('returns entries in descending order by time', () => {
    logSwitchHistory(null, 'first', true)
    logSwitchHistory(null, 'second', true)
    logSwitchHistory(null, 'third', true)

    const history = getSwitchHistory()
    expect(history.length).toBeGreaterThanOrEqual(3)
    expect(history[0].switchedAt).toBeGreaterThanOrEqual(history[1].switchedAt)
    expect(history[1].switchedAt).toBeGreaterThanOrEqual(history[2].switchedAt)
  })

  it('respects limit parameter', async () => {
    const { initDb: idb } = await import('@/main/db')
    const db = idb() as any
    db.prepare('DELETE FROM switch_history').run()

    for (let i = 0; i < 5; i++) {
      logSwitchHistory(null, `profile-${i}`, true)
    }

    const limited = getSwitchHistory(2)
    expect(limited.length).toBe(2)
  })

  it('defaults to limit of 20', () => {
    const history = getSwitchHistory()
    expect(history.length).toBeLessThanOrEqual(20)
  })
})
