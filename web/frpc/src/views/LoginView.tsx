import { DashboardLoginView } from '@common/components/DashboardLoginView'
import type { DashboardLoginViewProps } from '@common/components/DashboardLoginView'
import { STORAGE_KEY } from '../utils/auth'

type LoginViewProps = Pick<DashboardLoginViewProps, 'embedded' | 'onSuccess'>

export default function LoginView({
  embedded,
  onSuccess,
}: LoginViewProps) {
  return (
    <DashboardLoginView
      title="frpc 客户端登录"
      storageKey={STORAGE_KEY}
      probePath="/api/status"
      embedded={embedded}
      onSuccess={onSuccess}
    />
  )
}
