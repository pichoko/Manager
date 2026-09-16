import { useNavigate } from 'react-router-dom'
import { ProjectList } from './ProjectList'

export function ProjectsPage(): JSX.Element {
  const navigate = useNavigate()
  return (
    <ProjectList
      onCreateNew={() => navigate('/projects/new')}
      onOpenProject={(id) => navigate(`/projects/${id}`)}
    />
  )
}
