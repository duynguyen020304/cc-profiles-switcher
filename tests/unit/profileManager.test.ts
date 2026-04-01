import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('fs', () => {
  const readdirSync = vi.fn()
  const statSync = vi.fn()
  const readFileSync = vi.fn()
  const writeFileSync = vi.fn()
  const renameSync = vi.fn()
  return {
    default: { readdirSync, statSync, readFileSync, writeFileSync, renameSync },
    readdirSync,
    statSync,
    readFileSync,
    writeFileSync,
    renameSync
  }
})

vi.mock('os', () => ({
  default: { homedir: () => '/home/testuser' },
  homedir: () => '/home/testuser'
}))

vi.mock('crypto', () => {
  const createHash = (_algo: string) => {
    let data = ''
    const hashObj = {
      update: (input: string) => { data += input; return hashObj },
      digest: (format: string) => {
        if (format !== 'hex') return ''
        // Simple hash that produces different output for any input difference
        let h = 0x811c9dc5
        for (let i = 0; i < data.length; i++) {
          h ^= data.charCodeAt(i)
          h = Math.imul(h, 0x01000193)
        }
        // Return full 32-char hex so source .slice(0,16) still gets unique prefixes
        return (h >>> 0).toString(16).padStart(8, '0').repeat(4)
      }
    }
    return hashObj
  }
  return { default: { createHash }, createHash }
})

const fs = await import('fs')
const {
  deriveDisplayName,
  discoverProfiles,
  extractProfileMeta,
  generateProfileId,
  mergeAndWriteProfile
} = await import('@/main/profileManager')

describe('deriveDisplayName', () => {
  it('converts settings_alibaba_qwen35.json to "alibaba / qwen35"', () => {
    expect(deriveDisplayName('settings_alibaba_qwen35.json')).toBe('alibaba / qwen35')
  })

  it('converts settings_glm.json to "glm"', () => {
    expect(deriveDisplayName('settings_glm.json')).toBe('glm')
  })

  it('converts settings_custom_profile.json to "custom / profile"', () => {
    expect(deriveDisplayName('settings_custom_profile.json')).toBe('custom / profile')
  })

  it('handles simple name without prefix', () => {
    expect(deriveDisplayName('myprofile.json')).toBe('myprofile')
  })

  it('handles name with only underscores', () => {
    expect(deriveDisplayName('a_b_c.json')).toBe('a / b / c')
  })
})

describe('extractProfileMeta', () => {
  it('correctly parses base URL and model names', () => {
    const data = {
      env: {
        ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
        ANTHROPIC_AUTH_TOKEN: 'sk-abc1234567890',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'haiku-model',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'sonnet-model',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'opus-model'
      }
    }

    const meta = extractProfileMeta(data)
    // Token is first 8 chars + "...": "sk-abc12" + "..." = "sk-abc12..."
    expect(meta).toEqual({
      baseUrl: 'https://api.z.ai/api/anthropic',
      authTokenHint: 'sk-abc12...',
      modelHaiku: 'haiku-model',
      modelSonnet: 'sonnet-model',
      modelOpus: 'opus-model'
    })
  })

  it('returns null values for missing fields', () => {
    const data = { env: { ANTHROPIC_BASE_URL: 'https://example.com' } }
    const meta = extractProfileMeta(data)
    expect(meta).toEqual({
      baseUrl: 'https://example.com',
      authTokenHint: null,
      modelHaiku: null,
      modelSonnet: null,
      modelOpus: null
    })
  })

  it('handles empty env object', () => {
    const meta = extractProfileMeta({})
    expect(meta).toEqual({
      baseUrl: null,
      authTokenHint: null,
      modelHaiku: null,
      modelSonnet: null,
      modelOpus: null
    })
  })

  it('truncates auth token correctly', () => {
    const data = { env: { ANTHROPIC_AUTH_TOKEN: 'short' } }
    const meta = extractProfileMeta(data)
    expect(meta.authTokenHint).toBe('short...')
  })
})

describe('generateProfileId', () => {
  it('generates deterministic ID from filename', () => {
    const id1 = generateProfileId('settings_glm.json')
    const id2 = generateProfileId('settings_glm.json')
    expect(id1).toBe(id2)
  })

  it('generates different IDs for different filenames', () => {
    const id1 = generateProfileId('settings_glm.json')
    const id2 = generateProfileId('settings_alibaba.json')
    expect(id1).not.toBe(id2)
  })
})

describe('discoverProfiles', () => {
  beforeEach(() => {
    process.env.CLAUDE_DIR_OVERRIDE = '/tmp/test-claude'
  })

  afterEach(() => {
    delete process.env.CLAUDE_DIR_OVERRIDE
  })

  it('returns correct Profile objects from mocked dir, skips settings.json and settings.local.json', () => {
    ;(fs.readdirSync as any).mockReturnValue([
      'settings.json',
      'settings.local.json',
      'settings_glm.json',
      'settings_alibaba_qwen35.json',
      'readme.txt',
      'invalid.json'
    ])

    ;(fs.statSync as any).mockReturnValue({
      isFile: () => true,
      isDirectory: () => false
    } as any)

    ;(fs.readFileSync as any).mockImplementation((filePath: string) => {
      if (String(filePath).includes('settings_glm')) {
        return JSON.stringify({
          env: {
            ANTHROPIC_BASE_URL: 'https://glm.api.com',
            ANTHROPIC_AUTH_TOKEN: 'token1234567890',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4-flash',
            ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4-air',
            ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-4'
          }
        })
      }
      if (String(filePath).includes('alibaba_qwen35')) {
        return JSON.stringify({
          env: {
            ANTHROPIC_BASE_URL: 'https://alibaba.api.com',
            ANTHROPIC_AUTH_TOKEN: 'ali-token-1234567890'
          }
        })
      }
      if (String(filePath).includes('invalid.json')) {
        return '{not valid json}'
      }
      return '{}'
    })

    const profiles = discoverProfiles()

    expect(profiles.length).toBe(2)

    const glmProfile = profiles.find(p => p.filename === 'settings_glm.json')!
    expect(glmProfile.displayName).toBe('glm')
    expect(glmProfile.baseUrl).toBe('https://glm.api.com')
    expect(glmProfile.modelHaiku).toBe('glm-4-flash')

    const aliProfile = profiles.find(p => p.filename === 'settings_alibaba_qwen35.json')!
    expect(aliProfile.displayName).toBe('alibaba / qwen35')
  })

  it('handles empty directory gracefully', () => {
    ;(fs.readdirSync as any).mockReturnValue([])

    const profiles = discoverProfiles()
    expect(profiles).toEqual([])
  })

  it('skips malformed JSON files without throwing', () => {
    ;(fs.readdirSync as any).mockReturnValue(['broken.json'])
    ;(fs.statSync as any).mockReturnValue({ isFile: () => true } as any)
    ;(fs.readFileSync as any).mockReturnValue('this is not json {{{')

    const profiles = discoverProfiles()
    expect(profiles).toEqual([])
  })

  it('skips files that are not valid profiles (missing known keys)', () => {
    ;(fs.readdirSync as any).mockReturnValue(['not_a_profile.json'])
    ;(fs.statSync as any).mockReturnValue({ isFile: () => true } as any)
    ;(fs.readFileSync as any).mockReturnValue(JSON.stringify({
      someRandomKey: 'value',
      env: {
        RANDOM_VAR: 'something'
      }
    }))

    const profiles = discoverProfiles()
    expect(profiles).toEqual([])
  })
})

describe('mergeAndWriteProfile', () => {
  beforeEach(() => {
    process.env.CLAUDE_DIR_OVERRIDE = '/tmp/test-claude'
  })

  afterEach(() => {
    delete process.env.CLAUDE_DIR_OVERRIDE
  })

  it('merges env keys and preserves non-env top-level keys', () => {
    ;(fs.readFileSync as any).mockReturnValue(JSON.stringify({
      env: {
        ANTHROPIC_AUTH_TOKEN: 'old-token',
        ANTHROPIC_BASE_URL: 'https://old-url',
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1'
      },
      enabledPlugins: { 'frontend-design': true },
      skipDangerousModePermissionPrompt: true
    }))

    const result = mergeAndWriteProfile(JSON.stringify({
      env: {
        ANTHROPIC_AUTH_TOKEN: 'new-token',
        ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4.7',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.7',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-4.7'
      }
    }))

    expect(result.success).toBe(true)

    expect(fs.writeFileSync as any).toHaveBeenCalled()
    const writeCall = (fs.writeFileSync as any).mock.calls[0]
    const writtenData = JSON.parse(writeCall[1] as string)

    expect(writtenData.env.ANTHROPIC_AUTH_TOKEN).toBe('new-token')
    expect(writtenData.env.ANTHROPIC_BASE_URL).toBe('https://api.z.ai/api/anthropic')
    expect(writtenData.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1')
    expect(writtenData.skipDangerousModePermissionPrompt).toBe(true)
    expect(writtenData.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('glm-4.7')
    expect(writtenData.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe('glm-4.7')
    expect(writtenData.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe('glm-4.7')
  })

  it('writes atomically (tmp then rename)', () => {
    ;(fs.readFileSync as any).mockReturnValue('{}')

    const result = mergeAndWriteProfile(JSON.stringify({ env: { ANTHROPIC_BASE_URL: 'test' } }))
    expect(result.success).toBe(true)

    const tmpWriteCall = (fs.writeFileSync as any).mock.calls.find(
      (call: unknown[]) => String(call[0]).endsWith('.tmp')
    )
    expect(tmpWriteCall).toBeTruthy()

    expect(fs.renameSync as any).toHaveBeenCalled()
  })

  it('handles profile with no env key without crashing', () => {
    ;(fs.readFileSync as any).mockReturnValue('{}')

    const result = mergeAndWriteProfile(JSON.stringify({ otherKey: 'value' }))
    expect(result.success).toBe(true)
  })
})
