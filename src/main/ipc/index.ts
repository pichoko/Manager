import { registerSystemIpc } from './system'
import { registerProjectsIpc } from './projects'
import { registerSettingsIpc } from './settings'
import { registerFinancialIpc } from './financial'
import { registerTariffIpc } from './tariff'
import { registerTimelineIpc } from './timeline'
import { registerProfessionalFeesIpc } from './professionalFees'
import { registerDashboardIpc } from './dashboard'
import { registerOfficeExpensesIpc } from './officeExpenses'
import { registerBackupIpc } from './backup'

export function registerAllIpcHandlers(): void {
  registerSystemIpc()
  registerProjectsIpc()
  registerSettingsIpc()
  registerFinancialIpc()
  registerTariffIpc()
  registerTimelineIpc()
  registerProfessionalFeesIpc()
  registerDashboardIpc()
  registerOfficeExpensesIpc()
  registerBackupIpc()

  // فیچرهای بعدی فقط یک خط این‌جا اضافه می‌کنن بدون این‌که به بقیه‌ی فایل‌ها دست بزنن.
}
