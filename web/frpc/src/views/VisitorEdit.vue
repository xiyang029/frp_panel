<template>
  <div class="visitor-edit-page">
    <div class="edit-header">
      <n-breadcrumb separator=">">
        <n-breadcrumb-item>
          <router-link to="/visitors" class="breadcrumb-link">访问器列表</router-link>
        </n-breadcrumb-item>
        <n-breadcrumb-item>{{ isEditing ? '编辑访问器' : '新建访问器' }}</n-breadcrumb-item>
      </n-breadcrumb>
      <div class="header-actions">
        <n-button type="primary" secondary quaternary size="small" @click="goBack">取消</n-button>
        <n-button type="primary" size="small" :loading="saving" @click="handleSave">
          {{ isEditing ? '保存修改' : '创建访问器' }}
        </n-button>
      </div>
    </div>

    <div>
      <n-spin :show="pageLoading">
        <n-form
          ref="formRef"
          :model="form"
          :rules="formRules"
          label-placement="top"
          @submit.prevent
        >
          <VisitorFormLayout v-model="form" :editing="isEditing" />
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
import VisitorFormLayout from '../components/visitor-form/VisitorFormLayout.vue'
import { useResponsive } from '../composables/useResponsive'
import {
  type VisitorFormData,
  createDefaultVisitorForm,
  formToStoreVisitor,
  storeVisitorToForm,
} from '../types'
import { getStoreVisitor } from '../api/frpc'
import { useVisitorStore } from '../stores/visitor'
import { createMessageHelpers } from '../naive'

const { isMobile } = useResponsive()
const route = useRoute()
const router = useRouter()
const visitorStore = useVisitorStore()
const message = createMessageHelpers()

const isEditing = computed(() => !!route.params.name)
const pageLoading = ref(false)
const saving = ref(false)
const formRef = ref<FormInst | null>(null)
const form = ref<VisitorFormData>(createDefaultVisitorForm())
const dirty = ref(false)
const formSaved = ref(false)
const trackChanges = ref(false)

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入访问器名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度需为 1 到 50 个字符', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择访问器类型', trigger: 'change' }],
  serverName: [
    { required: true, message: '请输入服务端代理名称', trigger: 'blur' },
  ],
  bindPort: [
    { required: true, message: '请输入绑定端口', trigger: 'blur' },
    {
      validator: (_rule, value) => {
        if (value == null) {
          return new Error('请输入绑定端口')
        }
        if (value > 65535) {
          return new Error('绑定端口不能大于 65535')
        }
        if (form.value.type === 'sudp') {
          if (value < 1) {
            return new Error('SUDP 绑定端口必须大于 0')
          }
          return undefined
        }
        if (value === 0) {
          return new Error('绑定端口不能为 0')
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

const loadVisitor = async () => {
  const name = route.params.name as string
  if (!name) return

  trackChanges.value = false
  dirty.value = false
  pageLoading.value = true
  try {
    const res = await getStoreVisitor(name)
    form.value = storeVisitorToForm(res)
    await nextTick()
  } catch (err: any) {
    message.error('加载访问器失败：' + err.message)
    router.push('/visitors')
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
    const data = formToStoreVisitor(form.value)
    if (isEditing.value) {
      await visitorStore.updateVisitor(form.value.name, data)
      message.success('访问器已更新')
    } else {
      await visitorStore.createVisitor(data)
      message.success('访问器已创建')
    }
    formSaved.value = true
    router.push('/visitors')
  } catch (err: any) {
    message.error('操作失败：' + (err.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEditing.value) {
    loadVisitor()
  } else {
    trackChanges.value = true
  }
})

watch(
  () => route.params.name,
  (name, oldName) => {
    if (name === oldName) return
    if (name) {
      loadVisitor()
      return
    }
    trackChanges.value = false
    form.value = createDefaultVisitorForm()
    dirty.value = false
    nextTick(() => {
      trackChanges.value = true
    })
  },
)
</script>

<style scoped lang="scss">
.visitor-edit-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 960px;
  margin: 0 auto;
}

/* Header */
.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 20px 24px;
}

.header-actions {
  display: flex;
  gap: 8px;
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

@include mobile {
  .edit-header {
    padding: 20px 16px;
  }
}
</style>
