import { ipcMain } from 'electron'
import {
  createOfficeExpense,
  deleteOfficeExpense,
  getOfficeExpensesSummary,
  listOfficeExpenses,
  type CreateOfficeExpenseInput
} from '../services/officeExpenseService'

export function registerOfficeExpensesIpc(): void {
  ipcMain.handle('officeExpenses:list', () => {
    try {
      return { ok: true, data: listOfficeExpenses() }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت هزینه‌ها' } }
    }
  })

  ipcMain.handle('officeExpenses:summary', () => {
    try {
      return { ok: true, data: getOfficeExpensesSummary() }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در محاسبه‌ی خلاصه‌ی هزینه‌ها' } }
    }
  })

  ipcMain.handle('officeExpenses:create', (_event, input: CreateOfficeExpenseInput) => {
    try {
      const id = createOfficeExpense(input)
      return { ok: true, data: { id } }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در ثبت هزینه' } }
    }
  })

  ipcMain.handle('officeExpenses:delete', (_event, id: string) => {
    try {
      deleteOfficeExpense(id)
      return { ok: true }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در حذف هزینه' } }
    }
  })
}
