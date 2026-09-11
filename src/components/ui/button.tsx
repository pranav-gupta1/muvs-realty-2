import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-maroon-700 text-cream-50 shadow-sm hover:bg-maroon-500 hover:shadow-card active:translate-y-px',
        gold: 'bg-gold-500 text-maroon-900 shadow-sm hover:bg-gold-500/90 active:translate-y-px',
        outline:
          'border border-maroon-700/25 bg-transparent text-maroon-900 hover:border-gold-500 hover:bg-gold-200/25',
        ghost: 'text-maroon-900 hover:bg-gold-200/35',
        light:
          'border border-cream-50/35 bg-cream-50/10 text-cream-50 backdrop-blur-sm hover:bg-cream-50/20 hover:border-gold-500',
        destructive: 'bg-red-700 text-white hover:bg-red-800',
        link: 'text-maroon-700 underline-offset-4 hover:text-maroon-500 hover:underline',
      },
      size: {
        sm: 'h-9 px-3.5 text-[13px]',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-[15px]',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
