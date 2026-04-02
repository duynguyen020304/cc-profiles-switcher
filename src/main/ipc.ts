import { ipcMain, BrowserWindow, app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { initDb, upsertProfile, getAllProfiles, getProfileById, setActiveProfile, getActiveProfileId, logSwitchHistory, getSwitchHistory } from './db'
import { discoverProfiles, mergeAndWriteProfile } from './profileManager'
import type { Profile, SwitchHistoryEntry } from '../renderer/types/profile'

// Update status type for IPC communication
export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string; releaseDate?: string }
  | { state: 'not-available'; currentVersion: string }
  | { state: 'downloading'; percent: number; transferred: number; total: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

let currentUpdateStatus: UpdateStatus = { state: 'idle' }

/**
 * Broadcast update status to all renderer windows.
 */
export function broadcastUpdateStatus(status: UpdateStatus): void {
  currentUpdateStatus = status
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    win.webContents.send('update:status-changed', status)
  }
}

/**
 * Get current update status.
 */
export function getUpdateStatus(): UpdateStatus {
  return currentUpdateStatus
}

/**
 * Manual check for updates (triggered from renderer).
 */
export async function checkForUpdatesManually(): Promise<void> {
  try {
    broadcastUpdateStatus({ state: 'checking' })
    await autoUpdater.checkForUpdates()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    broadcastUpdateStatus({ state: 'error', message })
  }
}

/**
 * Install downloaded update.
 */
export function installUpdate(): void {
  autoUpdater.quitAndInstall()
}

/**
 * Setup autoUpdater event listeners (called from index.ts).
 */
export function setupAutoUpdaterEvents(): void {
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for update...')
    broadcastUpdateStatus({ state: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version)
    broadcastUpdateStatus({ state: 'available', version: info.version, releaseDate: info.releaseDate })
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] No update available. Current version:', info.version)
    broadcastUpdateStatus({ state: 'not-available', currentVersion: info.version })
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[AutoUpdater] Download progress: ${progress.percent.toFixed(1)}%`)
    broadcastUpdateStatus({
      state: 'downloading',
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version)
    broadcastUpdateStatus({ state: 'downloaded', version: info.version })
  })

  autoUpdater.on('error', (error) => {
    console.error('[AutoUpdater] Error:', error?.message || 'Unknown error')
    broadcastUpdateStatus({ state: 'error', message: error?.message || 'Unknown error' })
  })

  // Security settings
  autoUpdater.allowDowngrade = false
  autoUpdater.allowPrerelease = false
}

/**
 * Register all IPC handlers for the renderer process.
 * Call this once in the main process after app is ready.
 */
export function registerIpcHandlers(): void {
  // Initialize database
  initDb()

  // --- Profile CRUD ---

  ipcMain.handle('profiles:get', (): Profile[] => {
    return getAllProfiles()
  })

  ipcMain.handle('profiles:getActive', (): Profile | null => {
    const activeId = getActiveProfileId()
    if (!activeId) return null
    return getProfileById(activeId)
  })

  ipcMain.handle('profiles:refresh', (): Profile[] => {
    const discovered = discoverProfiles()
    
    for (const profile of discovered) {
      upsertProfile({
        id: profile.id,
        filename: profile.filename,
        displayName: profile.displayName,
        baseUrl: profile.baseUrl,
        authTokenHint: profile.authTokenHint,
        modelHaiku: profile.modelHaiku,
        modelSonnet: profile.modelSonnet,
        modelOpus: profile.modelOpus,
        rawJson: profile.rawJson
      })
    }

    // Notify all windows that profiles changed
    const { BrowserWindow } = require('electron')
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      win.webContents.send('profiles:changed', getAllProfiles())
    }

    return getAllProfiles()
  })

  ipcMain.handle('profiles:switch', async (_event: Electron.IpcMainInvokeEvent, profileId: string): Promise<{ success: boolean; error?: string }> => {
    const profile = getProfileById(profileId)
    if (!profile) {
      return { success: false, error: `Profile not found: ${profileId}` }
    }

    const previousActiveId = getActiveProfileId()

    const result = mergeAndWriteProfile(profile.rawJson)

    if (result.success) {
      setActiveProfile(profileId)
      logSwitchHistory(previousActiveId, profileId, true)

      // Notify all windows about the switch
      const { BrowserWindow } = require('electron')
      const windows = BrowserWindow.getAllWindows()
      for (const win of windows) {
        win.webContents.send('profile:switched', profile)
      }
    } else {
      logSwitchHistory(previousActiveId, profileId, false)
    }

    return result
  })

  // --- Switch History ---

  ipcMain.handle('profiles:history', (limit?: number): SwitchHistoryEntry[] => {
    return getSwitchHistory(limit ?? 20)
  })

  // --- Update Handlers ---

  ipcMain.handle('update:getVersion', (): string => {
    return app.getVersion()
  })

  ipcMain.handle('update:getStatus', (): UpdateStatus => {
    return currentUpdateStatus
  })

  ipcMain.handle('update:check', async (): Promise<void> => {
    await checkForUpdatesManually()
  })

  ipcMain.handle('update:install', (): void => {
    installUpdate()
  })
}

/**
 * Clean up IPC handlers (call on app quit).
 */
export function unregisterIpcHandlers(): void {
  ipcMain.removeHandler('profiles:get')
  ipcMain.removeHandler('profiles:getActive')
  ipcMain.removeHandler('profiles:refresh')
  ipcMain.removeHandler('profiles:switch')
  ipcMain.removeHandler('profiles:history')
  ipcMain.removeHandler('update:getVersion')
  ipcMain.removeHandler('update:getStatus')
  ipcMain.removeHandler('update:check')
  ipcMain.removeHandler('update:install')
}
