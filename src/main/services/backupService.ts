import { app, dialog } from 'electron'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync } from 'fs'
import { join } from 'path'
import Database from 'better-sqlite3'
import { closeDatabase, getDatabasePath } from '../database/client'

const MAX_AUTO_BACKUPS = 30

function getBackupsDir(): string {
  const dir = join(app.getPath('userData'), 'backups')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatBackupFilename(date: Date): string {
  return `ProjectManager_Backup_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.db`
}

/** طبق EG-17: هر بک‌آپ باید واقعاً قابل Restore باشه - از API رسمی SQLite Backup استفاده
 * می‌کنیم (نه کپی خام فایل)، چون در حالت WAL کپی مستقیم می‌تونه ناقص/ناسازگار باشه. */
export async function createBackup(customPath?: string): Promise<string> {
  const dbPath = getDatabasePath()
  const destination = customPath ?? join(getBackupsDir(), formatBackupFilename(new Date()))
  const sourceDb = new Database(dbPath, { readonly: true })
  await sourceDb.backup(destination)
  sourceDb.close()
  return destination
}

export interface BackupFileInfo {
  fileName: string
  path: string
  sizeBytes: number
  createdAt: string
}

export function listBackups(): BackupFileInfo[] {
  const dir = getBackupsDir()
  return readdirSync(dir)
    .filter((f) => f.endsWith('.db'))
    .map((f) => {
      const full = join(dir, f)
      const stat = statSync(full)
      return { fileName: f, path: full, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function pruneOldBackups(): void {
  const backups = listBackups()
  if (backups.length <= MAX_AUTO_BACKUPS) return
  for (const b of backups.slice(MAX_AUTO_BACKUPS)) {
    try {
      unlinkSync(b.path)
    } catch {
      // نادیده گرفتن خطای حذف یک بک‌آپ قدیمی - مهم نیست
    }
  }
}

/** فقط یک‌بار در روز بک‌آپ خودکار می‌گیره (اگه امروز قبلاً گرفته شده، دوباره نمی‌گیره) */
export async function runAutoBackupIfNeeded(): Promise<void> {
  try {
    const today = new Date()
    const todayPrefix = `ProjectManager_Backup_${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`
    const alreadyToday = listBackups().some((b) => b.fileName.startsWith(todayPrefix))
    if (alreadyToday) return
    await createBackup()
    pruneOldBackups()
  } catch (error) {
    console.error('Auto backup failed:', error)
  }
}

export async function exportBackupToUserPath(): Promise<
  { ok: true; path: string } | { ok: false; canceled?: boolean; message?: string }
> {
  const result = await dialog.showSaveDialog({
    title: 'ذخیره‌ی نسخه‌ی پشتیبان',
    defaultPath: formatBackupFilename(new Date()),
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  })
  if (result.canceled || !result.filePath) return { ok: false, canceled: true }

  try {
    await createBackup(result.filePath)
    return { ok: true, path: result.filePath }
  } catch (error) {
    console.error(error)
    return { ok: false, message: 'خطا در ذخیره‌ی نسخه‌ی پشتیبان' }
  }
}

function isValidBackupFile(path: string): boolean {
  try {
    const testDb = new Database(path, { readonly: true })
    const row = testDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'")
      .get()
    testDb.close()
    return Boolean(row)
  } catch {
    return false
  }
}

/**
 * بازیابی: قبل از هر چیز از وضعیت فعلی یک بک‌آپ ایمنی گرفته می‌شه (طبق EG-17: Restore
 * نباید اطلاعات فعلی رو بدون داشتن نسخه‌ی پشتیبان از بین ببره)، بعد Connection فعلی
 * بسته و فایل جایگزین می‌شه. برنامه باید بعدش ری‌استارت بشه (از renderer صدا زده می‌شه).
 */
async function restoreFromPath(sourcePath: string): Promise<{ ok: boolean; message?: string }> {
  if (!isValidBackupFile(sourcePath)) {
    return { ok: false, message: 'فایل انتخاب‌شده یک بک‌آپ معتبر نیست.' }
  }

  try {
    await createBackup() // بک‌آپ ایمنی از وضعیت فعلی، قبل از بازنویسی
    closeDatabase()
    copyFileSync(sourcePath, getDatabasePath())
    return { ok: true }
  } catch (error) {
    console.error(error)
    return { ok: false, message: 'خطا در بازیابی نسخه‌ی پشتیبان' }
  }
}

export async function restoreFromUserSelectedFile(): Promise<{
  ok: boolean
  message?: string
  canceled?: boolean
}> {
  const result = await dialog.showOpenDialog({
    title: 'انتخاب فایل بک‌آپ برای بازیابی',
    properties: ['openFile'],
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return { ok: false, canceled: true }
  return restoreFromPath(result.filePaths[0])
}

export async function restoreFromAutoBackup(fileName: string): Promise<{
  ok: boolean
  message?: string
}> {
  const backup = listBackups().find((b) => b.fileName === fileName)
  if (!backup) return { ok: false, message: 'فایل بک‌آپ پیدا نشد' }
  return restoreFromPath(backup.path)
}

export function getBackupsFolderPath(): string {
  return getBackupsDir()
}
