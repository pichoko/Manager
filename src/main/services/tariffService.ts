import {
  createTariffRule,
  createTariffVersion,
  deleteTariffRule,
  getActiveTariffVersion,
  listTariffRules,
  listTariffVersions,
  updateTariffRule,
  type CreateTariffRuleInput,
  type CreateTariffVersionInput
} from '../database/repositories/tariff'

export type { CreateTariffRuleInput, CreateTariffVersionInput }

export function listVersions() {
  return listTariffVersions()
}

export function createVersion(input: CreateTariffVersionInput): string {
  return createTariffVersion(input)
}

export function listRules(tariffVersionId: string) {
  return listTariffRules(tariffVersionId)
}

export function createRule(input: CreateTariffRuleInput): string {
  return createTariffRule(input)
}

export function updateRule(id: string, input: Partial<CreateTariffRuleInput>): void {
  updateTariffRule(id, input)
}

export function removeRule(id: string): void {
  deleteTariffRule(id)
}

export interface TariffCalculationInput {
  discipline: string
  floorCount: number
  area: number
  tariffVersionId?: string
}

export interface TariffCalculationResult {
  ok: true
  unitRate: number
  amount: number
  ruleDescription: string
  tariffYear: number
  tariffVersionId: string
}

export interface TariffCalculationError {
  ok: false
  message: string
}

/**
 * طبق Blueprint بخش ۱۸ (Tariff Engine): مبلغ پیشنهادی = متراژ × تعرفه واحد.
 * اگه tariffVersionId صریحاً داده نشه، از نسخه‌ی پیش‌فرض (isActive) استفاده می‌شه؛ ولی
 * کاربر همیشه می‌تونه هر سالی رو صریحاً انتخاب کنه (طبق درخواست: چند سال هم‌زمان توی
 * سیستم بمونن و هرکدوم برای پروژه‌ی خودش استفاده بشه).
 */
export function calculateTariff(
  input: TariffCalculationInput
): TariffCalculationResult | TariffCalculationError {
  const version = input.tariffVersionId
    ? listTariffVersions().find((v) => v.id === input.tariffVersionId)
    : getActiveTariffVersion()

  if (!version) {
    return { ok: false, message: 'هیچ نسخه‌ی تعرفه‌ای در تنظیمات ثبت نشده است.' }
  }

  const rules = listTariffRules(version.id).filter((r) => r.discipline === input.discipline)

  const matched = rules.find(
    (r) =>
      input.floorCount >= r.minFloors &&
      (r.maxFloors == null || input.floorCount <= r.maxFloors) &&
      input.area >= r.minArea &&
      (r.maxArea == null || input.area <= r.maxArea)
  )

  if (!matched) {
    return {
      ok: false,
      message: `برای ${input.floorCount} سقف و ${input.area} متر مربع، در تعرفه‌ی سال ${version.year} قانونی پیدا نشد.`
    }
  }

  return {
    ok: true,
    unitRate: matched.unitRate,
    amount: Math.round(input.area * matched.unitRate),
    ruleDescription: `تعرفه ${version.year} (${input.floorCount} سقف، ${input.area} متر) × ${matched.unitRate.toLocaleString('en-US')} تومان`,
    tariffYear: version.year,
    tariffVersionId: version.id
  }
}
