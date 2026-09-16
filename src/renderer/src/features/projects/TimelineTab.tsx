import { useEffect, useState } from 'react'
import { Card } from '@renderer/shared/ui/Card'
import { DualDate } from '@renderer/shared/ui/DualDate'
import type { TimelineRecord } from '@renderer/env'

const EVENT_ICONS: Record<string, string> = {
  project_created: '📁',
  status_changed: '🔄',
  stage_changed: '🔄',
  estimate: '📐',
  discount: '🏷️',
  payment: '💰',
  refund: '↩️',
  quota_deduction_updated: '📝'
}

export function TimelineTab({ projectId }: { projectId: string }): JSX.Element {
  const [items, setItems] = useState<TimelineRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    window.api.listTimeline(projectId).then((res) => {
      if (res.ok && res.data) setItems(res.data)
      setLoading(false)
    })
  }, [projectId])

  return (
    <Card>
      <h3 className="mb-3 text-sm font-bold">تاریخچه‌ی کامل پروژه</h3>
      {loading ? (
        <p className="py-8 text-center text-sm text-neutral-500">در حال بارگذاری...</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">هنوز رویدادی ثبت نشده.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 border-b border-neutral-900 pb-3 last:border-0">
              <span className="text-lg leading-none">{EVENT_ICONS[item.eventType] ?? '•'}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-neutral-500">
                    <DualDate date={item.eventDate} />
                  </span>
                </div>
                {item.description && (
                  <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
