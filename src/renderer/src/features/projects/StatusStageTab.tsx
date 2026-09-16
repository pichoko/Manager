import { useEffect, useState } from 'react'
import { Card } from '@renderer/shared/ui/Card'
import { Select } from '@renderer/shared/ui/Select'
import { Input } from '@renderer/shared/ui/Input'
import { Button } from '@renderer/shared/ui/Button'
import { DualDate } from '@renderer/shared/ui/DualDate'
import { JalaliDateInput } from '@renderer/shared/ui/JalaliDateInput'
import type { ProjectEventRecord, ProjectRecord, SettingItem } from '@renderer/env'

interface StatusStageTabProps {
  project: ProjectRecord
  onUpdated: () => void
}

export function StatusStageTab({ project, onUpdated }: StatusStageTabProps): JSX.Element {
  const [statuses, setStatuses] = useState<SettingItem[]>([])
  const [stages, setStages] = useState<SettingItem[]>([])
  const [statusId, setStatusId] = useState(project.statusId)
  const [stageId, setStageId] = useState(project.stageId)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const [quotaDeductorName, setQuotaDeductorName] = useState(project.quotaDeductorName ?? '')
  const [quotaDeductionDate, setQuotaDeductionDate] = useState(project.quotaDeductionDate ?? '')
  const [quotaSaving, setQuotaSaving] = useState(false)
  const [quotaSavedMsg, setQuotaSavedMsg] = useState<string | null>(null)

  const [history, setHistory] = useState<ProjectEventRecord[]>([])

  const loadHistory = (): void => {
    window.api.getProjectStatusStageHistory(project.id).then((res) => {
      if (res.ok && res.data) setHistory(res.data)
    })
  }

  useEffect(() => {
    window.api.listSettings('status').then((res) => {
      if (res.ok && res.data) setStatuses(res.data)
    })
    window.api.listSettings('stage').then((res) => {
      if (res.ok && res.data) setStages(res.data)
    })
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  const handleSaveStatusStage = async (): Promise<void> => {
    setSaving(true)
    setSavedMsg(null)
    const res = await window.api.changeProjectStatusStage(project.id, {
      statusId,
      stageId,
      reason: reason || undefined
    })
    setSaving(false)
    if (res.ok) {
      setSavedMsg('ذخیره شد')
      setReason('')
      loadHistory()
      onUpdated()
    }
  }

  const handleSaveQuota = async (): Promise<void> => {
    setQuotaSaving(true)
    setQuotaSavedMsg(null)
    const res = await window.api.updateQuotaDeduction(project.id, {
      quotaDeductorName: quotaDeductorName || undefined,
      quotaDeductionDate: quotaDeductionDate || undefined
    })
    setQuotaSaving(false)
    if (res.ok) {
      setQuotaSavedMsg('ذخیره شد')
      onUpdated()
    }
  }

  const unchanged = statusId === project.statusId && stageId === project.stageId

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h3 className="text-sm font-bold">وضعیت و مرحله فعلی</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">وضعیت</label>
            <Select value={statusId} onChange={(e) => setStatusId(e.target.value)}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">مرحله</label>
            <Select value={stageId} onChange={(e) => setStageId(e.target.value)}>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">دلیل تغییر (اختیاری)</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="flex items-center justify-end gap-3">
          {savedMsg && <span className="text-xs text-emerald-400">{savedMsg}</span>}
          <Button onClick={handleSaveStatusStage} disabled={saving || unchanged}>
            {saving ? 'در حال ذخیره...' : 'ثبت تغییر (با تاریخ امروز)'}
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h3 className="text-sm font-bold">تاریخ کسر سهمیه</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">کسر سهمیه‌کننده</label>
            <Input
              value={quotaDeductorName}
              onChange={(e) => setQuotaDeductorName(e.target.value)}
              placeholder="نام مهندس"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">تاریخ کسر سهمیه</label>
            <JalaliDateInput
              value={quotaDeductionDate}
              onChange={(iso) => setQuotaDeductionDate(iso)}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          {quotaSavedMsg && <span className="text-xs text-emerald-400">{quotaSavedMsg}</span>}
          <Button onClick={handleSaveQuota} disabled={quotaSaving}>
            {quotaSaving ? 'در حال ذخیره...' : 'ذخیره'}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold">تاریخچه‌ی تغییرات وضعیت/مرحله</h3>
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">هنوز تغییری ثبت نشده.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {[...history].reverse().map((h) => (
              <li key={h.id} className="border-b border-neutral-900 pb-2 last:border-0">
                <div className="flex justify-between">
                  <span>
                    {h.eventType === 'status_changed' ? 'وضعیت' : 'مرحله'}: {h.oldValue} ←{' '}
                    {h.newValue}
                  </span>
                  <span className="text-neutral-500">
                    <DualDate date={h.eventDate} />
                  </span>
                </div>
                {h.reason && <p className="mt-1 text-xs text-neutral-500">دلیل: {h.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
