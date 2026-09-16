import { randomUUID } from 'crypto'
import { getDatabase } from '../database/client'
import { timeline } from '../database/schema'
import {
  createProfessionalFee as createProfessionalFeeRecord,
  deleteProfessionalFee as deleteProfessionalFeeRecord,
  listProfessionalFeesByProject,
  updateProfessionalFee as updateProfessionalFeeRecord,
  type CreateProfessionalFeeInput,
  type FeeType,
  type UpdateProfessionalFeeInput
} from '../database/repositories/professionalFees'

export type { CreateProfessionalFeeInput, FeeType, UpdateProfessionalFeeInput }

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  checker: 'چکر',
  stamper: 'مهر'
}

export function listProfessionalFees(projectId: string) {
  return listProfessionalFeesByProject(projectId)
}

export function createProfessionalFee(input: CreateProfessionalFeeInput): string {
  const id = createProfessionalFeeRecord(input)

  const db = getDatabase()
  db.insert(timeline)
    .values({
      id: randomUUID(),
      projectId: input.projectId,
      eventType: 'professional_fee_added',
      title: `دستمزد ${FEE_TYPE_LABELS[input.feeType]} ثبت شد`,
      description: `${input.personName} - ${input.amountDue.toLocaleString('en-US')} تومان`,
      eventDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString()
    })
    .run()

  return id
}

/**
 * تسویه یا ثبت پرداخت جزئی. اگه settled=true بشه و تاریخی داده نشده باشه، خودکار
 * تاریخ امروز به‌عنوان تاریخ تسویه ثبت می‌شه.
 */
export function updateProfessionalFee(
  id: string,
  projectId: string,
  personName: string,
  feeType: FeeType,
  input: UpdateProfessionalFeeInput
): void {
  const patch: UpdateProfessionalFeeInput = { ...input }
  if (input.settled && !input.settledAt) {
    patch.settledAt = new Date().toISOString().slice(0, 10)
  }

  updateProfessionalFeeRecord(id, patch)

  if (input.settled) {
    const db = getDatabase()
    db.insert(timeline)
      .values({
        id: randomUUID(),
        projectId,
        eventType: 'professional_fee_settled',
        title: `دستمزد ${FEE_TYPE_LABELS[feeType]} تسویه شد`,
        description: personName,
        eventDate: patch.settledAt ?? new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString()
      })
      .run()
  }
}

export function deleteProfessionalFee(id: string): void {
  deleteProfessionalFeeRecord(id)
}
