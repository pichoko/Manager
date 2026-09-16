import { formatJalali } from '../jalali'

export function DualDate({ date }: { date: string | null | undefined }): JSX.Element {
  if (!date) return <span>—</span>
  return (
    <span>
      {formatJalali(date)} <span className="text-neutral-500">({date.slice(0, 10)})</span>
    </span>
  )
}
