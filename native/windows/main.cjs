const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('node:path')

const APP_URL = process.env.BUDGETPRO_APP_URL || 'https://budgetpro-afq2.onrender.com/'
const APP_ORIGIN = new URL(APP_URL).origin
let mainWindow
let updateDownload

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

function compareVersions(left, right) {
  const parse = (value) => String(value).replace(/^v/i, '').split(/[.-]/).map((part) => Number(part) || 0)
  const a = parse(left)
  const b = parse(right)
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return 1
    if ((a[index] || 0) < (b[index] || 0)) return -1
  }
  return 0
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 940,
    minHeight: 640,
    show: false,
    backgroundColor: '#07101e',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  const defaultAgent = mainWindow.webContents.getUserAgent()
  mainWindow.webContents.setUserAgent(`${defaultAgent} BudgetProNative/Windows/${app.getVersion()}`)
  mainWindow.setMenuBarVisibility(false)
  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== APP_ORIGIN) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  void mainWindow.loadURL(APP_URL)
}

ipcMain.handle('native:getInfo', () => ({
  installed: true,
  platform: 'windows',
  version: app.getVersion(),
  architecture: process.arch,
}))

ipcMain.handle('native:checkForUpdates', async () => {
  if (!app.isPackaged) return { available: false, version: app.getVersion(), development: true }
  const result = await autoUpdater.checkForUpdates()
  const latestVersion = result?.updateInfo?.version || app.getVersion()
  return {
    available: compareVersions(app.getVersion(), latestVersion) < 0,
    version: latestVersion,
  }
})

ipcMain.handle('native:installUpdate', async () => {
  if (!app.isPackaged) return { started: false, development: true }
  if (!updateDownload) {
    updateDownload = (async () => {
      await autoUpdater.checkForUpdates()
      await autoUpdater.downloadUpdate()
      autoUpdater.quitAndInstall(false, true)
    })().finally(() => { updateDownload = null })
  }
  await updateDownload
  return { started: true }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
