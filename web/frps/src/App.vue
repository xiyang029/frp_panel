<template>
  <DashboardShell
    app-title="frps 服务端"
    app-subtitle="服务端监控与配置中心"
    :menu-options="menuOptions"
    :menu-value="menuValue"
    :login-modal-visible="loginModalVisible"
  >
    <template #login-modal>
      <LoginView embedded @success="handleEmbeddedLoginSuccess" />
    </template>
  </DashboardShell>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { ArrowsLeftRight, Home, Settings, Users } from '@vicons/tabler'
import DashboardShell from '@common/components/DashboardShell.vue'
import { closeLoginModal, loginModalVisible } from '@common/composables/loginModal'
import LoginView from './views/LoginView.vue'
import { NIcon } from 'naive-ui'

const route = useRoute()
const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })

const menuOptions: MenuOption[] = [
  { label: '总览', key: '/', icon: renderIcon(Home) },
  { label: '客户端', key: '/clients', icon: renderIcon(Users) },
  { label: '代理', key: '/proxies', icon: renderIcon(ArrowsLeftRight) },
  { label: '配置', key: '/config', icon: renderIcon(Settings) },
]

const menuValue = computed(() => {
  if (route.path === '/') return '/'
  if (route.path.startsWith('/clients')) return '/clients'
  if (route.path.startsWith('/proxies') || route.path.startsWith('/proxy')) return '/proxies'
  if (route.path.startsWith('/config')) return '/config'
  return '/'
})

const handleEmbeddedLoginSuccess = () => {
  closeLoginModal()
  window.location.reload()
}
</script>
