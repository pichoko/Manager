import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ProjectRecord } from '@renderer/env'
import { OverviewTab } from './OverviewTab'
import { StatusStageTab } from './StatusStageTab'
import { TimelineTab } from './TimelineTab'
import { FinancialTab } from '@renderer/features/finance/FinancialTab'
import { Button } from '@renderer/shared/ui/Button'

type Tab = 'overview' | 'statusStage' | 'financial' | 'timeline' | 'notes' | 'checklist'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'کلیات' },
  { id: 'statusStage', label: 'وضعیت و مرحله' },
  { id: 'financial', label: 'مالی' },
  { id: 'timeline', label: 'تاریخچه' },
  { id: 'notes', label: 'یادداشت‌ها' },
  { id: 'checklist', label: 'چک‌لیست' }
]

export function ProjectDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [tab, setTab] = useState<Tab>('overview')

  const load = (): void => {
    if (!id) return
    window.api.getProject(id).then((res) => {
      if (res.ok && res.data) setProject(res.data)
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!id) return <p className="text-sm text-neutral-500">پروژه نامعتبر است.</p>
  if (!project) return <p className="text-sm text-neutral-500">در حال بارگذاری...</p>

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{project.projectName || project.ownerName}</h1>
          <p className="text-sm text-neutral-500">
            شماره پرونده: {project.projectNumber} · مالک: {project.ownerName}
          </p>
        </div>
        <Link to={`/projects/${id}/edit`}>
          <Button variant="secondary">✏️ ویرایش پروژه</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm transition-colors ${
              tab === t.id
                ? 'border-b-2 border-emerald-500 text-emerald-400'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab project={project} />}
      {tab === 'statusStage' && <StatusStageTab project={project} onUpdated={load} />}
      {tab === 'financial' && <FinancialTab project={project} />}
      {tab === 'timeline' && <TimelineTab projectId={project.id} />}
      {(tab === 'notes' || tab === 'checklist') && (
        <p className="py-10 text-center text-sm text-neutral-500">
          این بخش در فاز بعدی ساخته می‌شه.
        </p>
      )}
    </div>
  )
}
