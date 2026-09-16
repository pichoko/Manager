interface ComingSoonPageProps {
  title: string
  description?: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps): JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="max-w-sm text-sm text-neutral-500">
        {description ?? 'این بخش هنوز ساخته نشده — در فازهای بعدی اضافه می‌شه.'}
      </p>
    </div>
  )
}
