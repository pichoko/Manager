import { ipcMain } from 'electron'
import {
  calculateTariff,
  createRule,
  createVersion,
  listRules,
  listVersions,
  removeRule,
  updateRule,
  type CreateTariffRuleInput,
  type CreateTariffVersionInput,
  type TariffCalculationInput
} from '../services/tariffService'

export function registerTariffIpc(): void {
  ipcMain.handle('tariff:calculate', (_event, input: TariffCalculationInput) => {
    try {
      const result = calculateTariff(input)
      if (!result.ok) {
        return { ok: false, error: { code: 'NO_TARIFF_RULE', message: result.message } }
      }
      return { ok: true, data: result }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در محاسبه‌ی تعرفه' } }
    }
  })

  ipcMain.handle('tariff:listVersions', () => {
    try {
      return { ok: true, data: listVersions() }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت نسخه‌های تعرفه' } }
    }
  })

  ipcMain.handle('tariff:createVersion', (_event, input: CreateTariffVersionInput) => {
    try {
      const id = createVersion(input)
      return { ok: true, data: { id } }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در ایجاد نسخه‌ی تعرفه' } }
    }
  })

  ipcMain.handle('tariff:listRules', (_event, tariffVersionId: string) => {
    try {
      return { ok: true, data: listRules(tariffVersionId) }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت قوانین تعرفه' } }
    }
  })

  ipcMain.handle('tariff:createRule', (_event, input: CreateTariffRuleInput) => {
    try {
      const id = createRule(input)
      return { ok: true, data: { id } }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در افزودن قانون تعرفه' } }
    }
  })

  ipcMain.handle(
    'tariff:updateRule',
    (_event, id: string, input: Partial<CreateTariffRuleInput>) => {
      try {
        updateRule(id, input)
        return { ok: true }
      } catch (error) {
        console.error(error)
        return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در ویرایش قانون تعرفه' } }
      }
    }
  )

  ipcMain.handle('tariff:deleteRule', (_event, id: string) => {
    try {
      removeRule(id)
      return { ok: true }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در حذف قانون تعرفه' } }
    }
  })
}
