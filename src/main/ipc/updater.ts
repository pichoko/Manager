import { app, ipcMain, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

export type UpdaterStatus =
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'not-available' }
  | { status: 'downloading'; percent: number }
  | { status: 'downloaded'; version: string }
  | { status: 'error'; message: string }

let mainWindowRef: BrowserWindow | null = null

function sendStatus(data: UpdaterStatus): void {
  mainWindowRef?.webContents.send('updater:status', data)
}

/**
 * فقط یک‌بار (در شروع برنامه) IPC ها و Listener های autoUpdater ثبت می‌شن.
 * autoUpdater در حالت توسعه (npm run dev) کار نمی‌کنه چون هیچ نسخه‌ی منتشرشده‌ای
 * برای مقایسه وجود نداره - این طبیعیه و خطا محسوب نمی‌شه.
 */
export function registerUpdaterIpc(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => sendStatus({ status: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    sendStatus({ status: 'available', version: info.version })
  )
  autoUpdater.on('update-not-available', () => sendStatus({ status: 'not-available' }))
  autoUpdater.on('download-progress', (progress) =>
    sendStatus({ status: 'downloading', percent: Math.round(progress.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    sendStatus({ status: 'downloaded', version: info.version })
  )
  autoUpdater.on('error', (error) =>
    sendStatus({ status: 'error', message: error.message || 'خطای ناشناخته در بررسی آپدیت' })
  )

  ipcMain.handle('updater:check', async () => {
    try {
      await autoUpdater.checkForUpdates()
      return { ok: true }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'UPDATE_ERROR', message: 'خطا در بررسی آپدیت جدید' } }
    }
  })

  ipcMain.handle('updater:installNow', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('system:getAppVersion', () => app.getVersion())
}

export function checkForUpdatesInBackground(): void {
  autoUpdater.checkForUpdates().catch((error) => {
    console.error('Background update check failed:', error)
  })
}
