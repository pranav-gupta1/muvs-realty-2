import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Shown wherever a filtered list comes back empty. Always offers a way out. */
export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="mt-8 rounded border border-dashed border-maroon-900/20 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold-200/50">
        <SearchX className="size-5 text-maroon-700" />
      </div>
      <h3 className="mt-5 font-serif text-xl text-maroon-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-500">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Button asChild variant="outline" className="mt-7">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
