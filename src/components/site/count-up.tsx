'use client'

import * as React from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { formatIndianNumber } from '@/lib/format'

/**
 * Counts up to `value` when scrolled into view. Respects reduced motion by
 * rendering the final number immediately, and the final value is always in the
 * DOM on first paint for screen readers via aria-label.
 */
export function CountUp({
  value,
  suffix = '',
  durationMs = 1400,
}: {
  value: number
  suffix?: string
  durationMs?: number
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = React.useState(reduceMotion ? value : 0)

  React.useEffect(() => {
    if (!inView || reduceMotion) {
      if (reduceMotion) setDisplay(value)
      return
    }

    let frame = 0
    const start = performance.now()
    // Ease-out cubic: fast start, settles gently on the final number.
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      setDisplay(Math.round(ease(progress) * value))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduceMotion, value, durationMs])

  return (
    <span ref={ref} className="tabular" aria-label={`${formatIndianNumber(value)}${suffix}`}>
      <span aria-hidden="true">
        {formatIndianNumber(display)}
        {suffix}
      </span>
    </span>
  )
}
