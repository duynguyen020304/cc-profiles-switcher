import { contextBridge, ipcRenderer } from 'electron'
import type { Profile, SwitchHistoryEntry } from '../renderer/types/profile'

const ccProfilesApi = {
  /**
   * Get all discovered profiles from SQLite.
   */
  getProfiles: (): Promise<Profile[]> =>
    ipcRenderer.invoke('profiles:get'),

  /**
   * Get the currently active profile (or null).
   */
  getActiveProfile: (): Promise<Profile | null> =>
    ipcRenderer.invoke('profiles:getActive'),

  /**
   * Switch to a different profile by ID.
   */
  switchProfile: (profileId: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('profiles:switch', profileId),

  /**
   * Rescan ~/.claude/ directory for profiles and refresh DB + UI.
   */
  refreshProfiles: (): Promise<Profile[]> =>
    ipcRenderer.invoke('profiles:refresh'),

  /**
   * Get recent switch history entries.
   */
  getSwitchHistory: (): Promise<SwitchHistoryEntry[]> =>
    ipcRenderer.invoke('profiles:history'),

  /**
   * Subscribe to profile switch events.
   * Returns an unsubscribe function.
   */
  onProfileSwitched: (callback: (profile: Profile) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, profile: Profile): void => callback(profile)
    ipcRenderer.on('profile:switched', handler)
    return () => ipcRenderer.removeListener('profile:switched', handler)
  },

  /**
   * Subscribe to profiles-changed events (e.g., after refresh).
   * Returns an unsubscribe function.
   */
  onProfilesChanged: (callback: (profiles: Profile[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, profiles: Profile[]): void => callback(profiles)
    ipcRenderer.on('profiles:changed', handler)
    return () => ipcRenderer.removeListener('profiles:changed', handler)
  }
}

contextBridge.exposeInMainWorld('ccProfiles', ccProfilesApi)
