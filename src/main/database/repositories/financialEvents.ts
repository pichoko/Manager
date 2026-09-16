import { randomUUID } from 'crypto'
import { asc, eq } from 'drizzle-orm'
import { getDatabase } from '../client'
import { financialEvents } from '../schema'

export type FinancialEventType = 'estimate' | 'discount' | 'payment' | 'refund'

export interface CreateFinancialEventInput {
  projectId: string
  eventType: FinancialEventType
  amount: number
  discountPercent?: number
  baseAmount?: number
  eventDate: string
  paymentMethodId?: string
  referenceNumber?: string
  description?: string
}

export function listFinancialEventsByProject(projectId: string) {
  const db = getDatabase()
  return db
    .select()
    .from(financialEvents)
    .where(eq(financialEvents.projectId, projectId))
    .orderBy(asc(financialEvents.eventDate))
    .all()
}

export function createFinancialEvent(input: CreateFinancialEventInput): string {
  const db = getDatabase()
  const id = randomUUID()

  db.insert(financialEvents)
    .values({
      id,
      projectId: input.projectId,
      eventType: input.eventType,
      amount: input.amount,
      discountPercent: input.discountPercent ?? null,
      baseAmount: input.baseAmount ?? null,
      eventDate: input.eventDate,
      paymentMethodId: input.paymentMethodId ?? null,
      referenceNumber: input.referenceNumber ?? null,
      description: input.description ?? null,
      createdAt: new Date().toISOString()
    })
    .run()

  return id
}
