import { openLoginModal } from '@common/composables/loginModal'
import { createDashboardHttpClient } from '@common/utils/http'
import { clearDashboardAuth, buildBasicAuthHeader } from '../utils/auth'

export const http = createDashboardHttpClient({
  buildBasicAuthHeader,
  onUnauthorized: clearDashboardAuth,
  onProxyAuthRequired: openLoginModal,
})
