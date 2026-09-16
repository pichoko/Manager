import { desc, eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { getDatabase } from '../client'
import { tariffRules, tariffVersions } from '../schema'

export function getActiveTariffVersion() {
  const db = getDatabase()
  return db.select().from(tariffVersions).where(eq(tariffVersions.isActive, true)).get()
}

export function listTariffVersions() {
  const db = getDatabase()
  return db.select().from(tariffVersions).orderBy(desc(tariffVersions.year)).all()
}

export interface CreateTariffVersionInput {
  year: number
  title: string
  copyFromVersionId?: string
}

/**
 * نسخه‌ی جدید هیچ‌وقت جای نسخه‌ی قبلی رو نمی‌گیره - همه کنار هم توی سیستم می‌مونن
 * (طبق درخواست کاربر). فقط پرچم isActive جابه‌جا می‌شه تا مشخص باشه پیش‌فرض محاسبه
 * کدومه؛ ولی هر پروژه‌ای می‌تونه موقع محاسبه، هر نسخه‌ای رو صریحاً انتخاب کنه.
 */
export function createTariffVersion(input: CreateTariffVersionInput): string {
  const db = getDatabase()
  const id = randomUUID()

  // نسخه‌ی جدید پیش‌فرض می‌شه؛ نسخه‌های قبلی هنوز کامل توی سیستم می‌مونن، فقط دیگه
  // پیش‌فرض نیستن (بدون شرط WHERE یعنی همه‌ی ردیف‌ها آپدیت می‌شن)
  db.update(tariffVersions).set({ isActive: false }).run()

  db.insert(tariffVersions)
    .values({
      id,
      year: input.year,
      title: input.title,
      isActive: true,
      createdAt: new Date().toISOString()
    })
    .run()

  if (input.copyFromVersionId) {
    const sourceRules = db
      .select()
      .from(tariffRules)
      .where(eq(tariffRules.tariffVersionId, input.copyFromVersionId))
      .all()

    for (const rule of sourceRules) {
      db.insert(tariffRules)
        .values({
          id: randomUUID(),
          tariffVersionId: id,
          discipline: rule.discipline,
          minFloors: rule.minFloors,
          maxFloors: rule.maxFloors,
          minArea: rule.minArea,
          maxArea: rule.maxArea,
          unitRate: rule.unitRate,
          displayOrder: rule.displayOrder,
          createdAt: new Date().toISOString()
        })
        .run()
    }
  }

  return id
}

export function listTariffRules(tariffVersionId: string) {
  const db = getDatabase()
  return db
    .select()
    .from(tariffRules)
    .where(eq(tariffRules.tariffVersionId, tariffVersionId))
    .all()
}

export interface CreateTariffRuleInput {
  tariffVersionId: string
  discipline: string
  minFloors: number
  maxFloors?: number
  minArea: number
  maxArea?: number
  unitRate: number
  displayOrder?: number
}

export function createTariffRule(input: CreateTariffRuleInput): string {
  const db = getDatabase()
  const id = randomUUID()
  db.insert(tariffRules)
    .values({
      id,
      tariffVersionId: input.tariffVersionId,
      discipline: input.discipline,
      minFloors: input.minFloors,
      maxFloors: input.maxFloors ?? null,
      minArea: input.minArea,
      maxArea: input.maxArea ?? null,
      unitRate: input.unitRate,
      displayOrder: input.displayOrder ?? 0,
      createdAt: new Date().toISOString()
    })
    .run()
  return id
}

export function updateTariffRule(id: string, input: Partial<CreateTariffRuleInput>): void {
  const db = getDatabase()
  db.update(tariffRules).set(input).where(eq(tariffRules.id, id)).run()
}

export function deleteTariffRule(id: string): void {
  const db = getDatabase()
  db.delete(tariffRules).where(eq(tariffRules.id, id)).run()
}
