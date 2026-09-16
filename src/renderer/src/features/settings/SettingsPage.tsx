import { TariffSettingsSection } from './TariffSettingsSection'
import { BackupSettingsSection } from './BackupSettingsSection'
import { UpdateSettingsSection } from './UpdateSettingsSection'

export function SettingsPage(): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">تنظیمات</h1>
      <UpdateSettingsSection />
      <BackupSettingsSection />
      <TariffSettingsSection />
    </div>
  )
}
