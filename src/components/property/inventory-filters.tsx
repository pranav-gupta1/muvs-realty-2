'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { InventorySort, PropertyLocation, PropertyType } from '@/lib/taxonomy'
import {
  serializeInventoryFilters,
  type InventoryBounds,
  type InventoryFilters,
} from '@/lib/inventory'
import { formatIndianNumber, formatIndianPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Inventory filters. Every control writes to the URL query string, so a
 * filtered view is shareable and the back button behaves — the server component
 * re-renders from those params rather than from client state.
 *
 * Slider and search changes are debounced so dragging does not fire a
 * navigation per pixel.
 */
export function InventoryFilters({
  filters,
  bounds,
  total,
}: {
  filters: InventoryFilters
  bounds: InventoryBounds
  total: number
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const [draft, setDraft] = React.useState(filters)
  const debounce = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep the controls in step when navigation changes the params (back button,
  // "clear all", a link from the footer).
  React.useEffect(() => setDraft(filters), [filters])

  const push = React.useCallback(
    (next: InventoryFilters, immediate = true) => {
      setDraft(next)
      if (debounce.current) clearTimeout(debounce.current)

      const navigate = () =>
        startTransition(() => {
          // Any filter change resets to page 1.
          router.replace(`/inventory${serializeInventoryFilters({ ...next, page: 1 })}`, {
            scroll: false,
          })
        })

      if (immediate) navigate()
      else debounce.current = setTimeout(navigate, 350)
    },
    [router],
  )

  const toggle = (key: 'types' | 'locations', value: string) => {
    const current = draft[key]
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
    push({ ...draft, [key]: next })
  }

  const active =
    draft.types.length +
    draft.locations.length +
    (draft.priceMin != null || draft.priceMax != null ? 1 : 0) +
    (draft.areaMin != null || draft.areaMax != null ? 1 : 0) +
    (draft.q ? 1 : 0)

  const priceValue: [number, number] = [
    draft.priceMin ?? bounds.priceMin,
    draft.priceMax ?? bounds.priceMax,
  ]
  const areaValue: [number, number] = [
    draft.areaMin ?? bounds.areaMin,
    draft.areaMax ?? bounds.areaMax,
  ]

  const clearAll = () =>
    push({
      types: [],
      locations: [],
      priceMin: null,
      priceMax: null,
      areaMin: null,
      areaMax: null,
      sort: 'newest',
      q: '',
      page: 1,
    })

  const panel = (
    <div className="space-y-7">
      <FilterGroup title="Property Type">
        <div className="space-y-2.5">
          {PropertyType.options.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
              <Checkbox
                checked={draft.types.includes(option.value)}
                onCheckedChange={() => toggle('types', option.value)}
              />
              <span className="text-ink-900">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Location">
        <div className="space-y-2.5">
          {PropertyLocation.options.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
              <Checkbox
                checked={draft.locations.includes(option.value)}
                onCheckedChange={() => toggle('locations', option.value)}
              />
              <span className="text-ink-900">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <p className="tabular mb-3 text-[13px] text-ink-500">
          {formatIndianPrice(priceValue[0], { fallback: '₹0' })} to{' '}
          {formatIndianPrice(priceValue[1], { fallback: 'Any' })}
        </p>
        <Slider
          min={bounds.priceMin}
          max={bounds.priceMax}
          step={100_000}
          value={priceValue}
          onValueChange={([min, max]) =>
            push(
              {
                ...draft,
                priceMin: min > bounds.priceMin ? min : null,
                priceMax: max < bounds.priceMax ? max : null,
              },
              false,
            )
          }
          aria-label="Price range"
        />
      </FilterGroup>

      <FilterGroup title="Area">
        <p className="tabular mb-3 text-[13px] text-ink-500">
          {formatIndianNumber(areaValue[0])} to {formatIndianNumber(areaValue[1])} sq.ft.
        </p>
        <Slider
          min={bounds.areaMin}
          max={bounds.areaMax}
          step={100}
          value={areaValue}
          onValueChange={([min, max]) =>
            push(
              {
                ...draft,
                areaMin: min > bounds.areaMin ? min : null,
                areaMax: max < bounds.areaMax ? max : null,
              },
              false,
            )
          }
          aria-label="Area range in square feet"
        />
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-500">
          Areas are compared in square feet, so plots quoted in sq.yd., acres or bigha are
          included correctly.
        </p>
      </FilterGroup>
    </div>
  )

  return (
    <div>
      {/* Search + sort + mobile trigger */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Input
            type="search"
            value={draft.q}
            placeholder="Search by title, sector or locality"
            aria-label="Search listings"
            onChange={(event) => push({ ...draft, q: event.target.value }, false)}
          />
          {pending ? (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-maroon-700/60" />
          ) : null}
        </div>

        <select
          value={draft.sort}
          onChange={(event) =>
            push({ ...draft, sort: event.target.value as InventoryFilters['sort'] })
          }
          aria-label="Sort listings"
          className="h-11 rounded border border-maroon-900/15 bg-white px-3 text-[13.5px] text-ink-900 shadow-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35"
        >
          {InventorySort.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="lg:hidden">
              <SlidersHorizontal className="size-4" />
              Filters
              {active > 0 ? (
                <span className="ml-1 rounded-full bg-maroon-700 px-1.5 py-0.5 text-[11px] text-cream-50">
                  {active}
                </span>
              ) : null}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
            <DialogTitle>Filters</DialogTitle>
            <div className="mt-5">{panel}</div>
            <div className="mt-7 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={clearAll}>
                Clear all
              </Button>
              <DialogClose asChild>
                <Button className="flex-1">
                  Show {total} result{total === 1 ? '' : 's'}
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active filter chips */}
      {active > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {draft.types.map((type) => (
            <Chip key={type} onRemove={() => toggle('types', type)}>
              {PropertyType.label(type)}
            </Chip>
          ))}
          {draft.locations.map((location) => (
            <Chip key={location} onRemove={() => toggle('locations', location)}>
              {PropertyLocation.label(location)}
            </Chip>
          ))}
          {draft.priceMin != null || draft.priceMax != null ? (
            <Chip onRemove={() => push({ ...draft, priceMin: null, priceMax: null })}>
              {formatIndianPrice(priceValue[0], { fallback: '₹0' })} to{' '}
              {formatIndianPrice(priceValue[1], { fallback: 'Any' })}
            </Chip>
          ) : null}
          {draft.areaMin != null || draft.areaMax != null ? (
            <Chip onRemove={() => push({ ...draft, areaMin: null, areaMax: null })}>
              {formatIndianNumber(areaValue[0])} to {formatIndianNumber(areaValue[1])} sq.ft.
            </Chip>
          ) : null}
          {draft.q ? <Chip onRemove={() => push({ ...draft, q: '' })}>“{draft.q}”</Chip> : null}

          <button
            type="button"
            onClick={clearAll}
            className="text-[12.5px] font-medium text-maroon-700 underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}

      {/* Desktop sidebar panel */}
      <div className="mt-8 hidden lg:block">{panel}</div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-maroon-900">
        {title}
      </h3>
      <div className="hairline mb-4" />
      {children}
    </div>
  )
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-200/35 py-1 pl-3 pr-1.5 text-[12.5px] text-maroon-900',
      )}
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove filter"
        className="rounded-full p-0.5 transition-colors hover:bg-maroon-900/10"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}
