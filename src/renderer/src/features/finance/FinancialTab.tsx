import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@renderer/shared/ui/Card'
import { Button } from '@renderer/shared/ui/Button'
import { Input } from '@renderer/shared/ui/Input'
import { Select } from '@renderer/shared/ui/Select'
import { AmountInput } from '@renderer/shared/ui/AmountInput'
import { DualDate } from '@renderer/shared/ui/DualDate'
import { JalaliDateInput } from '@renderer/shared/ui/JalaliDateInput'
import { formatToman } from '@renderer/shared/format'
import { todayAsIso } from '@renderer/shared/jalali'
import { ProfessionalFeesSection } from './ProfessionalFeesSection'
import type {
  FinancialEventRecord,
  FinancialSummary,
  ProjectRecord,
  SettingItem,
  TariffVersionRecord
} from '@renderer/env'

const EVENT_TYPE_LABELS: Record<string, string> = {
  estimate: 'برآورد قیمتی',
  discount: 'تخفیف',
  payment: 'پرداخت',
  refund: 'استرداد'
}

const eventSchema = z
  .object({
    eventType: z.enum(['estimate', 'discount', 'payment', 'refund']),
    discountMode: z.enum(['fixed', 'percent']).default('fixed'),
    amount: z.string().optional(),
    percent: z.string().optional(),
    eventDate: z.string().min(1, 'تاریخ الزامی است'),
    paymentMethodId: z.string().optional(),
    description: z.string().optional()
  })
  .superRefine((data, ctx) => {
    const isPercentDiscount = data.eventType === 'discount' && data.discountMode === 'percent'
    if (isPercentDiscount) {
      const p = Number(data.percent)
      if (!data.percent || p <= 0 || p > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['percent'],
          message: 'درصد باید بین ۱ تا ۱۰۰ باشد'
        })
      }
    } else {
      const a = Number(data.amount)
      if (!data.amount || a <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: 'مبلغ الزامی است' })
      }
    }
  })

type EventFormValues = z.infer<typeof eventSchema>

export function FinancialTab({ project }: { project: ProjectRecord }): JSX.Element {
  const projectId = project.id
  const [events, setEvents] = useState<FinancialEventRecord[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<SettingItem[]>([])
  const [tariffVersions, setTariffVersions] = useState<TariffVersionRecord[]>([])
  const [selectedTariffVersionId, setSelectedTariffVersionId] = useState<string>('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [tariffNote, setTariffNote] = useState<string | null>(null)
  const [tariffError, setTariffError] = useState<string | null>(null)
  const [calculating, setCalculating] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: { eventType: 'payment', discountMode: 'fixed', eventDate: todayAsIso() }
  })

  const eventType = watch('eventType')
  const discountMode = watch('discountMode')
  const isPercentDiscount = eventType === 'discount' && discountMode === 'percent'

  const load = (): void => {
    window.api.listFinancialEvents(projectId).then((res) => {
      if (res.ok && res.data) setEvents(res.data)
    })
    window.api.getFinancialSummary(projectId).then((res) => {
      if (res.ok && res.data) setSummary(res.data)
    })
  }

  useEffect(() => {
    load()
    window.api.listSettings('paymentMethod').then((res) => {
      if (res.ok && res.data) setPaymentMethods(res.data)
    })
    window.api.listTariffVersions().then((res) => {
      if (res.ok && res.data) {
        setTariffVersions(res.data)
        const active = res.data.find((v) => v.isActive) ?? res.data[0]
        if (active) setSelectedTariffVersionId(active.id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleAutoCalculate = async (): Promise<void> => {
    setTariffError(null)
    setTariffNote(null)

    if (!project.floorCount || !project.initialArea) {
      setTariffError('برای محاسبه‌ی خودکار، اول «تعداد طبقات» و «متراژ» رو در تب کلیات ثبت کنید.')
      return
    }
    if (!selectedTariffVersionId) {
      setTariffError('هیچ نسخه‌ی تعرفه‌ای در تنظیمات ثبت نشده است.')
      return
    }

    setCalculating(true)
    const res = await window.api.calculateTariff({
      discipline: 'civil',
      floorCount: project.floorCount,
      area: project.initialArea,
      tariffVersionId: selectedTariffVersionId
    })
    setCalculating(false)

    if (!res.ok || !res.data) {
      setTariffError(res.error?.message ?? 'خطا در محاسبه‌ی تعرفه')
      return
    }

    setValue('amount', String(res.data.amount))
    setValue('description', res.data.ruleDescription)
    setTariffNote(`${res.data.ruleDescription} = ${formatToman(res.data.amount)}`)
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)

    const payload: Record<string, unknown> = {
      projectId,
      eventType: values.eventType,
      eventDate: values.eventDate,
      description: values.description || undefined,
      paymentMethodId: values.eventType === 'payment' ? values.paymentMethodId : undefined
    }

    if (values.eventType === 'discount' && values.discountMode === 'percent') {
      payload.discountMode = 'percent'
      payload.percent = Number(values.percent)
    } else {
      if (values.eventType === 'discount') payload.discountMode = 'fixed'
      payload.amount = Number(values.amount)
    }

    const res = await window.api.createFinancialEvent(payload)
    if (!res.ok) {
      setServerError(res.error?.message ?? 'خطای ناشناخته رخ داد')
      return
    }
    reset({ eventType: 'payment', discountMode: 'fixed', eventDate: todayAsIso() })
    setTariffNote(null)
    load()
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <p className="text-xs text-neutral-500">برآورد قیمتی</p>
          <p className="mt-1 text-lg font-bold">{formatToman(summary?.estimateTotal ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">مبلغ قرارداد</p>
          <p className="mt-1 text-lg font-bold">{formatToman(summary?.contractAmount ?? 0)}</p>
          {(summary?.discountTotal ?? 0) > 0 && (
            <p className="mt-0.5 text-[11px] text-amber-500">
              ({formatToman(summary?.discountTotal ?? 0)} تخفیف)
            </p>
          )}
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">مجموع دریافتی</p>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {formatToman(summary?.totalPayments ?? 0)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">مانده</p>
          <p
            className={`mt-1 text-lg font-bold ${
              (summary?.balance ?? 0) > 0 ? 'text-amber-400' : 'text-neutral-300'
            }`}
          >
            {formatToman(summary?.balance ?? 0)}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold">ثبت رویداد مالی جدید</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">نوع</label>
              <Select {...register('eventType')}>
                <option value="estimate">برآورد قیمتی</option>
                <option value="discount">تخفیف</option>
                <option value="payment">پرداخت</option>
                <option value="refund">استرداد</option>
              </Select>
            </div>

            {eventType === 'discount' ? (
              <div>
                <label className="mb-1 block text-xs text-neutral-400">نوع تخفیف</label>
                <Select {...register('discountMode')}>
                  <option value="fixed">مبلغ ثابت</option>
                  <option value="percent">درصد از برآورد</option>
                </Select>
              </div>
            ) : eventType === 'estimate' && tariffVersions.length > 0 ? (
              <div>
                <label className="mb-1 block text-xs text-neutral-400">سال تعرفه (برای محاسبه)</label>
                <Select
                  value={selectedTariffVersionId}
                  onChange={(e) => setSelectedTariffVersionId(e.target.value)}
                >
                  {tariffVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} {v.isActive ? '(پیش‌فرض)' : ''}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isPercentDiscount ? (
              <div>
                <label className="mb-1 block text-xs text-neutral-400">درصد تخفیف</label>
                <Input type="number" min={1} max={100} {...register('percent')} placeholder="مثلاً 25" />
                {errors.percent && (
                  <p className="mt-1 text-xs text-red-400">{errors.percent.message}</p>
                )}
                {summary && watch('percent') && (
                  <p className="mt-1 text-xs text-neutral-500">
                    معادل تقریبی:{' '}
                    {formatToman(Math.round((Number(watch('percent')) / 100) * summary.estimateTotal))}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs text-neutral-400">مبلغ (تومان)</label>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <AmountInput
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="0"
                    />
                  )}
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-400">{errors.amount.message}</p>
                )}
                {eventType === 'estimate' && (
                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={handleAutoCalculate}
                      disabled={calculating}
                      className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                    >
                      {calculating ? 'در حال محاسبه...' : '⚡ محاسبه خودکار طبق تعرفه (عمران)'}
                    </button>
                    {tariffNote && (
                      <p className="mt-1 text-[11px] text-neutral-500">{tariffNote}</p>
                    )}
                    {tariffError && (
                      <p className="mt-1 text-[11px] text-amber-500">{tariffError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-neutral-400">تاریخ</label>
              <Controller
                control={control}
                name="eventDate"
                render={({ field }) => (
                  <JalaliDateInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
            </div>
          </div>

          {eventType === 'payment' && (
            <div>
              <label className="mb-1 block text-xs text-neutral-400">روش پرداخت</label>
              <Select {...register('paymentMethodId')}>
                <option value="">— انتخاب کنید —</option>
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-neutral-400">توضیحات</label>
            <Input {...register('description')} />
          </div>

          {serverError && <p className="text-sm text-red-400">{serverError}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'در حال ذخیره...' : 'ثبت'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold">تاریخچه‌ی مالی</h3>
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">هنوز رویداد مالی ثبت نشده.</p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-xs text-neutral-500">
                <th className="py-2 font-normal">تاریخ</th>
                <th className="py-2 font-normal">نوع</th>
                <th className="py-2 font-normal">مبلغ</th>
                <th className="py-2 font-normal">توضیحات</th>
              </tr>
            </thead>
            <tbody>
              {[...events].reverse().map((e) => (
                <tr key={e.id} className="border-b border-neutral-900 last:border-0">
                  <td className="py-2 text-neutral-400">
                    <DualDate date={e.eventDate} />
                  </td>
                  <td className="py-2">{EVENT_TYPE_LABELS[e.eventType] ?? e.eventType}</td>
                  <td className="py-2">
                    {formatToman(e.amount)}
                    {e.discountPercent != null && (
                      <span className="text-xs text-neutral-500"> ({e.discountPercent}٪)</span>
                    )}
                  </td>
                  <td className="py-2 text-neutral-400">{e.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <ProfessionalFeesSection projectId={projectId} />
    </div>
  )
}
