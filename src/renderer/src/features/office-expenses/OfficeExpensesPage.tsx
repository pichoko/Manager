import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@renderer/shared/ui/Card'
import { Button } from '@renderer/shared/ui/Button'
import { Input } from '@renderer/shared/ui/Input'
import { AmountInput } from '@renderer/shared/ui/AmountInput'
import { JalaliDateInput } from '@renderer/shared/ui/JalaliDateInput'
import { DualDate } from '@renderer/shared/ui/DualDate'
import { formatToman } from '@renderer/shared/format'
import { todayAsIso } from '@renderer/shared/jalali'
import type { OfficeExpenseRecord, OfficeExpensesSummary } from '@renderer/env'

const expenseSchema = z.object({
  category: z.string().min(1, 'دسته‌بندی الزامی است'),
  amount: z.string().min(1, 'مبلغ الزامی است'),
  expenseDate: z.string().min(1, 'تاریخ الزامی است'),
  description: z.string().optional()
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export function OfficeExpensesPage(): JSX.Element {
  const [expenses, setExpenses] = useState<OfficeExpenseRecord[]>([])
  const [summary, setSummary] = useState<OfficeExpensesSummary | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { expenseDate: todayAsIso() }
  })

  const load = (): void => {
    window.api.listOfficeExpenses().then((res) => {
      if (res.ok && res.data) setExpenses(res.data)
    })
    window.api.getOfficeExpensesSummary().then((res) => {
      if (res.ok && res.data) setSummary(res.data)
    })
  }

  useEffect(load, [])

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    const res = await window.api.createOfficeExpense({
      category: values.category,
      amount: Number(values.amount),
      expenseDate: values.expenseDate,
      description: values.description || undefined
    })
    if (!res.ok) {
      setServerError(res.error?.message ?? 'خطای ناشناخته رخ داد')
      return
    }
    reset({ category: '', amount: '', expenseDate: todayAsIso(), description: '' })
    load()
  })

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.deleteOfficeExpense(id)
    load()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">هزینه‌های دفتر</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-neutral-500">مجموع هزینه‌ها</p>
          <p className="mt-1 text-lg font-bold">{formatToman(summary?.total ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-xs text-neutral-500">هزینه‌های این ماه</p>
          <p className="mt-1 text-lg font-bold text-amber-400">
            {formatToman(summary?.thisMonthTotal ?? 0)}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold">ثبت هزینه‌ی جدید</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">دسته‌بندی</label>
              <Input {...register('category')} placeholder="مثلاً اجاره، برق، اینترنت..." />
              {errors.category && (
                <p className="mt-1 text-xs text-red-400">{errors.category.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">مبلغ (تومان)</label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <AmountInput value={field.value ?? ''} onChange={field.onChange} placeholder="0" />
                )}
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-400">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-neutral-400">تاریخ</label>
            <Controller
              control={control}
              name="expenseDate"
              render={({ field }) => (
                <JalaliDateInput value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-neutral-400">توضیحات</label>
            <Input {...register('description')} />
          </div>

          {serverError && <p className="text-sm text-red-400">{serverError}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'در حال ذخیره...' : 'ثبت هزینه'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold">تاریخچه‌ی هزینه‌ها</h3>
        {expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">هنوز هزینه‌ای ثبت نشده.</p>
        ) : (
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-xs text-neutral-500">
                <th className="py-2 font-normal">تاریخ</th>
                <th className="py-2 font-normal">دسته‌بندی</th>
                <th className="py-2 font-normal">مبلغ</th>
                <th className="py-2 font-normal">توضیحات</th>
                <th className="py-2 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-neutral-900 last:border-0">
                  <td className="py-2 text-neutral-400">
                    <DualDate date={e.expenseDate} />
                  </td>
                  <td className="py-2">{e.category}</td>
                  <td className="py-2">{formatToman(e.amount)}</td>
                  <td className="py-2 text-neutral-400">{e.description ?? '—'}</td>
                  <td className="py-2">
                    <button
                      onClick={() => handleDelete(e.id)}
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
      </Card>
    </div>
  )
}
