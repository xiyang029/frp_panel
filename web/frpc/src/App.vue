<template>
  <n-config-provider
    :locale="locale"
    :date-locale="dateLocale"
    :theme="theme"
    :theme-overrides="themeOverrides"
  >
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-message-provider>
            <naive-bridge />
            <div id="app-shell">
              <template v-if="route.name !== 'Login'">
                <header class="header">
                  <div class="header-content">
                    <div class="brand-section">
                      <button
                        v-if="isMobile"
                        class="icon-button"
                        type="button"
                        @click="toggleSidebar"
                        aria-label="切换导航"
                      >
                        <n-icon :size="20"><MenuOutline /></n-icon>
                      </button>
                      <div class="logo-wrapper">
                        <LogoIcon class="logo-icon" />
                      </div>
                      <div class="brand-copy">
                        <span class="brand-name">frpc 工作台</span>
                        <span class="brand-subtitle">客户端代理、访客与配置管理</span>
                      </div>
                    </div>

                    <div class="header-controls">
                      <n-switch v-model:value="isDark">
                        <template #checked-icon>
                          <n-icon><Moon /></n-icon>
                        </template>
                        <template #unchecked-icon>
                          <n-icon><Sunny /></n-icon>
                        </template>
                      </n-switch>
                    </div>
                  </div>
                </header>

                <div class="layout">
                  <div
                    v-if="isMobile && sidebarOpen"
                    class="sidebar-overlay"
                    @click="closeSidebar"
                  />

                  <aside class="sidebar" :class="{ 'mobile-open': isMobile && sidebarOpen }">
                    <nav class="sidebar-nav">
                      <router-link
                        to="/proxies"
                        class="sidebar-link"
                        :class="{ active: route.path.startsWith('/proxies') }"
                        @click="closeSidebar"
                      >
                        代理
                      </router-link>
                      <router-link
                        to="/visitors"
                        class="sidebar-link"
                        :class="{ active: route.path.startsWith('/visitors') }"
                        @click="closeSidebar"
                      >
                        访客
                      </router-link>
                      <router-link
                        to="/config"
                        class="sidebar-link"
                        :class="{ active: route.path === '/config' }"
                        @click="closeSidebar"
                      >
                        配置
                      </router-link>
                    </nav>
                  </aside>

                  <main id="content">
                    <router-view />
                  </main>
                </div>
              </template>

              <router-view v-else />
            </div>
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { defineComponent, h, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDark } from '@vueuse/core'
import { MenuOutline, Moon, Sunny } from '@vicons/ionicons5'
import {
  NConfigProvider,
  NDialogProvider,
  NIcon,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  NSwitch,
  useDialog,
  useLoadingBar,
  useMessage,
  useNotification,
} from 'naive-ui'
import LogoIcon from './assets/icons/logo.svg?component'
import { useResponsive } from './composables/useResponsive'
import {
  dateLocale,
  locale,
  setNaiveDialogApi,
  setNaiveLoadingBarApi,
  setNaiveMessageApi,
  setNaiveNotificationApi,
  themeOverrides,
  useNaiveTheme,
} from './naive'

const route = useRoute()
const isDark = useDark()
const theme = useNaiveTheme(isDark)
const { isMobile } = useResponsive()
const sidebarOpen = ref(false)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

watch(
  () => route.path,
  () => {
    if (isMobile.value) {
      closeSidebar()
    }
  },
)

const NaiveBridge = defineComponent({
  name: 'NaiveBridge',
  setup() {
    const message = useMessage()
    const dialog = useDialog()
    const notification = useNotification()
    const loadingBar = useLoadingBar()
    setNaiveMessageApi(message)
    setNaiveDialogApi(dialog)
    setNaiveNotificationApi(notification)
    setNaiveLoadingBarApi(loadingBar)
    return () => h('div')
  },
})
</script>

<style scoped>
#app-shell {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(16px);
  background: color-mix(in srgb, var(--app-panel) 88%, transparent);
  border-bottom: 1px solid var(--app-border);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 72px;
  padding: 0 24px;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-wrapper {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--app-accent-soft);
}

.logo-icon {
  width: 28px;
  height: 28px;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text);
}

.brand-subtitle {
  font-size: 13px;
  color: var(--app-text-muted);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-button {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-panel-strong);
  color: var(--app-text);
  cursor: pointer;
  box-shadow: var(--app-shadow);
}

.layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  height: calc(100vh - 72px);
  height: calc(100dvh - 72px);
  min-height: 0;
  overflow: hidden;
}

.sidebar {
  height: 100%;
  overflow: auto;
  padding: 20px 14px;
  border-right: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-panel) 92%, transparent);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-link {
  padding: 12px 14px;
  border-radius: 14px;
  color: var(--app-text-muted);
  text-decoration: none;
  font-weight: 600;
  transition: 0.2s ease;
}

.sidebar-link:hover,
.sidebar-link.active {
  color: var(--app-text);
  background: var(--app-accent-soft);
}

#content {
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 24px;
}

#content > * {
  max-width: 1180px;
  margin: 0 auto;
}

.github-icon {
  width: 18px;
  height: 18px;
}

.sidebar-overlay {
  position: fixed;
  inset: 72px 0 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 40;
}

@media (max-width: 767px) {
  .header-content {
    height: 64px;
    padding: 0 16px;
  }

  .layout {
    grid-template-columns: 1fr;
    height: calc(100vh - 64px);
    height: calc(100dvh - 64px);
  }

  .sidebar {
    position: fixed;
    top: 64px;
    left: 0;
    bottom: 0;
    width: 220px;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  #content {
    padding: 16px;
  }
}
</style>
