<template>
  <div class="login-shell" :class="{ embedded }">
    <n-card class="login-card" :class="{ embedded }" :style="{ width: embedded ? '100%' : cardWidth }">
      <n-space vertical :size="20">
        <n-space vertical :size="6">
          <n-text class="login-title" strong>{{ title }}</n-text>
        </n-space>

        <n-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit">
          <n-space vertical :size="16">
            <n-form-item path="username" label="用户名">
              <n-input v-model:value="form.username" placeholder="请输入用户名" />
            </n-form-item>

            <n-form-item path="password" label="密码">
              <n-input
                v-model:value="form.password"
                type="password"
                show-password-on="click"
                placeholder="请输入密码"
                @keydown.enter.prevent="handleSubmit"
              />
            </n-form-item>

            <n-button type="primary" block :loading="submitting" @click="handleSubmit">
              登录
            </n-button>
          </n-space>
        </n-form>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NCard, NForm, NFormItem, NInput, NSpace, NText, useMessage, type FormInst, type FormRules } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    embedded?: boolean
    title: string
    cardWidth?: string
    defaultNextPath: string
    submitLogin: (credentials: { username: string; password: string }) => Promise<void>
  }>(),
  {
    embedded: false,
    cardWidth: 'min(440px, 100%)',
  },
)
const emit = defineEmits<{
  success: []
}>()

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
  return typeof next === 'string' ? decodeURIComponent(next) : props.defaultNextPath
})

const handleSubmit = async () => {
  await formRef.value?.validate()
  submitting.value = true

  try {
    await props.submitLogin({
      username: form.username.trim(),
      password: form.password,
    })
    message.success('登录成功')

    if (props.embedded) {
      emit('success')
      return
    }

    router.replace(nextPath.value)
  } catch (err: any) {
    message.error(err?.status === 401 ? '用户名或密码错误' : `登录失败: ${err?.message || '未知错误'}`)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-shell.embedded {
  min-height: 0;
  padding: 0;
}

.login-card {
  width: min(440px, 100%);
}

.login-card.embedded {
  width: 100%;
}

.login-title {
  font-size: 22px;
}
</style>
