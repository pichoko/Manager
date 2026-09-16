import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getDatabase } from './database/client'
import { registerAllIpcHandlers } from './ipc'
import { registerUpdaterIpc, checkForUpdatesInBackground } from './ipc/updater'
import { runAutoBackupIfNeeded } from './services/backupService'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // لینک‌های خارجی (مثلاً یک آدرس وب) باید در مرورگر پیش‌فرض ویندوز باز شوند، نه داخل برنامه
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.projectmanager.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // دیتابیس همین اول باز و در صورت نیاز ساخته می‌شه (فقط یک‌بار، در اولین اجرا)
  getDatabase()

  // ثبت IPC تمام Feature ها - هر Feature فایل مستقل خودش رو داره (src/main/ipc/*)
  registerAllIpcHandlers()

  // بک‌آپ خودکار روزانه - بدون توقف شروع برنامه (fire-and-forget)
  runAutoBackupIfNeeded()

  const mainWindow = createWindow()

  // آپدیت خودکار - فقط توی نسخه‌ی نصب‌شده‌ی واقعی معنی داره، نه حالت توسعه
  registerUpdaterIpc(mainWindow)
  if (!is.dev) {
    checkForUpdatesInBackground()
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
