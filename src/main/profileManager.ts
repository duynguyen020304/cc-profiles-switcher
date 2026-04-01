import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

// Respect CLAUDE_DIR_OVERRIDE for testing purposes
export const CLAUDE_DIR: string =
  process.env.CLAUDE_DIR_OVERRIDE ?? path.join(os.homedir(), '.claude')

const SETTINGS_FILE = 'settings.json'
const SETTINGS_LOCAL_FILE = 'settings.local.json'

// Types used internally
export interface ProfileRawData {
  env?: Record<string, string>
  [key: string]: unknown
}

/**
 * Derive a human-readable display name from a profile filename.
 * - Strips 'settings_' prefix and '.json' suffix
 * - Replaces remaining underscores with ' / '
 * Examples:
 *   settings_alibaba.json -> alibaba
 *   settings_glm.json -> glm
 *   settings_alibaba_qwen35.json -> alibaba / qwen35
 */
export function deriveDisplayName(filename: string): string {
  let name = filename
  // Remove .json extension
  if (name.endsWith('.json')) {
    name = name.slice(0, -5)
  }
  // Remove settings_ prefix if present
  if (name.startsWith('settings_')) {
    name = name.slice(9)
  }
  // Replace underscores with ' / '
  return name.replace(/_/g, ' / ')
}

/**
 * Check if a filename should be skipped during profile discovery.
 * Skips: settings.json, settings.local.json, non-.json files
 */
function shouldSkipFilename(filename: string): boolean {
  if (filename === SETTINGS_FILE) return true
  if (filename === SETTINGS_LOCAL_FILE) return true
  if (!filename.endsWith('.json')) return true
  return false
}

/**
 * Check if a parsed JSON object looks like a valid profile.
 * A valid profile must contain at least one of the known env keys.
 */
function isValidProfile(data: Record<string, unknown>): boolean {
  const env = data.env as Record<string, unknown> | undefined
  if (!env) return false

  const knownKeys = [
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_DEFAULT_HAIKU_MODEL',
    'ANTHROPIC_DEFAULT_SONNET_MODEL',
    'ANTHROPIC_DEFAULT_OPUS_MODEL'
  ]

  return knownKeys.some(key => key in env && env[key] !== undefined && env[key] !== '')
}

/**
 * Extract metadata from a parsed profile object.
 */
export function extractProfileMeta(data: ProfileRawData): {
  baseUrl: string | null
  authTokenHint: string | null
  modelHaiku: string | null
  modelSonnet: string | null
  modelOpus: string | null
} {
  const env = data.env as Record<string, string> | undefined

  const baseUrl = env?.ANTHROPIC_BASE_URL ?? null

  // Store only first 8 chars of auth token + "..." for security
  let authTokenHint: string | null = null
  if (env?.ANTHROPIC_AUTH_TOKEN) {
    const token = String(env.ANTHROPIC_AUTH_TOKEN)
    authTokenHint = token.length > 8 ? token.slice(0, 8) + '...' : token + '...'
  }

  const modelHaiku = env?.ANTHROPIC_DEFAULT_HAIKU_MODEL ?? null
  const modelSonnet = env?.ANTHROPIC_DEFAULT_SONNET_MODEL ?? null
  const modelOpus = env?.ANTHROPIC_DEFAULT_OPUS_MODEL ?? null

  return { baseUrl, authTokenHint, modelHaiku, modelSonnet, modelOpus }
}

/**
 * Generate a deterministic ID for a profile based on its filename.
 */
export function generateProfileId(filename: string): string {
  return crypto.createHash('sha256').update(filename).digest('hex').slice(0, 16)
}

/**
 * Discover all valid profile JSON files in ~/.claude/ directory.
 * Returns an array of profile objects ready for DB insertion.
 */
export function discoverProfiles(): Array<{
  id: string
  filename: string
  displayName: string
  baseUrl: string | null
  authTokenHint: string | null
  modelHaiku: string | null
  modelSonnet: string | null
  modelOpus: string | null
  rawJson: string
}> {
  let entries: string[]

  try {
    entries = fs.readdirSync(CLAUDE_DIR)
  } catch (err) {
    // Directory doesn't exist or isn't readable — return empty
    console.error(`Cannot read ${CLAUDE_DIR}:`, err)
    return []
  }

  const profiles: ReturnType<typeof discoverProfiles> = []

  for (const filename of entries) {
    if (shouldSkipFilename(filename)) continue

    const filePath = path.join(CLAUDE_DIR, filename)

    try {
      const stat = fs.statSync(filePath)
      if (!stat.isFile()) continue

      const rawContent = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(rawContent)

      // Must be an object and be a valid profile
      if (typeof data !== 'object' || data === null || Array.isArray(data)) continue
      if (!isValidProfile(data)) continue

      const displayName = deriveDisplayName(filename)
      const meta = extractProfileMeta(data as ProfileRawData)
      const id = generateProfileId(filename)

      profiles.push({
        id,
        filename,
        displayName,
        ...meta,
        rawJson: rawContent
      })
    } catch (err) {
      // Skip malformed JSON files silently
      console.warn(`Skipping invalid profile ${filename}:`, err)
      continue
    }
  }

  return profiles
}

/**
 * Deep merge a profile's env into the existing settings.json.
 * Strategy:
 *   - Start with current settings.json as base
 *   - Override only env keys that exist in the profile
 *   - Preserve all other top-level keys (enabledPlugins, skipDangerousModePermissionPrompt, etc.)
 *   - If profile has top-level keys beyond env, merge those shallowly too
 *
 * Writes atomically via tmp-file-then-rename pattern.
 */
export function mergeAndWriteProfile(profileRawJson: string): { success: boolean; error?: string } {
  let targetSettings: Record<string, unknown>
  let profileData: ProfileRawData

  // Parse the profile data
  try {
    profileData = JSON.parse(profileRawJson)
  } catch (err) {
    return { success: false, error: `Invalid profile JSON: ${(err as Error).message}` }
  }

  // Read current settings.json
  const settingsPath = path.join(CLAUDE_DIR, SETTINGS_FILE)

  try {
    const currentContent = fs.readFileSync(settingsPath, 'utf-8')
    targetSettings = JSON.parse(currentContent)
  } catch (err) {
    // If settings.json doesn't exist, start fresh
    targetSettings = {}
  }

  // Ensure targetSettings has an env object
  if (!targetSettings.env || typeof targetSettings.env !== 'object') {
    targetSettings.env = {}
  }

  // Merge env keys from profile
  if (profileData.env && typeof profileData.env === 'object') {
    for (const key of Object.keys(profileData.env)) {
      ;(targetSettings.env as Record<string, unknown>)[key] = profileData.env![key]
    }
  }

  // Merge any other top-level keys from profile (shallow merge, except 'env' which we handled)
  for (const key of Object.keys(profileData)) {
    if (key !== 'env') {
      targetSettings[key] = profileData[key]
    }
  }

  // Atomic write: write to .tmp then rename
  const tmpPath = settingsPath + '.tmp'
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(targetSettings, null, 2), 'utf-8')
    fs.renameSync(tmpPath, settingsPath)
  } catch (err) {
    return { success: false, error: `Failed to write settings: ${(err as Error).message}` }
  }

  return { success: true }
}

/**
 * Compute a hash of settings.json content for change detection.
 */
export function hashSettingsJson(): string {
  const settingsPath = path.join(CLAUDE_DIR, SETTINGS_FILE)
  try {
    const content = fs.readFileSync(settingsPath, 'utf-8')
    return crypto.createHash('sha256').update(content).digest('hex')
  } catch {
    return ''
  }
}

/**
 * Read the current settings.json content.
 */
export function readCurrentSettings(): Record<string, unknown> {
  const settingsPath = path.join(CLAUDE_DIR, SETTINGS_FILE)
  try {
    const content = fs.readFileSync(settingsPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}
