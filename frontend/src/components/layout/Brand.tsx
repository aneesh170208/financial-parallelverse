import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('h-9 w-9', className)}
      fill="none"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="11" fill="#0F1C2C" stroke="#2A3B51" />
      <path d="M11.5 27V17.5C11.5 14.46 13.96 12 17 12h1.5" stroke="#74E9C2" strokeWidth="3.1" strokeLinecap="round" />
      <path
        d="M28.5 13v9.5c0 3.04-2.46 5.5-5.5 5.5h-1.5"
        stroke="#44DCA9"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeDasharray="1.7 5"
      />
      <circle cx="20" cy="20" r="2.4" fill="#EEF4F0" />
    </svg>
  )
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <BrandMark className="shrink-0" />
      {!compact && (
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold leading-tight tracking-[-0.015em] text-ink">
            Financial <span className="text-emerald-300">Parallelverse</span>
          </div>
          <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.17em] text-faint">
            Decision intelligence
          </div>
        </div>
      )}
    </div>
  )
}
