import { useEffect, useState } from 'react'
import { toJalali, toGregorian, daysInJalaliMonth, JALALI_MONTH_NAMES, todayAsIso } from '../jalali'

interface JalaliDateInputProps {
  /** مقدار ذخیره‌شده همیشه تاریخ میلادی ISO (YYYY-MM-DD) است - برای سازگاری با بقیه‌ی سیستم */
  value: string
  onChange: (isoDate: string) => void
  onBlur?: () => void
}

const selectClass =
  'h-9 rounded-lg border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 focus:border-emerald-600 focus:outline-none'

function currentJalaliYear(): number {
  const [gy, gm, gd] = todayAsIso().split('-').map(Number)
  return toJalali(gy, gm, gd).jy
}

export function JalaliDateInput({ value, onChange, onBlur }: JalaliDateInputProps): JSX.Element {
  const base = value || todayAsIso()
  const [gy0, gm0, gd0] = base.slice(0, 10).split('-').map(Number)
  const initial = toJalali(gy0, gm0, gd0)

  const [jy, setJy] = useState(initial.jy)
  const [jm, setJm] = useState(initial.jm)
  const [jd, setJd] = useState(initial.jd)

  // اگه مقدار از بیرون عوض بشه (مثلاً reset فرم بعد از ثبت)، تاریخ‌های داخلی هم sync بشن
  useEffect(() => {
    if (!value) return
    const [gy, gm, gd] = value.slice(0, 10).split('-').map(Number)
    const j = toJalali(gy, gm, gd)
    setJy(j.jy)
    setJm(j.jm)
    setJd(j.jd)
  }, [value])

  const commit = (newJy: number, newJm: number, newJd: number): void => {
    const maxDay = daysInJalaliMonth(newJy, newJm)
    const clampedDay = Math.min(newJd, maxDay)
    const g = toGregorian(newJy, newJm, clampedDay)
    const iso = `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`
    setJy(newJy)
    setJm(newJm)
    setJd(clampedDay)
    onChange(iso)
  }

  const dayCount = daysInJalaliMonth(jy, jm)
  const yearNow = currentJalaliYear()
  const years = Array.from({ length: 16 }, (_, i) => yearNow - 10 + i)

  return (
    <div onBlur={onBlur}>
      <div className="flex gap-1.5" dir="rtl">
        <select
          className={selectClass}
          value={jy}
          onChange={(e) => commit(Number(e.target.value), jm, jd)}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          className={`${selectClass} flex-1`}
          value={jm}
          onChange={(e) => commit(jy, Number(e.target.value), jd)}
        >
          {JALALI_MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={jd}
          onChange={(e) => commit(jy, jm, Number(e.target.value))}
        >
          {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-[11px] text-neutral-500" dir="ltr">
        میلادی: {value ? value.slice(0, 10) : '—'}
      </p>
    </div>
  )
}
