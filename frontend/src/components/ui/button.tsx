import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary:
          'bg-emerald-400 text-[#05130E] shadow-[0_1px_0_rgba(255,255,255,.2)_inset,0_8px_22px_-14px_rgba(68,220,169,.8)] hover:bg-emerald-300 active:translate-y-px',
        secondary:
          'border border-line bg-panel text-ink shadow-[inset_0_1px_0_rgba(255,255,255,.025)] hover:border-[#30445e] hover:bg-elevated',
        outline:
          'border border-line bg-transparent text-ink hover:border-[#33485f] hover:bg-white/[0.035]',
        ghost: 'text-muted hover:bg-white/[0.055] hover:text-ink',
        soft: 'border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300 hover:bg-emerald-400/[0.13]',
        destructive:
          'border border-rose/25 bg-rose/[0.08] text-rose hover:border-rose/40 hover:bg-rose/[0.13]',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4',
        lg: 'h-11 rounded-[13px] px-5',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? children : (
          <>
            {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {children}
          </>
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
