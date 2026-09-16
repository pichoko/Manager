import { ipcMain } from 'electron'
import { createSetting, listSettingsByCategory } from '../database/repositories/settings'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:listByCategory', (_event, category: string) => {
    try {
      return { ok: true, data: listSettingsByCategory(category) }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت تنظیمات' } }
    }
  })

  ipcMain.handle('settings:create', (_event, category: string, name: string) => {
    try {
      if (!name.trim()) {
        return { ok: false, error: { code: 'VALIDATION', message: 'نام نمی‌تواند خالی باشد' } }
      }
      const id = createSetting(category, name.trim())
      return { ok: true, data: { id } }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در افزودن مورد جدید' } }
    }
  })
}
