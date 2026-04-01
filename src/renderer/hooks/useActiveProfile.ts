import { useState, useEffect, useCallback } from 'react'
import type { Profile } from '../types/profile'

interface UseActiveProfileReturn {
  activeProfile: Profile | null
  switchingId: string | null
  switchErrors: Record<string, string | null>
  switchToProfile: (profileId: string) => Promise<void>
}

export function useActiveProfile(profiles: Profile[]): UseActiveProfileReturn {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [switchErrors, setSwitchErrors] = useState<Record<string, string | null>>({})

  const loadActiveProfile = useCallback(async () => {
    try {
      const profile = await window.ccProfiles.getActiveProfile()
      setActiveProfile(profile)
    } catch (err) {
      console.error('Failed to load active profile:', err)
    }
  }, [])

  useEffect(() => {
    loadActiveProfile()

    // Subscribe to switch events from main process
    const cleanup = window.ccProfiles.onProfileSwitched((profile: Profile) => {
      setActiveProfile(profile)
      setSwitchingId(null)
      setSwitchErrors(prev => ({ ...prev, [profile.id]: null }))
    })

    return cleanup
  }, [loadActiveProfile])

  const switchToProfile = async (profileId: string): Promise<void> => {
    setSwitchingId(profileId)
    setSwitchErrors(prev => ({ ...prev, [profileId]: null }))

    try {
      const result = await window.ccProfiles.switchProfile(profileId)
      if (!result.success) {
        setSwitchErrors(prev => ({ ...prev, [profileId]: result.error || 'Switch failed' }))
        setSwitchingId(null)
      }
      // If success, the onProfileSwitched handler will update state
    } catch (err) {
      setSwitchErrors(prev => ({
        ...prev,
        [profileId]: err instanceof Error ? err.message : String(err)
      }))
      setSwitchingId(null)
    }
  }

  return { activeProfile, switchingId, switchErrors, switchToProfile }
}
