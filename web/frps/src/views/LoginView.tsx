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
      title="frps 服务端登录"
      storageKey={STORAGE_KEY}
      probePath="/api/serverinfo"
      embedded={embedded}
      onSuccess={onSuccess}
    />
  )
}
