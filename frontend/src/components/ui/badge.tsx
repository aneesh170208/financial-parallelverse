import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
  {
    variants: {
      variant: {
        default: 'border-line bg-white/[0.035] text-muted',
        success: 'border-emerald-400/20 bg-emerald-400/[0.09] text-emerald-300',
        warning: 'border-amber/25 bg-amber/[0.09] text-amber',
        danger: 'border-rose/25 bg-rose/[0.09] text-rose',
        info: 'border-sky/25 bg-sky/[0.08] text-sky',
        violet: 'border-violet/25 bg-violet/[0.08] text-violet',
        outline: 'border-line bg-transparent text-muted',
        solid: 'border-emerald-400 bg-emerald-400 text-canvas',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
