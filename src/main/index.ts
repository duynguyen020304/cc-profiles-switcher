import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import { registerIpcHandlers, unregisterIpcHandlers, setupAutoUpdaterEvents } from './ipc'

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
    setupAutoUpdaterEvents()
    autoUpdater.checkForUpdatesAndNotify().catch((error) => {
      console.error('[AutoUpdater] Check failed:', error?.message || 'Unknown error')
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  unregisterIpcHandlers()
})
