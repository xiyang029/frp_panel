<template>
  <div class="proxy-edit-page">
    <!-- Header with breadcrumb and actions -->
    <div class="edit-header">
      <n-breadcrumb separator=">">
        <n-breadcrumb-item>
          <router-link to="/proxies?tab=store" class="breadcrumb-link">代理列表</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>{{ isEditing ? '编辑代理' : '新建代理' }}</n-breadcrumb-item>
      </n-breadcrumb>
      <div class="header-actions">
        <n-button type="primary" secondary quaternary size="small" @click="goBack">取消</n-button>
        <n-button type="primary" size="small" :loading="saving" @click="handleSave">
          {{ isEditing ? '保存修改' : '创建代理' }}
        </n-button>
      </div>
    </div>

    <div>
      <n-spin :show="pageLoading">
        <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" @submit.prevent>
          <ProxyFormLayout v-model="form" :editing="isEditing" />
        </n-form>
      </n-spin>
    </div>

    <n-modal
      v-model:show="leaveDialogVisible"
      preset="card"
      title="存在未保存修改"
      :style="{ width: isMobile ? 'calc(100vw - 24px)' : '400px' }"
      :mask-closable="false"
    >
      <p class="confirm-message">当前内容尚未保存，确认离开当前页面吗？</p>
      <template #footer>
        <div class="dialog-footer">
          <n-button type="primary" secondary quaternary @click="handleLeaveCancel">
            取消
          </n-button>
          <n-button type="primary" @click="handleLeaveConfirm">
            确认
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { NBreadcrumb, NBreadcrumbItem, NButton, NForm, NModal, NSpin, type FormInst, type FormRules } from 'naive-ui'
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

<style scoped lang="scss">
.proxy-edit-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 960px;
  margin: 0 auto;
}

/* Edit Header */
.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: $spacing-xl 24px;
}

.header-actions {
  display: flex;
  gap: $spacing-sm;
}

.confirm-message {
  margin: 0;
  font-size: $font-size-md;
  color: $color-text-secondary;
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;
}

.n-breadcrumb {
  min-width: 0;
}

.breadcrumb-link {
  color: var(--app-text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--app-accent);
}

/* Responsive */
@include mobile {
  .edit-header {
    padding: $spacing-lg;
  }

}
</style>
