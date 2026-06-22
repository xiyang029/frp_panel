const STORAGE_KEY = 'frpc-dashboard-auth'
const AUTH_PROBE_PATH = '/api/status'

export interface DashboardAuth {
  username: string
  password: string
}

export const getDashboardAuth = (): DashboardAuth | null => {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DashboardAuth>
    if (!parsed.username || !parsed.password) {
      return null
    }
    return {
      username: parsed.username,
      password: parsed.password,
    }
  } catch {
    return null
  }
}

export const hasDashboardAuth = (): boolean => getDashboardAuth() !== null

export const setDashboardAuth = (auth: DashboardAuth): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

export const clearDashboardAuth = (): void => {
  window.localStorage.removeItem(STORAGE_KEY)
}

export const buildBasicAuthHeader = (): string | null => {
  const auth = getDashboardAuth()
  if (!auth) {
    return null
  }
  return `Basic ${window.btoa(`${auth.username}:${auth.password}`)}`
}

// Detect whether the dashboard endpoint requires Basic Auth before showing the login page.
export const probeDashboardAuthRequired = async (): Promise<boolean> => {
  const response = await fetch(AUTH_PROBE_PATH, {
    credentials: 'include',
    method: 'GET',
  })
  return response.status === 401
}
