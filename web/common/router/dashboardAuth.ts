import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

export interface DashboardAuthGuardOptions {
  loginRouteName: string
  authenticatedRouteName: string
  hasDashboardAuth: () => boolean
  probeDashboardAuthRequired: () => Promise<boolean>
}

export const createDashboardAuthGuard = (
  options: DashboardAuthGuardOptions,
) => {
  return async (to: RouteLocationNormalized): Promise<true | RouteLocationRaw> => {
    if (to.name === options.loginRouteName && options.hasDashboardAuth()) {
      return { name: options.authenticatedRouteName }
    }

    if (to.meta.public) {
      return true
    }

    if (options.hasDashboardAuth()) {
      return true
    }

    const authRequired = await options.probeDashboardAuthRequired()
    if (!authRequired) {
      return true
    }

    return {
      name: options.loginRouteName,
      query: { next: encodeURIComponent(to.fullPath) },
    }
  }
}
