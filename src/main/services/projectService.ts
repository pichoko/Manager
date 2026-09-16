import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { getDatabase, getFirstActiveSetting } from '../database/client'
import { projectEvents, timeline } from '../database/schema'
import {
  createProject as createProjectRecord,
  getProjectById,
  listProjects as listProjectRecords,
  updateProject as updateProjectRecord,
  updateProjectStatusStage,
  updateQuotaDeduction as updateQuotaDeductionRecord,
  type CreateProjectInput as RepositoryCreateProjectInput
} from '../database/repositories/projects'
import { listSettingsByCategory } from '../database/repositories/settings'

// در رابط کاربری، statusId/stageId دیگه از فرم ساخت پروژه گرفته نمی‌شن (طبق تصمیم اخیر) -
// اگه کاربر چیزی نفرسته، اولین وضعیت/مرحله‌ی فعال به‌صورت خودکار انتخاب می‌شه.
export type CreateProjectRequest = Omit<RepositoryCreateProjectInput, 'statusId' | 'stageId'> & {
  statusId?: string
  stageId?: string
}

export function listProjects() {
  return listProjectRecords()
}

export function getProject(id: string) {
  return getProjectById(id)
}

function resolveDefaultStatusAndStage(): { statusId: string; stageId: string } {
  const status = getFirstActiveSetting('status')
  const stage = getFirstActiveSetting('stage')
  if (!status || !stage) {
    throw new Error('هیچ وضعیت یا مرحله‌ی فعالی در تنظیمات پیدا نشد.')
  }
  return { statusId: status.id, stageId: stage.id }
}

/**
 * ثبت پروژه + ثبت خودکار رویداد «پروژه ایجاد شد» در Timeline.
 * طبق EG-12 (Logging & Audit Strategy): ایجاد پروژه یکی از رویدادهای الزامی Timeline است.
 */
export function createProject(input: CreateProjectRequest): string {
  const defaults = input.statusId && input.stageId ? null : resolveDefaultStatusAndStage()

  const id = createProjectRecord({
    ...input,
    statusId: input.statusId ?? defaults!.statusId,
    stageId: input.stageId ?? defaults!.stageId
  })

  const db = getDatabase()
  db.insert(timeline)
    .values({
      id: randomUUID(),
      projectId: id,
      eventType: 'project_created',
      title: 'پروژه ایجاد شد',
      eventDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    })
    .run()

  return id
}

export function updateProject(id: string, input: Partial<RepositoryCreateProjectInput>): void {
  updateProjectRecord(id, input)
}

export interface ChangeStatusStageInput {
  statusId?: string
  stageId?: string
  reason?: string
}

/**
 * هر تغییر وضعیت یا مرحله باید تاریخ‌دار و قابل‌پیگیری باشه (طبق درخواست کاربر و
 * قوانین ProjectEvents/Timeline در Blueprint). هر فیلدی که واقعاً تغییر کنه، یک رکورد
 * مستقل در project_events (با مقدار قبلی/جدید) و یک رویداد در Timeline می‌سازه.
 */
export function changeProjectStatusStage(projectId: string, input: ChangeStatusStageInput): void {
  const project = getProjectById(projectId)
  if (!project) throw new Error('پروژه یافت نشد')

  const db = getDatabase()
  const now = new Date().toISOString()

  const statusOptions = listSettingsByCategory('status')
  const stageOptions = listSettingsByCategory('stage')

  const logChange = (
    eventType: 'status_changed' | 'stage_changed',
    oldId: string,
    newId: string,
    options: Array<{ id: string; name: string }>,
    label: string
  ): void => {
    const oldName = options.find((o) => o.id === oldId)?.name ?? oldId
    const newName = options.find((o) => o.id === newId)?.name ?? newId

    db.insert(projectEvents)
      .values({
        id: randomUUID(),
        projectId,
        eventType,
        oldValue: oldName,
        newValue: newName,
        reason: input.reason ?? null,
        eventDate: now,
        createdAt: now
      })
      .run()

    db.insert(timeline)
      .values({
        id: randomUUID(),
        projectId,
        eventType,
        title: `${label} تغییر کرد`,
        description: `${oldName} ← ${newName}`,
        eventDate: now,
        createdAt: now
      })
      .run()
  }

  if (input.statusId && input.statusId !== project.statusId) {
    logChange('status_changed', project.statusId, input.statusId, statusOptions, 'وضعیت')
  }
  if (input.stageId && input.stageId !== project.stageId) {
    logChange('stage_changed', project.stageId, input.stageId, stageOptions, 'مرحله')
  }

  updateProjectStatusStage(projectId, {
    statusId: input.statusId,
    stageId: input.stageId
  })
}

export interface UpdateQuotaDeductionRequest {
  quotaDeductorName?: string
  quotaDeductionDate?: string
}

export function updateQuotaDeduction(projectId: string, input: UpdateQuotaDeductionRequest): void {
  updateQuotaDeductionRecord(projectId, input)

  const db = getDatabase()
  const now = new Date().toISOString()
  db.insert(timeline)
    .values({
      id: randomUUID(),
      projectId,
      eventType: 'quota_deduction_updated',
      title: 'اطلاعات کسر سهمیه ثبت/ویرایش شد',
      description: input.quotaDeductorName
        ? `کسر سهمیه توسط ${input.quotaDeductorName} در تاریخ ${input.quotaDeductionDate ?? '—'}`
        : null,
      eventDate: now,
      createdAt: now
    })
    .run()
}

export function getProjectStatusStageHistory(projectId: string) {
  const db = getDatabase()
  return db.select().from(projectEvents).where(eq(projectEvents.projectId, projectId)).all()
}
