import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { getDatabase } from '../client'
import { projects } from '../schema'

export interface CreateProjectInput {
  projectNumber: string
  ownerName: string
  projectName?: string
  phoneNumber?: string
  city?: string
  renovationCode?: string
  projectCode?: string
  referrerName?: string
  checkerName?: string
  initialArea?: number
  floorCount?: number
  frameTypeId?: string
  description?: string
  statusId: string
  stageId: string
}

// این فایل فقط و فقط با دیتابیس کار می‌کنه (Repository خالص، طبق EG-03).
// هرگونه منطق تجاری (مثل ثبت خودکار Timeline) در لایه‌ی Service انجام می‌شه.

export function listProjects() {
  const db = getDatabase()
  return db.select().from(projects).all()
}

export function getProjectById(id: string) {
  const db = getDatabase()
  return db.select().from(projects).where(eq(projects.id, id)).get()
}

export function createProject(input: CreateProjectInput): string {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.insert(projects)
    .values({
      id,
      projectNumber: input.projectNumber,
      projectName: input.projectName ?? null,
      ownerName: input.ownerName,
      phoneNumber: input.phoneNumber ?? null,
      city: input.city ?? null,
      renovationCode: input.renovationCode ?? null,
      projectCode: input.projectCode ?? null,
      referrerName: input.referrerName ?? null,
      checkerName: input.checkerName ?? null,
      statusId: input.statusId,
      stageId: input.stageId,
      initialArea: input.initialArea ?? null,
      floorCount: input.floorCount ?? null,
      frameTypeId: input.frameTypeId ?? null,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now
    })
    .run()

  return id
}

export function updateProject(id: string, input: Partial<CreateProjectInput>): void {
  const db = getDatabase()
  const now = new Date().toISOString()
  db.update(projects)
    .set({ ...input, updatedAt: now })
    .where(eq(projects.id, id))
    .run()
}

export interface UpdateStatusStageInput {
  statusId?: string
  stageId?: string
}

export function updateProjectStatusStage(id: string, input: UpdateStatusStageInput): void {
  const db = getDatabase()
  const now = new Date().toISOString()
  db.update(projects)
    .set({ ...input, updatedAt: now })
    .where(eq(projects.id, id))
    .run()
}

export interface UpdateQuotaDeductionInput {
  quotaDeductorName?: string
  quotaDeductionDate?: string
}

export function updateQuotaDeduction(id: string, input: UpdateQuotaDeductionInput): void {
  const db = getDatabase()
  const now = new Date().toISOString()
  db.update(projects)
    .set({ ...input, updatedAt: now })
    .where(eq(projects.id, id))
    .run()
}

