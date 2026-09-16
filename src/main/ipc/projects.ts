import { ipcMain } from 'electron'
import {
  changeProjectStatusStage,
  createProject,
  getProject,
  getProjectStatusStageHistory,
  listProjects,
  updateProject,
  updateQuotaDeduction,
  type ChangeStatusStageInput,
  type CreateProjectRequest,
  type UpdateQuotaDeductionRequest
} from '../services/projectService'
import type { CreateProjectInput } from '../database/repositories/projects'

interface SqliteLikeError {
  code?: string
  message: string
}

function isSqliteError(error: unknown): error is SqliteLikeError {
  return typeof error === 'object' && error !== null && 'message' in error
}

export function registerProjectsIpc(): void {
  ipcMain.handle('projects:list', () => {
    try {
      return { ok: true, data: listProjects() }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت لیست پروژه‌ها' } }
    }
  })

  ipcMain.handle('projects:getById', (_event, id: string) => {
    try {
      const project = getProject(id)
      if (!project) {
        return { ok: false, error: { code: 'NOT_FOUND', message: 'پروژه یافت نشد' } }
      }
      return { ok: true, data: project }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت پروژه' } }
    }
  })

  ipcMain.handle('projects:create', (_event, input: CreateProjectRequest) => {
    try {
      const id = createProject(input)
      return { ok: true, data: { id } }
    } catch (error) {
      if (isSqliteError(error) && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return {
          ok: false,
          error: { code: 'DUPLICATE_PROJECT_NUMBER', message: 'این شماره پروژه قبلاً ثبت شده است.' }
        }
      }
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در ثبت پروژه' } }
    }
  })

  ipcMain.handle('projects:update', (_event, id: string, input: Partial<CreateProjectInput>) => {
    try {
      updateProject(id, input)
      return { ok: true }
    } catch (error) {
      if (isSqliteError(error) && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return {
          ok: false,
          error: { code: 'DUPLICATE_PROJECT_NUMBER', message: 'این شماره پروژه قبلاً ثبت شده است.' }
        }
      }
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در ویرایش پروژه' } }
    }
  })

  ipcMain.handle(
    'projects:changeStatusStage',
    (_event, id: string, input: ChangeStatusStageInput) => {
      try {
        changeProjectStatusStage(id, input)
        return { ok: true }
      } catch (error) {
        console.error(error)
        return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در تغییر وضعیت/مرحله' } }
      }
    }
  )

  ipcMain.handle(
    'projects:updateQuotaDeduction',
    (_event, id: string, input: UpdateQuotaDeductionRequest) => {
      try {
        updateQuotaDeduction(id, input)
        return { ok: true }
      } catch (error) {
        console.error(error)
        return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در ثبت اطلاعات کسر سهمیه' } }
      }
    }
  )

  ipcMain.handle('projects:statusStageHistory', (_event, id: string) => {
    try {
      return { ok: true, data: getProjectStatusStageHistory(id) }
    } catch (error) {
      console.error(error)
      return { ok: false, error: { code: 'DB_ERROR', message: 'خطا در دریافت تاریخچه' } }
    }
  })
}
