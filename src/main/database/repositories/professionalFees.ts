import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { getDatabase } from '../client'
import { professionalFees } from '../schema'

export type FeeType = 'checker' | 'stamper'

export interface CreateProfessionalFeeInput {
  projectId: string
  feeType: FeeType
  personName: string
  amountDue: number
  description?: string
}

export function listProfessionalFeesByProject(projectId: string) {
  const db = getDatabase()
  return db
    .select()
    .from(professionalFees)
    .where(eq(professionalFees.projectId, projectId))
    .all()
}

export function createProfessionalFee(input: CreateProfessionalFeeInput): string {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()

  db.insert(professionalFees)
    .values({
      id,
      projectId: input.projectId,
      feeType: input.feeType,
      personName: input.personName,
      amountDue: input.amountDue,
      amountPaid: 0,
      settled: false,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now
    })
    .run()

  return id
}

export interface UpdateProfessionalFeeInput {
  amountPaid?: number
  settled?: boolean
  settledAt?: string | null
}

export function updateProfessionalFee(id: string, input: UpdateProfessionalFeeInput): void {
  const db = getDatabase()
  db.update(professionalFees)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(professionalFees.id, id))
    .run()
}

export function deleteProfessionalFee(id: string): void {
  const db = getDatabase()
  db.delete(professionalFees).where(eq(professionalFees.id, id)).run()
}
