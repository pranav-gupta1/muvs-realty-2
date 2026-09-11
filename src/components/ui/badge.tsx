import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] transition-colors',
  {
    variants: {
      variant: {
        gold: 'border-gold-500/40 bg-gold-200/40 text-maroon-900',
        maroon: 'border-transparent bg-maroon-700 text-cream-50',
        outline: 'border-maroon-900/20 bg-transparent text-ink-500',
        light: 'border-cream-50/30 bg-maroon-900/55 text-cream-50 backdrop-blur-sm',
        muted: 'border-transparent bg-ink-500/10 text-ink-500',
      },
    },
    defaultVariants: { variant: 'gold' },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
