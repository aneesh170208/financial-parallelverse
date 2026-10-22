import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Bell,
  Calculator,
  CalendarClock,
  CircleUserRound,
  GitFork,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { PageLoader } from '@/components/common/PageLoader'
import { ErrorState } from '@/components/common/ErrorState'
import { Brand, BrandMark } from '@/components/layout/Brand'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useApp } from '@/lib/app-context'
import { cn, initials } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
  end?: boolean
  badge?: number
}

function useNavItems() {
  const { dashboard } = useApp()
  const dueCount = (dashboard?.upcoming_installments || []).filter(
    (item) => item.due_status === 'overdue' || item.due_status === 'due_soon',
  ).length

  const primary: NavItem[] = [
    { label: 'Overview', to: '/', icon: LayoutDashboard, end: true },
    { label: 'Parallel Futures', to: '/futures', icon: GitFork },
    { label: 'Purchase Planner', to: '/planner', icon: Target },
    { label: 'EMI Calculator', to: '/emi', icon: Calculator },
    { label: 'Installment Tracker', to: '/installments', icon: CalendarClock, badge: dueCount },
    { label: 'Financial Profile', to: '/profile', icon: CircleUserRound },
  ]
  return { primary, dueCount }
}

function SidebarNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { primary } = useNavItems()
  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
      {!collapsed && <p className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Workspace</p>}
      {primary.map((item, index) => {
        const Icon = item.icon
        return (
          <div key={item.to}>
            {!collapsed && index === 3 && (
              <p className="mb-2 mt-5 px-3 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Money tools</p>
            )}
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-10 items-center rounded-xl text-[12px] font-medium transition-colors',
                  collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                  isActive
                    ? 'bg-emerald-400/[0.075] text-ink'
                    : 'text-muted hover:bg-white/[0.035] hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 h-4 w-[2px] rounded-r-full bg-emerald-400" />}
                  <Icon
                    className={cn('h-[17px] w-[17px] shrink-0 transition-colors', isActive ? 'text-emerald-300' : 'text-faint group-hover:text-muted')}
                    aria-hidden="true"
                    strokeWidth={1.8}
                  />
                  {!collapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {!!item.badge && (
                        <span className="ml-auto flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-amber/15 px-1 font-mono text-[9px] font-medium text-amber">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && !!item.badge && (
                    <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
                  )}
                </>
              )}
            </NavLink>
          </div>
        )
      })}
    </nav>
  )
}

function SidebarFooter({ collapsed = false }: { collapsed?: boolean }) {
  const { profile } = useApp()
  if (!profile) return null
  return (
    <div className="mt-auto border-t border-line/70 pt-4">
      {!collapsed ? (
        <Link to="/profile" className="mb-3 block rounded-xl border border-line/70 bg-[#09121E] px-3.5 py-3 transition-colors hover:border-[#30445e]">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
              <Sparkles className="h-3 w-3 text-emerald-300" aria-hidden="true" /> Financial weather
            </span>
            <span className="numeric text-xs font-medium text-ink">{profile.health_score}</span>
          </div>
          <Progress value={profile.health_score} />
          <p className="mt-2 text-[10px] text-faint">
            {profile.health_label} · {profile.emergency_coverage_months.toFixed(1)} mo cover
          </p>
        </Link>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/profile"
              aria-label={`Financial weather score ${profile.health_score}`}
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-[#09121E] text-[10px] font-semibold text-emerald-300"
            >
              {profile.health_score}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{profile.health_label} · {profile.emergency_coverage_months.toFixed(1)} months covered</TooltipContent>
        </Tooltip>
      )}
      <Link
        to="/profile"
        className={cn(
          'flex items-center rounded-xl border border-transparent transition-colors hover:border-line hover:bg-white/[0.025]',
          collapsed ? 'justify-center py-2' : 'gap-3 px-2 py-2',
        )}
        title={collapsed ? profile.name : undefined}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/[0.1] text-[10px] font-bold text-emerald-300">
          {initials(profile.name)}
        </span>
        {!collapsed && (
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold text-ink">{profile.name}</span>
            <span className="block text-[9px] text-faint">Demo workspace</span>
          </span>
        )}
      </Link>
    </div>
  )
}

function MobileDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-[#03070d]/80 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-[290px] max-w-[86vw] flex-col border-r border-line bg-[#080F1A] p-5 shadow-lift focus:outline-none">
          <div className="mb-8 flex items-center justify-between">
            <Brand />
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close navigation">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Navigate to any section of Financial Parallelverse.
          </DialogPrimitive.Description>
          <SidebarNav onNavigate={() => onOpenChange(false)} />
          <SidebarFooter />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function MobileBottomNav({ onMore }: { onMore: () => void }) {
  const { dueCount } = useNavItems()
  const links = [
    { label: 'Overview', to: '/', icon: LayoutDashboard, end: true },
    { label: 'Futures', to: '/futures', icon: GitFork },
    { label: 'Planner', to: '/planner', icon: Target },
    { label: 'Tracker', to: '/installments', icon: CalendarClock },
  ]
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-[#080F1A]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      aria-label="Mobile navigation"
    >
      {links.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 py-2.5 text-[9px] font-medium transition-colors',
                isActive ? 'text-emerald-300' : 'text-faint',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            {item.label}
            {item.to === '/installments' && dueCount > 0 && (
              <span className="absolute right-[22%] top-2 h-1.5 w-1.5 rounded-full bg-amber" />
            )}
          </NavLink>
        )
      })}
      <button
        type="button"
        onClick={onMore}
        className="flex flex-col items-center gap-1 py-2.5 text-[9px] font-medium text-faint"
      >
        <Menu className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
        More
      </button>
    </nav>
  )
}

export function AppShell() {
  const { profile, error, isLoading, refresh } = useApp()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('pv-sidebar-collapsed') === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { dueCount } = useNavItems()

  useEffect(() => {
    localStorage.setItem('pv-sidebar-collapsed', String(collapsed))
  }, [collapsed])

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="min-h-screen">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line/80 bg-[#080F1A]/95 px-3.5 pb-4 pt-5 backdrop-blur-xl transition-[width] duration-300 lg:flex',
          collapsed ? 'w-[82px] items-center' : 'w-[258px]',
        )}
        aria-label="Primary sidebar"
      >
        <div className={cn('mb-8 flex w-full items-center', collapsed ? 'justify-center' : 'justify-between px-1')}>
          <Link to="/" aria-label="Financial Parallelverse home">
            <Brand compact={collapsed} />
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>
        {collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="mb-5"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        )}
        <SidebarNav collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />
      </aside>

      <div className={cn('min-h-screen transition-[padding] duration-300', collapsed ? 'lg:pl-[82px]' : 'lg:pl-[258px]')}>
        <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
          <div className="mx-auto flex h-[62px] max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-muted lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <Link to="/" className="flex items-center gap-2.5 lg:hidden" aria-label="Financial Parallelverse home">
                <BrandMark className="h-8 w-8" />
                <span className="text-[12px] font-semibold tracking-[-0.015em] text-ink">Financial <span className="text-emerald-300">PV</span></span>
              </Link>
              <div className="hidden items-center gap-2.5 lg:flex">
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
                  Local simulation engine
                </span>
                <span className="h-3 w-px bg-line" />
                <span className="rounded-md border border-line/70 bg-white/[0.025] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                  Demo data
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/installments"
                    aria-label={`Installment reminders${dueCount ? `, ${dueCount} due soon` : ''}`}
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
                  >
                    <Bell className="h-[17px] w-[17px]" strokeWidth={1.8} />
                    {dueCount > 0 && (
                      <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber px-1 font-mono text-[8px] font-bold text-canvas">
                        {dueCount}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {dueCount ? `${dueCount} installment${dueCount === 1 ? '' : 's'} need attention` : 'No payments due soon'}
                </TooltipContent>
              </Tooltip>
              <Link
                to="/profile"
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel text-[9px] font-bold text-emerald-300 transition-colors hover:border-emerald-400/40"
                aria-label="Open financial profile"
              >
                {profile ? initials(profile.name) : '?'}
              </Link>
            </div>
          </div>
        </header>

        <main>
          {error && !profile ? (
            <div className="page-container">
              <ErrorState message={error} onRetry={() => void refresh()} />
            </div>
          ) : isLoading && !profile ? (
            <PageLoader />
          ) : (
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </motion.div>
          )}
        </main>
      </div>

      <MobileBottomNav onMore={() => setMobileOpen(true)} />
      <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen} />
    </div>
  )
}
