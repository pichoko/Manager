import { InputHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`h-9 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-600 focus:outline-none ${className}`}
      {...props}
    />
  )
)

Input.displayName = 'Input'
