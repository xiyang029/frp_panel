<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="login-head">
        <h1>登录客户端面板</h1>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit">
        <n-form-item path="username" label="用户名">
          <n-input v-model:value="form.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item path="password" label="密码">
          <n-input v-model:value="form.password" type="password" show-password-on="click" placeholder="请输入密码"
            @keydown.enter.prevent="handleSubmit" />
        </n-form-item>
        <n-button type="primary" block :loading="submitting" @click="handleSubmit">
          登录
        </n-button>
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NForm, NFormItem, NInput, useMessage, type FormInst, type FormRules } from 'naive-ui'
import { getStatus } from '../api/frpc'
import { setDashboardAuth } from '../utils/auth'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: ['blur', 'input'],
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: ['blur', 'input'],
  },
}

const nextPath = computed(() => {
  const next = route.query.next
  return typeof next === 'string' ? decodeURIComponent(next) : '/proxies'
})

const handleSubmit = async () => {
  await formRef.value?.validate()
  submitting.value = true
  try {
    setDashboardAuth({
      username: form.username.trim(),
      password: form.password,
    })
    await getStatus()
    message.success('登录成功')
    router.replace(nextPath.value)
  } catch (err: any) {
    message.error(err?.status === 401 ? '用户名或密码错误' : `登录失败: ${err?.message || '未知错误'}`)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-panel {
  width: min(420px, 100%);
  padding: 28px;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-panel);
  backdrop-filter: blur(18px);
  box-shadow: var(--app-shadow);
}

.login-head {
  margin-bottom: 20px;
}

.login-head h1 {
  margin: 12px 0 8px;
  font-size: 28px;
  color: var(--app-text);
}

.login-head p {
  margin: 0;
  line-height: 1.6;
  color: var(--app-text-muted);
}
</style>
