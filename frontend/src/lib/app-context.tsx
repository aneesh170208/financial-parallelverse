import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { api, getApiErrorMessage, type ProfileInput } from '@/lib/api'
import type { Dashboard, Profile } from '@/types/api'

interface AppContextValue {
  profile: Profile | null
  dashboard: Dashboard | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refresh: () => Promise<void>
  updateProfile: (payload: ProfileInput) => Promise<Profile>
  restoreDemoProfile: () => Promise<Profile>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (background = false) => {
    if (background) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    try {
      const [nextProfile, nextDashboard] = await Promise.all([api.getProfile(), api.getDashboard()])
      setProfile(nextProfile)
      setDashboard(nextDashboard)
    } catch (caught) {
      setError(getApiErrorMessage(caught))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const refresh = useCallback(async () => {
    await load(true)
  }, [load])

  const updateProfile = useCallback(
    async (payload: ProfileInput) => {
      const nextProfile = await api.updateProfile(payload)
      setProfile(nextProfile)
      await load(true)
      return nextProfile
    },
    [load],
  )

  const restoreDemoProfile = useCallback(async () => {
    const nextProfile = await api.restoreDemoProfile()
    setProfile(nextProfile)
    await load(true)
    return nextProfile
  }, [load])

  return (
    <AppContext.Provider
      value={{
        profile,
        dashboard,
        isLoading,
        isRefreshing,
        error,
        refresh,
        updateProfile,
        restoreDemoProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used inside AppProvider')
  }
  return context
}
