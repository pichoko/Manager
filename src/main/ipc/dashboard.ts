import { ipcMain } from 'electron'
import { getDashboardData } from '../services/dashboardService'

export function registerDashboardIpc(): void {
  ipcMain.handle('dashboard:getData', () => {
    try {
      return { ok: true, data: getDashboardData() }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت اطلاعات داشبورد' } }
    }
  })
}
