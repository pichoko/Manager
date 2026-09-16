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
import { formatToman } from '@renderer/shared/format'
import type { ProfessionalFeeRecord } from '@renderer/env'

const FEE_TYPE_LABELS: Record<string, string> = {
  checker: 'چکر',
  stamper: 'مهر'
}

const feeSchema = z.object({
  feeType: z.enum(['checker', 'stamper']),
  personName: z.string().min(1, 'نام الزامی است'),
  amountDue: z.string().min(1, 'مبلغ الزامی است'),
  description: z.string().optional()
})

type FeeFormValues = z.infer<typeof feeSchema>

export function ProfessionalFeesSection({ projectId }: { projectId: string }): JSX.Element {
  const [fees, setFees] = useState<ProfessionalFeeRecord[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FeeFormValues>({
    resolver: zodResolver(feeSchema),
    defaultValues: { feeType: 'checker' }
  })

  const load = (): void => {
    window.api.listProfessionalFees(projectId).then((res) => {
      if (res.ok && res.data) setFees(res.data)
    })
  }

  useEffect(load, [projectId])

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    const res = await window.api.createProfessionalFee({
      projectId,
      feeType: values.feeType,
      personName: values.personName,
      amountDue: Number(values.amountDue),
      description: values.description || undefined
    })
    if (!res.ok) {
      setServerError(res.error?.message ?? 'خطای ناشناخته رخ داد')
      return
    }
    reset({ feeType: 'checker', personName: '', amountDue: '', description: '' })
    load()
  })

  const handleToggleSettled = async (fee: ProfessionalFeeRecord): Promise<void> => {
    await window.api.updateProfessionalFee(
      fee.id,
      projectId,
      fee.personName,
      fee.feeType,
      fee.settled
        ? { settled: false, settledAt: null }
        : { settled: true, amountPaid: fee.amountDue }
    )
    load()
  }

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.deleteProfessionalFee(id)
    load()
  }

  return (
    <Card>
      <h3 className="mb-1 text-sm font-bold">دستمزد چکر و مهر</h3>
      <p className="mb-3 text-xs text-neutral-500">
        پرداخت دفتر به این افراد، جدا از پرداختی که از مالک پروژه دریافت می‌شه.
      </p>

      {fees.length > 0 && (
        <table className="mb-4 w-full text-right text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-xs text-neutral-500">
              <th className="py-2 font-normal">نوع</th>
              <th className="py-2 font-normal">نام</th>
              <th className="py-2 font-normal">مبلغ مقرر</th>
              <th className="py-2 font-normal">وضعیت</th>
              <th className="py-2 font-normal">تاریخ تسویه</th>
              <th className="py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f.id} className="border-b border-neutral-900 last:border-0">
                <td className="py-2">{FEE_TYPE_LABELS[f.feeType]}</td>
                <td className="py-2">{f.personName}</td>
                <td className="py-2">{formatToman(f.amountDue)}</td>
                <td className="py-2">
                  <span
                    className={f.settled ? 'text-emerald-400' : 'text-amber-400'}
                  >
                    {f.settled ? 'تسویه شده' : 'تسویه‌نشده'}
                  </span>
                </td>
                <td className="py-2 text-neutral-400">
                  <DualDate date={f.settledAt} />
                </td>
                <td className="py-2 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleSettled(f)}
                    className="ml-2 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    {f.settled ? 'لغو تسویه' : 'ثبت تسویه'}
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form onSubmit={onSubmit} className="space-y-3 border-t border-neutral-800 pt-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">نوع</label>
            <Select {...register('feeType')}>
              <option value="checker">چکر</option>
              <option value="stamper">مهر</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">نام</label>
            <Input {...register('personName')} />
            {errors.personName && (
              <p className="mt-1 text-xs text-red-400">{errors.personName.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">مبلغ مقرر (تومان)</label>
            <Controller
              control={control}
              name="amountDue"
              render={({ field }) => (
                <AmountInput value={field.value ?? ''} onChange={field.onChange} placeholder="0" />
              )}
            />
            {errors.amountDue && (
              <p className="mt-1 text-xs text-red-400">{errors.amountDue.message}</p>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">توضیحات</label>
          <Input {...register('description')} />
        </div>
        {serverError && <p className="text-sm text-red-400">{serverError}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'در حال ذخیره...' : '+ افزودن'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
