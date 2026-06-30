import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router'

export interface DashboardAuthGuardOptions {
  hasDashboardAuth: () => boolean
  verifyDashboardAuth: () => Promise<boolean>
  probeDashboardAuthRequired: () => Promise<boolean>
  loginPath: string
}

export const useDashboardAuthState = (
  options: DashboardAuthGuardOptions,
): 'checking' | 'allowed' | 'login' => {
  const location = useLocation()
  const [state, setState] = useState<'checking' | 'allowed' | 'login'>('checking')

  useEffect(() => {
    let canceled = false

    const check = async () => {
      if (options.hasDashboardAuth()) {
        try {
          const authValid = await options.verifyDashboardAuth()
          if (!canceled) {
            setState(authValid ? 'allowed' : 'login')
          }
        } catch {
          if (!canceled) {
            setState('login')
          }
        }
        return
      }

      try {
        const authRequired = await options.probeDashboardAuthRequired()
        if (!canceled) {
          setState(authRequired ? 'login' : 'allowed')
        }
      } catch {
        if (!canceled) {
          setState('login')
        }
      }
    }

    setState('checking')
    check()

    return () => {
      canceled = true
    }
  }, [location.pathname, location.search, options])

  return state
}

export function LoginRedirect({ loginPath }: { loginPath: string }) {
  const location = useLocation()
  const next = encodeURIComponent(`${location.pathname}${location.search}`)
  return <Navigate to={`${loginPath}?next=${next}`} replace />
}
