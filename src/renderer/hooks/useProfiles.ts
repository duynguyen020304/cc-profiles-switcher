import { useState, useEffect, useCallback } from 'react'
import type { Profile } from '../types/profile'

interface UseProfilesReturn {
  profiles: Profile[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useProfiles(): UseProfilesReturn {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const api = window.ccProfiles
      const result = await api.refreshProfiles()
      setProfiles(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfiles()

    // Subscribe to profile changes from main process
    const cleanup = window.ccProfiles.onProfilesChanged((newProfiles: Profile[]) => {
      setProfiles(newProfiles)
      setError(null)
    })

    return cleanup
  }, [loadProfiles])

  return { profiles, loading, error, refresh: loadProfiles }
}
