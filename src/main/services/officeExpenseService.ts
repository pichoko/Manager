import {
  createOfficeExpense as createRecord,
  deleteOfficeExpense as deleteRecord,
  listOfficeExpenses as listRecords,
  type CreateOfficeExpenseInput
} from '../database/repositories/officeExpenses'

export type { CreateOfficeExpenseInput }

export function listOfficeExpenses() {
  return listRecords()
}

export function createOfficeExpense(input: CreateOfficeExpenseInput): string {
  return createRecord(input)
}

export function deleteOfficeExpense(id: string): void {
  deleteRecord(id)
}

export function getOfficeExpensesSummary(): { total: number; thisMonthTotal: number } {
  const items = listRecords()
  const total = items.reduce((sum, i) => sum + i.amount, 0)

  const now = new Date()
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthTotal = items
    .filter((i) => i.expenseDate.startsWith(currentMonthPrefix))
    .reduce((sum, i) => sum + i.amount, 0)

  return { total, thisMonthTotal }
}
