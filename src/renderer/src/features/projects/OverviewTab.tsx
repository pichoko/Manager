import { useEffect, useState } from 'react'
import { Card } from '@renderer/shared/ui/Card'
import type { ProjectRecord, SettingItem } from '@renderer/env'

const FIELDS: Array<{ key: keyof ProjectRecord; label: string }> = [
  { key: 'ownerName', label: 'مالک' },
  { key: 'phoneNumber', label: 'شماره تماس' },
  { key: 'city', label: 'شهر' },
  { key: 'referrerName', label: 'ارجاع‌دهنده' },
  { key: 'projectCode', label: 'کد پروژه' },
  { key: 'renovationCode', label: 'کد نوسازی' },
  { key: 'initialArea', label: 'متراژ (متر مربع)' },
  { key: 'floorCount', label: 'تعداد طبقات (سقف)' },
  { key: 'checkerName', label: 'چکر' },
  { key: 'description', label: 'توضیحات' }
]

export function OverviewTab({ project }: { project: ProjectRecord }): JSX.Element {
  const [frameTypeName, setFrameTypeName] = useState<string | null>(null)

  useEffect(() => {
    if (!project.frameTypeId) return
    window.api.listSettings('frameType').then((res) => {
      if (res.ok && res.data) {
        setFrameTypeName(res.data.find((s: SettingItem) => s.id === project.frameTypeId)?.name ?? null)
      }
    })
  }, [project.frameTypeId])

  return (
    <Card className="space-y-1">
      {FIELDS.map(({ key, label }) => (
        <div
          key={key}
          className="flex justify-between border-b border-neutral-800 py-2 text-sm last:border-0"
        >
          <span className="text-neutral-500">{label}</span>
          <span>{project[key] ? String(project[key]) : '—'}</span>
        </div>
      ))}
      <div className="flex justify-between py-2 text-sm">
        <span className="text-neutral-500">نوع اسکلت</span>
        <span>{frameTypeName ?? '—'}</span>
      </div>
    </Card>
  )
}
