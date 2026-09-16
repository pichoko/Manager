import { useEffect, useState } from 'react'
import { Card } from '@renderer/shared/ui/Card'
import { Button } from '@renderer/shared/ui/Button'
import type { UpdaterStatus } from '@renderer/env'

export function UpdateSettingsSection(): JSX.Element {
  const [version, setVersion] = useState<string>('')
  const [status, setStatus] = useState<UpdaterStatus | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    window.api.getAppVersion().then(setVersion)
    const unsubscribe = window.api.onUpdateStatus((s) => {
      setStatus(s)
      if (s.status !== 'checking') setChecking(false)
    })
    return unsubscribe
  }, [])

  const handleCheck = async (): Promise<void> => {
    setChecking(true)
    setStatus({ status: 'checking' })
    await window.api.checkForUpdate()
  }

  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-bold">به‌روزرسانی برنامه</h3>
      <p className="text-xs text-neutral-500">نسخه‌ی فعلی: {version || '...'}</p>

      {status?.status === 'checking' && (
        <p className="text-xs text-neutral-400">در حال بررسی نسخه‌ی جدید...</p>
      )}
      {status?.status === 'not-available' && (
        <p className="text-xs text-emerald-400">شما آخرین نسخه رو دارید.</p>
      )}
      {status?.status === 'available' && (
        <p className="text-xs text-amber-400">
          نسخه‌ی جدید ({status.version}) پیدا شد، در حال دانلود...
        </p>
      )}
      {status?.status === 'downloading' && (
        <p className="text-xs text-amber-400">در حال دانلود آپدیت... {status.percent}٪</p>
      )}
      {status?.status === 'downloaded' && (
        <div className="space-y-2">
          <p className="text-xs text-emerald-400">
            نسخه‌ی {status.version} آماده‌ی نصبه. با نصب، برنامه بسته و دوباره باز می‌شه.
          </p>
          <Button onClick={() => window.api.installUpdateNow()}>نصب و ری‌استارت</Button>
        </div>
      )}
      {status?.status === 'error' && <p className="text-xs text-red-400">{status.message}</p>}

      <Button variant="secondary" onClick={handleCheck} disabled={checking}>
        {checking ? 'در حال بررسی...' : 'بررسی آپدیت جدید'}
      </Button>
    </Card>
  )
}
