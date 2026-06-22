<template>
  <n-config-provider :locale="locale" :date-locale="dateLocale" :theme="theme" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-message-provider>
            <NaiveBridge />
            <n-layout style="min-height: 100dvh;">
              <template v-if="route.name !== 'Login'">
                <n-layout-header bordered style="height: 64px; padding: 0 20px;">
                  <n-space justify="space-between" align="center" :wrap="false" style="height: 100%;">
                    <n-space align="center" :size="12" :wrap="false">
                      <n-avatar round :size="40" :class="{ 'clickable-logo': isMobile }" :style="{
                        backgroundColor: 'var(--n-primary-color-hover)',
                        cursor: isMobile ? 'pointer' : 'default'
                      }" @click="isMobile && toggleSidebar()">
                        <LogoIcon style="width: 40px; height: 40px; display: block;" />
                      </n-avatar>

                      <span :style="{ fontSize: '18px', fontWeight: 700, color: 'var(--n-text-color)', lineHeight: 1 }">
                        {{ appTitle }}
                      </span>
                    </n-space>

                    <n-space align="center" :size="12">
                      <n-switch v-model:value="isDark">
                        <template #checked-icon>
                          <n-icon>
                            <Moon />
                          </n-icon>
                        </template>
                        <template #unchecked-icon>
                          <n-icon>
                            <Sunny />
                          </n-icon>
                        </template>
                      </n-switch>
                    </n-space>
                  </n-space>
                </n-layout-header>

                <n-layout has-sider style="height: calc(100dvh - 72px);">
                  <n-layout-sider v-if="!isMobile" bordered collapse-mode="width" :width="240"
                    :native-scrollbar="false">
                    <n-menu :value="menuValue" :options="menuOptions" :indent="20" @update:value="handleMenuSelect" />
                  </n-layout-sider>

                  <n-layout-content :content-style="{ padding: isMobile ? '16px' : '24px' }">
                    <router-view />
                  </n-layout-content>
                </n-layout>

                <n-drawer v-model:show="sidebarOpen" placement="left">
                  <n-drawer-content title="导航">
                    <n-menu :value="menuValue" :options="menuOptions" :indent="20" @update:value="handleMenuSelect" />
                  </n-drawer-content>
                </n-drawer>

                <n-modal :show="loginModalVisible" :mask-closable="false" preset="card"
                  :style="{ width: isMobile ? 'calc(100vw - 24px)' : '420px' }">
                  <slot name="login-modal" />
                </n-modal>
              </template>

              <router-view v-else />
            </n-layout>
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { defineComponent, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDark } from '@vueuse/core'
import { Moon, Sunny } from '@vicons/ionicons5' // 彻底移除了 MenuOutline
import {
  NConfigProvider,
  NDialogProvider,
  NDrawer,
  NDrawerContent,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NLoadingBarProvider,
  NMenu,
  NMessageProvider,
  NModal,
  NNotificationProvider,
  NSpace,
  NSwitch,
  NAvatar, // 只保留 n-avatar，去除了 NButton
  type MenuOption,
  useDialog,
  useLoadingBar,
  useMessage,
  useNotification,
} from 'naive-ui'
import LogoIcon from '@/assets/icons/logo.svg?component'
import { useResponsive } from '@/composables/useResponsive'
import {
  dateLocale,
  locale,
  setNaiveDialogApi,
  setNaiveLoadingBarApi,
  setNaiveMessageApi,
  setNaiveNotificationApi,
  themeOverrides,
  useNaiveTheme,
} from '@/naive'

defineProps<{
  appTitle: string
  appSubtitle: string
  menuOptions: MenuOption[]
  menuValue: string
  loginModalVisible: boolean
}>()

const route = useRoute()
const router = useRouter()
const isDark = useDark()
const theme = useNaiveTheme(isDark)
const { isMobile } = useResponsive()
const sidebarOpen = ref(false)

const handleMenuSelect = async (key: string) => {
  if (route.path !== key) {
    await router.push(key)
  }
  sidebarOpen.value = false
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

watch(
  () => route.path,
  () => {
    if (isMobile.value) {
      sidebarOpen.value = false
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
/* 移动端下 Logo 图标的点击与悬停视觉反馈 */
.clickable-logo {
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.clickable-logo:hover {
  opacity: 0.85;
}

.clickable-logo:active {
  transform: scale(0.95);
  /* 按下时有微小的缩放反馈 */
  opacity: 0.7;
}
</style>