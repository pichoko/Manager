import { useEffect, useState } from 'react'
import { Card } from '@renderer/shared/ui/Card'
import { Button } from '@renderer/shared/ui/Button'
import { DualDate } from '@renderer/shared/ui/DualDate'
import type { BackupFileInfo } from '@renderer/env'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`
}

export function BackupSettingsSection(): JSX.Element {
  const [backups, setBackups] = useState<BackupFileInfo[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = (): void => {
    window.api.listBackups().then((res) => {
      if (res.ok && res.data) setBackups(res.data)
    })
  }

  useEffect(load, [])

  const handleManualBackup = async (): Promise<void> => {
    setBusy(true)
    setMessage(null)
    const res = await window.api.createManualBackup()
    setBusy(false)
    if (res.ok) {
      setMessage('بک‌آپ با موفقیت ذخیره شد.')
      load()
    } else {
      setMessage(res.error?.message ?? 'خطا در تهیه‌ی بک‌آپ')
    }
  }

  const handleExport = async (): Promise<void> => {
    setBusy(true)
    setMessage(null)
    const res = await window.api.exportBackupToFile()
    setBusy(false)
    if (res.ok && res.data) {
      setMessage(`ذخیره شد: ${res.data.path}`)
    } else if (res.error?.code !== 'CANCELED') {
      setMessage(res.error?.message ?? 'خطا در ذخیره‌ی بک‌آپ')
    }
  }

  const confirmAndRestart = async (): Promise<void> => {
    alert('بازیابی انجام شد. برنامه الان دوباره باز می‌شه.')
    await window.api.relaunchApp()
  }

  const handleRestoreFromFile = async (): Promise<void> => {
    if (
      !confirm(
        'بازیابی از یک فایل بک‌آپ، اطلاعات فعلی رو جایگزین می‌کنه (یک بک‌آپ ایمنی از وضعیت فعلی هم خودکار گرفته می‌شه). ادامه می‌دید؟'
      )
    )
      return
    setBusy(true)
    setMessage(null)
    const res = await window.api.restoreFromFile()
    setBusy(false)
    if (res.ok) {
      await confirmAndRestart()
    } else if (res.error?.code !== 'CANCELED') {
      setMessage(res.error?.message ?? 'خطا در بازیابی')
    }
  }

  const handleRestoreAuto = async (fileName: string): Promise<void> => {
    if (!confirm(`بازیابی از «${fileName}» انجام بشه؟ اطلاعات فعلی جایگزین می‌شه.`)) return
    setBusy(true)
    setMessage(null)
    const res = await window.api.restoreFromAutoBackup(fileName)
    setBusy(false)
    if (res.ok) {
      await confirmAndRestart()
    } else {
      setMessage(res.error?.message ?? 'خطا در بازیابی')
    }
  }

  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-bold">پشتیبان‌گیری</h3>
      <p className="text-xs text-neutral-500">
        برنامه هر روز خودکار یک بک‌آپ می‌گیره (حداکثر ۳۰ نسخه‌ی آخر نگه داشته می‌شه). می‌تونید
        هر وقت دستی هم بک‌آپ بگیرید یا یک نسخه رو به‌عنوان فایل جدا ذخیره کنید.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleManualBackup} disabled={busy}>
          تهیه‌ی بک‌آپ الان
        </Button>
        <Button variant="secondary" onClick={handleExport} disabled={busy}>
          ذخیره به‌عنوان فایل...
        </Button>
        <Button variant="secondary" onClick={() => window.api.openBackupsFolder()}>
          نمایش پوشه‌ی بک‌آپ‌ها
        </Button>
        <Button variant="danger" onClick={handleRestoreFromFile} disabled={busy}>
          بازیابی از فایل...
        </Button>
      </div>

      {message && <p className="text-xs text-neutral-400">{message}</p>}

      <div>
        <h4 className="mb-2 text-xs font-bold text-neutral-400">بک‌آپ‌های اخیر</h4>
        {backups.length === 0 ? (
          <p className="text-xs text-neutral-500">هنوز بک‌آپی گرفته نشده.</p>
        ) : (
          <ul className="max-h-52 space-y-1 overflow-y-auto">
            {backups.map((b) => (
              <li
                key={b.fileName}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-neutral-800/50"
              >
                <span className="text-neutral-400">
                  <DualDate date={b.createdAt.slice(0, 10)} /> · {formatSize(b.sizeBytes)}
                </span>
                <button
                  onClick={() => handleRestoreAuto(b.fileName)}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  بازیابی
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
