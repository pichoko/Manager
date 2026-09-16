import { randomUUID } from 'crypto'
import { getDatabase } from '../database/client'
import { timeline } from '../database/schema'
import {
  createFinancialEvent as createFinancialEventRecord,
  listFinancialEventsByProject,
  type FinancialEventType
} from '../database/repositories/financialEvents'

export type { FinancialEventType }

const EVENT_TITLES: Record<FinancialEventType, string> = {
  estimate: 'برآورد قیمتی ثبت شد',
  discount: 'تخفیف اعمال شد',
  payment: 'پرداخت ثبت شد',
  refund: 'استرداد وجه ثبت شد'
}

export interface FinancialSummary {
  estimateTotal: number
  discountTotal: number
  contractAmount: number
  totalPayments: number
  balance: number
}

/**
 * طبق توضیح کاربر: «برآورد قیمتی» شامل ۱۰۰٪ مبلغ پروژه‌ست، و «مبلغ قرارداد» ممکنه به‌خاطر
 * تخفیف کمتر از برآورد باشه (مثلاً ۷۵٪ برآورد). این عدد هیچ‌وقت ذخیره نمی‌شه، همیشه لحظه‌ای
 * از روی رویدادهای مالی محاسبه می‌شه.
 */
export function computeFinancialSummary(projectId: string): FinancialSummary {
  const events = listFinancialEventsByProject(projectId)
  let estimateTotal = 0
  let discountTotal = 0
  let totalPayments = 0

  for (const event of events) {
    switch (event.eventType) {
      case 'estimate':
        estimateTotal += event.amount
        break
      case 'discount':
        discountTotal += event.amount
        break
      case 'payment':
        totalPayments += event.amount
        break
      case 'refund':
        totalPayments -= event.amount
        break
    }
  }

  const contractAmount = estimateTotal - discountTotal
  return { estimateTotal, discountTotal, contractAmount, totalPayments, balance: contractAmount - totalPayments }
}

export function listFinancialEvents(projectId: string) {
  return listFinancialEventsByProject(projectId)
}

export interface CreateFinancialEventRequest {
  projectId: string
  eventType: FinancialEventType
  eventDate: string
  description?: string
  paymentMethodId?: string
  referenceNumber?: string
  // برای estimate/payment/refund و تخفیف با نوع «مبلغ ثابت»:
  amount?: number
  // فقط برای تخفیف با نوع «درصد»:
  discountMode?: 'fixed' | 'percent'
  percent?: number
}

/**
 * اگه تخفیف از نوع «درصد» باشه، مبلغ نهایی این‌جا (در Backend، نه در رابط کاربری) محاسبه
 * و Snapshot می‌شه - طبق همون اصل Tariff Snapshot در Blueprint: تغییرات آینده‌ی برآورد
 * نباید محاسبات گذشته رو عوض کنه.
 */
export function createFinancialEvent(input: CreateFinancialEventRequest): string {
  let amount: number
  let discountPercent: number | undefined
  let baseAmount: number | undefined

  if (input.eventType === 'discount' && input.discountMode === 'percent') {
    const summary = computeFinancialSummary(input.projectId)
    baseAmount = summary.estimateTotal
    discountPercent = input.percent ?? 0
    amount = Math.round((discountPercent / 100) * baseAmount)
  } else {
    amount = input.amount ?? 0
  }

  const id = createFinancialEventRecord({
    projectId: input.projectId,
    eventType: input.eventType,
    amount,
    discountPercent,
    baseAmount,
    eventDate: input.eventDate,
    paymentMethodId: input.eventType === 'payment' ? input.paymentMethodId : undefined,
    referenceNumber: input.referenceNumber,
    description: input.description
  })

  // طبق EG-12: تمام Eventهای مالی باید در Timeline هم ثبت بشن
  const db = getDatabase()
  db.insert(timeline)
    .values({
      id: randomUUID(),
      projectId: input.projectId,
      eventType: input.eventType,
      title: EVENT_TITLES[input.eventType],
      description: input.description ?? null,
      eventDate: input.eventDate,
      metadata: JSON.stringify({ financialEventId: id, amount, discountPercent, baseAmount }),
      createdAt: new Date().toISOString()
    })
    .run()

  return id
}
