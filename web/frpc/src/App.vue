<template>
  <DashboardShell
    app-title="frpc 控制台"
    app-subtitle="客户端代理、访客与配置管理"
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import DashboardShell from '@common/components/DashboardShell.vue'
import LoginView from './views/LoginView.vue'
import { closeLoginModal, loginModalVisible } from './composables/loginModal'

const route = useRoute()
const menuOptions: MenuOption[] = [
  { label: '代理', key: '/proxies' },
  { label: '访客', key: '/visitors' },
  { label: '配置', key: '/config' },
]

const menuValue = computed(() => {
  if (route.path.startsWith('/visitors')) return '/visitors'
  if (route.path === '/config') return '/config'
  return '/proxies'
})

const handleEmbeddedLoginSuccess = () => {
  closeLoginModal()
  window.location.reload()
}
</script>
