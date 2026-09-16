import { useNavigate } from 'react-router-dom'
import { ProjectForm } from './ProjectForm'

export function ProjectsNewPage(): JSX.Element {
  const navigate = useNavigate()
  return (
    <ProjectForm onSaved={() => navigate('/projects')} onCancel={() => navigate('/projects')} />
  )
}
