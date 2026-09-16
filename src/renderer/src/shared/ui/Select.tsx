import { SelectHTMLAttributes, forwardRef } from 'react'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => (
    <select
      ref={ref}
      className={`h-9 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 focus:border-emerald-600 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  )
)

Select.displayName = 'Select'
