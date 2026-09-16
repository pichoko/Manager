import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@renderer/shared/ui/Button'
import { Input } from '@renderer/shared/ui/Input'
import { Select } from '@renderer/shared/ui/Select'
import { Card } from '@renderer/shared/ui/Card'
import type { ProjectRecord, SettingItem } from '@renderer/env'

const projectSchema = z.object({
  ownerName: z.string().min(1, 'نام مالک الزامی است'),
  projectNumber: z.string().min(1, 'شماره پرونده الزامی است'),
  projectName: z.string().optional(),
  phoneNumber: z.string().optional(),
  city: z.string().optional(),
  referrerName: z.string().optional(),
  renovationCode: z.string().optional(),
  projectCode: z.string().optional(),
  checkerName: z.string().optional(),
  initialArea: z.string().optional(),
  floorCount: z.string().optional(),
  frameTypeId: z.string().optional(),
  description: z.string().optional()
})

type ProjectFormValues = z.infer<typeof projectSchema>

interface ProjectFormProps {
  /** اگه پر باشه، فرم در حالت ویرایش یک پروژه‌ی موجوده؛ در غیر این صورت ساخت پروژه‌ی جدید */
  project?: ProjectRecord
  onSaved: () => void
  onCancel: () => void
}

export function ProjectForm({ project, onSaved, onCancel }: ProjectFormProps): JSX.Element {
  const isEditMode = Boolean(project)
  const [frameTypes, setFrameTypes] = useState<SettingItem[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          ownerName: project.ownerName,
          projectNumber: project.projectNumber,
          projectName: project.projectName ?? '',
          phoneNumber: project.phoneNumber ?? '',
          city: project.city ?? '',
          referrerName: project.referrerName ?? '',
          renovationCode: project.renovationCode ?? '',
          projectCode: project.projectCode ?? '',
          checkerName: project.checkerName ?? '',
          initialArea: project.initialArea != null ? String(project.initialArea) : '',
          floorCount: project.floorCount != null ? String(project.floorCount) : '',
          frameTypeId: project.frameTypeId ?? '',
          description: project.description ?? ''
        }
      : undefined
  })

  useEffect(() => {
    window.api.listSettings('frameType').then((res) => {
      if (res.ok && res.data) setFrameTypes(res.data)
    })
  }, [])

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    const payload = {
      ...values,
      initialArea: values.initialArea ? Number(values.initialArea) : undefined,
      floorCount: values.floorCount ? Number(values.floorCount) : undefined
    }
    const res = isEditMode
      ? await window.api.updateProject(project!.id, payload)
      : await window.api.createProject(payload)
    if (!res.ok) {
      setServerError(res.error?.message ?? 'خطای ناشناخته رخ داد')
      return
    }
    onSaved()
  })

  return (
    <Card className="mx-auto max-w-xl">
      <h2 className="mb-4 text-lg font-bold">{isEditMode ? 'ویرایش پروژه' : 'پروژه جدید'}</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">نام مالک *</label>
          <Input {...register('ownerName')} />
          {errors.ownerName && (
            <p className="mt-1 text-xs text-red-400">{errors.ownerName.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-400">شماره پرونده *</label>
          <Input {...register('projectNumber')} placeholder="مثلاً 1405-032" />
          {errors.projectNumber && (
            <p className="mt-1 text-xs text-red-400">{errors.projectNumber.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-400">نام پروژه</label>
          <Input {...register('projectName')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">شماره تماس</label>
            <Input {...register('phoneNumber')} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">شهر</label>
            <Input {...register('city')} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-400">ارجاع‌دهنده</label>
          <Input {...register('referrerName')} placeholder="مثلاً معرفی‌شده توسط..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">کد پروژه</label>
            <Input {...register('projectCode')} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">کد نوسازی</label>
            <Input {...register('renovationCode')} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">متراژ (متر مربع)</label>
            <Input type="number" step="0.01" {...register('initialArea')} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">تعداد طبقات (سقف)</label>
            <Input type="number" {...register('floorCount')} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">نوع اسکلت</label>
            <Select {...register('frameTypeId')}>
              <option value="">— انتخاب نشده —</option>
              {frameTypes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-400">چکر</label>
          <Input {...register('checkerName')} placeholder="نام چکر" />
        </div>

        <div>
          <label className="mb-1 block text-xs text-neutral-400">توضیحات</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-600 focus:outline-none"
          />
        </div>

        {serverError && <p className="text-sm text-red-400">{serverError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            انصراف
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'در حال ذخیره...' : isEditMode ? 'ذخیره تغییرات' : 'ذخیره پروژه'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
