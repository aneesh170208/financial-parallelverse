import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  className?: string
  indicatorClassName?: string
  label?: string
}

export function Progress({ value, className, indicatorClassName, label }: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]', className)}
      role="progressbar"
      aria-valuenow={Math.round(safeValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full bg-emerald-400 transition-[width] duration-500', indicatorClassName)}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}
