import { MotionConfig } from 'motion/react'
import { lazy } from 'react'
import { Toaster } from 'sonner'
import { Route, Routes } from 'react-router-dom'

import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/lib/app-context'

const OverviewPage = lazy(() => import('@/pages/OverviewPage').then((module) => ({ default: module.OverviewPage })))
const SimulatorPage = lazy(() => import('@/pages/SimulatorPage').then((module) => ({ default: module.SimulatorPage })))
const PurchasePlannerPage = lazy(() =>
  import('@/pages/PurchasePlannerPage').then((module) => ({ default: module.PurchasePlannerPage })),
)
const EMIPage = lazy(() => import('@/pages/EMIPage').then((module) => ({ default: module.EMIPage })))
const InstallmentsPage = lazy(() =>
  import('@/pages/InstallmentsPage').then((module) => ({ default: module.InstallmentsPage })),
)
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <TooltipProvider delayDuration={250} skipDelayDuration={400}>
          <MotionConfig reducedMotion="user">
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<OverviewPage />} />
                <Route path="futures" element={<SimulatorPage />} />
                <Route path="planner" element={<PurchasePlannerPage />} />
                <Route path="emi" element={<EMIPage />} />
                <Route path="installments" element={<InstallmentsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            <Toaster
              theme="dark"
              position="bottom-right"
              richColors
              closeButton
              offset={20}
              toastOptions={{
                style: {
                  background: '#0B1524',
                  border: '1px solid #203047',
                  color: '#EEF4F0',
                  fontFamily: '"Manrope Variable", Manrope, system-ui, sans-serif',
                  fontSize: '12px',
                  boxShadow: '0 30px 70px -32px rgba(0,0,0,0.85)',
                },
              }}
            />
          </MotionConfig>
        </TooltipProvider>
      </AppProvider>
    </ErrorBoundary>
  )
}
