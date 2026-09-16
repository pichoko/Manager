import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell(): JSX.Element {
  return (
    <div dir="rtl" className="flex h-screen bg-neutral-950 text-neutral-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
