import { ipcMain } from 'electron'
import { listTimelineByProject } from '../database/repositories/timeline'

export function registerTimelineIpc(): void {
  ipcMain.handle('timeline:listByProject', (_event, projectId: string) => {
    try {
      return { ok: true, data: listTimelineByProject(projectId) }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت تاریخچه' } }
    }
  })
}
