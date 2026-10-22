import { ArrowLeft, Compass, GitFork, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="page-container">
      <div className="relative flex min-h-[62vh] flex-col items-center justify-center overflow-hidden rounded-3xl border border-line/70 bg-surface/60 px-6 py-16 text-center surface-grid">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-emerald-400/[0.08]" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full border border-sky/[0.06]" />

        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300">
          <Compass className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">404 · Unknown branch</p>
        <h1 className="mt-3 max-w-lg text-[28px] font-semibold leading-tight tracking-[-0.04em] text-ink sm:text-[34px]">
          This future doesn&apos;t exist yet.
        </h1>
        <p className="mt-3 max-w-md text-[12px] leading-relaxed text-muted">
          The page you followed has no matching route in this parallelverse. Head back to the overview or compare a
          different set of futures.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Button asChild size="sm">
            <Link to="/">
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              Back to overview
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to="/futures">
              <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
              Open Parallel Futures
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/profile">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Review your profile
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
