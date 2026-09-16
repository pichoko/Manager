import { listProjects } from '../database/repositories/projects'
import { listSettingsByCategory } from '../database/repositories/settings'
import { computeFinancialSummary } from './financialService'

export interface ProjectAttentionItem {
  id: string
  projectNumber: string
  ownerName: string
  projectName: string | null
  balance: number
}

export interface RecentProjectItem {
  id: string
  projectNumber: string
  ownerName: string
  projectName: string | null
  statusName: string | null
  createdAt: string
}

export interface DashboardData {
  totalProjects: number
  activeProjects: number
  archivedProjects: number
  totalContractAmount: number
  totalReceived: number
  totalBalance: number
  projectsNeedingAttention: ProjectAttentionItem[]
  recentProjects: RecentProjectItem[]
}

/**
 * طبق فلسفه‌ی Dashboard در Blueprint (بخش ۱۵): هیچ عددی این‌جا ذخیره نمی‌شه، همه چیز
 * لحظه‌ای از روی پروژه‌ها و رویدادهای مالی محاسبه می‌شه. برای تعداد پروژه‌ی شخصی (نه
 * هزاران‌تا)، محاسبه‌ی حلقه‌ای روی همه‌ی پروژه‌ها کاملاً سریع و کافیه.
 */
export function getDashboardData(): DashboardData {
  const allProjects = listProjects()
  const statuses = listSettingsByCategory('status')
  const statusNameById = new Map(statuses.map((s) => [s.id, s.name]))
  const archivedStatus = statuses.find((s) => s.name === 'آرشیو')

  let totalContractAmount = 0
  let totalReceived = 0
  let totalBalance = 0
  const needingAttention: ProjectAttentionItem[] = []

  for (const p of allProjects) {
    const summary = computeFinancialSummary(p.id)
    totalContractAmount += summary.contractAmount
    totalReceived += summary.totalPayments
    totalBalance += summary.balance

    if (summary.balance > 0) {
      needingAttention.push({
        id: p.id,
        projectNumber: p.projectNumber,
        ownerName: p.ownerName,
        projectName: p.projectName,
        balance: summary.balance
      })
    }
  }

  needingAttention.sort((a, b) => b.balance - a.balance)

  const archivedProjects = archivedStatus
    ? allProjects.filter((p) => p.statusId === archivedStatus.id).length
    : 0

  const recentProjects: RecentProjectItem[] = [...allProjects]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      projectNumber: p.projectNumber,
      ownerName: p.ownerName,
      projectName: p.projectName,
      statusName: statusNameById.get(p.statusId) ?? null,
      createdAt: p.createdAt
    }))

  return {
    totalProjects: allProjects.length,
    activeProjects: allProjects.length - archivedProjects,
    archivedProjects,
    totalContractAmount,
    totalReceived,
    totalBalance,
    projectsNeedingAttention: needingAttention.slice(0, 8),
    recentProjects
  }
}
