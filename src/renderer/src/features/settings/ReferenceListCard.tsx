import { useEffect, useState } from 'react'
import { Card } from '@renderer/shared/ui/Card'
import { Input } from '@renderer/shared/ui/Input'
import { Button } from '@renderer/shared/ui/Button'
import type { SettingItem } from '@renderer/env'

interface ReferenceListCardProps {
  category: string
  title: string
  placeholder: string
}

export function ReferenceListCard({ category, title, placeholder }: ReferenceListCardProps): JSX.Element {
  const [items, setItems] = useState<SettingItem[]>([])
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = (): void => {
    window.api.listSettings(category).then((res) => {
      if (res.ok && res.data) setItems(res.data)
    })
  }

  useEffect(load, [category])

  const handleAdd = async (): Promise<void> => {
    if (!newName.trim()) return
    setSaving(true)
    const res = await window.api.createSetting(category, newName.trim())
    setSaving(false)
    if (res.ok) {
      setNewName('')
      load()
    }
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      <div className="mb-3 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={saving}>
          افزودن
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-neutral-500">هنوز چیزی اضافه نشده.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((i) => (
            <li key={i.id} className="rounded-lg bg-neutral-800 px-3 py-1 text-xs text-neutral-200">
              {i.name}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
