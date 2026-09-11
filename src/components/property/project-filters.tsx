'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ProjectStatus, PropertyLocation } from '@/lib/taxonomy'
import { serializeProjectFilters, type ProjectFilters } from '@/lib/projects'
import { cn } from '@/lib/utils'

/**
 * Status and location chips for /projects. Like the inventory filters, state
 * lives in the URL so a filtered view can be shared.
 */
export function ProjectFiltersBar({
  filters,
  statusCounts,
  basePath = '/projects',
}: {
  filters: ProjectFilters
  statusCounts: Record<string, number>
  basePath?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const apply = (next: ProjectFilters) => {
    startTransition(() => {
      router.replace(`${basePath}${serializeProjectFilters(next)}`, { scroll: false })
    })
  }

  const toggle = (key: 'statuses' | 'locations', value: string) => {
    const current = filters[key]
    apply({
      ...filters,
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    })
  }

  const anyActive = filters.statuses.length > 0 || filters.locations.length > 0

  return (
    <div className={cn('space-y-5', pending && 'opacity-70')} aria-busy={pending}>
      <FilterRow label="Status">
        {ProjectStatus.options.map((option) => (
          <Chip
            key={option.value}
            active={filters.statuses.includes(option.value)}
            onClick={() => toggle('statuses', option.value)}
            count={statusCounts[option.value]}
          >
            {option.label}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label="Location">
        {PropertyLocation.options.map((option) => (
          <Chip
            key={option.value}
            active={filters.locations.includes(option.value)}
            onClick={() => toggle('locations', option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </FilterRow>

      {anyActive ? (
        <button
          type="button"
          onClick={() => apply({ statuses: [], locations: [] })}
          className="text-[12.5px] font-medium text-maroon-700 underline-offset-4 hover:underline"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
        {label}
      </span>
      {children}
    </div>
  )
}

function Chip({
  children,
  active,
  onClick,
  count,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-maroon-700 bg-maroon-700 text-cream-50'
          : 'border-maroon-900/15 bg-white text-ink-900 hover:border-gold-500 hover:bg-gold-200/25',
      )}
    >
      {children}
      {typeof count === 'number' ? (
        <span className={cn('tabular ml-1.5', active ? 'text-cream-50/70' : 'text-ink-500')}>
          {count}
        </span>
      ) : null}
    </button>
  )
}
