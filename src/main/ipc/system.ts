import { ipcMain, shell } from 'electron'
import { getDatabase, getDatabasePath } from '../database/client'
import { projects } from '../database/schema'

export function registerSystemIpc(): void {
  const db = getDatabase()

  ipcMain.handle('db:ping', () => {
    const count = db.select().from(projects).all().length
    return { ok: true, projectCount: count, dbPath: getDatabasePath() }
  })

  ipcMain.handle('db:openFolder', () => {
    shell.showItemInFolder(getDatabasePath())
  })
}
