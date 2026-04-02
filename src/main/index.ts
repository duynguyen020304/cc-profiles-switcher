import { app, BrowserWindow, shell, dialog } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers, unregisterIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    title: 'CC Profiles',
    width: 420,
    height: 560,
    minWidth: 360,
    minHeight: 400,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    backgroundColor: '#0d0d0d',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    },
    show: false
  })

  // Show window when ready to prevent visual flash
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle external links in OS default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()
  registerIpcHandlers()

  // Auto-updater: only check in production (not dev mode)
  if (process.env.ELECTRON_RENDERER_URL === undefined) {
    setupAutoUpdater()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

function setupAutoUpdater(): void {
  // Log update events
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version)
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] No update available. Current version:', info.version)
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[AutoUpdater] Download progress: ${progress.percent.toFixed(1)}%`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version)

    // Notify user and prompt to install
    if (!mainWindow) {
      // Window closed, install on next launch
      return
    }
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'Restart the application to install the update now, or it will be installed when you close the app.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })

  autoUpdater.on('error', (error) => {
    console.error('[AutoUpdater] Error:', error?.message || 'Unknown error')
  })

  // Security: prevent downgrade attacks and prereleases
  autoUpdater.allowDowngrade = false
  autoUpdater.allowPrerelease = false

  // Check for updates (non-blocking)
  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    console.error('[AutoUpdater] Check failed:', error?.message || 'Unknown error')
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  unregisterIpcHandlers()
})
