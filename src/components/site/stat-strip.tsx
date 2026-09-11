import { CountUp } from '@/components/site/count-up'
import { RevealGroup, RevealItem } from '@/components/site/reveal'

export type Stat = { label: string; value: number; suffix?: string }

/** Animated trust strip. Zero-valued stats are dropped rather than shown as 0. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  const visible = stats.filter((stat) => stat.value > 0)
  if (visible.length === 0) return null

  return (
    <RevealGroup className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
      {visible.map((stat) => (
        <RevealItem key={stat.label} className="text-center">
          <p className="font-serif text-[34px] font-semibold leading-none text-maroon-900 sm:text-[42px]">
            <CountUp value={stat.value} suffix={stat.suffix} />
          </p>
          <div className="mx-auto mt-4 h-px w-8 bg-gold-500" />
          <p className="mt-4 text-[12.5px] uppercase tracking-[0.12em] text-ink-500">{stat.label}</p>
        </RevealItem>
      ))}
    </RevealGroup>
  )
}
