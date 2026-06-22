<template>
  <n-space vertical :size="16">
    <n-space justify="space-between" align="start" :wrap="false">
      <n-breadcrumb separator=">">
        <n-breadcrumb-item>
          <router-link to="/proxies?tab=store">代理列表</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>{{ isEditing ? '编辑代理' : '新建代理' }}</n-breadcrumb-item>
      </n-breadcrumb>
      <n-space>
        <n-button type="primary" secondary size="small" @click="goBack">取消</n-button>
        <n-button type="primary" size="small" :loading="saving" @click="handleSave">
          {{ isEditing ? '保存修改' : '创建代理' }}
        </n-button>
      </n-space>
    </n-space>

    <n-spin :show="pageLoading">
      <n-card size="small">
        <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" @submit.prevent>
          <ProxyFormLayout v-model="form" :editing="isEditing" />
        </n-form>
      </n-card>
    </n-spin>

    <n-modal
      v-model:show="leaveDialogVisible"
      preset="card"
      title="存在未保存修改"
      :style="{ width: isMobile ? 'calc(100vw - 24px)' : '400px' }"
      :mask-closable="false"
    >
      <n-text depth="3">当前内容尚未保存，确认离开当前页面吗？</n-text>
      <template #footer>
        <n-space justify="end">
          <n-button type="primary" secondary @click="handleLeaveCancel">取消</n-button>
          <n-button type="primary" @click="handleLeaveConfirm">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { NBreadcrumb, NBreadcrumbItem, NButton, NCard, NForm, NModal, NSpin, NSpace, NText, type FormInst, type FormRules } from 'naive-ui'
import {
  type ProxyFormData,
  createDefaultProxyForm,
  formToStoreProxy,
  storeProxyToForm,
} from '../types'
import { getStoreProxy } from '../api/frpc'
import { useProxyStore } from '../stores/proxy'
import ProxyFormLayout from '../components/proxy-form/ProxyFormLayout.vue'
import { useResponsive } from '../composables/useResponsive'
import { createMessageHelpers } from '../naive'

const { isMobile } = useResponsive()
const route = useRoute()
const router = useRouter()
const proxyStore = useProxyStore()
const message = createMessageHelpers()

const isEditing = computed(() => !!route.params.name)
const pageLoading = ref(false)
const saving = ref(false)
const formRef = ref<FormInst | null>(null)
const form = ref<ProxyFormData>(createDefaultProxyForm())
const dirty = ref(false)
const formSaved = ref(false)
const trackChanges = ref(false)

const rules: FormRules = {
  name: [
    { required: true, message: '请输入代理名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度需为 1 到 50 个字符', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择代理类型', trigger: 'change' }],
  localPort: [
    {
      validator: (_rule, value) => {
        if (!form.value.pluginType && value == null) {
          return new Error('请输入本地端口')
        }
        return undefined
      },
      trigger: 'blur',
    },
  ],
  remotePort: [
    {
      validator: (_rule, value) => {
        if (['tcp', 'udp'].includes(form.value.type) && value == null) {
          return new Error('请输入远程端口')
        }
        return undefined
      },
      trigger: 'blur',
    },
  ],
  customDomains: [
    {
      validator: (_rule, value) => {
        if (
          ['http', 'https', 'tcpmux'].includes(form.value.type) &&
          (!value || value.length === 0) &&
          !form.value.subdomain
        ) {
          return new Error('自定义域名和子域名至少填写一项')
        }
        return undefined
      },
      trigger: 'blur',
    },
  ],
  healthCheckPath: [
    {
      validator: (_rule, value) => {
        if (form.value.healthCheckType === 'http' && !value) {
          return new Error('HTTP 健康检查必须填写路径')
        }
        return undefined
      },
      trigger: 'blur',
    },
  ],
}

const goBack = () => {
  router.back()
}

watch(
  () => form.value,
  () => {
    if (trackChanges.value) {
      dirty.value = true
    }
  },
  { deep: true },
)

const leaveDialogVisible = ref(false)
const leaveResolve = ref<((value: boolean) => void) | null>(null)

onBeforeRouteLeave(async () => {
  if (dirty.value && !formSaved.value) {
    leaveDialogVisible.value = true
    return new Promise<boolean>((resolve) => {
      leaveResolve.value = resolve
    })
  }
})

const handleLeaveConfirm = () => {
  leaveDialogVisible.value = false
  leaveResolve.value?.(true)
}

const handleLeaveCancel = () => {
  leaveDialogVisible.value = false
  leaveResolve.value?.(false)
}

const loadProxy = async () => {
  const name = route.params.name as string
  if (!name) return

  trackChanges.value = false
  dirty.value = false
  pageLoading.value = true
  try {
    const res = await getStoreProxy(name)
    form.value = storeProxyToForm(res)
    await nextTick()
  } catch (err: any) {
    message.error('加载代理失败：' + err.message)
    router.push('/proxies?tab=store')
  } finally {
    pageLoading.value = false
    nextTick(() => {
      trackChanges.value = true
    })
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    message.warning('请先修正表单校验错误')
    return
  }

  saving.value = true
  try {
    const data = formToStoreProxy(form.value)
    if (isEditing.value) {
      await proxyStore.updateProxy(form.value.name, data)
      message.success('代理已更新')
    } else {
      await proxyStore.createProxy(data)
      message.success('代理已创建')
    }
    formSaved.value = true
    router.push('/proxies?tab=store')
  } catch (err: any) {
    message.error('操作失败：' + (err.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEditing.value) {
    loadProxy()
  } else {
    trackChanges.value = true
  }
})

watch(
  () => route.params.name,
  (name, oldName) => {
    if (name === oldName) return
    if (name) {
      loadProxy()
      return
    }
    trackChanges.value = false
    form.value = createDefaultProxyForm()
    dirty.value = false
    nextTick(() => {
      trackChanges.value = true
    })
  },
)
</script>
