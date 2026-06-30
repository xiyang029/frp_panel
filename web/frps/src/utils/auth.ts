import {
  buildBasicAuthHeader as buildBasicAuthHeaderBase,
  clearDashboardAuth as clearDashboardAuthBase,
  getDashboardAuth as getDashboardAuthBase,
  hasDashboardAuth as hasDashboardAuthBase,
  probeDashboardAuthRequired as probeDashboardAuthRequiredBase,
  setDashboardAuth as setDashboardAuthBase,
  verifyDashboardAuth as verifyDashboardAuthBase,
  type DashboardAuth,
} from '@common/utils/auth'

export const STORAGE_KEY = 'frps-dashboard-auth'
const AUTH_PROBE_PATH = '/api/serverinfo'

export type { DashboardAuth }

export const getDashboardAuth = (): DashboardAuth | null =>
  getDashboardAuthBase(STORAGE_KEY)

export const hasDashboardAuth = (): boolean =>
  hasDashboardAuthBase(STORAGE_KEY)

export const setDashboardAuth = (auth: DashboardAuth): void => {
  setDashboardAuthBase(STORAGE_KEY, auth)
}

export const clearDashboardAuth = (): void => {
  clearDashboardAuthBase(STORAGE_KEY)
}

export const buildBasicAuthHeader = (): string | null =>
  buildBasicAuthHeaderBase(STORAGE_KEY)

export const probeDashboardAuthRequired = async (): Promise<boolean> =>
  probeDashboardAuthRequiredBase(AUTH_PROBE_PATH)

export const verifyDashboardAuth = async (): Promise<boolean> => {
  const auth = getDashboardAuth()
  return auth ? verifyDashboardAuthBase(AUTH_PROBE_PATH, auth) : false
}
