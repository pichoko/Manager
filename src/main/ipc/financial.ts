import { ipcMain } from 'electron'
import {
  computeFinancialSummary,
  createFinancialEvent,
  listFinancialEvents,
  type CreateFinancialEventRequest
} from '../services/financialService'

export function registerFinancialIpc(): void {
  ipcMain.handle('financial:listByProject', (_event, projectId: string) => {
    try {
      return { ok: true, data: listFinancialEvents(projectId) }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت اطلاعات مالی' } }
    }
  })

  ipcMain.handle('financial:summary', (_event, projectId: string) => {
    try {
      return { ok: true, data: computeFinancialSummary(projectId) }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در محاسبه‌ی خلاصه‌ی مالی' } }
    }
  })

  ipcMain.handle('financial:create', (_event, input: CreateFinancialEventRequest) => {
    try {
      const id = createFinancialEvent(input)
      return { ok: true, data: { id } }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در ثبت رویداد مالی' } }
    }
  })
}
