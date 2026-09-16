import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700',
  secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700',
  ghost: 'bg-transparent text-neutral-300 hover:bg-neutral-800',
  danger: 'bg-red-600 text-white hover:bg-red-500'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
)

Button.displayName = 'Button'
