import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@renderer/shared/ui/Card'
import { Button } from '@renderer/shared/ui/Button'
import { formatToman } from '@renderer/shared/format'
import { formatJalali, todayAsIso } from '@renderer/shared/jalali'
import type { DashboardData } from '@renderer/env'

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getDashboardData().then((res) => {
      if (res.ok && res.data) setData(res.data)
      setLoading(false)
    })
  }, [])

  const todayGregorian = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD ثابت و مستقل از منطقه‌زمانی
  const todayJalali = formatJalali(todayAsIso())

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">داشبورد</h1>
          <p className="text-sm text-neutral-500">
            {todayJalali} <span className="text-neutral-600">({todayGregorian})</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/projects/new')}>+ پروژه جدید</Button>
          <Button variant="secondary" onClick={() => navigate('/projects')}>
            مشاهده پروژه‌ها
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-500">در حال بارگذاری...</p>
      ) : !data ? (
        <p className="py-10 text-center text-sm text-red-400">خطا در دریافت اطلاعات داشبورد</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <p className="text-xs text-neutral-500">کل پروژه‌ها</p>
              <p className="mt-1 text-xl font-bold">{data.totalProjects}</p>
            </Card>
            <Card>
              <p className="text-xs text-neutral-500">پروژه‌های فعال</p>
              <p className="mt-1 text-xl font-bold">{data.activeProjects}</p>
            </Card>
            <Card>
              <p className="text-xs text-neutral-500">مجموع دریافتی</p>
              <p className="mt-1 text-xl font-bold text-emerald-400">
                {formatToman(data.totalReceived)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-neutral-500">مانده‌ی کل</p>
              <p
                className={`mt-1 text-xl font-bold ${data.totalBalance > 0 ? 'text-amber-400' : 'text-neutral-300'}`}
              >
                {formatToman(data.totalBalance)}
              </p>
            </Card>
          </div>

          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <span className="text-amber-400">⚠️</span> نیازمند پیگیری (دارای مانده)
            </h3>
            {data.projectsNeedingAttention.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-500">
                هیچ پروژه‌ای مانده‌ی پرداختی نداره 🎉
              </p>
            ) : (
              <ul className="space-y-1">
                {data.projectsNeedingAttention.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-neutral-800/50"
                  >
                    <span>
                      <span className="text-emerald-400">{p.projectNumber}</span> ·{' '}
                      {p.projectName || p.ownerName}
                    </span>
                    <span className="text-amber-400">{formatToman(p.balance)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-bold">پروژه‌های اخیر</h3>
            {data.recentProjects.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-500">هنوز پروژه‌ای ثبت نشده.</p>
            ) : (
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-xs text-neutral-500">
                    <th className="py-2 font-normal">شماره پرونده</th>
                    <th className="py-2 font-normal">مالک</th>
                    <th className="py-2 font-normal">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentProjects.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="cursor-pointer border-b border-neutral-900 last:border-0 hover:bg-neutral-800/50"
                    >
                      <td className="py-2 text-emerald-400">{p.projectNumber}</td>
                      <td className="py-2">{p.ownerName}</td>
                      <td className="py-2 text-neutral-400">{p.statusName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
