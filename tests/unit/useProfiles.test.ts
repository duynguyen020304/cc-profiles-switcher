import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act as reactAct } from '@testing-library/react'
import { useProfiles } from '@/renderer/hooks/useProfiles'
import type { Profile } from '@/renderer/types/profile'
import '@testing-library/jest-dom/vitest'

const mockGetProfiles = vi.fn()
const mockRefreshProfiles = vi.fn()
const mockOnProfilesChanged = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()

  mockGetProfiles.mockResolvedValue([])
  mockRefreshProfiles.mockResolvedValue([])

  let listener: ((profiles: Profile[]) => void) | null = null
  mockOnProfilesChanged.mockImplementation((cb: (profiles: Profile[]) => void) => {
    listener = cb
    return () => { listener = null }
  })

  Object.defineProperty(window, 'ccProfiles', {
    value: {
      getProfiles: mockGetProfiles,
      refreshProfiles: mockRefreshProfiles,
      onProfilesChanged: mockOnProfilesChanged,
      getActiveProfile: vi.fn().mockResolvedValue(null),
      switchProfile: vi.fn().mockResolvedValue({ success: true }),
      getSwitchHistory: vi.fn().mockResolvedValue([]),
      onProfileSwitched: vi.fn(() => vi.fn())
    },
    writable: true,
    configurable: true
  })
})

describe('useProfiles', () => {
  it('returns empty profiles list on mount', async () => {
    const { result } = renderHook(() => useProfiles())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.profiles).toEqual([])
    expect(mockRefreshProfiles).toHaveBeenCalledTimes(1)
  })

  it('calls refreshProfiles when triggered', async () => {
    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    mockRefreshProfiles.mockResolvedValueOnce([{ id: 'p1' } as Profile])

    await reactAct(async () => {
      await result.current.refresh()
    })

    expect(result.current.profiles.length).toBe(1)
  })

  it('updates state when onProfilesChanged fires', async () => {
    // Render hook to register the callback
    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Get the callback that was registered during useEffect
    const registeredCb = mockOnProfilesChanged.mock.calls[0]?.[0]
    if (!registeredCb) {
      throw new Error('onProfilesChanged callback was not registered')
    }

    const updatedProfiles: Profile[] = [
      { id: 'dynamic-1', filename: 'dyn.json', displayName: 'Dynamic', baseUrl: null, authTokenHint: null, modelHaiku: null, modelSonnet: null, modelOpus: null, rawJson: '{}', lastSeen: Date.now(), createdAt: Date.now() }
    ]

    // Simulate main process sending an update via the registered callback
    reactAct(() => {
      registeredCb(updatedProfiles)
    })

    expect(result.current.profiles.length).toBe(1)
    expect(result.current.profiles[0].id).toBe('dynamic-1')
  })

  it('handles API errors gracefully', async () => {
    mockRefreshProfiles.mockRejectedValueOnce(new Error('Connection failed'))

    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).not.toBeNull()
    expect(result.current.profiles).toEqual([])
  })
})
