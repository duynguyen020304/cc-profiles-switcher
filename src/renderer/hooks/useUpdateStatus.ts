import { useState, useEffect, useCallback } from 'react'
import type { UpdateStatus } from '../types/profile'

interface UseUpdateStatusReturn {
  status: UpdateStatus
  appVersion: string
  checkForUpdates: () => Promise<void>
  installUpdate: () => void
}

export function useUpdateStatus(): UseUpdateStatusReturn {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [appVersion, setAppVersion] = useState<string>('')

  // Load initial app version
  useEffect(() => {
    window.ccProfiles.getAppVersion().then(setAppVersion).catch(() => setAppVersion('unknown'))
  }, [])

  // Subscribe to update status changes
  useEffect(() => {
    const cleanup = window.ccProfiles.onUpdateStatusChanged((newStatus: UpdateStatus) => {
      setStatus(newStatus)
    })
    return cleanup
  }, [])

  const checkForUpdates = useCallback(async () => {
    try {
      await window.ccProfiles.checkForUpdates()
    } catch (error) {
      setStatus({ state: 'error', message: error instanceof Error ? error.message : 'Check failed' })
    }
  }, [])

  const installUpdate = useCallback(() => {
    window.ccProfiles.installUpdate()
  }, [])

  return { status, appVersion, checkForUpdates, installUpdate }
}