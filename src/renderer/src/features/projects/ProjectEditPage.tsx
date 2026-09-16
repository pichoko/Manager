import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ProjectRecord } from '@renderer/env'
import { ProjectForm } from './ProjectForm'

export function ProjectEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectRecord | null>(null)

  useEffect(() => {
    if (!id) return
    window.api.getProject(id).then((res) => {
      if (res.ok && res.data) setProject(res.data)
    })
  }, [id])

  if (!id) return <p className="text-sm text-neutral-500">پروژه نامعتبر است.</p>
  if (!project) return <p className="text-sm text-neutral-500">در حال بارگذاری...</p>

  return (
    <ProjectForm
      project={project}
      onSaved={() => navigate(`/projects/${id}`)}
      onCancel={() => navigate(`/projects/${id}`)}
    />
  )
}
