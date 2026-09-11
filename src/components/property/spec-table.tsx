import { cn } from '@/lib/utils'

export type SpecRow = { label: string; value: string }

/** Two-column specification table used on both detail pages. */
export function SpecTable({ rows, className }: { rows: SpecRow[]; className?: string }) {
  if (rows.length === 0) return null

  return (
    <dl
      className={cn(
        'grid grid-cols-1 overflow-hidden rounded border border-maroon-900/10 bg-white sm:grid-cols-2',
        className,
      )}
    >
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={cn(
            'flex items-baseline justify-between gap-4 border-b border-maroon-900/8 px-4 py-3.5',
            // Keep the zebra effect readable in both one- and two-column layouts.
            index % 2 === 0 ? 'sm:border-r' : '',
          )}
        >
          <dt className="text-[13px] text-ink-500">{row.label}</dt>
          <dd className="tabular text-right text-[14px] font-medium text-ink-900">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
