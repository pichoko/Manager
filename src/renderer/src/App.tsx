import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@renderer/app/AppShell'
import { DashboardPage } from '@renderer/features/dashboard/DashboardPage'
import { ProjectsPage } from '@renderer/features/projects/ProjectsPage'
import { ProjectsNewPage } from '@renderer/features/projects/ProjectsNewPage'
import { ProjectDetailPage } from '@renderer/features/projects/ProjectDetailPage'
import { ProjectEditPage } from '@renderer/features/projects/ProjectEditPage'
import { ComingSoonPage } from '@renderer/shared/ComingSoonPage'
import { SettingsPage } from '@renderer/features/settings/SettingsPage'
import { OfficeExpensesPage } from '@renderer/features/office-expenses/OfficeExpensesPage'

function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/new" element={<ProjectsNewPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
        <Route
          path="/payments"
          element={
            <ComingSoonPage
              title="پرداخت‌ها"
              description="ثبت پرداخت از داخل صفحه‌ی هر پروژه (تب مالی) انجام می‌شه. این صفحه در آینده یک نمای کلی از همه‌ی پرداخت‌های تمام پروژه‌ها نشون می‌ده."
            />
          }
        />
        <Route path="/office-expenses" element={<OfficeExpensesPage />} />
        <Route path="/reports" element={<ComingSoonPage title="گزارش‌ها" />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
