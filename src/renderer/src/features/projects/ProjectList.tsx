import { useEffect, useState } from 'react'
import { Button } from '@renderer/shared/ui/Button'
import { Input } from '@renderer/shared/ui/Input'
import { Card } from '@renderer/shared/ui/Card'
import type { ProjectRecord } from '@renderer/env'

interface ProjectListProps {
  onCreateNew: () => void
  onOpenProject: (id: string) => void
}

export function ProjectList({ onCreateNew, onOpenProject }: ProjectListProps): JSX.Element {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = (): void => {
    setLoading(true)
    window.api.listProjects().then((res) => {
      if (res.ok && res.data) setProjects(res.data)
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = projects.filter((p) => {
    const q = search.trim()
    if (!q) return true
    return (
      p.ownerName.includes(q) ||
      p.projectNumber.includes(q) ||
      (p.projectName ?? '').includes(q) ||
      (p.city ?? '').includes(q)
    )
  })

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو بر اساس مالک، شماره پرونده، نام پروژه، شهر..."
          className="max-w-sm"
        />
        <Button onClick={onCreateNew}>+ پروژه جدید</Button>
      </div>

      <Card>
        {loading ? (
          <p className="py-8 text-center text-sm text-neutral-500">در حال بارگذاری...</p>
        ) : filtered.length === 0 && projects.length > 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">نتیجه‌ای یافت نشد.</p>
        ) : projects.length === 0 ? (
          <div className="py-10 text-center">
            <p className="mb-3 text-sm text-neutral-500">هنوز پروژه‌ای ثبت نشده.</p>
            <Button onClick={onCreateNew}>+ ثبت اولین پروژه</Button>
          </div>
        ) : (
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-xs text-neutral-500">
                <th className="py-2 font-normal">شماره پرونده</th>
                <th className="py-2 font-normal">مالک</th>
                <th className="py-2 font-normal">نام پروژه</th>
                <th className="py-2 font-normal">شهر</th>
                <th className="py-2 font-normal">متراژ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onOpenProject(p.id)}
                  className="cursor-pointer border-b border-neutral-900 last:border-0 hover:bg-neutral-800/50"
                >
                  <td className="py-2 text-emerald-400">{p.projectNumber}</td>
                  <td className="py-2">{p.ownerName}</td>
                  <td className="py-2 text-neutral-400">{p.projectName ?? '—'}</td>
                  <td className="py-2 text-neutral-400">{p.city ?? '—'}</td>
                  <td className="py-2 text-neutral-400">{p.initialArea ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p className="text-center text-xs text-neutral-600">تعداد کل پروژه‌ها: {projects.length}</p>
    </div>
  )
}
