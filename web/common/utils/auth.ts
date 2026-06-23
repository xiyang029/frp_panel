export interface DashboardAuth {
  username: string
  password: string
}

export const getDashboardAuth = (
  storageKey: string,
): DashboardAuth | null => {
  const raw = window.localStorage.getItem(storageKey)
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

export const hasDashboardAuth = (storageKey: string): boolean =>
  getDashboardAuth(storageKey) !== null

export const setDashboardAuth = (
  storageKey: string,
  auth: DashboardAuth,
): void => {
  window.localStorage.setItem(storageKey, JSON.stringify(auth))
}

export const clearDashboardAuth = (storageKey: string): void => {
  window.localStorage.removeItem(storageKey)
}

export const buildBasicAuthHeader = (
  storageKey: string,
): string | null => {
  const auth = getDashboardAuth(storageKey)
  if (!auth) {
    return null
  }
  return `Basic ${window.btoa(`${auth.username}:${auth.password}`)}`
}

export const probeDashboardAuthRequired = async (
  probePath: string,
): Promise<boolean> => {
  const response = await fetch(probePath, {
    credentials: 'include',
    method: 'GET',
  })
  return response.status === 401
}
