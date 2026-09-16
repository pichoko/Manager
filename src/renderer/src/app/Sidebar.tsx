import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Wallet, BarChart3, Receipt, Settings, type LucideIcon } from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { to: '/projects', label: 'پروژه‌ها', icon: Briefcase },
  { to: '/payments', label: 'پرداخت‌ها', icon: Wallet },
  { to: '/reports', label: 'گزارش‌ها', icon: BarChart3 },
  { to: '/office-expenses', label: 'هزینه‌های دفتر', icon: Receipt },
  { to: '/settings', label: 'تنظیمات', icon: Settings }
]

export function Sidebar(): JSX.Element {
  return (
    <aside className="flex w-56 flex-shrink-0 flex-col gap-1 border-l border-neutral-800 bg-neutral-900 p-3">
      <div className="mb-4 px-2 text-sm font-bold">مدیریت پروژه</div>

      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-emerald-600/15 text-emerald-400'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
            }`
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </aside>
  )
}
