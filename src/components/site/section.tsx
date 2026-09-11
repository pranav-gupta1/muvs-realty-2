import * as React from 'react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/site/reveal'

/** Eyebrow + heading + optional lede, with the gold hairline underneath. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  tone = 'dark',
  className,
  action,
}: {
  eyebrow?: string
  title: string
  lede?: string
  align?: 'left' | 'center'
  tone?: 'dark' | 'light'
  className?: string
  action?: React.ReactNode
}) {
  return (
    <Reveal
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
        {eyebrow ? (
          <p className={cn('eyebrow', tone === 'light' && 'text-gold-200')}>{eyebrow}</p>
        ) : null}
        <h2
          className={cn(
            'mt-2.5 text-balance text-[26px] leading-[1.15] sm:text-3xl lg:text-[38px]',
            tone === 'light' && 'text-cream-50',
          )}
        >
          {title}
        </h2>
        {lede ? (
          <p
            className={cn(
              'mt-4 text-[15px] leading-relaxed text-ink-500',
              tone === 'light' && 'text-cream-50/75',
            )}
          >
            {lede}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </Reveal>
  )
}

/** Consistent vertical rhythm for page sections. */
export function Section({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('py-16 sm:py-20 lg:py-24', className)} {...props}>
      {children}
    </section>
  )
}

export function Hairline({ className }: { className?: string }) {
  return <div className={cn('hairline', className)} role="presentation" />
}
