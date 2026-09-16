import { app, ipcMain, shell } from 'electron'
import {
  createBackup,
  exportBackupToUserPath,
  getBackupsFolderPath,
  listBackups,
  restoreFromAutoBackup,
  restoreFromUserSelectedFile
} from '../services/backupService'

export function registerBackupIpc(): void {
  ipcMain.handle('backup:list', () => {
    try {
      return { ok: true, data: listBackups() }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'BACKUP_ERROR', message: 'خطا در دریافت لیست بک‌آپ‌ها' } }
    }
  })

  ipcMain.handle('backup:createManualInAppFolder', async () => {
    try {
      const path = await createBackup()
      return { ok: true, data: { path } }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'BACKUP_ERROR', message: 'خطا در تهیه‌ی بک‌آپ' } }
    }
  })

  ipcMain.handle('backup:exportToFile', async () => {
    const result = await exportBackupToUserPath()
    if (!result.ok) {
      if (result.canceled) return { ok: false, error: { code: 'CANCELED', message: '' } }
      return {
        ok: false,
        error: { code: 'BACKUP_ERROR', message: result.message ?? 'خطا در ذخیره‌ی بک‌آپ' }
      }
    }
    return { ok: true, data: { path: result.path } }
  })

  ipcMain.handle('backup:restoreFromFile', async () => {
    const result = await restoreFromUserSelectedFile()
    if (result.canceled) return { ok: false, error: { code: 'CANCELED', message: '' } }
    if (!result.ok) {
      return {
        ok: false,
        error: { code: 'RESTORE_ERROR', message: result.message ?? 'خطا در بازیابی' }
      }
    }
    return { ok: true }
  })

  ipcMain.handle('backup:restoreFromAutoBackup', async (_event, fileName: string) => {
    const result = await restoreFromAutoBackup(fileName)
    if (!result.ok) {
      return {
        ok: false,
        error: { code: 'RESTORE_ERROR', message: result.message ?? 'خطا در بازیابی' }
      }
    }
    return { ok: true }
  })

  ipcMain.handle('backup:openFolder', () => {
    shell.openPath(getBackupsFolderPath())
  })

  ipcMain.handle('backup:relaunchApp', () => {
    app.relaunch()
    app.exit(0)
  })
}
