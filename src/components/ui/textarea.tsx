import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-[110px] w-full rounded border border-maroon-900/15 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-sm transition-colors',
      'placeholder:text-ink-500/70',
      'focus-visible:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/35',
      'disabled:cursor-not-allowed disabled:opacity-60',
      'aria-[invalid=true]:border-red-600',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export { Textarea }
