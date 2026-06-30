import { useEffect, useMemo, useState } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router'
import { ArrowLeftRightIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { Toaster } from 'sonner'

import { DashboardShell, type DashboardMenuItem } from '@common/components/DashboardShell'
import { BlockingState } from '@common/components/Page'
import { closeLoginModal } from '@common/composables/loginModal'
import { LoginRedirect, useDashboardAuthState } from '@common/router/dashboardAuth'
import { hasDashboardAuth, probeDashboardAuthRequired, verifyDashboardAuth } from './utils/auth'
import { useProxyStore } from './stores/proxy'
import ClientConfigure from './views/ClientConfigure'
import LoginView from './views/LoginView'
import ProxyDetail from './views/ProxyDetail'
import ProxyEdit from './views/ProxyEdit'
import ProxyList from './views/ProxyList'
import VisitorDetail from './views/VisitorDetail'
import VisitorEdit from './views/VisitorEdit'
import VisitorList from './views/VisitorList'

function ProtectedLayout() {
  const guardOptions = useMemo(
    () => ({
      hasDashboardAuth,
      verifyDashboardAuth,
      probeDashboardAuthRequired,
      loginPath: '/login',
    }),
    [],
  )
  const state = useDashboardAuthState(guardOptions)

  if (state === 'checking') return null
  if (state === 'login') return <LoginRedirect loginPath="/login" />

  const menuItems: DashboardMenuItem[] = [
    { label: '代理', path: '/proxies', icon: ArrowLeftRightIcon, match: (path) => path.startsWith('/proxies') },
    { label: '访客', path: '/visitors', icon: UsersIcon, match: (path) => path.startsWith('/visitors') },
    { label: '配置', path: '/config', icon: SettingsIcon, match: (path) => path === '/config' },
  ]

  return (
    <DashboardShell
      appTitle="frpc 客户端"
      appSubtitle="客户端代理、访客与配置管理"
      menuItems={menuItems}
      loginModal={
        <LoginView
          embedded
          onSuccess={() => {
            closeLoginModal()
            window.location.reload()
          }}
        />
      }
    />
  )
}

function StoreRequired() {
  const checkStoreEnabled = useProxyStore((state) => state.checkStoreEnabled)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    checkStoreEnabled().then(setAllowed)
  }, [checkStoreEnabled])

  if (allowed === null) return <BlockingState label="检查本地存储" />
  if (!allowed) return <Navigate to="/proxies" replace />
  return <Outlet />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/proxies" replace />} />
          <Route path="/proxies" element={<ProxyList />} />
          <Route path="/proxies/detail/:name" element={<ProxyDetail />} />
          <Route element={<StoreRequired />}>
            <Route path="/proxies/create" element={<ProxyEdit />} />
            <Route path="/proxies/:name/edit" element={<ProxyEdit />} />
            <Route path="/visitors/create" element={<VisitorEdit />} />
            <Route path="/visitors/:name/edit" element={<VisitorEdit />} />
          </Route>
          <Route path="/visitors" element={<VisitorList />} />
          <Route path="/visitors/detail/:name" element={<VisitorDetail />} />
          <Route path="/config" element={<ClientConfigure />} />
        </Route>
        <Route path="*" element={<Navigate to="/proxies" replace />} />
      </Routes>
      <Toaster richColors />
    </HashRouter>
  )
}
