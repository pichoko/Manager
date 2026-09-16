import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// اینجا توابعی که renderer (رابط کاربری) نیاز داره با دیتابیس یا فایل‌سیستم
// کار کنه، به‌صورت امن تعریف و expose می‌شن (هیچ‌وقت دسترسی مستقیم به Node/فایل‌سیستم
// به renderer داده نمی‌شه، فقط از همین مسیر کنترل‌شده).
const api = {
  dbPing: (): Promise<{ ok: boolean; projectCount: number; dbPath: string }> =>
    ipcRenderer.invoke('db:ping'),
  openDbFolder: (): Promise<void> => ipcRenderer.invoke('db:openFolder'),
  listProjects: () => ipcRenderer.invoke('projects:list'),
  getProject: (id: string) => ipcRenderer.invoke('projects:getById', id),
  createProject: (input: unknown) => ipcRenderer.invoke('projects:create', input),
  updateProject: (id: string, input: unknown) => ipcRenderer.invoke('projects:update', id, input),
  listSettings: (category: string) => ipcRenderer.invoke('settings:listByCategory', category),
  listFinancialEvents: (projectId: string) =>
    ipcRenderer.invoke('financial:listByProject', projectId),
  getFinancialSummary: (projectId: string) => ipcRenderer.invoke('financial:summary', projectId),
  createFinancialEvent: (input: unknown) => ipcRenderer.invoke('financial:create', input),
  calculateTariff: (input: unknown) => ipcRenderer.invoke('tariff:calculate', input),
  changeProjectStatusStage: (id: string, input: unknown) =>
    ipcRenderer.invoke('projects:changeStatusStage', id, input),
  updateQuotaDeduction: (id: string, input: unknown) =>
    ipcRenderer.invoke('projects:updateQuotaDeduction', id, input),
  getProjectStatusStageHistory: (id: string) =>
    ipcRenderer.invoke('projects:statusStageHistory', id),
  createSetting: (category: string, name: string) =>
    ipcRenderer.invoke('settings:create', category, name),
  listTariffVersions: () => ipcRenderer.invoke('tariff:listVersions'),
  createTariffVersion: (input: unknown) => ipcRenderer.invoke('tariff:createVersion', input),
  listTariffRules: (tariffVersionId: string) =>
    ipcRenderer.invoke('tariff:listRules', tariffVersionId),
  createTariffRule: (input: unknown) => ipcRenderer.invoke('tariff:createRule', input),
  updateTariffRule: (id: string, input: unknown) =>
    ipcRenderer.invoke('tariff:updateRule', id, input),
  deleteTariffRule: (id: string) => ipcRenderer.invoke('tariff:deleteRule', id),
  listTimeline: (projectId: string) => ipcRenderer.invoke('timeline:listByProject', projectId),
  listProfessionalFees: (projectId: string) =>
    ipcRenderer.invoke('professionalFees:listByProject', projectId),
  createProfessionalFee: (input: unknown) => ipcRenderer.invoke('professionalFees:create', input),
  updateProfessionalFee: (
    id: string,
    projectId: string,
    personName: string,
    feeType: string,
    input: unknown
  ) => ipcRenderer.invoke('professionalFees:update', id, projectId, personName, feeType, input),
  deleteProfessionalFee: (id: string) => ipcRenderer.invoke('professionalFees:delete', id),
  getDashboardData: () => ipcRenderer.invoke('dashboard:getData'),
  listOfficeExpenses: () => ipcRenderer.invoke('officeExpenses:list'),
  getOfficeExpensesSummary: () => ipcRenderer.invoke('officeExpenses:summary'),
  createOfficeExpense: (input: unknown) => ipcRenderer.invoke('officeExpenses:create', input),
  deleteOfficeExpense: (id: string) => ipcRenderer.invoke('officeExpenses:delete', id),
  listBackups: () => ipcRenderer.invoke('backup:list'),
  createManualBackup: () => ipcRenderer.invoke('backup:createManualInAppFolder'),
  exportBackupToFile: () => ipcRenderer.invoke('backup:exportToFile'),
  restoreFromFile: () => ipcRenderer.invoke('backup:restoreFromFile'),
  restoreFromAutoBackup: (fileName: string) =>
    ipcRenderer.invoke('backup:restoreFromAutoBackup', fileName),
  openBackupsFolder: () => ipcRenderer.invoke('backup:openFolder'),
  relaunchApp: () => ipcRenderer.invoke('backup:relaunchApp'),
  getAppVersion: () => ipcRenderer.invoke('system:getAppVersion'),
  checkForUpdate: () => ipcRenderer.invoke('updater:check'),
  installUpdateNow: () => ipcRenderer.invoke('updater:installNow'),
  onUpdateStatus: (callback: (status: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: unknown): void => callback(data)
    ipcRenderer.on('updater:status', listener)
    return () => ipcRenderer.removeListener('updater:status', listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
