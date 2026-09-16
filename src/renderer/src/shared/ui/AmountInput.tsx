import { forwardRef } from 'react'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  name?: string
  placeholder?: string
}

function formatWithCommas(digits: string): string {
  if (!digits) return ''
  return Number(digits).toLocaleString('en-US')
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, onBlur, name, placeholder }, ref) => (
    <input
      ref={ref}
      name={name}
      type="text"
      inputMode="numeric"
      dir="ltr"
      value={formatWithCommas(value)}
      onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
      onBlur={onBlur}
      placeholder={placeholder}
      className="h-9 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-left text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-600 focus:outline-none"
    />
  )
)

AmountInput.displayName = 'AmountInput'
