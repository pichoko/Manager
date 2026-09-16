import { randomUUID } from 'crypto'
import { desc, eq, isNull, and } from 'drizzle-orm'
import { getDatabase } from '../client'
import { officeExpenses } from '../schema'

export interface CreateOfficeExpenseInput {
  category: string
  amount: number
  expenseDate: string
  description?: string
}

export function listOfficeExpenses() {
  const db = getDatabase()
  return db
    .select()
    .from(officeExpenses)
    .where(isNull(officeExpenses.deletedAt))
    .orderBy(desc(officeExpenses.expenseDate))
    .all()
}

export function createOfficeExpense(input: CreateOfficeExpenseInput): string {
  const db = getDatabase()
  const id = randomUUID()
  const now = new Date().toISOString()
  db.insert(officeExpenses)
    .values({
      id,
      category: input.category,
      amount: input.amount,
      expenseDate: input.expenseDate,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now
    })
    .run()
  return id
}

/** طبق اصل ششم Blueprint: حذف دائمی اطلاعات ممنوع است - فقط Soft Delete */
export function deleteOfficeExpense(id: string): void {
  const db = getDatabase()
  db.update(officeExpenses)
    .set({ deletedAt: new Date().toISOString() })
    .where(and(eq(officeExpenses.id, id), isNull(officeExpenses.deletedAt)))
    .run()
}
