<template>
  <DashboardLoginView
    title="登录客户端面板"
    card-width="min(440px, 100%)"
    default-next-path="/proxies"
    :embedded="embedded"
    :submit-login="submitLogin"
    @success="handleSuccess"
  />
</template>

<script setup lang="ts">
import DashboardLoginView from '@common/components/DashboardLoginView.vue'
import { getStatus } from '../api/frpc'
import { setDashboardAuth } from '../utils/auth'

withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false,
  },
)
const emit = defineEmits<{
  success: []
}>()

const handleSuccess = () => {
  emit('success')
}

const submitLogin = async ({ username, password }: { username: string; password: string }) => {
  setDashboardAuth({
    username,
    password,
  })
  await getStatus()
}
</script>
