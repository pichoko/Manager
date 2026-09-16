import { ipcMain } from 'electron'
import {
  createProfessionalFee,
  deleteProfessionalFee,
  listProfessionalFees,
  updateProfessionalFee,
  type CreateProfessionalFeeInput,
  type FeeType,
  type UpdateProfessionalFeeInput
} from '../services/professionalFeeService'

export function registerProfessionalFeesIpc(): void {
  ipcMain.handle('professionalFees:listByProject', (_event, projectId: string) => {
    try {
      return { ok: true, data: listProfessionalFees(projectId) }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت دستمزدها' } }
    }
  })

  ipcMain.handle('professionalFees:create', (_event, input: CreateProfessionalFeeInput) => {
    try {
      const id = createProfessionalFee(input)
      return { ok: true, data: { id } }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در ثبت دستمزد' } }
    }
  })

  ipcMain.handle(
    'professionalFees:update',
    (
      _event,
      id: string,
      projectId: string,
      personName: string,
      feeType: FeeType,
      input: UpdateProfessionalFeeInput
    ) => {
      try {
        updateProfessionalFee(id, projectId, personName, feeType, input)
        return { ok: true }
      } catch (error) {
        console.error(error)
        return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در ویرایش دستمزد' } }
      }
    }
  )

  ipcMain.handle('professionalFees:delete', (_event, id: string) => {
    try {
      deleteProfessionalFee(id)
      return { ok: true }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در حذف دستمزد' } }
    }
  })
}
