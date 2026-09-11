'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Scroll-snap carousel. Native horizontal scrolling does the work — so it is
 * touch-, trackpad- and keyboard-friendly for free, degrades to a plain
 * scrollable row without JS, and needs no animation library. The arrows are
 * hidden when there is nothing to scroll to.
 */
export function Carousel({
  children,
  label,
  className,
  itemClassName = 'w-[86vw] sm:w-[54vw] lg:w-[calc((100%-3rem)/3)]',
}: {
  children: React.ReactNode
  label: string
  className?: string
  itemClassName?: string
}) {
  const track = React.useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = React.useState(true)
  const [atEnd, setAtEnd] = React.useState(false)

  const sync = React.useCallback(() => {
    const element = track.current
    if (!element) return
    const max = element.scrollWidth - element.clientWidth
    setAtStart(element.scrollLeft <= 8)
    setAtEnd(element.scrollLeft >= max - 8)
  }, [])

  React.useEffect(() => {
    sync()
    const element = track.current
    if (!element) return
    element.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      element.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [sync])

  const scrollBy = (direction: 1 | -1) => {
    const element = track.current
    if (!element) return
    const step = element.clientWidth * 0.8
    element.scrollBy({ left: step * direction, behavior: 'smooth' })
  }

  const items = React.Children.toArray(children)
  const scrollable = !atStart || !atEnd

  return (
    <div className={cn('relative', className)}>
      <ul
        ref={track}
        aria-label={label}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2"
      >
        {items.map((child, index) => (
          <li key={index} className={cn('shrink-0 snap-start', itemClassName)}>
            {child}
          </li>
        ))}
      </ul>

      {scrollable ? (
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={atStart}
            aria-label="Scroll left"
            className="rounded-full border border-maroon-900/15 bg-white p-2.5 text-maroon-900 transition-colors hover:border-gold-500 hover:bg-gold-200/30 disabled:opacity-35"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={atEnd}
            aria-label="Scroll right"
            className="rounded-full border border-maroon-900/15 bg-white p-2.5 text-maroon-900 transition-colors hover:border-gold-500 hover:bg-gold-200/30 disabled:opacity-35"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
