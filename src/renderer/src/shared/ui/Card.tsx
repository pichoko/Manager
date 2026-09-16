import { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={`rounded-xl border border-neutral-800 bg-neutral-900 p-4 ${className}`}
      {...props}
    />
  )
}
