import { useEffect, useState } from 'react'
import { Card } from '@renderer/shared/ui/Card'
import { Input } from '@renderer/shared/ui/Input'
import { Select } from '@renderer/shared/ui/Select'
import { Button } from '@renderer/shared/ui/Button'
import { AmountInput } from '@renderer/shared/ui/AmountInput'
import { formatToman } from '@renderer/shared/format'
import type { TariffRuleRecord, TariffVersionRecord } from '@renderer/env'

const DISCIPLINE_LABELS: Record<string, string> = {
  civil: 'عمران',
  architecture: 'معماری',
  mechanical: 'مکانیکی',
  electrical: 'برقی',
  coordination: 'هماهنگ‌کننده'
}

export function TariffSettingsSection(): JSX.Element {
  const [versions, setVersions] = useState<TariffVersionRecord[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string>('')
  const [rules, setRules] = useState<TariffRuleRecord[]>([])

  const [newYear, setNewYear] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [copyFrom, setCopyFrom] = useState('')
  const [creatingVersion, setCreatingVersion] = useState(false)

  const [ruleForm, setRuleForm] = useState({
    discipline: 'civil',
    minFloors: '',
    maxFloors: '',
    minArea: '',
    maxArea: '',
    unitRate: ''
  })
  const [savingRule, setSavingRule] = useState(false)

  const loadVersions = (): void => {
    window.api.listTariffVersions().then((res) => {
      if (res.ok && res.data) {
        setVersions(res.data)
        if (!selectedVersionId && res.data[0]) setSelectedVersionId(res.data[0].id)
      }
    })
  }

  const loadRules = (versionId: string): void => {
    if (!versionId) return
    window.api.listTariffRules(versionId).then((res) => {
      if (res.ok && res.data) setRules(res.data)
    })
  }

  useEffect(loadVersions, [])
  useEffect(() => loadRules(selectedVersionId), [selectedVersionId])

  const handleCreateVersion = async (): Promise<void> => {
    if (!newYear.trim() || !newTitle.trim()) return
    setCreatingVersion(true)
    const res = await window.api.createTariffVersion({
      year: Number(newYear),
      title: newTitle.trim(),
      copyFromVersionId: copyFrom || undefined
    })
    setCreatingVersion(false)
    if (res.ok) {
      setNewYear('')
      setNewTitle('')
      setCopyFrom('')
      loadVersions()
      if (res.data) setSelectedVersionId(res.data.id)
    }
  }

  const handleAddRule = async (): Promise<void> => {
    if (!selectedVersionId || !ruleForm.minFloors || !ruleForm.minArea || !ruleForm.unitRate) return
    setSavingRule(true)
    const res = await window.api.createTariffRule({
      tariffVersionId: selectedVersionId,
      discipline: ruleForm.discipline,
      minFloors: Number(ruleForm.minFloors),
      maxFloors: ruleForm.maxFloors ? Number(ruleForm.maxFloors) : undefined,
      minArea: Number(ruleForm.minArea),
      maxArea: ruleForm.maxArea ? Number(ruleForm.maxArea) : undefined,
      unitRate: Number(ruleForm.unitRate),
      displayOrder: rules.length + 1
    })
    setSavingRule(false)
    if (res.ok) {
      setRuleForm({ discipline: 'civil', minFloors: '', maxFloors: '', minArea: '', maxArea: '', unitRate: '' })
      loadRules(selectedVersionId)
    }
  }

  const handleDeleteRule = async (id: string): Promise<void> => {
    await window.api.deleteTariffRule(id)
    loadRules(selectedVersionId)
  }

  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-bold">تعرفه‌ها</h3>
      <p className="text-xs text-neutral-500">
        هر سال یک نسخه‌ی مستقل داره. ویرایش یک نسخه روی نسخه‌های دیگه (و پروژه‌هایی که قبلاً
        از روی تعرفه محاسبه شدن) هیچ اثری نمی‌ذاره.
      </p>

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-800 p-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">سال (مثلاً ۱۴۰۶)</label>
          <Input value={newYear} onChange={(e) => setNewYear(e.target.value)} className="w-28" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">عنوان</label>
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="تعرفه سال ۱۴۰۶" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-400">کپی از (اختیاری)</label>
          <Select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="">— شروع خالی —</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={handleCreateVersion} disabled={creatingVersion}>
          {creatingVersion ? 'در حال ساخت...' : '+ نسخه‌ی جدید'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {versions.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelectedVersionId(v.id)}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              v.id === selectedVersionId
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {v.title} {v.isActive && '⭐'}
          </button>
        ))}
      </div>

      {selectedVersionId && (
        <div className="space-y-3">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-500">
                <th className="py-1.5 font-normal">رشته</th>
                <th className="py-1.5 font-normal">سقف</th>
                <th className="py-1.5 font-normal">متراژ</th>
                <th className="py-1.5 font-normal">تعرفه (تومان/متر)</th>
                <th className="py-1.5 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-neutral-900">
                  <td className="py-1.5">{DISCIPLINE_LABELS[r.discipline] ?? r.discipline}</td>
                  <td className="py-1.5">
                    {r.minFloors} تا {r.maxFloors ?? '∞'}
                  </td>
                  <td className="py-1.5">
                    {r.minArea} تا {r.maxArea ?? '∞'}
                  </td>
                  <td className="py-1.5">{formatToman(r.unitRate)}</td>
                  <td className="py-1.5">
                    <button
                      onClick={() => handleDeleteRule(r.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-6 gap-2 rounded-lg border border-neutral-800 p-3">
            <Select
              value={ruleForm.discipline}
              onChange={(e) => setRuleForm({ ...ruleForm, discipline: e.target.value })}
              className="col-span-2"
            >
              <option value="civil">عمران</option>
              <option value="architecture">معماری</option>
              <option value="mechanical">مکانیکی</option>
              <option value="electrical">برقی</option>
              <option value="coordination">هماهنگ‌کننده</option>
            </Select>
            <Input
              placeholder="حداقل سقف"
              value={ruleForm.minFloors}
              onChange={(e) => setRuleForm({ ...ruleForm, minFloors: e.target.value })}
            />
            <Input
              placeholder="حداکثر سقف"
              value={ruleForm.maxFloors}
              onChange={(e) => setRuleForm({ ...ruleForm, maxFloors: e.target.value })}
            />
            <Input
              placeholder="حداقل متراژ"
              value={ruleForm.minArea}
              onChange={(e) => setRuleForm({ ...ruleForm, minArea: e.target.value })}
            />
            <Input
              placeholder="حداکثر متراژ"
              value={ruleForm.maxArea}
              onChange={(e) => setRuleForm({ ...ruleForm, maxArea: e.target.value })}
            />
            <div className="col-span-2">
              <AmountInput
                value={ruleForm.unitRate}
                onChange={(v) => setRuleForm({ ...ruleForm, unitRate: v })}
                placeholder="تعرفه به تومان"
              />
            </div>
            <Button onClick={handleAddRule} disabled={savingRule} className="col-span-2">
              {savingRule ? 'در حال افزودن...' : '+ افزودن بازه'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
