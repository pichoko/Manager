import { InputHTMLAttributes, forwardRef } from 'react'
import { formatJalali } from '../jalali'

export const DualDateInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ value, className = '', ...props }, ref) => (
  <div>
    <input
      ref={ref}
      type="date"
      value={value}
      className={`h-9 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 focus:border-emerald-600 focus:outline-none ${className}`}
      {...props}
    />
    <p className="mt-1 text-[11px] text-neutral-500">
      {formatJalali(typeof value === 'string' ? value : undefined)}
    </p>
  </div>
))

DualDateInput.displayName = 'DualDateInput'
