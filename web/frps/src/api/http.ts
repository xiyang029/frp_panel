import { openLoginModal } from '@common/composables/loginModal'
import {
  buildQueryString,
  createDashboardHttpClient,
  type V2Envelope,
  type V2Page,
} from '@common/utils/http'
import { clearDashboardAuth, buildBasicAuthHeader } from '../utils/auth'

export { buildQueryString }
export type { V2Envelope, V2Page }

export const http = createDashboardHttpClient({
  buildBasicAuthHeader,
  onUnauthorized: clearDashboardAuth,
  onProxyAuthRequired: openLoginModal,
})
