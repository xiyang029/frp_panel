import { useMemo } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { ArrowLeftRightIcon, HomeIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { Toaster } from 'sonner'

import { DashboardShell, type DashboardMenuItem } from '@common/components/DashboardShell'
import { LoginRedirect, useDashboardAuthState } from '@common/router/dashboardAuth'
import { closeLoginModal } from '@common/composables/loginModal'
import { hasDashboardAuth, probeDashboardAuthRequired, verifyDashboardAuth } from './utils/auth'
import ServerOverview from './views/ServerOverview'
import ServerConfig from './views/ServerConfig'
import Clients from './views/Clients'
import ClientDetail from './views/ClientDetail'
import Proxies from './views/Proxies'
import ProxyDetail from './views/ProxyDetail'
import LoginView from './views/LoginView'

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
  if (state === 'login') {
    return <LoginRedirect loginPath="/login" />
  }

  const menuItems: DashboardMenuItem[] = [
    { label: '总览', path: '/', icon: HomeIcon, match: (path) => path === '/' },
    { label: '客户端', path: '/clients', icon: UsersIcon, match: (path) => path.startsWith('/clients') },
    {
      label: '代理',
      path: '/proxies',
      icon: ArrowLeftRightIcon,
      match: (path) => path.startsWith('/proxies') || path.startsWith('/proxy'),
    },
    { label: '配置', path: '/config', icon: SettingsIcon, match: (path) => path.startsWith('/config') },
  ]

  return (
    <DashboardShell
      appTitle="frps 服务端"
      appSubtitle="服务端监控与配置中心"
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

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<ServerOverview />} />
          <Route path="/config" element={<ServerConfig />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:key" element={<ClientDetail />} />
          <Route path="/proxies" element={<Proxies />} />
          <Route path="/proxies/:type" element={<Proxies />} />
          <Route path="/proxy/:name" element={<ProxyDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors />
    </HashRouter>
  )
}
