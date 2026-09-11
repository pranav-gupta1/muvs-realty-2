import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded border border-maroon-900/15 bg-white px-3.5 py-2 text-sm text-ink-900 shadow-sm transition-colors',
        'placeholder:text-ink-500/70',
        'focus-visible:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/35 focus-visible:ring-offset-0',
        'disabled:cursor-not-allowed disabled:bg-ink-500/5 disabled:opacity-60',
        'aria-[invalid=true]:border-red-600 aria-[invalid=true]:ring-red-600/20',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
