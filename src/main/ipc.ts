import { ipcMain } from 'electron'
import { initDb, upsertProfile, getAllProfiles, getProfileById, setActiveProfile, getActiveProfileId, logSwitchHistory, getSwitchHistory } from './db'
import { discoverProfiles, mergeAndWriteProfile } from './profileManager'
import type { Profile, SwitchHistoryEntry } from '../renderer/types/profile'

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
}
