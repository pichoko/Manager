/// <reference types="vite/client" />

export interface ApiError {
  code: string
  message: string
}

export interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: ApiError
}

export interface SettingItem {
  id: string
  category: string
  name: string
  color: string | null
  icon: string | null
  displayOrder: number
  active: boolean
  createdAt: string
}

export interface ProjectRecord {
  id: string
  projectNumber: string
  projectName: string | null
  ownerName: string
  phoneNumber: string | null
  city: string | null
  address: string | null
  renovationCode: string | null
  projectCode: string | null
  referrerName: string | null
  engineerId: string | null
  checkerId: string | null
  statusId: string
  stageId: string
  structureTypeId: string | null
  frameTypeId: string | null
  initialArea: number | null
  floorCount: number | null
  quotaDeductorName: string | null
  quotaDeductionDate: string | null
  checkerName: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ProjectEventRecord {
  id: string
  projectId: string
  eventType: string
  oldValue: string | null
  newValue: string | null
  reason: string | null
  eventDate: string
  createdAt: string
}

export type FinancialEventType = 'estimate' | 'discount' | 'payment' | 'refund'

export interface FinancialEventRecord {
  id: string
  projectId: string
  eventType: FinancialEventType
  amount: number
  discountPercent: number | null
  baseAmount: number | null
  eventDate: string
  paymentMethodId: string | null
  referenceNumber: string | null
  description: string | null
  createdAt: string
}

export interface FinancialSummary {
  estimateTotal: number
  discountTotal: number
  contractAmount: number
  totalPayments: number
  balance: number
}

export interface TariffCalculationData {
  unitRate: number
  amount: number
  ruleDescription: string
  tariffYear: number
  tariffVersionId: string
}

export interface TariffVersionRecord {
  id: string
  year: number
  title: string
  isActive: boolean
  createdAt: string
}

export interface TariffRuleRecord {
  id: string
  tariffVersionId: string
  discipline: string
  minFloors: number
  maxFloors: number | null
  minArea: number
  maxArea: number | null
  unitRate: number
  displayOrder: number
  createdAt: string
}

export interface TimelineRecord {
  id: string
  projectId: string
  eventType: string
  title: string
  description: string | null
  eventDate: string
  metadata: string | null
  createdAt: string
}

export type ProfessionalFeeType = 'checker' | 'stamper'

export interface ProfessionalFeeRecord {
  id: string
  projectId: string
  feeType: ProfessionalFeeType
  personName: string
  amountDue: number
  amountPaid: number
  settled: boolean
  settledAt: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

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

export interface OfficeExpenseRecord {
  id: string
  category: string
  amount: number
  expenseDate: string
  description: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface OfficeExpensesSummary {
  total: number
  thisMonthTotal: number
}

export interface BackupFileInfo {
  fileName: string
  path: string
  sizeBytes: number
  createdAt: string
}

export type UpdaterStatus =
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'not-available' }
  | { status: 'downloading'; percent: number }
  | { status: 'downloaded'; version: string }
  | { status: 'error'; message: string }

export interface ProjectManagerApi {
  dbPing: () => Promise<{ ok: boolean; projectCount: number; dbPath: string }>
  openDbFolder: () => Promise<void>
  listProjects: () => Promise<ApiResult<ProjectRecord[]>>
  getProject: (id: string) => Promise<ApiResult<ProjectRecord>>
  createProject: (input: Record<string, unknown>) => Promise<ApiResult<{ id: string }>>
  updateProject: (id: string, input: Record<string, unknown>) => Promise<ApiResult<null>>
  changeProjectStatusStage: (
    id: string,
    input: { statusId?: string; stageId?: string; reason?: string }
  ) => Promise<ApiResult<null>>
  updateQuotaDeduction: (
    id: string,
    input: { quotaDeductorName?: string; quotaDeductionDate?: string }
  ) => Promise<ApiResult<null>>
  getProjectStatusStageHistory: (id: string) => Promise<ApiResult<ProjectEventRecord[]>>
  listSettings: (category: string) => Promise<ApiResult<SettingItem[]>>
  createSetting: (category: string, name: string) => Promise<ApiResult<{ id: string }>>
  listFinancialEvents: (projectId: string) => Promise<ApiResult<FinancialEventRecord[]>>
  getFinancialSummary: (projectId: string) => Promise<ApiResult<FinancialSummary>>
  createFinancialEvent: (input: Record<string, unknown>) => Promise<ApiResult<{ id: string }>>
  calculateTariff: (input: {
    discipline: string
    floorCount: number
    area: number
    tariffVersionId?: string
  }) => Promise<ApiResult<TariffCalculationData>>
  listTariffVersions: () => Promise<ApiResult<TariffVersionRecord[]>>
  createTariffVersion: (input: {
    year: number
    title: string
    copyFromVersionId?: string
  }) => Promise<ApiResult<{ id: string }>>
  listTariffRules: (tariffVersionId: string) => Promise<ApiResult<TariffRuleRecord[]>>
  createTariffRule: (input: Record<string, unknown>) => Promise<ApiResult<{ id: string }>>
  updateTariffRule: (id: string, input: Record<string, unknown>) => Promise<ApiResult<null>>
  deleteTariffRule: (id: string) => Promise<ApiResult<null>>
  listTimeline: (projectId: string) => Promise<ApiResult<TimelineRecord[]>>
  listProfessionalFees: (projectId: string) => Promise<ApiResult<ProfessionalFeeRecord[]>>
  createProfessionalFee: (input: Record<string, unknown>) => Promise<ApiResult<{ id: string }>>
  updateProfessionalFee: (
    id: string,
    projectId: string,
    personName: string,
    feeType: string,
    input: Record<string, unknown>
  ) => Promise<ApiResult<null>>
  deleteProfessionalFee: (id: string) => Promise<ApiResult<null>>
  getDashboardData: () => Promise<ApiResult<DashboardData>>
  listOfficeExpenses: () => Promise<ApiResult<OfficeExpenseRecord[]>>
  getOfficeExpensesSummary: () => Promise<ApiResult<OfficeExpensesSummary>>
  createOfficeExpense: (input: Record<string, unknown>) => Promise<ApiResult<{ id: string }>>
  deleteOfficeExpense: (id: string) => Promise<ApiResult<null>>
  listBackups: () => Promise<ApiResult<BackupFileInfo[]>>
  createManualBackup: () => Promise<ApiResult<{ path: string }>>
  exportBackupToFile: () => Promise<ApiResult<{ path: string }>>
  restoreFromFile: () => Promise<ApiResult<null>>
  restoreFromAutoBackup: (fileName: string) => Promise<ApiResult<null>>
  openBackupsFolder: () => Promise<void>
  relaunchApp: () => Promise<void>
  getAppVersion: () => Promise<string>
  checkForUpdate: () => Promise<ApiResult<null>>
  installUpdateNow: () => Promise<void>
  onUpdateStatus: (callback: (status: UpdaterStatus) => void) => () => void
}

declare global {
  interface Window {
    api: ProjectManagerApi
  }
}
